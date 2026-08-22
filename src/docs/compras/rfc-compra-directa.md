# RFC de contrato: Compra directa

## Estado y alcance

- Estado: **publicado en `yola-fresh-utils` 1.7.0**.
- Fecha: 12 de agosto de 2026.
- Consumer de referencia: YolaFresh POS.

Este documento define el lenguaje y las invariantes compartidas para registrar una
compra cuya mercadería ya se encuentra en el establecimiento y debe ingresar al
inventario en una sola operación de usuario.

No prescribe SQLite, CouchDB ni componentes visuales. Sus enums, campos y comando
canónico forman parte del contrato vigente desde la versión 1.6.0; la versión
1.7.0 añadió la trazabilidad cruzada de Egreso y MovimientoCaja en el resultado.

## Problema de dominio

El selector `FORMAL/INFORMAL` de un consumer mezcló conceptos que deben permanecer
separados:

1. flujo logístico;
2. sustento documentario;
3. recepción física;
4. condición y estado de pago.

Una adquisición directa puede estar plenamente documentada. Una recepción
inmediata puede quedar pendiente o parcialmente pagada. Por ello “informal” no es
un término canónico de Compras.

## Lenguaje canónico

```ts
export enum TipoFlujoCompraEnum {
  GESTIONADA = "GESTIONADA",
  DIRECTA = "DIRECTA",
}

export enum EstadoDocumentarioCompraEnum {
  PENDIENTE = "PENDIENTE",
  COMPLETO = "COMPLETO",
  OBSERVADO = "OBSERVADO",
  ANULADO = "ANULADO",
}
```

Lectura:

- `GESTIONADA`: preparación, aprobación y recepciones pueden ocurrir en momentos
  diferentes;
- `DIRECTA`: el proveedor y la mercadería están presentes y el alta física se
  confirma en el mismo comando;
- `EstadoDocumentarioCompraEnum` no reemplaza `EstadoCompraEnum`,
  `EstadoRecepcionMercaderiaEnum` ni `EstadoPagoEnum`.

`TipoDocumentoCompraEnum` debe incorporar:

```ts
LIQUIDACION_COMPRA = "LIQUIDACION_COMPRA"
```

`SIN_ASIGNAR` continúa significando pendiente de captura. No significa que una
evidencia interna tenga efectos tributarios.

## Separación de estados

| Eje | Contrato | Regla |
|---|---|---|
| Flujo | `TipoFlujoCompraEnum` | Explica cómo se orquestó la adquisición |
| Compra | `EstadoCompraEnum` | Estado comercial del documento |
| Documento | `EstadoDocumentarioCompraEnum` | Completitud/observación del sustento |
| Recepción | `EstadoRecepcionMercaderiaEnum` | Confirmación física |
| Pago | `EstadoPagoEnum` | Aplicación financiera |

No son equivalentes:

- `DIRECTA` no implica `PAGADO`;
- recepción `CONFIRMADA` no implica Compra pagada;
- Compra `CERRADO` no implica saldo de proveedor cero;
- evidencia adjunta no implica documento `COMPLETO`;
- documento pendiente no impide registrar un hecho físico, pero sí debe producir
  una tarea de regularización visible.

## Cambios contractuales publicados

### `EventoCompra`

Campos aditivos:

```ts
tipoFlujoCompra?: TipoFlujoCompraEnum;
operationId?: string;
```

Compatibilidad:

- campo ausente se lee como `GESTIONADA`;
- `operationId` identifica el comando original y no debe regenerarse al reintentar.

`montoAsignado` conserva sentido solo para flujos gestionados. Debe continuar
opcional y no copiarse artificialmente a Compra directa.

### `ICompra`

Campos publicados:

```ts
tipoFlujoCompra?: TipoFlujoCompraEnum;
operationId?: string;
estadoDocumentario?: EstadoDocumentarioCompraEnum;
contraparteSnapshot?: IdentidadContraparteCompraSnapshot;
```

El snapshot permite auditar quién vendió aunque el catálogo maestro cambie.

### Identidad de contraparte

```ts
export type TipoDocumentoContraparteCompra =
  | "RUC"
  | "DNI"
  | "CE"
  | "OTRO";

export interface IdentidadContraparteCompraSnapshot {
  tipoDocumento: TipoDocumentoContraparteCompra;
  numeroDocumento: string;
  nombreORazonSocial: string;
  domicilio?: string;
  lugarOperacion?: string;
}
```

