# Venta y Pedido — Modelo de Negocio y Contratos Nuevos

Este documento explica modelo nuevo de `Venta` y `Pedido` en `yola-fresh-utils`, por qué se cambió, qué quedó legacy por compatibilidad y cómo debe pensarse negocio ahora.

Fuentes reales de implementación:
- [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)
- [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts)
- [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)
- [pedido.legacy.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.legacy.ts)
- [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)
- [enums.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/enums.ts)

## 1. Problema que se corrigió

Antes, contrato de ventas mezclaba varias cosas dentro de mismo agregado:

- `Venta` cargaba semántica de venta, pedido, caja, finanza y forma de pago.
- `CarritoVenta` ya venía contaminado con datos de cobro y flags como `esPedido`.
- `Pedido` existía, pero como contrato legacy, separado de flujo moderno de `Venta`.
- `OrderState` intentaba servir a pedido y venta al mismo tiempo.

Esa mezcla producía tres problemas:

1. `Venta` no representaba solo hecho comercial.
2. `Pedido` no tenía lugar claro en modelo.
3. Cobro, caja y deuda terminaban acoplados a documento comercial.

## 2. Nuevo modelado de negocio

Modelo ahora separa responsabilidades.

### `CarritoVenta`

Rol:
- captura mutable operativa
- estado en curso
- espacio de trabajo para UI y armado de operación

Debe contener:
- items en edición
- cliente/personal en captura
- configuración fiscal
- procedencia

Puede contener todavía por compatibilidad:
- `metodoPago`
- `dineroRecibido`

Pero esos campos ya no son contrato canónico de documento final.

Fuente: [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts)

### `Pedido`

Rol:
- reserva o solicitud comercial
- operación pendiente de atención o conversión
- no es cobro
- no es caja
- no es deuda por sí mismo

Sirve para casos como:
- cliente separa mercadería
- pedido web pendiente de despacho
- pedido que luego se convierte en venta al recoger o confirmar

Fuente: [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)

### `Venta`

Rol:
- hecho comercial confirmado
- documento comercial congelado
- nace desde carrito o desde pedido

No debe modelar como propiedad primaria:
- cobro
- turno de caja
- deuda
- bandera `esPedido`

Si venta proviene de pedido, relación correcta es `pedidoId`.

Fuente: [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)

### `Pago`

Rol:
- captura y conciliación de dinero
- efectivo, tarjeta, digital, validaciones externas

`Pago` no reemplaza:
- `Venta`
- `Pedido`
- `MovimientoCaja`

### `MovimientoCaja`

Rol:
- impacto real en tesorería
- ingreso/salida de dinero
- turno, correlativos, saldos posteriores

No debe vivir como parte primaria de `Venta`.

### `CuentaCliente`

Rol:
- saldo, deuda, abonos, depósitos, aplicaciones

No debe vivir adentro de `Venta`.

## 3. Estados nuevos por agregado

Estados separados en [enums.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/enums.ts).

### `PedidoState`

```ts
export enum PedidoState {
  ABIERTO = "ABIERTO",
  PARCIALMENTE_ATENDIDO = "PARCIALMENTE_ATENDIDO",
  CONVERTIDO = "CONVERTIDO",
  CANCELADO = "CANCELADO",
  VENCIDO = "VENCIDO",
}
```

Semántica:
- `ABIERTO`: pedido activo sin atención completa
- `PARCIALMENTE_ATENDIDO`: parte atendida, parte pendiente
- `CONVERTIDO`: pedido ya pasó a venta
- `CANCELADO`: pedido cancelado
- `VENCIDO`: expiró sin convertirse

### `VentaState`

```ts
export enum VentaState {
  CONFIRMADA = "CONFIRMADA",
  DESPACHADA = "DESPACHADA",
  ANULADA = "ANULADA",
}
```

Semántica:
- `CONFIRMADA`: venta cerrada comercialmente
- `DESPACHADA`: venta cumplida/entregada
- `ANULADA`: venta revertida por flujo explícito

### `OrderState`

`OrderState` sigue existiendo solo como compatibilidad legacy.

```ts
/**
 * @deprecated Usar `PedidoState` o `VentaState` según agregado.
 */
export enum OrderState {
  PENDIENTE = "PENDIENTE",
  ATENDIENDO = "ATENDIENDO",
  ENTREGADO = "ENTREGADO",
  CANCELADO = "CANCELADO",
  DESPACHADO = "DESPACHADO",
}
```

