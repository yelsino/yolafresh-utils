# Modelo de negocio de comprobantes electrónicos

## Configuración tributaria antes de la venta

La empresa declara si tiene habilitada la facturación electrónica. Si no la
habilita expresamente, su venta comercial no debe depender del proceso fiscal.
Esta decisión no clasifica productos ni sustituye los permisos del operador.

El perfil fiscal identifica al emisor, su régimen y el establecimiento, y
conserva las reglas tributarias por presentación, sus vigencias y el sustento
de cada decisión. Una regla puede estar pendiente de clasificación; eso no
equivale a exoneración. Cuando corresponde, se considera también la renuncia
del emisor a una exoneración.

Producto describe lo vendido; precio conserva el acuerdo comercial; el perfil
fiscal determina su tratamiento tributario. Son responsabilidades distintas.
Para una venta concreta se resuelve la regla aplicable en esa fecha y se
congelan base e impuesto en cada línea del comprobante. Una modificación
posterior del perfil no reescribe comprobantes ya emitidos.

Compartir estos contratos no implica que el perfil ya esté disponible sin
conexión. Su recepción y actualización local deben estar implementadas y
verificadas antes de preparar la emisión sin consultar el perfil remoto.

## Venta y comprobante son hechos distintos

La venta registra lo acordado con el cliente. Solicitar un comprobante no
significa que ya exista uno emitido. Antes de emitirlo, se congela la
información fiscal de esa venta: vendedor legal, adquirente, descripción y
cantidad de cada línea, precio acordado, descuento, afectación tributaria,
impuesto e importe final. Cambios posteriores en el catálogo o en los precios
no modifican lo que se documentó para esa operación.

El comprobante nace cuando recibe su serie y número y queda firmado. Conserva
su propia identidad, fecha, emisor, adquirente, detalle, tributos y total.
No se reemplaza ni se renumera para reflejar cambios posteriores de la venta.
El domicilio fiscal textual debe estar en el perfil validado antes de firmar;
el código de establecimiento del XML no lo sustituye. La referencia
`signature.signedXml` apunta a los bytes del XML firmado crudo y conserva su
SHA-256. `signedAt` registra cuándo el emisor verificó la firma; la fecha fiscal
del comprobante se toma del XML firmado.

## Firma, entrega y respuesta tributaria

La firma, el envío y la respuesta tributaria son hechos diferentes. En el
flujo de boleta previsto para YolaFresh, una vez firmado el comprobante se
puede preparar su representación impresa y entregarla al cliente mientras el
envío continúa en segundo plano. Esa impresión no afirma que SUNAT lo haya
aceptado. La representación debe contener la misma serie, número, importes y
datos de verificación del comprobante firmado.

Una copia ya emitida debe poder reimprimirse sin generar otro comprobante ni
solicitar de nuevo su información fiscal. Si se trata de una prueba Demo, la
impresión debe advertir claramente que no tiene validez tributaria.

El estado del trámite distingue, como mínimo, pendiente de envío, envío en
curso, resultado incierto, reporte del proveedor y respuesta tributaria
verificada. Un reporte favorable del proveedor no equivale por sí mismo a
aceptación tributaria. Si la respuesta es incierta, se consulta o concilia el
trámite antes de intentar otro envío; no se asume éxito ni fracaso.

## Correcciones y bajas

Una nota de crédito o débito es otro comprobante con identidad propia. Debe
referenciar el comprobante original y expresar su causal; no edita ni borra
el original. Una baja también es una operación posterior y distinta del
comprobante que afecta. Cada trámite conserva su resultado sin confundirlo
con el estado comercial de la venta o con un cobro.

## Alcance vigente

El cálculo fiscal de ventas actualmente contemplado cubre importes en soles
y líneas gravadas, exoneradas o inafectas de boletas y facturas. El modelo
puede representar notas, pero sus causales, cálculos y reglas de emisión aún
requieren definición y pruebas propias. Las reglas de entrega y plazos se
verifican para cada tipo de comprobante y modalidad de emisión; no se
generaliza a facturas o notas el flujo inicial de boletas.
