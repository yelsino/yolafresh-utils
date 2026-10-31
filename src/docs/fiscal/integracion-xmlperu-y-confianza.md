# XmlPeru: afiliación empresarial y confianza de la integración

Decisión de responsabilidades: 30 de octubre de 2026.

## Empresa afiliada

La empresa identifica al emisor, autoriza el trámite PSE y conserva una credencial de firma vinculada a su RUC y entorno. El backend custodia esa credencial en la bóveda; no se solicita al operador copiar un token entre empresas. Una autorización SOL ya concluida no se repite para resolver la confianza técnica del integrador.

Con `signing: provider`, XmlPeru firma con su certificado PSE. Subir un certificado propio es una alternativa del proveedor, no un requisito del registro empresarial. No se agrega al onboarding ni a la caja un campo obligatorio CER, PEM, PFX, certificado CDR o clave pública técnica.

## Responsabilidad de YolaFresh

La integración mantiene la confianza pública del PSE y del veredicto SUNAT por entorno. Esa confianza puede reutilizarse entre empresas que utilicen el mismo proveedor y modalidad. No contiene credenciales empresariales ni concede permiso para emitir en otro RUC.

Compartir el firmante PSE no comparte empresa, autorización, token, series, correlativos, comprobantes ni deudas. Cada operación conserva su tenant, emisor legal, entorno e identidad documental; sus importes se contrastan con el snapshot de la venta. Demo no acredita confianza ni aceptación productiva.

La verificación independiente X509 es un control interno de YolaFresh. No debe presentarse como un trámite que XmlPeru exige a cada contribuyente. El registro de confianza del PSE y el de quien firma el CDR son distintos; autorizar el primero no autoriza automáticamente el segundo.

La publicación fiscal Ed25519 tiene otra función: autoriza perfiles, reglas y capacidades de YolaFresh. No es el certificado con el que XmlPeru firma un comprobante ni la autorización SOL del emisor.

## Controles conservados

La confianza debe provenir de una fuente revisada fuera del documento que se está verificando. Encontrar un certificado en el `KeyInfo` de un XML no lo autoriza. Un cambio de certificado requiere una actualización de la integración, conservando los certificados históricos necesarios para leer archivos ya emitidos. No obliga a cada empresa a volver a afiliarse.

Un XML firmado, su envío y la aceptación/rechazo tributario son hechos separados. `success: true` o HTTP 200/202 no bastan para declarar aceptación. La respuesta aún pendiente se consulta; no se vuelve a firmar para resolver una espera.

La selección de confianza central no habilita por sí misma un tenant, una capacidad, una serie ni un comprobante. Se mantienen las autorizaciones y verificaciones empresariales existentes. Este documento no acredita que una configuración productiva concreta ya esté publicada.

## Contrato del proveedor consultado

- [Quién firma](https://docs.xmlperu.dev/referencia/firma-empresa/): firma PSE por defecto, firma propia opcional y firma externa diferenciada.
- [Certificado propio](https://docs.xmlperu.dev/referencia/certificado-empresa/): gestión opcional y metadata; no entrega el archivo privado.
- [Empresa del token](https://docs.xmlperu.dev/referencia/empresa-del-token/): comprobación de emisor y entorno de una credencial.
- [Cómo leer el resultado](https://docs.xmlperu.dev/guias/interpretacion/): separación entre procesamiento de la API, comunicación y veredicto SUNAT.
- [Descarga de CDR](https://docs.xmlperu.dev/referencia/descargar-cdr/): ZIP original o XML sin envoltorio.

La documentación consultada no proporciona una descarga pública del certificado PSE ni del firmante CDR. Resolver la fuente confiable es trabajo de la integración de YolaFresh; no se traslada al registro del cliente ni se suple aceptando automáticamente un certificado recibido dentro del comprobante.