Ya no debe usarse como enum canónico nuevo.

## 4. Contrato nuevo de `Pedido`

Contrato actual canónico:

```ts
export interface PedidoItem {
  id: string;
  presentacionId: string;
  cantidadSolicitada: number;
  cantidadAtendida: number;
  cantidadCancelada: number;
  precioUnitario: number;
}

export interface Pedido {
  id: string;
  type: "pedido";
  estado: PedidoState;
  clienteId?: string;
  creadoPorId: string;
  items: PedidoItem[];
  subtotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Fuente: [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)

### Lectura de negocio

- `PedidoItem` ya soporta atención parcial.
- También soporta cancelación parcial.
- Pendiente derivable:

```ts
const cantidadPendiente =
  item.cantidadSolicitada - item.cantidadAtendida - item.cantidadCancelada;
```

### Invariantes de negocio esperadas

- pedido debe tener al menos un item
- `cantidadSolicitada > 0`
- `cantidadAtendida >= 0`
- `cantidadCancelada >= 0`
- `cantidadAtendida + cantidadCancelada <= cantidadSolicitada`
- `subtotal >= 0`
- `total >= 0`

### Qué salió de `Pedido`

No entran como contrato mínimo:
- caja
- cobro
- `turnoCajaId`
- `movimientoCajaId`
- `finanzaId`
- `metodoPago`
- `dineroRecibido`

## 5. Contrato nuevo de `Venta`

Contrato actual canónico:

```ts
export interface VentaItem {
  id: string;
  presentacionId: string;
  cantidadVendida: number;
  precioUnitario: number;
  descuento?: number;
}

export interface IVenta {
  id: string;
  nombre: string;
  type: string;
  estado: VentaState;
  items: VentaItem[];
  pedidoId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  costoEnvio?: number;
  subtotal: number;
  impuesto: number;
  total: number;
  montoRedondeo?: number;
  procedencia: ProcedenciaVenta;
  clienteId?: string;
  vendedorId?: string;
  codigoVenta?: string;
  numeroVenta?: string;
}
```

Fuente: [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)

### Lectura de negocio

- `Venta` ahora usa `items` como contrato principal.
- `pedidoId` expresa origen desde pedido.
- `esPedido` deja de ser forma canónica de modelar relación.
- `Venta.confirmar()` lleva estado a `VentaState.CONFIRMADA`.

### Invariantes implementadas en código

`Venta.validar()` exige:
- `id`
- `nombre`
- `procedencia`
- al menos un item
- `total > 0`
- `subtotal >= 0`
- `impuesto >= 0`
- `costoEnvio >= 0` si existe

Cada item exige:
- `id`
- `presentacionId`
- `cantidadVendida > 0`
- `precioUnitario >= 0`

Referencia: [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts#L659-L699)

## 6. Qué cambió vs modelo anterior

### Antes

`Venta` mezclaba:
- `detalleVenta`
- `tipoPago`
- `finanzaId`
- `turnoCajaId`
- `esPedido`

Eso volvía difuso agregado porque no se sabía si documento era:
- venta
- pedido
- cobro
- crédito
- caja

### Ahora

`Venta` conserva núcleo comercial:
- identidad
- estado
- items
- totales
- cliente
- vendedor
- fechas
- `pedidoId?`

Y saca de contrato principal:
- `tipoPago`
- `finanzaId`
- `turnoCajaId`
- `esPedido`

## 7. Compatibilidad legacy que todavía existe

Refactor no rompió persistencia histórica. Por eso quedaron capas de compatibilidad.

### Compatibilidad en `Venta`

`Venta.ts` todavía mantiene:
- `VentaLegacyCompatibilityFields`
- `fromLegacyInput()`
- `fromPersistenceSnapshot()`
- `fromCouchSnapshot()`

Esos puntos sirven para leer datos viejos y normalizarlos al modelo nuevo.

### Compatibilidad en snapshots

En [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts) siguen existiendo temporalmente:
- `detalleVenta`
- `tipoPago`
- `finanzaId`
- `turnoCajaId`
- `esPedido`

Pero están marcados como compatibilidad temporal o deprecación.

### Compatibilidad de pedido legacy

Contrato viejo sigue en [pedido.legacy.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.legacy.ts):

- `PedidoLegacy`
- `Carrito`
- `ItemCar`
- `Hora`
- tipos auxiliares históricos

Ese módulo existe para consumidores antiguos y migraciones graduales.

## 8. Relación correcta entre agregados

Relación objetivo:

```text
CarritoVenta -> Pedido -> Venta -> Pago -> MovimientoCaja
                    \------> Venta

