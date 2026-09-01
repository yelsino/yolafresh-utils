# Integración de compras en un POS offline-first

## Propósito

Este documento define el perfil de integración que debe respetar una aplicación YolaFresh que opere compras sobre una base local y sincronice directamente con CouchDB.

No prescribe una librería de UI, SQLite ni un motor de sync concreto. Sí define la secuencia de negocio, ownership de documentos e invariantes que el consumer debe preservar.

## Separación de responsabilidades

| Capa o dominio | Responsabilidad |
|---|---|
| Compras | evento, documento económico por proveedor, items, totales, condición y estado de pago |
| Inventario | recepción física, asignación, movimiento, stock y kardex |
| Finanzas | egreso, obligación de proveedor, pago y aplicación |
| Evidencias | comprobantes, guías, vouchers y adjuntos |
| Consumer móvil | persistencia local, outbox, conflictos, reintentos, UI y proyecciones |
| CouchDB | convergencia remota de documentos y feed de cambios |

## Flujo canónico

    Preparar evento
      → confirmar/agrupar items por proveedor
      → crear una Compra por proveedor
      → aprobar la Compra según política comercial
      → registrar una o más recepciones parciales
      → confirmar físicamente cada recepción
      → crear asignaciones y un movimiento idempotente
      → actualizar stock y kardex
      → derivar estado de recepción completa
      → registrar/aplicar pagos
      → cerrar Compra y Evento cuando sus dimensiones estén completas

El mismo grafo puede producirse mediante una Compra directa: un único comando de
aplicación confirma de inmediato Compra, Recepción y Movimiento sin exigir al
operador recorrer los pasos manualmente. No debe implementarse como una cadena de
transacciones independientes. Véase
[RFC de Compra directa](./rfc-compra-directa.md).

## Documentos mínimos

Un consumer CouchDB debería mantener como documentos independientes:

- `evento_compra`;
- `evento_compra_item` mientras el evento se prepara;
- `compra`;
- `recepcion_mercaderia`;
- `asignacion_recepcion_compra`;
- `movimiento_inventario` (`schemaVersion = 2`);
- proyecciones de stock y kardex si la arquitectura vigente las sincroniza;
- `egreso`, `movimiento_caja`, evidencia y documentos de pago cuando apliquen;
- `cuenta_proveedor`, `movimiento_cuenta_proveedor`,
  `imputacion_cuenta_proveedor`, `desembolso_proveedor`,
  `resumen_cuenta_proveedor` y `operacion_cuenta_proveedor`.

La separación permite:

- varias compras dentro de un evento;
- varias recepciones para una compra;
- un mismo evento con varios proveedores;
- pagos parciales independientes de recepciones parciales;
- reconstrucción y auditoría sin incrustar todo el proceso en un único documento mutable.

## Secuencia local-first exigida

### Comando local

1. validar el dominio;
2. persistir el cambio en SQLite;
3. persistir una operación de outbox durable;
4. actualizar la proyección visible;
5. responder al usuario sin exigir red;
6. sincronizar de forma eventual.

Guardar solo en memoria y encolar después no es suficiente. Una muerte del proceso entre ambos pasos puede perder la intención del usuario.

### Cambio remoto

1. leer `_changes` desde un checkpoint durable;
2. resolver el `type` a un procesador conocido;
3. aplicar el documento o tombstone a SQLite;
4. confirmar la transacción local;
5. avanzar checkpoint;
6. invalidar las proyecciones UI afectadas.

El processor no debe absorber un error y devolver éxito. Si no pudo proyectar, el checkpoint no debe superar ese cambio salvo que exista una dead-letter explícita.

## Atomicidad de una recepción

Confirmar una recepción es una sola unidad de negocio, aunque produzca varios documentos.

Debe quedar atómicamente decidido en local:

- recepción confirmada;
- asignaciones creadas;
- movimiento de inventario creado;
- stock actualizado;
- kardex generado;
- intención de sincronización registrada.

La operación debe ser idempotente. Repetir el mismo comando con el mismo `recepcionId` no puede crear otro movimiento ni aumentar stock de nuevo.

Recomendaciones de contrato de implementación:

- movimiento automático con ID determinista por recepción;
- índice único por recepción/origen para el movimiento;
- asignaciones con identidad estable;
- guard de resultado ya aplicado;
- outbox transaccional en la misma base local cuando sea posible.

## Cantidades y costo base

Para un CompraItem:

    unidadesBaseCompradas = cantidad × factorUnidadBase

    costoPorUnidadBase = costoTotal / unidadesBaseCompradas

Para una recepción parcial:

    unidadesBaseRecibidas = cantidadRecibida × factorUnidadBase

    valorRecibido = unidadesBaseRecibidas × costoPorUnidadBase

`factorUnidadBase` describe el empaque o unidad real comprada. Junto con
`presentacionId`, `productoBaseId`, `unidadBaseInventario` y
`versionConversion`, forma el snapshot inmutable de la conversión capturada en
el `CompraItem`. `versionConversion` debe ser un entero seguro positivo.

La recepción debe usar exclusivamente ese snapshot. No puede completar campos
faltantes consultando la presentación mutable ni asumir factor o versión por
defecto. Un item físico legacy incompleto debe fallar cerrado antes de crear el
movimiento; una migración de lectura puede identificarlo, pero no convertirlo
silenciosamente en un hecho físico nuevo.

`equivalenciaUnidadBase` describe una presentación y no debe sustituir
silenciosamente a `factorUnidadBase`.

Ejemplo:

- 5 cajas;
- 12 unidades base por caja;
- costo por caja S/ 35;
- costo total S/ 175.

