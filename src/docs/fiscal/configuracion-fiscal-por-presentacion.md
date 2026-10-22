# Configuración fiscal de presentaciones

Actualización de alcance 2026-10-22: el [plan de configuración fiscal simple](./configuracion-fiscal-simple-plan-contratos-2026-10-22.md)
mantiene XmlPeru, excluye cambios al onboarding de negocio y distingue las reglas
de este modelo de las publicaciones V1. Una UI más breve no elimina las reglas
ni convierte una capacidad pendiente en soporte de emisión.

> Base conceptual y contrato local previo. El módulo multitenant nuevo
> requiere conciliar esta publicación con la autoridad backend en una única
> fuente canónica; véanse el RFC, matriz y plan `10-` a `12-` en
> `FINANZAS-YOLA-FRESH/docs/facturacion-electronica/`. No interpretar una
> configuración publicada aquí como certificación de todas las capacidades
> de XmlPeru/SUNAT.

Estado: negocio implementado y probado sin UI en la biblioteca compartida,
backend y almacenamiento local. La publicación del paquete y el despliegue
son pasos separados; no se han realizado como parte de este trabajo.

La configuración fiscal determina cómo se documenta tributariamente lo
vendido por un emisor en una fecha. No determina su precio ni sus existencias.
El precio conserva el acuerdo comercial; la venta y su snapshot conservan lo
vendido; el comprobante conserva los impuestos realmente aplicados.

## Emisor y presentación

La configuración de empresa conserva al vendedor legal, su régimen y
establecimiento. El perfil fiscal vinculado conserva sus decisiones
tributarias, sin duplicar esos datos. La configuración de una presentación
identifica el tratamiento de esa presentación para ese emisor. Son
configuraciones separadas.

Una presentación no se clasifica por su nombre, por ser pesable ni por costar
un determinado importe. Su naturaleza y el sustento revisado determinan si
es gravada, exonerada o inafecta. Si todavía no se sabe, queda pendiente de
clasificación. Pendiente no significa exonerada ni impuesto cero.

La ficha comercial puede señalar qué configuración le corresponde; no
conserva dentro de ella las tasas y el historial tributario. Dos emisores
pueden requerir configuraciones distintas para la misma presentación.

Por cada emisor hay una sola configuración canónica de la presentación y
una sola referencia explícita a ella. Sus reglas y decisiones pueden ser
varias, pero no hay varios documentos compitiendo por ser «el más nuevo».
El perfil del emisor sigue la misma regla de identidad única vinculada.

## Decisiones publicadas y borradores

La configuración conserva las decisiones publicadas y sus vigencias. La
publicación utilizada está identificada expresamente. No se elige una
decisión solo por haber sido creada o actualizada más recientemente.

Para la fecha de una operación debe existir una sola regla publicada
aplicable. Los períodos no se solapan. Una regla que termina un día puede
aplicarse ese día; la siguiente comienza después. Si la fecha cae en un
período sin regla, se informa que falta configuración.

Editar una configuración inicia o modifica un borrador. El borrador no cambia
lo que ya está publicado. Publicar una nueva decisión conserva la anterior y
expresa cómo queda el calendario tributario, incluidos los períodos futuros.
Esto permite preparar con anticipación una modificación con fecha de inicio.

Una corrección debe expresar su motivo. No se borra una decisión publicada
para hacer desaparecer su uso anterior. El historial de decisiones es
historial de negocio, no una colección de formatos de software compatibles.

## Sustento y auditoría

El tratamiento, tasa aplicable, naturaleza, unidad y vigencias son datos
operativos. La subpartida, características, fuentes legales, fecha de revisión
y referencias documentales son detalles opcionales. Si se aportan, deben
tener un formato válido y se conservan con la decisión; no son una consulta
automática a SUNAT ni prueban por sí solos la corrección jurídica del tratamiento.

