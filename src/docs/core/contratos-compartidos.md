# Contratos Compartidos del Core

## Propósito

Este documento describe mapa vigente de contratos compartidos después de eliminar `shared/interfaces` y redistribuir ownership hacia dominios propietarios.

## Criterio de lectura

El paquete distingue tres grupos:

- contratos de dominio;
- contratos transversales reales en `shared/kernel`;
- contratos auxiliares históricos claramente acotados, como `ledger`.

## Ownership por dominio

### Ventas

Evidencia principal:

- [ventas/contracts/index.ts](../../domain/ventas/contracts/index.ts)
- [pedido.contract.ts](../../domain/ventas/contracts/pedido.contract.ts)
- [venta.contract.ts](../../domain/ventas/contracts/venta.contract.ts)
- [carrito-venta.contract.ts](../../domain/ventas/contracts/carrito-venta.contract.ts)
- [venta-snapshot.contract.ts](../../domain/ventas/contracts/venta-snapshot.contract.ts)

Lenguaje observado:

- `Pedido`
- `PedidoItem`
- `IVenta`
- `VentaItem`
- `ICarritoVenta`
- `IVentaSnapshot`

### Compras

Evidencia principal:

- [compras/contracts/index.ts](../../domain/compras/contracts/index.ts)
- [compra.contract.ts](../../domain/compras/contracts/compra.contract.ts)

Lenguaje observado:

- `ICompra`
- `CompraItem`
- `CompraEgresoRef`
- `EstadoCompraEnum`
- `TipoDocumentoCompraEnum`

### Inventario

Evidencia principal:

- [inventario/contracts/index.ts](../../domain/inventario/contracts/index.ts)
- [producto.contract.ts](../../domain/inventario/contracts/producto.contract.ts)
- [inventario.contract.ts](../../domain/inventario/contracts/inventario.contract.ts)
- [producto-update.contract.ts](../../domain/inventario/contracts/producto-update.contract.ts)

Lenguaje observado:

- `ProductoBase`
- `Presentacion`
- `MovimientoInventario`
- `StockPresentacionAlmacen`
- `Almacen`

### Tesoreria

Evidencia principal:

- [tesoreria/contracts/index.ts](../../domain/tesoreria/contracts/index.ts)
- [caja.contract.ts](../../domain/tesoreria/contracts/caja.contract.ts)
- [pago.contract.ts](../../domain/tesoreria/contracts/pago.contract.ts)

Lenguaje observado:

- `Caja`
- `TurnoCaja`
- `MovimientoCaja`
- `Pago`
- `EstadoPagoCapturaEnum`

### Finanzas

Evidencia principal:

- [finanzas/contracts/index.ts](../../domain/finanzas/contracts/index.ts)
- [finanzas.contract.ts](../../domain/finanzas/contracts/finanzas.contract.ts)
- [cuenta-cliente.contract.ts](../../domain/finanzas/contracts/cuenta-cliente.contract.ts)
- [ledger-auxiliar.contract.ts](../../domain/finanzas/contracts/ledger-auxiliar.contract.ts)
- [recurrencia.contract.ts](../../domain/finanzas/contracts/recurrencia.contract.ts)

Lenguaje observado:

- `Ingreso`
- `Egreso`
- `Cambio`
- `Anulacion`
- `CuentaProveedor`
- `MovimientoCuentaProveedor`
- `CuentaCliente`
- `MovimientoCuentaCliente`
- `ImputacionCuentaCliente`
- `RecepcionCobroCliente`
- `TransferenciaCustodiaCobro`
- `ResumenCuentaCliente`
- `Recurrencia`
- `ReglaRecurrencia`

Lectura importante:

- `CuentaCliente` queda absorbido dentro de `finanzas`;
- `MovimientoFinanciero` en `ledger-auxiliar.contract.ts` se trata como contrato auxiliar, no como ledger oficial.

### Personas

Evidencia principal:

- [personas/contracts/index.ts](../../domain/personas/contracts/index.ts)
- [persons.contract.ts](../../domain/personas/contracts/persons.contract.ts)
- [usuario.contract.ts](../../domain/personas/contracts/usuario.contract.ts)
- [entidad.contract.ts](../../domain/personas/contracts/entidad.contract.ts)
- [roles.contract.ts](../../domain/personas/contracts/roles.contract.ts)
- [permisos.contract.ts](../../domain/personas/contracts/permisos.contract.ts)
- [direccion.contract.ts](../../domain/personas/contracts/direccion.contract.ts)

Lenguaje observado:

- `Cliente`
- `Personal`
- `Proveedor`
- `IUsuario`
- `Entidad`
- `Rol`
- `SesionContexto`
- `Permisos`
- `RolesPredefinidos`

### Contabilidad

Evidencia principal:

- [contabilidad/contracts/index.ts](../../domain/contabilidad/contracts/index.ts)

Lenguaje observado:

- `EstadoAsientoContable`
- `EstadoPeriodoFiscal`
- `TipoCuentaContable`

## Contratos transversales reales

### `shared/kernel`

Evidencia principal:

- [kernel/index.ts](../../domain/shared/kernel/index.ts)
- [documentos.contract.ts](../../domain/shared/kernel/documentos.contract.ts)
- [empresa.contract.ts](../../domain/shared/kernel/empresa.contract.ts)
- [evidencias.contract.ts](../../domain/shared/kernel/evidencias.contract.ts)
- [enums.ts](../../domain/shared/kernel/enums.ts)
- [fiscal.contract.ts](../../domain/shared/kernel/fiscal.contract.ts)

Responsabilidad:

- sostener documentos, empresa, evidencias, enums y configuración fiscal transversal.

## Restricciones observadas

- nuevos contratos no deben volver a caer en un bucket genérico compartido;
- `shared/kernel` solo guarda lenguaje transversal real;
- consumers deben usar contratos como lenguaje, no como orquestación completa;
- infraestructura y persistencia siguen fuera del paquete.

## Referencias

- [README.md](./README.md)
- [arquitectura-vigente.md](./arquitectura-vigente.md)
- [../ventas/README.md](../ventas/README.md)
- [../finanzas/README.md](../finanzas/README.md)
