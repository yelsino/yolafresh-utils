# Migración de `Pedido` desde `ventas/contracts` hacia `pedido/contracts`

## Resumen

El contrato de `Pedido` deja de pertenecer a `ventas/contracts` y pasa al nuevo Domain `pedido`.

Además:

- `PedidoState` agrega `ATENDIDO`;
- aparece contrato nuevo `PedidoEntrega`;
- `VENCIDO` pasa a tener respaldo temporal explícito mediante `fechaVencimiento`;
- el pedido ahora modela prioridad, procedencia, responsable, programación y observaciones.

## Cambios incompatibles

### Import anterior

```ts
import type { Pedido, PedidoItem } from "yola-fresh-utils/ventas/contracts";
```

### Import nuevo

```ts
import type { Pedido, PedidoEntrega, PedidoItem } from "yola-fresh-utils/pedido/contracts";
```

## Nuevo shape mínimo de `Pedido`

Campos nuevos:

- `codigoPedido`
- `prioridad`
- `procedencia`
- `responsableId`
- `ventaId`
- `fechaPedido`
- `fechaProgramada`
- `fechaVencimiento`
- `observaciones`
- `PedidoItem.subtotal`

## Nuevo contrato `PedidoEntrega`

Usar `PedidoEntrega` para seguimiento operativo/logístico. No seguir metiendo esa semántica dentro de `PedidoState`.

## Reemplazos conceptuales

- `PedidoState.ATENDIDO` cubre caso donde reserva quedó completa pero aún no se convirtió;
- `PedidoEntregaState.DESPACHADO`, `EN_RUTA`, `ENTREGADO` salen del estado comercial y pasan al contrato logístico.

## Referencias

- [README.md](./README.md)
- [modelo-vigente.md](./modelo-vigente.md)
- [guia-de-consumo.md](./guia-de-consumo.md)
