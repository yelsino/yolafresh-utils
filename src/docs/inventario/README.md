# Inventario

Este dominio publica el único modelo de inventario de Yola Fresh. Su fuente de
verdad es el movimiento físico aplicado; el stock es una proyección por producto
base y almacén.

## Contratos principales

- `StockProductoBaseAlmacen`: saldo proyectado y costo promedio.
- `MovimientoInventarioV2`: hecho físico append-only.
- `PoliticaInventario`: forma de control por empresa, almacén o producto.
- `ConteoInventario` y `ConteoInventarioLinea`: inventario inicial y periódico.
- `AjusteInventario`: corrección aprobada.
- `MermaInventario`: pérdida auditada.
- `TransferenciaInventarioV2`: salida y recepciones entre almacenes.
- `RecepcionMercaderia`: ingreso físico vinculado a una compra.

Los sufijos de versión son revisiones del contrato wire; no representan motores
alternativos ni un modo elegible por tenant.

## Invariantes

- Las cantidades oficiales se expresan en unidad base.
- Cada operación congela su conversión, actor, almacén e idempotencia.
- Venta y merma producen salida; recepción produce entrada; anulación produce
  la reversa exacta del movimiento original.
- Un conteo admite cero y exige motivo cuando valida una diferencia.
- La migración de datos históricos es externa al contrato operativo.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md)
- [transferencias-v2.md](./transferencias-v2.md)
- [politicas-y-mermas-v2.md](./politicas-y-mermas-v2.md)
- [Integración POS de compras](../compras/integracion-pos-offline-first.md)