La configuración cotidiana no obliga a completar un expediente documental.
El administrador elige expresamente el tratamiento: no se deduce del nombre,
no se asigna por defecto una exoneración y no se inventa un sustento o una fecha
de revisión. Una clasificación pendiente puede guardarse sin notas, pero no
publicarse ni usarse como una decisión de impuesto cero.

La regla conserva la afectación, tasa, unidad fiscal, naturaleza del bien o
servicio, período y sustento de la decisión. También se considera la decisión
del emisor que modifique su tratamiento cuando corresponda. Una categoría
gravada no demuestra por sí sola qué monto de impuesto corresponde cobrar
en todos los regímenes.

Se registra quién creó y cuándo creó la configuración, y quién realizó su
última actualización y cuándo. Cada publicación conserva además su autor,
fecha y motivo. Una actualización no reemplaza la identidad del creador.
La identidad del actor se acredita con la sesión que autoriza la operación.

La naturaleza, unidad de venta y conversión de la presentación deben seguir
siendo compatibles con el sustento publicado. Un cambio en ellas requiere
revisión; cambiar solo el precio o el nombre no invalida el tratamiento.
Una caja de leche vendida por unidad no se convierte en venta por litros
solo porque su contenido sea un litro. Las cantidades pesables se expresan
en la unidad de venta correspondiente.

## Trabajo sin conexión

La aplicación conserva localmente las configuraciones publicadas recibidas.
Puede consultarlas y preparar los impuestos de una operación sin pedir otra
vez el catálogo o el perfil al servidor. Las actualizaciones se reciben por
la sincronización existente.

También puede guardar un borrador sin conexión y enviarlo después. Ese
borrador no se presenta como publicado para todos los dispositivos hasta
que su publicación haya sido confirmada. Dos cambios incompatibles no se
resuelven escogiendo el último reloj: se conserva el cambio pendiente y se
informa el conflicto.

Crear, guardar un borrador, publicar y suspender son acciones distintas.
Solo quien está autorizado puede publicar. Repetir una misma acción cuya
respuesta se perdió recupera su resultado; no crea otra publicación. Un
borrador privado pendiente no sustituye la publicación recibida ni impide
vender otros productos correctamente configurados.

Un equipo sin conexión no conoce un cambio que otro acaba de publicar. Usa
la última publicación que recibió, siempre dentro de la vigencia conocida.
No inventa una regla para cubrir información ausente y no utiliza una regla
vencida como alternativa.

Si la empresa no tiene habilitada la facturación electrónica, la venta
comercial no necesita consultar la configuración fiscal ni pedir firma.
Si se eligió un comprobante y falta una regla necesaria, se informa antes de
emitir; no se cambia a ticket normal de manera automática ni se pierde el
carrito. El problema se limita a la configuración y operación afectadas.

Preparar datos sin red no equivale a obtener una firma electrónica. Cuando
la firma depende del proveedor remoto, se necesita conexión para confirmar
que el comprobante quedó firmado. La disponibilidad de una impresora tampoco
determina si la venta comercial existe.

## Impuestos históricos de una venta

Al preparar el comprobante se congelan la decisión y regla utilizadas,
fecha de resolución, emisor, base, impuesto e importes de cada línea.
El régimen y las decisiones del emisor forman parte de esa resolución.

Cambiar el precio, el nombre del producto o una regla fiscal después no
reescribe los impuestos del comprobante. Una copia se obtiene del
comprobante conservado, no del catálogo tributario de hoy. Una corrección
del comprobante es una operación fiscal distinta; no consiste en editar
la configuración para alterar el documento original.

## Una sola implementación vigente

La implementación nueva utiliza una sola definición de sus contratos y
reglas. No convierte perfiles antiguos, no mantiene formatos fiscales v1/v2
ni asume valores por ausencia de campos. Una configuración incompleta se
diagnostica como incompleta; no se oculta mediante compatibilidad o fallbacks.