`ICompra.proveedorId` permanece obligatorio: una contraparte ocasional también
necesita identidad estable para pagos, devoluciones y auditoría.

El contrato vigente `Proveedor.ruc: string` no representa personas naturales sin
RUC. Debe evolucionar de forma versionada a una identificación discriminada o
introducir una contraparte de abastecimiento equivalente. No es válido guardar DNI
en el campo RUC ni usar un proveedor genérico si queda deuda.

### Pago inicial

El estado de pago se deriva de aplicaciones, no de una bandera del modal:

```text
totalAplicado = suma(abonos válidos ligados a la Compra)

0                         → PENDIENTE
0 < totalAplicado < total → PAGADO_PARCIAL
totalAplicado >= total    → PAGADO
```

El agregado puede conservar `CompraEgresoRef`, pero la autoridad financiera debe
ser el libro y sus imputaciones explícitas:

- movimiento `COMPRA` por el total de la obligación;
- `DesembolsoProveedor` y movimiento `PAGO` por cada salida real;
- `ImputacionCuentaProveedor` que vincula el pago con la Compra;
- Egreso solo cuando existió salida real de dinero;
- reversas append-only para correcciones.

Un gasto adicional prorrateable no es un pago de mercadería.

El modelo actual de `CuentaProveedor.saldoActual` no es suficiente. La evolución
completa se define en
[finanzas/cuenta-proveedor/rfc-modelo-propuesto.md](../finanzas/cuenta-proveedor/rfc-modelo-propuesto.md).

## Comando de aplicación publicado

El comando pertenece a la capa de aplicación del consumer o a un paquete de casos
de uso compartidos; no a la entidad de infraestructura:

```ts
export interface RegistrarCompraDirectaCommand {
  operationId: string;
  responsableId: string;
  proveedorId: string;
  contraparteSnapshot: IdentidadContraparteCompraSnapshot;
  almacenDestinoId: string;
  fechaOperacion: number;
  items: CompraItem[];
  documento: {
    tipo: TipoDocumentoCompraEnum;
    estado: EstadoDocumentarioCompraEnum;
    serie?: string;
    numero?: string;
    fecha?: number;
  };
  pagoInicial: {
    montoPagado: number;
    fechaVencimiento?: number;
    metodoPago?: string;
    referenciaPagoId?: string;
  };
  evidenciaIds?: string[];
  observaciones?: string;
}
```

Resultado mínimo:

```ts
export interface RegistrarCompraDirectaResult {
  operationId: string;
  eventoCompraId: string;
  compraId: string;
  recepcionMercaderiaId: string;
  movimientoInventarioId: string;
  egresoId?: string;
  saldoProveedor: number;
  estadoPago: EstadoPagoEnum;
  replayed: boolean;
}
```

## Grafo producido

Una ejecución válida produce los mismos hechos canónicos que el flujo gestionado:

```text
EventoCompra(DIRECTA)
  └─ Compra
       ├─ RecepcionMercaderia(CONFIRMADA)
       │    ├─ AsignacionRecepcionCompra[]
       │    └─ MovimientoInventario(APLICADO)
       │         ├─ Stock
       │         └─ Kardex
       ├─ MovimientoCuentaProveedor(COMPRA)
       ├─ DesembolsoProveedor?
       ├─ MovimientoCuentaProveedor(PAGO)?
       ├─ ImputacionCuentaProveedor[]
       ├─ Egreso?
       └─ Evidencia[]
```

No se propone `compra_directa` como nuevo `type` de CouchDB. Es otro caso de uso
sobre los agregados existentes. Los items temporales del evento no necesitan
persistirse si el comando ya posee información final válida.

## Invariantes de Compra directa

- exactamente un proveedor por comando;
- proveedor e identidad mínimos presentes;
- almacén destino activo;
- al menos un item;
- cada item que afecta stock tiene `presentacionId` inequívoco;
- cantidad y `factorUnidadBase` mayores que cero;
- costo total consistente;
- cantidad recibida igual a cantidad comprada;
- no admite recepción parcial dentro del mismo comando;
- `montoPagado` está entre cero y total;
- si queda saldo, existe vencimiento o política explícita;
- si `montoPagado > 0`, existe método y origen financiero válido;
- pago en efectivo requiere caja/turno según la política del consumer;
- documento completo exige campos obligatorios de su tipo;
- toda evidencia obligatoria existe localmente antes de confirmar;
- una misma `operationId` produce los mismos IDs y efectos;
- una recepción origina como máximo un movimiento aplicado;
- un reintento no incrementa stock, deuda ni egreso otra vez.

