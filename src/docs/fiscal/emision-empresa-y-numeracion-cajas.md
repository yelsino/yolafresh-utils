# Emisión por empresa y numeración automática de cajas

Decisión de negocio: 30 de octubre de 2026. Contratos canónicos en `yola-fresh-utils`.

## Responsabilidades

La empresa configura su emisor, entorno e integración fiscal una sola vez. Su política comercial define la selección inicial de comprobante; no autoriza por sí misma una firma ni sustituye la preparación tributaria.

La caja identifica desde dónde se vende. No contiene un contador fiscal editable, un certificado, un token ni una publicación tributaria propia. Un turno puede ocupar una caja; abrirlo o cerrarlo no crea ni reinicia series.

El servidor administra las asignaciones y los correlativos. El dispositivo vende con sus datos locales y conserva la solicitud fiscal para continuar al reconectar. Crear una caja offline no inventa una serie global.

## Política y decisión por venta

`ConfigEmpresa.fiscal.facturacionElectronicaEnabled` conserva la habilitación existente. `politicaEmision` agrega una preferencia:

| Política | Selección inicial | Decisión del operador |
|---|---|---|
| Ausente o `MANUAL` | `NINGUNO` | Puede elegir boleta o factura antes de confirmar. |
| `AUTOMATICA` | `comprobantePredeterminado`: boleta o factura | Puede conservarlo o elegir boleta, factura o ninguno. |

El RUC del comprador no convierte automáticamente una boleta en factura. La opción Ninguno es explícita y prevalece al volver a abrir el modal o recibir una actualización de configuración.

La venta y su snapshot conservan `fiscalDocumentSelection`, con `seleccion`, `origen` y `politicaAplicada`. Cambiar la política empresarial no solicita comprobantes sobre ventas históricas. `NINGUNO` no pertenece a `FiscalIntent` ni a `FiscalV1SaleInput`: no crea petición, reserva ni llamada al proveedor.

La opción Ninguno expresa que este flujo del sistema no solicitó un CPE. No constituye una exoneración de las obligaciones legales de emisión y entrega del vendedor. Un ticket comercial no debe presentarse como comprobante electrónico aceptado.

## Numeración automática

La preparación por empresa habilita un registro por emisor y entorno. Se revisa el inventario de series ya utilizadas en XmlPeru mediante consultas de lectura; nunca se emite un comprobante para averiguar un correlativo.

El aprovisionador incorpora las cajas activas existentes y las nuevas. Conserva todas las asignaciones previas y no recicla series cuando se desactiva o elimina una caja. Las cajas inactivas sin asignación no reciben series hasta activarse.

Se eligen series libres de cuatro caracteres: familia B para boletas y F para facturas. La secuencia comienza en B001/F001 y continúa sin colisiones. Las notas de crédito tienen su propio tipo documental 07 y contador; pueden utilizar la misma serie de la familia correspondiente. El régimen que solo admite boletas no recibe asignación de factura.

Cada número es único en el conjunto tenant, emisor, entorno, tipo documental y serie. Demo y Producción son independientes. Una serie nueva comienza en 1; una serie usada conserva su evidencia y contador. Crear cajas, publicar configuración o abrir turnos no consume correlativos. Una reserva efectuada no se reutiliza ni se reinicia por reintentar una operación.

## Autoridad y datos offline

`fiscal_v1_series_head_v3` sigue siendo la autoridad de asignaciones, contadores e índices inmutables de reserva. Las asignaciones nuevas y las series correspondientes se confirman mediante el mismo control de concurrencia. `assignmentRevision` aumenta al cambiar asignaciones; no es la revisión Couch del documento ni cambia por cada venta.

`ConfigEmpresa.fiscal.numeracionPorEntorno` es una proyección sin contadores. Contiene scope explícito, `registryId` opaco, revisión y asignaciones por `cajaId`, establecimiento y versión. Los clientes no pueden modificarla. Si falla la copia después de confirmar el registro, el reconciliador la repara al reiniciar o en su siguiente ejecución.

