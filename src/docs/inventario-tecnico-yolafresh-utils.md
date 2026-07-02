# Inventario Tecnico de `yolafresh-utils`

## Proposito

`yolafresh-utils` funciona como libreria compartida de dominio para proyectos de YolaFresh. Centraliza contratos, entidades, utilidades y componentes de negocio reutilizables para backend, frontend y otros consumidores TypeScript.

La fuente principal vive en `src/`. En particular:

- `src/domain/` contiene los bounded contexts y la capa compartida.
- `src/index.ts` expone un subconjunto de exports de alto nivel.
- `src/docs/` concentra la documentacion funcional y tecnica.

## Estructura General

### Modulos de dominio

| Modulo | Responsabilidad principal | Piezas relevantes |
| --- | --- | --- |
| `compras` | Representacion y ciclo de vida de compras | `Compra`, `EventoCompraFactory`, `GeneradorCompra`, `RecepcionService` |
| `inventario` | Aplicacion de movimientos de stock y ayudas de producto | `MovimientoInventarioService`, `getUrlProduct`, `producto.update.interface.ts` |
| `contabilidad` | Asientos, periodos, plan de cuentas y configuracion fiscal | `AsientoContable`, `LineaAsiento`, `PeriodoFiscal`, `PlanCuenta`, `FiscalUtils`, `ConfiguracionFiscalFactory` |
| `finanzas` | Recurrencias y procesamiento de ejecuciones | `RecurrenciaEntity`, `RecurrenciaProcessor` |
| `tesoreria` | Caja, turnos y pagos | `Caja`, `TurnoCaja`, `MovimientoCaja`, `Pago`, `EstadoPagoCapturaEnum` |
| `cuenta-cliente` | Cuenta cliente v2 con ledger, custodia y resumen reconstruible | `CuentaCliente`, `MovimientoCuentaCliente`, `ImputacionCuentaCliente`, `RecepcionCobroCliente`, `TransferenciaCustodiaCobro`, `ResumenCuentaCliente` |
| `usuarios` | Usuarios, personas y validacion de permisos | `Usuario`, `PermisoValidator`, `Personal`, `Cliente`, `Proveedor`, enums de cargos y categorias |
| `ventas` | Venta agregada, carrito, snapshots y eventos | `Venta`, `CarritoVenta`, `VentaConfirmada`, snapshots de persistencia y helpers de venta |
| `shared` | Contratos transversales, base DDD, value objects y utilidades | `interfaces`, `utils`, `base`, `value-objects` |

### Capa compartida

| Carpeta | Rol |
| --- | --- |
| `shared/interfaces` | Contratos de dominio reutilizables: producto, personas, finanzas, compras, caja, permisos, notificaciones, recurrencias, documentos, ledger y otros |
| `shared/utils` | Utilidades de fechas, texto, regex, RBAC, multimedia, naming, conversiones y helpers de venta/producto |
| `shared/base` | Bloques DDD base: `AggregateRoot`, `Entity`, `ValueObject`, `DomainEvent` |
| `shared/value-objects` | Value objects concretos: `EmpresaId`, `SucursalId` |

## Inventario por Modulo

### `ventas`

Responsabilidad: modelar la venta finalizada, el carrito congelado y snapshots de persistencia o integracion.

Activos principales:

- `Venta.ts`: agrega `IVenta`, clase `Venta`, `ItemVenta` y funciones auxiliares como `getVentaItems` y `getVentaItemsResumen`.
- `CarritoVenta.ts`: define `CarItem`, `OpcionesAgregarProducto`, `ProcedenciaVenta`, `ICarritoVenta` y la clase `CarritoVenta`.
- `snapshots.ts`: contratos `VentaImageSnapshot`, `VentaDetalleSnapshot`, `VentaPersistenceSnapshot`, `VentaCouchMinimalSnapshot` y variantes compactas.
- `events/VentaConfirmada.ts`: evento de dominio para confirmacion de venta.
- `pedido.ts`: tipos auxiliares de carrito y hora, mas cercanos a contratos legados.
- `utilsVenta.ts`: helpers de salida como `generarWhatsAppLink`, `generarCodigoAmigable` y `formatearHora`.

Observaciones:

- `Venta` extiende `AggregateRoot<string>` y congela el carrito como fuente unica de verdad.
- Parte de los contratos de venta tambien estan duplicados o reexportados en `shared/interfaces/pedido.ts` y `shared/utils/venta.ts`.

### `compras`

