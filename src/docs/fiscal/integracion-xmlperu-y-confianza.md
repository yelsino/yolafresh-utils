# XmlPeru: afiliación empresarial y confianza de la integración

Decisión de responsabilidades: 30 de octubre de 2026.

## Empresa afiliada

La empresa identifica al emisor, autoriza el trámite PSE y conserva una credencial de firma vinculada a su RUC y entorno. El backend custodia esa credencial en la bóveda; no se solicita al operador copiar un token entre empresas. Una autorización SOL ya concluida no se repite para resolver la confianza técnica del integrador.

Con `signing: provider`, XmlPeru firma con su certificado PSE. Subir un certificado propio es una alternativa del proveedor, no un requisito del registro empresarial. No se agrega al onboarding ni a la caja un campo obligatorio CER, PEM, PFX, certificado CDR o clave pública técnica.

## Responsabilidad de YolaFresh

El modo estándar aprobado es `PROVIDER_AUTHENTICATED_CHANNEL`: el backend recibe los artefactos desde el origen fijo de XmlPeru mediante TLS y la credencial empresarial custodiada. Contrasta identidad, entorno, numeración y contenido económico contra la operación congelada; conserva los bytes y su SHA-256. No exige certificados a la empresa ni afirma haber validado independientemente la cadena X509.

La capacidad fiscal firmada declara `providerEvidenceAssurance`. El backend exige que coincida con su configuración antes de reservar un número y congela ese criterio en el claim previo al POST. La recuperación usa el criterio histórico; cambiar una variable no convierte un documento antiguo a otra modalidad.

Cada XML, CDR o rechazo sin CDR tiene un `FiscalV1ProviderChannelReceipt` con origen, tenant, RUC, entorno, identidad, hash y fecha. Es evidencia de procedencia creada por el adaptador del backend; su forma JSON no es una firma ni una autorización. No se acepta como entrada de un operador, dispositivo o XML importado. El móvil conserva el recibo mediante los contratos existentes, sin nuevas lecturas HTTP de listas de negocio.

Compartir el firmante PSE no comparte empresa, autorización, token, series, correlativos, comprobantes ni deudas. Cada operación conserva su tenant, emisor legal, entorno e identidad documental; sus importes se contrastan con el snapshot de la venta. Demo no acredita confianza ni aceptación productiva.

La verificación independiente X509 sigue disponible como modalidad separada con certificados previamente autorizados por YolaFresh. Su registro PSE y su registro de firmantes CDR son distintos. No debe presentarse como un trámite que XmlPeru exige a cada contribuyente.

La publicación fiscal Ed25519 tiene otra función: autoriza perfiles, reglas y capacidades de YolaFresh. No es el certificado con el que XmlPeru firma un comprobante ni la autorización SOL del emisor.

## Controles conservados

En la modalidad independiente, la confianza proviene de una fuente revisada fuera del documento. Encontrar un certificado en el `KeyInfo` de un XML no lo autoriza. Un cambio de certificado requiere actualizar esa modalidad conservando la confianza histórica; no obliga a cada empresa a volver a afiliarse.

Un XML firmado, su envío y la aceptación/rechazo tributario son hechos separados. `success: true` o HTTP 200/202 no bastan para declarar aceptación. La respuesta aún pendiente se consulta; no se vuelve a firmar para resolver una espera.

En el modo estándar, la aceptación exige resultado resuelto, `reached_sunat`, código cero, CDR presente y coincidencia entre CDR, respuesta e identidad congelada. Un rechazo resuelto sin CDR conserva la respuesta original como `PROVIDER_RESULT`, publicando `PROVEEDOR_AUTENTICADO` y estado rechazado. Nunca fabrica una CDR ni ofrece ese JSON como CDR. Los bytes privados no forman parte de la proyección pública.

Las capacidades de carritos gravados, exonerados y mixtos son conjuntos exactos y separados dentro del mismo contexto. La numeración no elige una de ellas; el motor la selecciona según las líneas de cada venta. Las notas requieren su capacidad correctiva correspondiente. `DEMO_TEST_ONLY` permite probar esta integración en Demo, sin habilitar Producción ni inventar evidencia `SUPPORTED`.

La selección de confianza central no habilita por sí misma un tenant, una capacidad, una serie ni un comprobante. Se mantienen las autorizaciones y verificaciones empresariales existentes. Este documento no acredita que una configuración productiva concreta ya esté publicada.

## Contrato del proveedor consultado

- [Quién firma](https://docs.xmlperu.dev/referencia/firma-empresa/): firma PSE por defecto, firma propia opcional y firma externa diferenciada.
- [Certificado propio](https://docs.xmlperu.dev/referencia/certificado-empresa/): gestión opcional y metadata; no entrega el archivo privado.
- [Empresa del token](https://docs.xmlperu.dev/referencia/empresa-del-token/): comprobación de emisor y entorno de una credencial.
- [Cómo leer el resultado](https://docs.xmlperu.dev/guias/interpretacion/): separación entre procesamiento de la API, comunicación y veredicto SUNAT.
- [Descarga de CDR](https://docs.xmlperu.dev/referencia/descargar-cdr/): ZIP original o XML sin envoltorio.

La documentación consultada no proporciona una descarga pública del certificado PSE ni del firmante CDR. Resolver la fuente confiable es trabajo de la integración de YolaFresh; no se traslada al registro del cliente ni se suple aceptando automáticamente un certificado recibido dentro del comprobante.
