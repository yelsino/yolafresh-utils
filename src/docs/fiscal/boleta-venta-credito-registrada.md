# Comprobante posterior de una venta a crédito registrada

La emisión fiscal es un hecho adicional de la misma venta confirmada. No vuelve a crear la venta, el crédito, movimientos de caja, pagos, stock ni el ticket comercial. La elección original `NINGUNO` y su snapshot comercial permanecen intactos; una solicitud explícita posterior registra la elección del operador.

## Contratos y admisión

`FiscalV1Snapshot.commercialSource` contiene `kind: REGISTERED_SALE`, el identificador opaco del snapshot comercial y `snapshotSha256`. Esta última huella corresponde a la **proyección fiscal de origen** generada por `fiscalV1RegisteredSaleSource`: identificadores de snapshot/venta/líneas/presentaciones, moneda, total, descripciones, cantidades, precios y totales por línea. Excluye sobres CouchDB, imágenes y datos mutables del cliente. El adaptador remoto copia `_id` a `id`; no exige un `id` remoto duplicado.

El backend contrasta esa referencia con la venta y snapshot publicados del tenant autenticado, condición `CREDITO`, estado `CONFIRMADA`, comprador y libro oficial de Cuenta cliente. Rechaza diferencias antes de reservar numeración. El saldo pendiente proviene del libro normalizado en céntimos, con deuda contabilizada, sin reversa ni operación financiera inconclusa.

El crédito se congela mediante `fiscal-v1-snapshot-v2`, `paymentTerms.kind: CREDITO`, `netPendingCents` y cuotas positivas que suman ese saldo. El operador elige el vencimiento; no se fabrica una fecha. XmlPeru recibe `formaPago: Credito` y `cuotas`, según su colección oficial. El XML debe conservar condición, saldo y cada cuota, además de los importes, identidad, serie y número ya comprobados. Esta representación técnica no presume que boleta y factura tengan idénticos requisitos legales.

## Operación móvil y recuperación

En Opciones de una venta a crédito con selección original `NINGUNO`, «Emitir boleta» abre una revisión local. Confirma comprador, importe, saldo, caja/serie y entorno; el calendario registra el vencimiento. Abrir o cerrar la revisión no solicita firma. La confirmación guarda una solicitud técnica durable en la tabla existente `fiscal_deferred_sale_requests`, con `purpose: REGISTERED_SALE`, alcance de sesión, origen comercial y condiciones de crédito. No modifica tablas comerciales ni financieras.

La cola fiscal existente prepara, solicita firma y recupera el mismo `operationId`. Un POST ambiguo conserva su identidad; no autoriza otro comprobante. El registro global de series impide duplicar la venta entre dispositivos. El acuse se adjunta a la venta existente en una transacción local; si falta o cambió el origen, no se recrea. Los documentos públicos fiscales siguen llegando por bootstrap/catch-up/longpoll. La cola técnica se conserva al instalar snapshots; no aparece una nueva raíz ni tabla y no aumenta el schema SQLite 115.

## Precisión y compatibilidad

Importes de línea y documento usan céntimos exactos; el valor unitario sin IGV puede necesitar hasta diez decimales. Por ejemplo: 15 unidades de queso a S/2.70 → total S/40.50, base S/34.32, IGV S/6.18 y valor unitario S/2.288. El adaptador comprueba que la precisión enviada reproduce la base y el XML reproduce bases, IGV y totales. La misma regla se aplica a notas; las devoluciones parciales siguen exigiendo una distribución histórica exacta de base e impuesto.

Los campos nuevos son opcionales. La ausencia conserva los bytes y huellas anteriores. La emisión nueva de crédito exige el contrato v2; las referencias de confianza y credenciales PSE existentes se conservan. Se comprueban contratos, persistencia/recuperación sin efectos duplicados, UI física y XML/CDR Demo cuando se autoriza ese entorno. Si el titular limita la validación a su empresa en Producción, se verifica preparación y configuración sin emitir y se distingue la habilitación técnica de la aceptación real del primer comprobante.

Referencia del proveedor: https://docs.xmlperu.dev/referencia/emitir/ y colección oficial https://docs.xmlperu.dev/xmlperu-v1.postman_collection.json.