Responsabilidad: modelar compras persistidas y operaciones del flujo de compra.

Activos principales:

- `Compra.ts`: entidad inmutable `Compra` basada en `ICompra`, con reglas de confirmacion, cierre, anulacion y pago.
- `EventoCompraFactory.ts`: factoria para construir eventos relacionados con compra.
- `GeneradorCompra.ts`: generacion de compras a partir de insumos del dominio.
- `RecepcionService.ts`: operaciones de recepcion asociadas al contexto.

Observaciones:

- El modulo se apoya en contratos definidos en `shared/interfaces/compras.ts` y tipos financieros compartidos.

### `inventario`

Responsabilidad: procesar movimientos de stock y utilidades asociadas a producto/inventario.

Activos principales:

- `MovimientoInventarioService.ts`: aplica entradas, salidas, transferencias y ajustes sobre stock y kardex.
- `producto.ts`: helper `getUrlProduct`.
- `producto.update.interface.ts`: contratos de actualizacion de producto.

Observaciones:

- El servicio depende fuertemente de contratos de `shared/interfaces/Inventario.ts` y `shared/interfaces/producto.ts`.
- En `src/domain/inventario` existe `producto.rar`, que no forma parte del codigo TypeScript fuente.

### `contabilidad`

Responsabilidad: modelar estructura contable y configuraciones fiscales.

Activos principales:

- `AsientoContable.ts`: `AsientoId`, `LineaAsiento` y `AsientoContable`.
- `ContabilidadBase.ts`: `PeriodoFiscalId`, `CuentaId`, `PeriodoFiscal`, `PlanCuenta`.
- `fiscales.ts`: `ConfiguracionFiscal`, `CONFIGURACIONES_FISCALES`, `FiscalUtils`, `ConfiguracionFiscalFactory`.

Observaciones:

- Es el modulo mas alineado con bloques DDD explicitos (`AggregateRoot`, `Entity`, `ValueObject`).

### `finanzas`

Responsabilidad: programacion y procesamiento de recurrencias.

Activos principales:

- `Recurrencia.ts`: aggregate `RecurrenciaEntity` para crear, pausar, activar, anular y reprogramar recurrencias.
- `RecurrenciaProcessor.ts`: procesamiento operativo de recurrencias.
- Dependencias contractuales en `shared/interfaces/recurrencias.ts`.

Observaciones:

- El aggregate encapsula calculo de siguiente ejecucion diaria, semanal, mensual y anual.

### `tesoreria`

Responsabilidad: contratos de caja operativa y pagos.

Activos principales:

- `caja.ts`: `Caja`, `TurnoCaja`, `MovimientoCaja` y tipos de estado/origen/referencia.
- `pagos.ts`: `EstadoPagoCapturaEnum` y `Pago`.

Observaciones:

- El enfoque es contractual; no hay clases de dominio equivalentes en este modulo.
- Parte de estos contratos tambien existen en `shared/interfaces/caja.ts` y `shared/interfaces/pagos.ts`.

### `usuarios`

Responsabilidad: cuentas de usuario, personas de negocio y validacion de permisos.

Activos principales:

- `usuario.ts`: entidad `Usuario` con reglas de estado, roles, permisos y serializacion.
- `PermisoValidator.ts`: `ContextoValidacion`, `ResultadoValidacion`, `ReglaValidacion` y `PermisoValidator`.
- `persons.ts`: enums `CargosPersonal`, `CategoriaCliente`, `DiaSemana`, `EstadoRelacionProveedor` e interfaces `Personal`, `Cliente`, `Proveedor` y contratos relacionados.
- `rbac.ts`: artefactos del modulo vinculados a autorizacion.

Observaciones:

- El contexto mezcla modelado de cuenta (`Usuario`) con contratos de personas de negocio (`Cliente`, `Proveedor`, `Personal`).

### `shared/interfaces`

Responsabilidad: contratos base reutilizables por toda la libreria.

Cobertura identificada:

- Producto e inventario: `producto.ts`, `Inventario.ts`, `producto.update.interface.ts`.
- Personas y entidades: `persons.ts`, `entidades.ts`, `usuario.ts`, `empresa.ts`, `direccion.ts`.
- Operacion comercial: `pedido.ts`, `compras.ts`, `documentos.ts`.
- Finanzas y tesoreria: `finanzas.ts`, `pagos.ts`, `caja.ts`, `ledger.ts`, `recurrencias.ts`.
- Cuenta cliente: `customer-account.ts`.
- Seguridad y organizacion: `permisos.ts`, `roles.ts`, `Device.ts`.
- Soporte transversal: `notificaciones.ts`, `evidencias.ts`, `tarjetaVirtual.ts`.

