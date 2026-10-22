# Contratos V1 para factura nacional y evidencia de resultados

Paquete `2.7.15-fiscal-v1.14`, 19/10/2026. Implementación Issue 347. Los estudios
14–16 de `FINANZAS-YOLA-FRESH/docs/facturacion-electronica/` conservan el análisis
de código, reglas oficiales y diferencias del proveedor que originan este corte.

## Alcance de integración

La composición prevista admite factura nacional RER, PEN y contado, con comprador
RUC identificado y nota vinculada por causales 01, 06 y 07. Los contratos puros
compartidos no certifican un emisor, no verifican firmas XML y no activan esa
composición. La habilitación requiere las capacidades exactas y sus evidencias.

`FiscalV1PrintEvidence` conserva QR, digest, fecha de verificación, leyenda y hash
del XML. El backend la construye solo después de verificar contenido, identidad y
certificado. Su validador liga esos campos a los hechos congelados del documento
y ACK. La proyección no afirma aceptación SUNAT ni existencia del commit comercial.
El móvil puede imprimir desde snapshot y evidencia sin inventar los identificadores
`intentId` o `saleSnapshotId` del piloto.

La proyección `FiscalSignedDocument` puede declarar origen `VENTA_V1`, con venta,
operación y snapshot fiscal reales y su hash. Esto permite reusar las políticas
económicas de NC sin atribuir una intención del piloto. La liquidación comercial
resuelve su snapshot comercial por la relación explícita de la venta. El helper
económico acepta BOLETA o FACTURA para 01/06/07 y no sustituye los gates de emisor,
CDR, otorgamiento o capacidad de la composición que emite.

`FiscalV1TributaryResult` mantiene el resultado binario histórico. Sus nuevos
campos `responseCode`, `description` y `observations` se incluyen juntos; el
validador con `requireDetails: true` los exige en cada nueva escritura. Una CDR
aceptada con observaciones mantiene `outcome: ACCEPTED` y su lista original. Una
ausencia de resultado no se convierte en aceptación. Los resultados antiguos sin
detalle siguen legibles sin fabricar código, descripción ni observaciones vacías.

Cada nota conserva su respuesta propia. Un rechazo después de firmar no libera
su reserva ni implica una reversión financiera o física. `FiscalV1DocumentGrant`
registra receptor, momento, referencia y operador del otorgamiento. Se conserva
separado del CDR y del pago, también para factura.

## Recuperación y admisión de crédito

El snapshot `fiscal-v1-snapshot` conserva las reglas originales para comprobar
bytes y hashes de operaciones existentes. No se modifica una evidencia histórica
para completar un saldo que no tenía. `assertFiscalV1SnapshotForIssuance` rechaza
crédito de ese formato al admitir una emisión nueva.

`fiscal-v1-snapshot-v2` requiere `paymentTerms.netPendingCents` en crédito, positivo
y no mayor al total. Las cuotas suman el saldo pendiente y tienen vencimiento
posterior a la fecha de emisión. El campo no concede soporte de anticipo,
detracción, retención o percepción: su cálculo y su payload necesitan una política
y capacidad propias. La composición de esta entrega mantiene el crédito apagado.

Base técnica: hoja `Factura2_0`, celdas J868/L868, J869/L869, J870/L870 y J883/L883
de [Reglas SUNAT 26/08/2026](https://cpe.sunat.gob.pe/sites/default/files/2026-08/Reglas%20de%20validaci%C3%B3n%20-%20actualizado%20al%2026.08.2026.xlsx),
SHA-256 `cb5e871cfe3b81abea7faf25b156e5d35b21e8c4837979350919926612da73b6`.
La causal 13 exige total cero y términos corregidos, por lo que no forma parte de
los comandos de devolución por cantidad de esta entrega.

