# Módulo fiscal V1: estado de implementación

Este corte publica contratos, verificación criptográfica de publicaciones, motor de decisión, snapshot, documento y preparación económica de nota en `yola-fresh-utils`. El backend y el móvil consumen el mismo paquete `2.7.15-fiscal-v1.2` en sus adaptadores de publicación y verificación. El checkout y la emisión V1 todavía no están conectados; la ruta V1 de firma devuelve `501` deliberadamente. No se han publicado perfiles ni modificado datos de ningún tenant.

## Límite de confianza

`prepareFiscalV1Sale` recibe un `FiscalV1SignedPublicationBundle`, claves públicas confiables fijadas fuera del bundle y la hora observada. La biblioteca verifica Ed25519 sobre los bytes UTF-8 del JSON canónico del payload; SHA-256 del payload y de cada artefacto; ámbito tenant/emisor/entorno; revisión entera positiva; vigencia con expiración exclusiva; y validez de la clave confiable. No existe un callback para aprobar publicaciones arbitrarias. `tweetnacl` y `@noble/hashes` son implementaciones puras compatibles con Node y React Native.

El backend mantiene la clave privada fuera del proceso API, autoriza la publicación, aplica revisión monotónica con CAS y expone un registro de claves públicas administrado por operador. El móvil conserva por tenant y entorno las claves y el bundle, y rechaza regresiones de revisión en SQLite. **Una firma válida solo prueba que el publicador autorizado firmó esos datos; no demuestra por sí sola que SUNAT o XmlPeru admiten el caso.** Las referencias de evidencia no equivalen a XML/CDR reales revisados. No hay claves productivas en esta biblioteca. El backend vuelve a verificar el bundle con su propio reloj antes de cualquier futuro efecto externo.

## Lo que decide el motor

- Selecciona exactamente un perfil de emisor, una regla por presentación y contexto, y una capacidad `SUPPORTED` para el conjunto exacto de categorías del carrito. Ausencia, suspensión, solapamiento o capacidad no verificada bloquean.
- Conserva por separado la categoría legal del producto y la revelación de impuesto por régimen. En NRUS deja base, impuesto y tasa aplicada en `null`: no fabrica un IGV de cero. En RER calcula el importe incluido usando la tasa publicada.
- No produce códigos de afectación documental/UBL. La traducción a XML corresponde al adaptador de proveedor, que debe tener evidencia para la combinación exacta de régimen, entorno, SEE, versión y categorías; nunca debe inferirla del nombre `GRAVADA`.
- V1 solo acepta PEN, operaciones domésticas de venta al detalle o al por mayor, comprador identificado con RUC para factura, y líneas de importe positivo. Gratuidades, otras monedas, contextos no modelados, RMT y Régimen General quedan bloqueados hasta que exista contrato y capacidad probada.

## Snapshot, documento y nota

`FiscalV1Snapshot` congela la decisión, emisor y establecimiento completos, dirección, descripciones por línea, comprador, condición de pago, serie/número e importes con huella canónica. El backend debe recalcular la decisión con publicaciones autorizadas antes de reservar o firmar: una huella auto calculada de un snapshot arbitrario no es autorización. `FiscalV1DocumentRecord` distingue resultado incierto, XML firmado pendiente y aceptación/rechazo tributario con evidencia separada. Impresión no es un estado fiscal.

`prepareFiscalV1CreditNote` usa exclusivamente el snapshot original para naturaleza y precio históricos. Factura exige aceptación tributaria y mismo comprador RUC; boleta exige evidencia de otorgamiento al mismo adquiriente. Suma notas previas reservadas, inciertas, firmadas o aceptadas como saldo consumido. V1 solo modela créditos proporcionales a cantidad original con saldo exacto por línea; ajuste monetario sin unidades no se aproxima. La causal debe estar en una capacidad `NOTA_CREDITO` exacta y `SUPPORTED` para perfil, régimen, contexto, categorías, proveedor y versión. Una capacidad de boleta/factura no habilita la nota. Este resultado no crea XML, no revierte caja/stock y no presupone que una nota NRUS esté admitida: si no hay evidencia y publicación específica, se bloquea.

## Integración parcial y siguientes gates, sin ruta alternativa

El backend ya ofrece publicación autenticada, registro de claves y verificación pura de preparación/snapshot. El móvil ya puede descargar y verificar la publicación fuera del checkout y preparar una decisión local. Su refresco aún es opt-in y no hay cutover de ventas. Antes de reservar correlativo, firmar o enviar habrá que verificar perfil, reglas, capacidad, huellas, tenant, emisor y comprador; ligar fecha de emisión a una política de tiempo confiable; reservar serie/número de forma durable e idempotente; archivar el XML firmado; y superar los ensayos reales del proveedor. El adaptador XmlPeru aislado valida vectores sintéticos pero no se invoca para emitir. Ninguna ausencia de perfil o capacidad se resuelve con una tasa, código o configuración global predeterminada.

Descuentos globales, redondeo de efectivo, precios unitarios modificados, operaciones gratuitas y reanudación/idempotencia de la emisión requieren contratos y pruebas propios antes de activar el módulo en el POS. La nota necesita además causal oficial/versión de catálogo y prueba real XML/resultado para cada capacidad; el test sintético no concede esa admisión.