Observaciones:

- `shared/interfaces/index.ts` es generado automaticamente y reexporta la mayor parte de los contratos fuente.
- Hay contratos que tambien aparecen en modulos especificos (`pedido`, `pagos`, `caja`, `persons`), lo que sugiere coexistencia entre contratos transversales y contextos mas concretos.

### `shared/utils`

Responsabilidad: utilidades puras y helpers transversales.

Cobertura identificada:

- Fechas: `dates.ts`
- Enums compartidos: `enums.ts`
- Fiscalidad: `fiscales.ts`
- Iconos y multimedia: `icons.ts`, `multimedia.ts`
- Listas, mappers y naming: `listas.ts`, `mappers.ts`, `naming-conventions.ts`
- Medidas y producto: `medidas-converter.ts`, `producto.ts`
- Seguridad y acceso: `rbac.ts`
- Validacion textual: `regex.ts`, `textos.ts`
- Herramientas de UI o soporte: `tools.ts`
- Helpers de venta: `venta.ts`

Observaciones:

- `shared/utils/index.ts` tambien es generado automaticamente.
- Algunas utilidades no son completamente agnosticas de entorno, por ejemplo `tools.ts` incluye helpers para `dialog` y efectos de click en DOM.

### `shared/base` y `shared/value-objects`

Responsabilidad: base DDD reusable.

Activos principales:

- `AggregateRoot.ts`
- `Entity.ts`
- `ValueObject.ts`
- `DomainEvent.ts`
- `EmpresaId.ts`
- `SucursalId.ts`

Observaciones:

- Son piezas fundacionales para los aggregates presentes en `ventas`, `contabilidad` y `finanzas`.

## Exports Publicos y Superficie de Consumo

### Export principal (`src/index.ts`)

El root exporta:

- Todo `shared/interfaces`
- Todo `shared/utils`
- Todo `shared/base`
- Todo `shared/value-objects`
- `Venta`
- `CarritoVenta`
- `snapshots` de ventas
- `MovimientoInventarioService`
- `Recurrencia`
- `RecurrenciaProcessor`

Esto posiciona a la libreria como una mezcla de:

- contratos compartidos
- utilidades reutilizables
- algunas clases de dominio seleccionadas

### Subpath exports (`package.json`)

El paquete declara subpath exports para:

- `./domain/*`
- `./domain/ventas/*`
- `./domain/ventas/events/*`
- `./domain/compras/*`
- `./domain/inventario/*`
- `./domain/contabilidad/*`
- `./domain/tesoreria/*`
- `./domain/finanzas/*`
- `./domain/usuarios/*`
- `./domain/shared/*`
- `./domain/shared/interfaces/*`
- `./domain/shared/utils/*`
- `./domain/shared/base/*`
- `./domain/shared/value-objects/*`
- alias agregados `./interfaces`, `./utils` y `./class`

## Fuente vs Artefactos Generados

### Codigo fuente

- `src/` es la fuente editable real.
- Los archivos `index.ts` generados automaticamente en `src/domain/shared/*` consolidan exports.

### Artefactos compilados o publicados

- Existe una carpeta `domain/` en la raiz con archivos `.js` y `.d.ts`.
- `package.json` publica `domain/` en `files` y usa esos artefactos para los subpath exports.
- `tsconfig.json` compila a `dist/`, y el entrypoint principal (`main`, `types`) apunta a `dist/index.*`.

### Observacion estructural

En el estado actual del repositorio no aparece la carpeta `dist/`, aunque el paquete la declara como salida principal. En cambio, si aparecen artefactos compilados en `domain/`. Conviene tener esta diferencia presente al revisar el flujo de build y publicacion.

## Observaciones Finales

- La libreria esta orientada a dominio compartido, no a infraestructura.
- `shared/interfaces` es la capa mas extensa y probablemente la principal fuente de contratos entre aplicaciones.
- Hay coexistencia de modelos mas ricos con clases (`Venta`, `Compra`, `Usuario`, `RecurrenciaEntity`, `AsientoContable`) y modulos puramente contractuales.
- Existen indicios de legado o transicion estructural: duplicidades entre modulos y `shared/interfaces`, artefactos compilados versionados en `domain/`, archivo `restaurando/ShoppingCart.ts` y binarios `.rar` dentro de `src/domain`.