La proyección llega a SQLite mediante el bootstrap y `_changes`/longpoll existentes. No hay un GET para cargar la lista de cajas o consultar sus asignaciones. El bootstrap instala datos y checkpoints; no crea cajas, series ni operaciones de negocio.

La publicación firmada conserva los hechos tributarios y las capacidades del emisor. La asignación operativa se valida aparte contra el registro central. Una caja nueva no necesita otra firma de publicación ni una entrada privada por cada serie. El modo anterior de publicaciones con contextos V2 se mantiene para instalaciones que aún no usan el registro automático.

## Solicitud fiscal y venta offline

Para una venta que solicita CPE, la misma transacción local conserva venta, snapshot, efectos y una petición fiscal durable. No espera a una llamada HTTP para guardar la venta. La petición congela comprador, fecha, tipo, caja, política y material comercial. No asigna un número local.

Un trabajador acotado prepara y entrega esa petición cuando la sesión, la empresa y la configuración fiscal lo permiten. Usa la misma identidad de operación en los reintentos. Antes de cualquier POST se conserva el marcador durable del journal V1; una respuesta incierta se recupera consultando esa operación, sin crear otra venta ni reservar otro comprobante.

Cuando llega la evidencia fiscal, se vincula a la venta existente. No se vuelven a aplicar inventario, ingreso en caja, pagos, deuda ni ticket comercial. La impresión fiscal posterior es explícita, para evitar dos impresiones automáticas de la misma venta. Una configuración faltante conserva la solicitud; un rechazo definitivo se muestra para revisión y no deshace la venta comercial.

Una solicitud pendiente debe poder distinguirse de un documento firmado y de un resultado SUNAT/CDR. Aprovisionar series no acredita firma, aceptación, capacidad de crédito ni compatibilidad de todas las casuísticas. Las limitaciones de capacidades actuales siguen siendo explícitas; no se inventa una autorización para omitirlas.

La versión V1 actual admite este checkout fiscal al contado con comprador identificado. La interfaz no ofrece emisión a crédito como si ya estuviera soportada; permite elegir Ninguno para continuar la venta comercial. Una solicitud que todavía no inició firma y cuya fecha ya no coincide con el día de emisión se envía a revisión antes de reservar un número. No se cambia la fecha comercial ni se fabrica otra fecha de emisión. Son límites de esta versión del módulo, no prohibiciones tributarias generales.

Una sucursal interna no equivale por sí misma a un establecimiento fiscal. Si una caja declara sucursal y no existe una correspondencia configurada, se conserva sin asignación nueva y con diagnóstico; las demás cajas siguen preparándose. Las emisiones nuevas de esa caja requieren resolver su establecimiento. Sus reservas y comprobantes históricos continúan siendo recuperables.

## Instalación y compatibilidad

La política y la proyección son campos opcionales de una raíz existente. La selección fiscal de ventas usa una columna nullable y se transporta en venta/snapshot. La migración SQLite 115 agrega esa columna y la cola técnica local; no modifica ninguna migración ya aplicada.

Instalaciones anteriores sin selección mantienen su comportamiento manual. No se rebobina el checkpoint ni se materializan peticiones históricas. La cola, journal, outbox y conflictos no son tablas autoritativas que el snapshot pueda borrar. Se evita reemplazar ventas locales con solicitudes fiscales pendientes hasta garantizar su preservación.

## Fuentes de numeración

- [XmlPeru: correlativos por serie](https://docs.xmlperu.dev/referencia/series/): formato, separación por tipo, series nuevas y números utilizados incluso en rechazos.
- [XmlPeru: cambio de entorno](https://docs.xmlperu.dev/referencia/cambiar-entorno/): independencia entre numeración Demo y Producción.
- [SUNAT: operatividad del SEE del contribuyente](https://orientacion.sunat.gob.pe/3529-operatividad): familias B/F y estructura de series.
- [SUNAT: preguntas frecuentes sobre boletas electrónicas](https://contenido.app.sunat.gob.pe/insc/ComprobantesDePago%2BElectronicos/FAQ_boletas_de_venta_electronicas.pdf): numeración y gestión de series por el emisor.

Estas fuentes sustentan la numeración. La revisión mensual tributaria global no queda sustituida por esta decisión técnica.
