# Contratos de Pedido y Venta para `yolafresh-utils`

## Por qué

`FINANZAS-YOLA-FRESH` consume `yolafresh-utils`, pero problema no nace solo en frontend. La propia librería ya mezcla en `Venta` y `CarritoVenta` conceptos de venta, pedido, pago, finanza y caja.

Antes de migrar app consumidora, primero hace falta sanear especificación del dominio en `yolafresh-utils`, partiendo del contrato real observado en:

- [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)
- [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts)
- [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)
- [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)
- [enums.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/enums.ts)
- [pagos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pagos.ts)
- [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts)

## Qué cambia

- Reiniciar esta spec usando como fuente primaria el contrato real de `yolafresh-utils`.
- Documentar el contrato actual real de `Venta`, `CarritoVenta` y `Pedido`, incluyendo propiedades, estados y mezclas semánticas hoy existentes.
- Definir delta de refactor para `yolafresh-utils`: qué se conserva, qué sale del agregado, qué se depreca y qué se agrega.
- Proponer contrato objetivo mínimo y profesional para `Pedido`.
- Proponer contrato objetivo mínimo y profesional para `Venta`.
- Aclarar la relación correcta entre `CarritoVenta`, `Pedido`, `Venta`, `Pago`, `MovimientoCaja` y `CuentaCliente`.
- Mantener `Pago` y `EstadoPagoCapturaEnum` sin renombre en esta fase.

## Impacto

- Specs afectadas:
  - `rebuild-customer-account-v2-frontend`
  - `restructure-offline-first-sync-runtime`
  - `optimize-pos-sales-runtime-benchmark`
- Código fuente auditado:
  - [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)
  - [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts)
  - [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)
  - [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)
  - [enums.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/enums.ts)
  - [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts)
  - [pagos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pagos.ts)
- Código legacy relacionado:
  - [ventas/pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/pedido.ts)
  - [mappers.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/mappers.ts)
- Documentación relacionada:
  - [venta-turno-caja.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/venta-turno-caja.md)

## Estado actual en `yolafresh-utils`

### Venta actual