Resultado:

- 60 unidades base;
- costo base S/ 2.9167;
- recibir 2 cajas ingresa 24 unidades base valorizadas en S/ 70.

## Item de producto base versus presentación

`EventoCompraItem.productoCompra` es parcial y un consumer puede capturar
inicialmente un `productoBaseId`. Sin embargo, el contrato vigente de
`CompraItem` inventariable exige congelar la presentación y su conversión
completa (`presentacionId`, `productoBaseId`, `factorUnidadBase`,
`unidadBaseInventario`, `versionConversion`) antes de consolidar la compra.

Por tanto, antes de consolidar o recibir el item, el consumer debe resolver una presentación de movimiento inequívoca. No es válido marcar una recepción como completada y omitir el movimiento porque la presentación quedó vacía.

## Estados independientes

### Estado comercial

- `BORRADOR`: editable;
- `CONFIRMADO`: aprobado/validado comercialmente;
- `CERRADO`: sin pendientes comerciales según política;
- `ANULADO`: invalidado mediante flujo compensatorio.

### Estado físico

- recepción `BORRADOR` no afecta stock;
- recepción `CONFIRMADA` queda aplicada una sola vez;
- recepción `ANULADA` requiere no haber sido aplicada o una compensación explícita.

El resumen físico de una Compra se deriva de asignaciones:

- pendiente;
- parcial;
- completa.

No se recomienda reutilizar `EstadoCompraEnum.CONFIRMADO` como sinónimo de “recepción completa”.

### Estado financiero

El estado de pago debe derivarse de aplicaciones válidas:

- pendiente;
- pagado parcial;
- pagado.

Un gasto logístico prorrateable aumenta el costo de inventario; un pago de mercadería reduce la deuda con el proveedor. No son el mismo hecho.

## Conflictos CouchDB

Para documentos mutables:

- recuperar `_rev` vigente;
- aplicar una política de merge por agregado;
- preservar transiciones válidas;
- no hacer last-write-wins ciego sobre estados terminales;
- guardar auditoría de actor y timestamp.

Para hechos contables o de inventario, preferir documentos append-only con IDs idempotentes. Stock puede ser una proyección reconstruible, no el único registro del hecho.

## Bootstrap e instalación

Una aplicación que use snapshot debe incluir en generación, descarga, importación y conteo:

- eventos e items;
- compras;
- recepciones y asignaciones;
- movimientos, stock y kardex si forman parte de la proyección distribuida;
- proveedores, almacenes, evidencias, egresos y precios requeridos por la UI.

El snapshot debe exponer `sourceUpdateSeq`. El consumer debe sembrar el checkpoint con ese valor y ejecutar catch-up antes de declarar la instalación lista.

Agregar un nuevo tipo CouchDB exige cablear simultáneamente:

1. contrato y `type` canónico;
2. generación del snapshot;
3. configuración de importación;
4. tabla y migración SQLite;
5. mapper/processor;
6. habilitación del processor;
7. tombstone;
8. invalidación reactiva;
9. pruebas de instalación limpia, actualización y eliminación.

## Perfil auditado: YolaFresh POS 1.1.21

Este bloque describe un consumer concreto; no redefine el dominio.

Fortalezas observadas:

- SQLite primero y outbox directo a CouchDB;
- grafo de evento e items en operación batch de outbox;
- una compra por proveedor;
- recepciones parciales con rechazo de sobre-recepción;
- MovimientoInventario como única mutación de stock;
- snapshot con los tipos principales de compra;
- tombstones registrados;
- pruebas unitarias para grafo, outbox, generación y recepción.

Garantías implementadas por el consumer auditado al 12-08-2026:

- confirmación de recepción atómica e idempotente en SQLite;
- IDs deterministas para movimiento, asignaciones y kardex;
- intención durable que enlaza la transacción de negocio con el outbox;
- recuperación de confirmaciones históricas interrumpidas sin duplicar stock;
- costo base calculado con `factorUnidadBase`;
- presentación física obligatoria para items que afectan inventario;
- sync, backfill, tombstone y bootstrap para todo el grafo de recepción e inventario;
- processors que propagan fallos e impiden avanzar un checkpoint incompleto;
- ruta heredada de mutación directa de stock bloqueada.

Decisiones de negocio que siguen pendientes y no deben inferirse en la capa
técnica:

- estados comercial, físico y financiero separados;
- anulación con compensaciones;
- política de cierre sin gasto adicional.

La evidencia completa vive en el repositorio consumidor:

- `docs/compras/MODULO-COMPRA-MERCADERIA-END-TO-END.md`;
- `docs/compras/AUDITORIA-TECNICA-Y-BRECHAS.md`.

## Checklist de conformidad para consumers

- [x] Compra no modifica stock.
- [x] Recepción borrador no modifica stock.
- [x] Confirmación de recepción es atómica e idempotente.
- [x] No existe sobre-recepción.
- [x] Cada item físico tiene presentación/unidad inequívoca.
- [x] Costo y cantidad se normalizan con el snapshot versionado del `CompraItem`.
- [x] Movimiento, stock y kardex convergen entre dispositivos.
- [x] Un fallo de processor bloquea checkpoint o queda en dead-letter visible.
- [x] Todos los tipos tienen bootstrap, processor, enable flag y tombstone.
- [ ] Estado comercial no se deduce de recepción sin política explícita.
- [x] Estado financiero se deriva de pagos aplicados en CuentaProveedor.
- [ ] Anulaciones posteriores a stock generan compensación auditable.
- [ ] Los timestamps públicos son Unix milliseconds.
