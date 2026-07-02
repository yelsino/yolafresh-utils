# Tipos y contratos del paquete

> Documento histórico de apoyo.
> La referencia oficial de contratos vigentes debe leerse en [core/contratos-compartidos.md](./core/contratos-compartidos.md).
> Este archivo ya no documenta helpers eliminados ni artefactos legacy como `ShoppingCart`.

## Propósito

Este documento resume cómo debe leerse hoy la capa tipada de `yolafresh-utils`.

## Principio central

El paquete ya no se documenta como colección amplia de tipos de frontend, transforms o utilidades genéricas.

Su responsabilidad actual es publicar:

- contratos de negocio;
- enums y clasificaciones canónicas;
- primitivas DDD;
- algunos agregados o entidades con invariantes.

## Áreas tipadas principales

### Comercial

Contratos y modelos relacionados con:

- `Pedido`
- `ICompra`
- `Venta`
- `CarritoVenta`
- `VentaSnapshot`

Lectura correcta:

- `Pedido` modela reserva comercial;
- `Venta` modela hecho comercial confirmado;
- `CarritoVenta` modela captura mutable;
- `VentaSnapshot` preserva representación histórica visible.

### Producto e inventario

Contratos compartidos observados:

- `ProductoBase`
- `Presentacion`
- `ProductoPrecio`
- `MovimientoInventario`
- `StockPresentacionAlmacen`
- `Almacen`

### Finanzas, pagos y caja

Contratos compartidos observados:

- `Ingreso`
- `Egreso`
- `Cambio`
- `Anulacion`
- `Pago`
- `MovimientoCaja`

### Cuenta cliente

Contratos observados:

- `CuentaCliente`
- `MovimientoCuentaCliente`
- `ImputacionCuentaCliente`
- `RecepcionCobroCliente`
- `TransferenciaCustodiaCobro`
- `ResumenCuentaCliente`

### Organización y actores

Contratos observados:

- `Cliente`
- `Personal`
- `Proveedor`
- `IUsuario`
- `Entidad`
- `Rol`
- `Permisos`

## Dónde vive la verdad tipada

La evidencia primaria actual está en:

- `src/domain/shared/interfaces/`
- `src/domain/shared/base/`
- `src/domain/shared/value-objects/`
- `src/domain/ventas/`
- `src/domain/finanzas/Recurrencia.ts`

## Qué ya no debe esperarse en esta capa

La auditoría actual confirma que este paquete ya no debe presentarse como fuente de:

- `ShoppingCart` legacy;
- transforms camel/snake case;
- mappers de persistencia;
- adaptadores a SQLite o CouchDB;
- helpers de DOM o UI;
- procesadores operativos de compra o inventario.

## Recomendaciones de consumo

- usar imports de valor solo para símbolos realmente publicados en runtime;
- usar `import type` para contratos e interfaces cuando corresponda;
- resolver adaptaciones de persistencia en el consumer, no en el core compartido;
- leer la documentación modular por Domain antes de asumir semántica de negocio.

## Preguntas abiertas

- si esta guía seguirá existiendo como resumen liviano o será absorbida por la documentación modular del core;
- qué contratos históricos todavía requieren depuración adicional para quedar completamente alineados.

## Referencias

- [README.md](./README.md)
- [core/README.md](./core/README.md)
- [core/contratos-compartidos.md](./core/contratos-compartidos.md)
- [ventas/README.md](./ventas/README.md)
- [cuenta-cliente/README.md](./cuenta-cliente/README.md)
