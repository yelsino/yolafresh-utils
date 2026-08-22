# RFC: libro financiero de proveedor

Estado: **publicado como contrato canónico desde `yola-fresh-utils` 1.5.0; enlaces de desembolso completados en 1.7.0**
Fecha: **12 de agosto de 2026**

## 1. Contexto

El paquete publicaba originalmente:

```ts
interface CuentaProveedor {
  proveedorId: string;
  saldoActual: number;
  moneda: "PEN" | "USD";
  updatedAt: Date;
}
```

y un `MovimientoCuentaProveedor` con tipos `CARGO`, `ABONO`, `SALDO_FAVOR`,
`USO_SALDO` y `DEVOLUCION`.

El contrato expresa una intención útil, pero no alcanza para una cuenta corriente
auditable porque:

- convierte un saldo mutable en parte principal del contrato;
- no existe identidad estable de cuenta separada del proveedor;
- no hay imputación pago → compra;
- no distingue desembolso operativo de efecto en el libro;
- no exige idempotencia, actor ni fecha efectiva;
- no define una proyección reconstruible;
- no modela recuperación de una operación multi-documento;
- no permite demostrar de qué compras proviene el saldo.

La implementación de CuentaCliente demuestra el patrón correcto: cuenta estable,
movimientos append-only, imputaciones explícitas, documento de dinero, resumen
derivado y autoridad remota con captura offline. CuentaProveedor adopta ese patrón
con semántica de cuentas por pagar.

## 2. Lenguaje canónico

- **obligación:** importe que el negocio debe al proveedor por una compra;
- **desembolso:** ejecución operativa de una salida de dinero;
- **pago:** movimiento financiero que reduce una obligación o queda no aplicado;
- **imputación:** vínculo explícito entre pago/crédito y compra;
- **adelanto:** dinero entregado antes de una obligación aplicable;
- **saldo por pagar:** obligaciones aún no cubiertas;
- **saldo a favor del negocio:** desembolsos o créditos todavía no aplicados;
- **resumen:** proyección descartable y reconstruible;
- **reversa:** hecho compensatorio; nunca borrado del original.

`CARGO` y `ABONO` pueden conservarse como etiquetas de compatibilidad, pero no son
el lenguaje principal de la UI ni sustituyen el tipo económico del movimiento.

## 3. Separación de agregados

```text
Compra ───────────────→ MovimientoCuentaProveedor(COMPRA)
RecepcionMercaderia ──→ habilita reconocimiento según política
DesembolsoProveedor ──→ MovimientoCuentaProveedor(PAGO)
Egreso/MovimientoCaja ─→ prueba salida de fondos
PAGO ─────────────────→ ImputacionCuentaProveedor ─→ COMPRA
Movimientos + imputaciones ─→ ResumenCuentaProveedor
```

Reglas:

- recibir mercadería no significa haber pagado;
- crear un egreso no identifica por sí solo qué obligación liquidó;
- guardar evidencia no ejecuta dinero;
- marcar una Compra `PAGADA` no crea movimientos financieros;
- un resumen no puede corregir el libro que resume.

## 4. Contratos publicados

### 4.1 Cuenta

```ts
export type EstadoCuentaProveedor = "ACTIVA" | "SUSPENDIDA" | "CERRADA";

export interface CuentaProveedorV2 {
  id: string;
  proveedorId: string;
  estado: EstadoCuentaProveedor;
  moneda: "PEN" | "USD";
  aperturaAt: Date;
  cierreAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

Una cuenta identifica el libro. No contiene saldo.

### 4.2 Movimiento

```ts
export type TipoMovimientoCuentaProveedorV2 =
  | "COMPRA"
  | "PAGO"
  | "ADELANTO"
  | "NOTA_CREDITO"
  | "DEVOLUCION"
  | "AJUSTE"
  | "REVERSA";

export type DireccionMovimientoProveedor = "DEBITO" | "CREDITO";