Venta -> CuentaCliente   (solo si negocio genera deuda o saldo)
```

Lectura correcta:

- `CarritoVenta`: captura mutable
- `Pedido`: reserva comercial
- `Venta`: hecho comercial confirmado
- `Pago`: dinero capturado o conciliado
- `MovimientoCaja`: impacto de tesorería
- `CuentaCliente`: deuda, adelanto, saldo aplicado

## 9. Flujos de negocio canónicos

### Venta de contado

```text
CarritoVenta
  -> Venta
  -> Pago        (si negocio registra captura/confirmación)
  -> MovimientoCaja
```

No necesita `Pedido`.

### Pedido sin pago

```text
CarritoVenta
  -> Pedido
```

No genera todavía:
- `Venta`
- `MovimientoCaja`
- deuda automática

### Pedido convertido al recoger

```text
Pedido
  -> Venta(pedidoId)
  -> Pago
  -> MovimientoCaja
```

### Venta a crédito

```text
Venta
  -> CuentaCliente
  -> Pago posterior
  -> MovimientoCaja cuando entra dinero real
```

## 10. Ejemplos de contratos

### Ejemplo de `Pedido`

```json
{
  "id": "pedido-001",
  "type": "pedido",
  "estado": "ABIERTO",
  "clienteId": "cliente-001",
  "creadoPorId": "user-001",
  "items": [
    {
      "id": "pedido-item-1",
      "presentacionId": "pres-1",
      "cantidadSolicitada": 8,
      "cantidadAtendida": 3,
      "cantidadCancelada": 1,
      "precioUnitario": 12.5
    }
  ],
  "subtotal": 100,
  "total": 100,
  "createdAt": "2026-06-21T10:00:00.000Z",
  "updatedAt": "2026-06-21T10:00:00.000Z"
}
```

Pendiente derivado de item:
- `8 - 3 - 1 = 4`

### Ejemplo de `Venta`

```json
{
  "id": "venta-001",
  "nombre": "Venta Mostrador",
  "type": "venta",
  "estado": "CONFIRMADA",
  "pedidoId": "pedido-001",
  "items": [
    {
      "id": "venta-item-1",
      "presentacionId": "pres-1",
      "cantidadVendida": 6,
      "precioUnitario": 12.5,
      "descuento": 0
    }
  ],
  "subtotal": 75,
  "impuesto": 0,
  "total": 75,
  "montoRedondeo": 0,
  "procedencia": "TIENDA",
  "clienteId": "cliente-001",
  "vendedorId": "user-001",
  "codigoVenta": "V-001",
  "numeroVenta": "1",
  "createdAt": "2026-06-21T10:05:00.000Z",
  "updatedAt": "2026-06-21T10:05:00.000Z"
}
```

## 11. Guía rápida para consumidores

Si estás implementando consumer nuevo:

- usa `Pedido` de [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)
- usa `IVenta` y `Venta` de [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)
- usa `PedidoState` y `VentaState`
- usa `pedidoId` para unir venta con pedido

Evita en código nuevo:

- `OrderState`
- `esPedido`
- `turnoCajaId` dentro de `Venta`
- `finanzaId` dentro de `Venta`
- `tipoPago` como dato principal de `Venta`
- `detalleVenta` como contrato principal de lectura/escritura

## 12. Resumen ejecutivo

Cambio central:

- antes `Venta` era agregado contaminado
- ahora `Venta` representa hecho comercial
- `Pedido` representa reserva comercial
- `CarritoVenta` representa captura mutable
- `Pago`, `MovimientoCaja` y `CuentaCliente` quedan fuera de contrato principal de `Venta`

Resultado:

- más claridad de negocio
- menos acoplamiento
- mejor evolución offline-first
- mejor compatibilidad entre POS, pedidos, crédito, caja y sincronización