Fuente: [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts#L17-L646)

`IVenta` hoy incluye:

- `id`
- `nombre`
- `type`
- `estado: OrderState`
- `createdAt`
- `updatedAt`
- `detalleVenta: ICarritoVenta`
- `costoEnvio`
- `subtotal`
- `impuesto`
- `total`
- `montoRedondeo`
- `procedencia`
- `tipoPago`
- `clienteId`
- `vendedorId`
- `finanzaId`
- `turnoCajaId`
- `codigoVenta`
- `numeroVenta`
- `esPedido`

Observaciones reales:

- `Venta` depende estructuralmente de `detalleVenta`, que hoy es un `CarritoVenta` congelado.
- `Venta.confirmar()` mueve el estado a `OrderState.DESPACHADO`, no a un estado comercial explícito como `CONFIRMADA`.
- `Venta` expone comportamiento de pedido mediante `esUnPedido`, `tieneItemsPedido`, `itemsPedido`, `requiereFinanza`.
- `Venta.fromCarritoVenta()` arrastra `metodoPago` del carrito a `tipoPago` y propaga `esPedido`.

Diagnóstico:

- `Venta` ya nace acoplada a `CarritoVenta`.
- `Venta` ya contiene trazabilidad financiera y de caja.
- `Venta` ya contiene semántica de `Pedido` por `esPedido`.
- `Venta` mezcla hecho comercial con situación de cobro, crédito y caja.
- Esa mezcla vuelve difuso el agregado porque mismo documento intenta expresar venta emitida, pedido, cobro y tesorería.

### CarritoVenta actual

Fuente: [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts#L145-L1440)

`ICarritoVenta` hoy incluye:

- `id`
- `createdAt`
- `updatedAt`
- `nombre`
- `items`
- `subtotal`
- `impuesto`
- `total`
- `descuentoTotal`
- `cantidadItems`
- `cantidadTotal`
- `notas`
- `tasaImpuesto`
- `cliente`
- `personal`
- `clienteColor`
- `metodoPago`
- `dineroRecibido`
- `procedencia`
- `configuracionFiscal`
- `esPedido`
- `finanzaId`
- `clienteId`
- `personalId`

Observaciones reales:

- La clase es mutable y permite agregar productos, cambiar cantidades, descuentos, notas, trazabilidad y pago.
- Incluye APIs específicas de pedido: `marcarComoPedido()`, `convertirAVentaNormal()`, `marcarItemComoPedido()`, `itemsPedido`, `totalesSeparados`.
- Comentarios internos dicen que marcar como pedido implica crear finanza de crédito y dejar venta pendiente de pago.

Diagnóstico:

- `CarritoVenta` no solo captura productos.
- También captura cliente, personal, configuración fiscal, forma de pago y semántica de crédito/pedido.
- Hoy funciona como pre-venta mutable, pero con contaminación de conceptos de cobro y pedido.
- Debe quedar definido como estado mutable de captura operativa, no como documento histórico final.

### Pedido actual

Fuente: [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts#L68-L82)

`Pedido` hoy incluye:

- `id`
- `fechaEntrega`
- `estado: OrderState`
- `datosPedido: Carrito`
- `numeroPedido`
- `porcentajeDescuento`
- `subTotal`
- `total`
- `codigo`
- `costoEnvio`
- `usuarioId`
- `creacion`
- `actualizacion`

Observaciones reales:

- `Pedido` sí existe.
- Usa `Carrito` legacy, no `ICarritoVenta`.
- Reutiliza `OrderState`.
- No está conectado formalmente con `Venta` moderna.
- Conviven además contratos legacy en [ventas/pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/pedido.ts#L1-L33) y mapping heredado en [mappers.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/mappers.ts#L26-L41).

Diagnóstico:

- `Pedido` ya existe, pero no está alineado con `Venta` agregada moderna.
- Usa `Carrito` legacy.
- Reutiliza `OrderState`, lo que induce mezcla entre ciclo de vida de pedido y venta.
- Debe auditarse como fuente real, pero no asumirse como contrato final deseado.

### Snapshots actuales observados

Fuente: [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts#L41-L183)

`VentaDetalleSnapshot` hoy mantiene:

- `items`
- `subtotal`
- `descuentoTotal`
- `impuesto`
- `total`
- `cantidadItems`
- `cantidadTotal`
- `notas`
- `configuracionFiscal`
- `tasaImpuesto`
- `cliente`
- `personal`
- `clienteColor`
- `clienteId`
- `personalId`
- `metodoPago`
- `dineroRecibido`
- `procedencia`
- `esPedido`
- `finanzaId`

`VentaPersistenceSnapshot` y `VentaCouchMinimalSnapshot` además mantienen:

- `tipoPago`
- `finanzaId`
- `turnoCajaId`
- `codigoVenta`
- `numeroVenta`
- `esPedido`

Diagnóstico:

- La mezcla actual no vive solo en `IVenta`.
- También está materializada en snapshots de persistencia y sincronización.
- Cualquier refactor futuro requiere delta explícito de compatibilidad para snapshots.

### Estados actuales observados

Fuente: [enums.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/enums.ts#L2-L8)

`OrderState` hoy contiene:

- `PENDIENTE`
- `ATENDIENDO`
- `ENTREGADO`
- `CANCELADO`
- `DESPACHADO`

Diagnóstico:

- Mismo enum intenta servir para pedido y venta.
- `ATENDIENDO` parece etapa operativa de proceso, no estado canónico de documento histórico.
- `PENDIENTE` queda ambiguo: puede leerse como pedido abierto, venta sin cobrar o etapa temporal de UI.
- `DESPACHADO` hoy se usa incluso en `Venta.confirmar()`.

## Relación canónica entre agregados

### CarritoVenta

- Es estado mutable de captura operativa.
- Puede contener datos temporales de UI, cálculo y configuración.
- Puede servir como origen de `Pedido` o de `Venta`.
- No debe consolidarse como documento histórico final.

### Pedido

- Es reserva o solicitud comercial pendiente de conversión.
- Puede nacer desde `CarritoVenta`.
- Puede convertirse después en `Venta`.
- No es verdad primaria de caja.
- No es verdad primaria de deuda.
- No es `Pago`.

### Venta

- Es hecho comercial confirmado o emitido.
- Puede nacer desde `CarritoVenta` o desde `Pedido`.
- Si nace desde `Pedido`, debe referenciar `pedidoId`.
- No debe cargar como propiedades primarias el cobro, el turno de caja ni el crédito.

### Pago

- Es captura y conciliación de dinero.
- Sigue siendo entidad válida, especialmente para cobro digital, externo o conciliado.
- Puede enlazarse luego a `Venta`.
- No sustituye por sí mismo a `Venta`, `MovimientoCaja` ni `Pedido`.

### MovimientoCaja

- Refleja impacto de tesorería y saldo operativo de caja.
- No debe vivir dentro de `Venta`.

### CuentaCliente

- Refleja deuda, adelanto, cobro aplicado y saldo.
- No debe vivir dentro de `Venta`.

## Casos canónicos

### Contado

- `CarritoVenta`
- `Venta`
- `Pago` si aplica captura o confirmación
- `MovimientoCaja`
- sin `Pedido`

### Pedido sin pago

- `CarritoVenta`
- `Pedido`
- sin `Venta`
- sin `MovimientoCaja`

### Pedido convertido al recoger

- `Pedido`
- `Venta` con `pedidoId`
- `Pago` y `MovimientoCaja` si paga en ese momento

### Venta a crédito

- `Venta`
- evento o comando posterior hacia `CuentaCliente`
- `Pago` posterior cuando cliente abona
- `MovimientoCaja` solo cuando entra dinero real

## Requisitos agregados

### Requisito: Auditoría del contrato actual de `yolafresh-utils`

La especificación DEBE partir del contrato real de `yolafresh-utils`, no de reconstrucción basada solo en frontend.

#### Escenario: Venta actual

- **CUANDO** se revise [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)
- **ENTONCES** la spec debe listar los campos reales de `IVenta`
- **Y** debe marcar que hoy `Venta` mezcla `esPedido`, `finanzaId`, `turnoCajaId`, `tipoPago`, `codigoVenta` y `numeroVenta`
- **Y** debe explicar por qué esa mezcla vuelve difuso el agregado

#### Escenario: Carrito actual

- **CUANDO** se revise [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts)
- **ENTONCES** la spec debe dejar claro que `CarritoVenta` hoy ya incluye `metodoPago`, `dineroRecibido`, `esPedido`, `finanzaId` y trazabilidad de cliente/personal
- **Y** debe identificar que `CarritoVenta` está funcionando como pre-venta mutable más configuración financiera

#### Escenario: Pedido actual

- **CUANDO** se revise [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)
- **ENTONCES** la spec debe dejar claro que sí existe un `Pedido`
- **Y** debe explicar que ese contrato es legacy y no está alineado todavía con `Venta` agregada moderna

#### Escenario: Persistencia actual

- **CUANDO** se revise [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)
- **ENTONCES** la spec debe dejar claro que `esPedido`, `finanzaId`, `tipoPago` y `turnoCajaId` ya están replicados en snapshots
- **Y** debe declarar que el refactor futuro requerirá estrategia de compatibilidad de persistencia

### Requisito: Separación canónica de responsabilidades

La especificación DEBE definir responsabilidades separadas para `CarritoVenta`, `Pedido`, `Venta`, `Pago`, `MovimientoCaja` y `CuentaCliente`.

#### Escenario: Carrito mutable

- **CUANDO** se describa `CarritoVenta`
- **ENTONCES** debe quedar definido como estado mutable de captura operativa
- **Y** no debe consolidarse como documento histórico final

#### Escenario: Pedido como reserva comercial

- **CUANDO** se describa `Pedido`
- **ENTONCES** debe quedar definido como solicitud o reserva comercial pendiente de conversión
- **Y** no debe ser verdad primaria de caja ni de deuda

#### Escenario: Venta como hecho comercial

- **CUANDO** se describa `Venta`
- **ENTONCES** debe quedar definida como hecho comercial confirmado o emitido
- **Y** no debe cargar como propiedades primarias el cobro, el turno de caja ni el crédito

#### Escenario: Pago preservado

- **CUANDO** se describa relación con `Pago`
- **ENTONCES** debe quedar claro que `Pago` sigue siendo válido como captura y conciliación
- **Y** no debe renombrarse en esta fase

### Requisito: Contrato objetivo de `Pedido`

La especificación DEBE proponer un contrato mínimo de `Pedido` para `yolafresh-utils`, compatible con evolución futura pero sin llenar campos por gusto.

#### Escenario: Pedido mínimo

- **CUANDO** se proponga `Pedido`
- **ENTONCES** la spec debe usar un conjunto mínimo de campos de negocio
- **Y** debe incluir items, estado, cliente, creador, totales y fechas
- **Y** debe evitar guardar campos derivables si no existe proceso que los mantenga consistentes

#### Escenario: Items de pedido

- **CUANDO** se propongan items de `Pedido`
- **ENTONCES** la spec debe cubrir atención parcial y cancelación parcial
- **Y** debe permitir derivar pendiente con `cantidadSolicitada - cantidadAtendida - cantidadCancelada`

#### Escenario: Invariantes de pedido

- **CUANDO** se definan invariantes de `Pedido`
- **ENTONCES** la spec debe exigir al menos un item
- **Y** debe exigir `cantidadSolicitada > 0`
- **Y** debe impedir que `cantidadAtendida + cantidadCancelada` supere `cantidadSolicitada`

### Requisito: Contrato objetivo de `Venta`

La especificación DEBE proponer un contrato objetivo de `Venta`, partiendo de `IVenta` actual y eliminando responsabilidades ajenas al agregado.

#### Escenario: Campos que se conservan

- **CUANDO** se proponga `Venta` nueva
- **ENTONCES** la spec debe conservar identidad, estado, items, cliente, vendedor, totales y fechas

#### Escenario: Campos que salen del agregado

- **CUANDO** se comparen contratos
- **ENTONCES** la spec debe marcar `finanzaId`, `turnoCajaId`, `tipoPago`, `dineroRecibido` y `esPedido` como candidatos a salir del agregado `Venta`
- **Y** debe explicar adónde pertenece cada concepto

#### Escenario: Nueva relación con pedido

- **CUANDO** se proponga `Venta` nueva
- **ENTONCES** la spec debe introducir `pedidoId` opcional
- **Y** debe usar esa relación en lugar de `esPedido`

#### Escenario: Estados de venta

- **CUANDO** se definan estados de `Venta`
- **ENTONCES** la spec debe proponer estados profesionales mínimos y claros
- **Y** debe explicar por qué `PENDIENTE` y `ATENDIENDO` no deben seguir siendo estados canónicos finales de `Venta`

#### Escenario: Invariantes de venta

- **CUANDO** se definan invariantes de `Venta`
- **ENTONCES** la spec debe exigir al menos un item
- **Y** debe exigir `cantidadVendida > 0`
- **Y** debe impedir montos negativos

### Requisito: Delta de refactor explícito

La especificación DEBE declarar con claridad qué se conserva, qué se mueve, qué se depreca y qué se agrega.

#### Escenario: Compatibilidad temporal

- **CUANDO** se documente transición desde contrato actual
- **ENTONCES** la spec debe dejar `esPedido` como deuda técnica/deprecación temporal
- **Y** debe marcar `pedidoId` como relación objetivo
- **Y** debe declarar que `detalleVenta` y `snapshots` requieren revisión de compatibilidad en siguiente fase

### Requisito: Preservación temporal de pagos

La especificación DEBE mantener `Pago` y `EstadoPagoCapturaEnum` sin renombre en esta fase, preservando su rol de captura y conciliación.

#### Escenario: Pago digital externo

- **CUANDO** se capture un pago externo y se aplique a una venta
- **ENTONCES** la spec debe mantener `Pago` como entidad válida
- **Y** debe aclarar que `Pago` no sustituye por sí mismo a `Venta`, `MovimientoCaja` ni `Pedido`

## Requisitos modificados

### Requisito: Procesamiento de ventas POS

El flujo de ventas objetivo DEBE nacer desde contratos saneados en `yolafresh-utils`. Primero se corrige el modelo de librería y luego se adapta frontend. La separación final debe distinguir claramente carrito mutable, pedido, venta, pago, caja y deuda.

## Requisitos eliminados

### Requisito: Modelar `Pedido` desde frontend sin leer librería

**Razón**: genera especulación, omite propiedades reales y puede ignorar contratos ya existentes en `yolafresh-utils`.

**Migración**: toda propuesta nueva de `Pedido` o `Venta` debe partir de la fuente real de la librería y luego compararse con consumers.

## Modelo objetivo de `Pedido`

### Semántica

- `Pedido` representa reserva o solicitud comercial pendiente de conversión.
- `Pedido` no es `Venta`.
- `Pedido` no es `Pago`.
- `Pedido` no es `MovimientoCaja`.
- `Pedido` no es deuda por sí mismo.

### Contrato mínimo propuesto

#### Pedido

- `id`
- `type`
- `estado`
- `clienteId`
- `creadoPorId`
- `items`
- `subtotal`
- `total`
- `createdAt`
- `updatedAt`

#### PedidoItem

- `id`
- `presentacionId`
- `cantidadSolicitada`
- `cantidadAtendida`
- `cantidadCancelada`
- `precioUnitario`

### Estados mínimos propuestos para `Pedido`

- `ABIERTO`
- `PARCIALMENTE_ATENDIDO`
- `CONVERTIDO`
- `CANCELADO`
- `VENCIDO`

### Invariantes mínimas

- `Pedido` debe tener al menos un item.
- `cantidadSolicitada` debe ser mayor a cero.
- `cantidadAtendida` no puede ser negativa.
- `cantidadCancelada` no puede ser negativa.
- `cantidadAtendida + cantidadCancelada` no puede superar `cantidadSolicitada`.
- `subtotal` y `total` no pueden ser negativos.

### Campos que no entran en primera versión

- `turnoCajaId`
- `movimientoCajaId`
- `finanzaId`
- `metodoPago`
- `dineroRecibido`
- `cantidadPendiente`
- `cantidadReservada`
- `cantidadBackorder`

### JSON mínimo propuesto

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
      "cantidadAtendida": 0,
      "cantidadCancelada": 0,
      "precioUnitario": 12.5
    }
  ],
  "subtotal": 100,
  "total": 100,
  "createdAt": 1780000000000,
  "updatedAt": 1780000000000
}
```

## Modelo objetivo de `Venta`

### Semántica

- `Venta` representa hecho comercial confirmado.
- `Venta` puede venir de `CarritoVenta` o de `Pedido`.
- `Venta` no debe depender de `esPedido` para expresar origen.
- `Venta` no debe tener como propiedad primaria el cobro ni la caja.

### Campos actuales que deben conservarse

- `id`
- `type`
- `estado`
- `clienteId`
- `vendedorId`
- `subtotal`
- `impuesto`
- `total`
- `montoRedondeo`
- `createdAt`
- `updatedAt`

### Campos actuales que deben revisarse

- `nombre`
- `codigoVenta`
- `numeroVenta`
- `detalleVenta`

### Campos actuales que deben salir del agregado

- `tipoPago`
- `finanzaId`
- `turnoCajaId`
- `esPedido`

### Campo nuevo propuesto

- `pedidoId` opcional

### Contrato mínimo propuesto

#### Venta

- `id`
- `type`
- `estado`
- `pedidoId` opcional
- `clienteId`
- `vendedorId`
- `items`
- `subtotal`
- `impuesto`
- `total`
- `montoRedondeo`
- `createdAt`
- `updatedAt`

#### VentaItem

- `id`
- `presentacionId`
- `cantidadVendida`
- `precioUnitario`
- `descuento` opcional

### Estados mínimos propuestos para `Venta`

- `CONFIRMADA`
- `DESPACHADA`
- `ANULADA`

### Razón de cambio de estados

- `PENDIENTE` debe quedar en `Pedido` o en pre-venta mutable.
- `ATENDIENDO` debe quedar como etapa operativa de UI o proceso, no como estado final de agregado.
- `ENTREGADO` y `DESPACHADO` deben revisarse para no duplicar semántica; esta spec propone `DESPACHADA` como término canónico de venta cumplida.
- `CANCELADO` debe homogeneizarse con `ANULADA` para `Venta`; la librería debe elegir término único.

### Invariantes mínimas

- `Venta` debe tener al menos un item.
- `cantidadVendida` debe ser mayor a cero.
- `subtotal`, `impuesto` y `total` no pueden ser negativos.
- `Venta` no puede mutar a `Pedido`.
- `Venta` anulada no puede reactivarse sin flujo explícito de reversa.

### JSON mínimo propuesto

```json
{
  "id": "venta-001",
  "type": "venta",
  "estado": "CONFIRMADA",
  "pedidoId": "pedido-001",
  "clienteId": "cliente-001",
  "vendedorId": "user-001",
  "items": [
    {
      "id": "venta-item-1",
      "presentacionId": "pres-1",
      "cantidadVendida": 6,
      "precioUnitario": 12.5
    }
  ],
  "subtotal": 75,
  "impuesto": 0,
  "total": 75,
  "montoRedondeo": 0,
  "createdAt": 1780005000000,
  "updatedAt": 1780005000000
}
```