export interface MovimientoCuentaProveedorV2 {
  id: string;
  cuentaId: string;
  proveedorId: string;
  tipo: TipoMovimientoCuentaProveedorV2;
  direccion: DireccionMovimientoProveedor;
  monto: number;
  moneda: "PEN" | "USD";
  tipoOrigen: "COMPRA" | "PAGO" | "ADELANTO" | "NOTA_CREDITO" |
    "DEVOLUCION" | "AJUSTE" | "REVERSA";
  origenId: string;
  estado: "CONTABILIZADO" | "REVERTIDO" | "RECHAZADO";
  idempotencyKey: string;
  descripcion?: string;
  creadoPorId: string;
  desembolsoId?: string;
  reversaDeMovimientoId?: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt?: Date;
}
```

Dirección desde los libros del negocio:

- `COMPRA` que reconoce una cuenta por pagar: `CREDITO`;
- `PAGO`, adelanto o nota que reduce deuda: `DEBITO`;
- `REVERSA`: dirección opuesta al movimiento original.

Los contratos de dominio deben validar esa matriz; no se deja al consumer.

### 4.3 Imputación

```ts
export interface ImputacionCuentaProveedor {
  id: string;
  cuentaId: string;
  proveedorId: string;
  movimientoOrigenId: string;
  movimientoDestinoId: string;
  monto: number;
  moneda: "PEN" | "USD";
  estrategia: "EXPLICITA" | "FIFO";
  estado: "APLICADA" | "REVERTIDA";
  reversaDeImputacionId?: string;
  createdAt: Date;
}
```

La fuente es un pago, adelanto, nota de crédito o devolución financiera. El destino
es una obligación `COMPRA`. Ninguna imputación puede exceder el disponible de la
fuente ni el saldo del destino.

### 4.4 Desembolso

```ts
export interface DesembolsoProveedor {
  id: string;
  proveedorId: string;
  cuentaId: string;
  monto: number;
  moneda: "PEN" | "USD";
  metodoPago: MetodoPago;
  estado: "CREADO" | "AUTORIZADO" | "EJECUTADO" | "RECHAZADO" | "ANULADO";
  solicitadoPorId: string;
  autorizadoPorId?: string;
  ejecutadoPorId?: string;
  cajaId?: string;
  turnoCajaId?: string;
  cuentaFinancieraId?: string;
  egresoId?: string;
  movimientoCajaId?: string;
  evidenciaIds?: string[];
  tipoOrigen: "COMPRA" | "PAGO_PROVEEDOR" | "ADELANTO" | "AJUSTE";
  origenId: string;
  idempotencyKey: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt?: Date;
}
```

Solo `EJECUTADO` puede originar un movimiento `PAGO`/`ADELANTO`. El método efectivo
exige caja y turno activos; un método bancario/digital exige origen financiero y su
confirmación correspondiente.

### 4.5 Resumen

```ts
export interface ResumenCuentaProveedor {
  cuentaId: string;
  proveedorId: string;
  saldoPorPagar: number;
  saldoFavorNegocio: number;
  saldoDebitoNoAplicado: number;
  moneda: "PEN" | "USD";
  ultimoMovimientoId?: string;
  ultimoMovimientoAt?: Date;
  cantidadMovimientosFuente: number;
  cantidadImputacionesFuente: number;
  version: number;
  reconstruidaAt: Date;
  updatedAt: Date;
}
```

Se calcula solo desde movimientos contabilizados, reversas e imputaciones aplicadas.

### 4.6 Operación recuperable

`OperacionCuentaProveedor` pertenece al contrato de integración/aplicación, no al
saldo de dominio. Debe contener:

- `operationId`, `operationType`, cuenta y proveedor;
- `idempotencyKey` y hash canónico del request;
- estado de ejecución y paso alcanzado;
- IDs deterministas de los documentos planeados;
- resultado oficial o causa de rechazo;
- timestamps y actor/dispositivo.

CouchDB no garantiza atomicidad multi-documento. El manifiesto convierte la
operación en una saga corta, reentrante y reparable.

## 5. Invariantes

- monto finito, positivo y normalizado a centavos;
- una cuenta opera en una sola moneda;
- una obligación referencia una Compra estable del mismo proveedor;
- una `Compra` solo produce una obligación oficial por versión económica;
- misma idempotencia + mismo payload devuelve el mismo resultado;
- misma idempotencia + payload distinto se rechaza;
- movimientos confirmados e imputaciones no se actualizan ni borran;
- toda corrección usa reversa;
- suma aplicada a una fuente no supera su disponible;
- suma aplicada a una compra no supera su obligación vigente;
- pago excedente permanece como saldo a favor del negocio;
- `estadoPago` de Compra se deriva de imputaciones;
- evidencia, egreso, desembolso y movimiento de cuenta conservan referencias, pero
  no se sustituyen entre sí;
- el resumen puede eliminarse y reconstruirse con resultado idéntico.

## 6. Casos de uso

### Compra pendiente

1. reconocer movimiento `COMPRA` por el total;
2. no crear desembolso ni método ficticio;
3. resumen expone el total por pagar.

### Compra pagada al contado

1. reconocer `COMPRA`;
2. ejecutar `DesembolsoProveedor`;
3. crear `PAGO` por el total;
4. imputar pago a compra;
5. saldo de la compra queda cero.

### Pago parcial

Se ejecuta e imputa solo el importe real. La diferencia continúa como obligación.

### Adelanto o pago excedente

El remanente no aplicado queda en `saldoFavorNegocio` y se aplica posteriormente de
forma explícita o FIFO según política.

### Nota de crédito/devolución

Debe referenciar el hecho comercial validado. Reduce la obligación por imputación o
genera crédito del negocio si la compra ya estaba pagada.

### Reversa

Crea movimiento e imputaciones compensatorias. Si hubo dinero, tesorería ejecuta su
propia reversa; si hubo stock, inventario ejecuta su compensación independiente.

## 7. Frontera offline y autoridad

El contrato de dominio no obliga un transporte, pero el perfil YolaFresh POS adopta:

- captura offline en SQLite;
- proyección local marcada como provisional;
- outbox en la misma transacción que la intención local;
- backend como autoridad financiera;
- reintento con clave estable;
- consulta de estado tras timeout;
- reconciliación con documentos oficiales por respuesta, changes y bootstrap.

La compra y el stock pueden quedar operativos localmente mientras la cuenta de
proveedor está pendiente. Un rechazo financiero debe producir una incidencia de
reconciliación, no borrar mercadería físicamente recibida.

## 8. Relación con Compra directa

Compra directa usa un comando oficial único `REGISTRAR_COMPRA_Y_PAGO` para producir:

- obligación por el total;
- desembolso opcional por el importe pagado;
- movimiento de pago opcional;
- imputaciones;
- resumen reconstruido.

Pago pendiente usa el mismo comando con monto pagado cero, sin método ni desembolso.
Pago parcial conserva deuda. El único clic de UI no implica un único documento ni
elimina las fronteras del dominio.

## 9. Versionado y migración

No se encontraron consumidores productivos de `CuentaProveedor` o
`MovimientoCuentaProveedor` en la app ni en el backend auditados; el uso actual está
limitado al paquete y documentación. Aun así son exports públicos.

Plan:

1. introducir contratos V2 y funciones puras de validación/reconstrucción;
2. marcar `CuentaProveedor.saldoActual` y los tipos reducidos como deprecated;
3. migrar consumers antes de cambiar exports principales;
4. publicar transición compatible en versión menor si es aditiva;
5. retirar legacy solo en versión mayor;
6. no convertir un saldo histórico en movimientos inventados;
7. cuando existan saldos reales, importarlos mediante un `AJUSTE_APERTURA` auditado,
   aprobado y trazable.

## 10. Pruebas contractuales mínimas

- reconstrucción determinista con orden de entrada arbitrario;
- pagos total, parcial, excedente y adelanto;
- nota de crédito antes y después del pago;
- reversa de obligación, pago e imputación;
- rechazo de monedas distintas;
- rechazo de sobreaplicación;
- idempotencia repetida y conflicto de payload;
- concurrencia entre dos pagos sobre la misma compra;
- resumen borrado y reconstruido;
- serialización/deserialización sin pérdida de fechas ni centavos.

## 11. Impacto de integración

Los consumers que persistan estos contratos deben cablear cada nuevo tipo en:

- CouchDB y sus índices;
- schema/migraciones SQLite;
- mappers y repositories;
- processors de changes y tombstones;
- snapshot/bootstrap e importador;
- auditorías de cobertura y conteos;
- despliegue compatible móvil antes de publicación desde backend.

## 12. Referencias

- [CuentaCliente](../cuenta-cliente/README.md)
- [Modelo vigente de finanzas](../modelo-vigente.md)
- [RFC de Compra directa](../../compras/rfc-compra-directa.md)
- [Integración offline-first de compras](../../compras/integracion-pos-offline-first.md)
