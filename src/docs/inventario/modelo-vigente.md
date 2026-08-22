# Modelo vigente de inventario

## Identidad y cantidades

El saldo oficial se identifica por `productoBaseId + almacenId`. Las
presentaciones pertenecen al catálogo y aportan una conversión congelada hacia
la unidad base; no son una segunda fuente de stock.

Cada `Presentacion` persiste `versionConversion` como entero positivo. Empieza
en `1`, se conserva ante cambios de nombre, precio o imagen y aumenta
exactamente en uno cuando cambia `productoBaseId`,
`equivalenciaUnidadBase` o `unidadBaseInventario`. Las ventas y demás hechos
físicos congelan esa versión junto con el factor; nunca reconstruyen una
operación histórica desde la presentación actual.

## Fuente de verdad

`MovimientoInventarioV2` es un hecho aplicado e inmutable. Contiene origen,
actor, fecha efectiva, operación idempotente y líneas con delta base firmado.
`StockProductoBaseAlmacen` y el kardex son proyecciones reconstruibles del libro.

## Inicio de operación

Una empresa nueva empieza sin saldos. Después de crear catálogo y almacenes,
realiza un conteo inicial por almacén. Las diferencias aprobadas generan ajustes;
no existen saldos inferidos ni un motor alternativo que deba activarse.

## Flujos

- Compra: representa el hecho económico.
- Recepción confirmada: materializa una entrada por las líneas controladas.
- Venta confirmada: materializa una salida según el plan congelado.
- Anulación: invierte exactamente la salida original.
- Conteo: captura, revisa y valida existencia física.
- Ajuste: concilia diferencia aprobada.
- Merma: registra pérdida mediante una salida auditada.
- Transferencia: salida total de origen y una o más entradas de destino.

## Política

`PoliticaInventario` resuelve el comportamiento con precedencia empresa,
almacén, producto y producto+almacén. Puede ser estricto, flexible, referencial
o sin control. La política decide si una línea registra movimientos, pero no
cambia el modelo persistente.

## Offline-first

Las raíces y sus intenciones durables se guardan primero en SQLite. Los
reintentos usan IDs, conversiones y claves congeladas; nunca reconstruyen una
operación histórica desde el catálogo actual.