## Atomicidad local-first

El consumer debe persistir como una sola decisión local:

- Evento y Compra;
- Recepción confirmada y asignaciones;
- Movimiento, stock y kardex;
- cargo y aplicación financiera;
- intención durable de sincronización.

No basta con llamar secuencialmente “crear evento”, “generar compras”, “crear
recepción” y “confirmar recepción”. Cada método puede tener su propia transacción y
dejar una operación parcial tras un crash.

Se recomienda:

- unidad de trabajo local explícita;
- ID de movimiento determinista por recepción;
- restricciones únicas para asignaciones y operaciones financieras;
- resultado del comando guardado por `operationId`;
- outbox transaccional o intención durable reconciliable;
- documentos contables y de inventario append-only cuando sea posible.

La red no forma parte del commit local. CouchDB converge posteriormente.

## Liquidación de Compra peruana

La Liquidación de Compra electrónica puede aplicar a adquisiciones específicas a
personas naturales productoras o acopiadoras que carecen de RUC. Es emitida por el
comprador mediante SEE-SOL y tiene requisitos de identificación, ubicación,
productos, cantidades, unidades, valores, tributos y registro de pagos.

Referencias oficiales:

- [SUNAT: Liquidación de Compra](https://cpe.sunat.gob.pe/tipos_de_comprobantes/liquidacion_de_compra)
- [R.S. N.° 317-2017/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2017/317-2017.pdf)

Implicaciones contractuales:

- `LIQUIDACION_COMPRA` debe ser tipo explícito;
- se necesita identificación de persona sin RUC;
- serie/número emitidos por SUNAT no pueden inventarse offline;
- el consumer puede registrar `PENDIENTE` y regularizar después;
- la evidencia local no afirma emisión fiscal;
- pagos y retenciones requieren trazabilidad separada;
- una futura integración no debe exponer credenciales SOL en un cliente móvil o
  en CouchDB.

Este documento define capacidades de software y no reemplaza validación contable.

## Estados finales del comando

Compra directa siempre deja:

- recepción `CONFIRMADA`;
- movimiento `APLICADO`;
- recepción física completa.

Compra y Evento pueden quedar:

- `CERRADO` si el expediente comercial/documentario está completo;
- `CONFIRMADO` si existe regularización documentaria pendiente.

El pago puede quedar pendiente o parcial en ambos casos, porque continúa como
obligación financiera independiente.

## Corrección y anulación

Después de aplicar inventario, Compra directa no se edita destructivamente.

Una anulación debe coordinar:

- movimiento compensatorio de inventario;
- reversa del egreso y del movimiento de caja;
- reversa del ledger del proveedor;
- estados anulados y referencia al hecho original;
- conservación de evidencia y auditoría.

Si no hay stock para la reversa, el consumer requiere una política de ajuste y
autorización; borrar documentos no es una compensación.

## Compatibilidad y migración

- `tipoFlujoCompra` ausente se interpreta como `GESTIONADA`;
- el selector histórico `FORMAL/INFORMAL` no se persiste, por lo que no existe un
  valor confiable para backfill;
- no inferir flujo por estado de Compra o Recepción;
- no inventar documento, pago ni contraparte histórica;
- cambios a `Proveedor.ruc` requieren versión y migración explícitas;
- los nuevos campos deben atravesar contrato, mappers, SQLite, CouchDB, bootstrap,
  processors, invalidación y pruebas.

## Criterios para publicar los contratos

Antes de modificar `compra.contract.ts` deben aprobarse:

- nombres `GESTIONADA/DIRECTA`;
- política de un proveedor por Compra directa;
- identidad de vendedor ocasional;
- estado documentario;
- semántica de `CONFIRMADO/CERRADO`;
- ledger y aplicación de pago;
- política de Liquidación de Compra;
- protocolo de anulación compensatoria;
- estrategia de migración de `Proveedor`.

Hasta entonces este archivo es RFC y `modelo-vigente.md` continúa describiendo los
tipos realmente publicados.
