# Configuración fiscal simple: decisiones y brechas contractuales

Fecha: 2026-10-22. Estado: **F1 implementada localmente; no habilita emisión**.
Las brechas de la tabla conservan el diagnóstico previo; el resultado contractual
implementado se detalla a continuación. La adopción en backend/móvil y su release
se verifican por separado.

Este acuerdo aplica a las pantallas existentes de Empresa y Facturación electrónica.
El onboarding de configuración del negocio queda fuera del alcance. XmlPeru sigue
siendo el proveedor de firma, envío a SUNAT y obtención de XML/CDR; este plan no
introduce un selector de proveedores ni una integración alternativa.

## Implementación contractual del 22/10

- `ConfigEmpresa.fiscal.regimenTributarioVigencias` es un calendario aditivo de
  declaraciones. Cada inicio único tiene régimen, identidad y auditoría.
  Una corrección conserva el original y exige `supersedesDecisionId` más `reason`;
  no puede bifurcar una corrección ni trasladarla a otro inicio.
- [`resolveFiscalCompanyTaxRegime`](../../domain/fiscal/contracts/configuracion-fiscal-empresa.ts)
  resuelve por fecha. Sin calendario informa declaración sin fecha; con calendario
  no cae al escalar anterior. `appendFiscalCompanyTaxRegimeDecision` conserva
  idempotencia y rechaza identidad reutilizada con contenido diferente.
- `FiscalCompanyTaxRegimeCommand` lleva referencia a empresa, revisión esperada,
  operación, régimen e inicio. Actor y hora pertenecen al servidor. El resultado
  remoto usa `_id`/`_rev` y no exige un `id` duplicado.
- `deriveFiscalV1IssuerProfileFromCompany` obtiene identidad y régimen de la empresa
  con su calendario. La autoridad backend comprueba RUC, entorno y establecimiento;
  el perfil no puede atravesar el siguiente cambio de régimen y fija XmlPeru.
- `toFiscalV1Environment` y `toCompanyFiscalEmissionEnvironment` traducen ambos
  enums explícitamente; un valor ausente o desconocido devuelve `null`.
- El payload firmado V1 admite `checkoutContexts` opcional: perfil, tipo de
  documento, contexto, serie y serie NC opcional. No distribuye correlativos.
  El selector local exige coincidencia única, vigencia y capacidad. Factura
  mantiene la vía correctiva demostrada; no se añade ese gate global a boleta.
- `FiscalV1PublicationDocument` proyecta la raíz existente
  `fiscal_v1_signed_publication` sin historia, secretos ni claves confiables.
  El sobre no concede confianza ni descarta documentos históricos por expiración;
  la firma, ancla, vigencia y protección contra rollback se comprueban al consumir.

Los bundles anteriores sin `checkoutContexts` conservan exactamente su material,
hash y firma. Un binario antiguo puede rechazar el campo nuevo: distribuir móvil
compatible antes de publicar esa ampliación mientras no haya negociación verificada.
Las declaraciones nuevas no convierten RMT/General en circuitos de emisión soportados.

Verificación local: TypeScript y build correctos; **402 pruebas aprobadas** en la
suite completa del paquete, incluidas 18 nuevas de calendario/entorno/comando,
derivación, publicación firmada, contexto, ambigüedad y proyección pública.
No se consultó ningún tenant, no se llamó a XmlPeru y no se publicó un paquete.

## Fuente de verdad y responsabilidades

La biblioteca compartida es la autoridad de tipos y reglas comunes. Móvil y backend
consumen una versión compatible y no reconstruyen contratos propios desde el formulario.
Las etiquetas de interfaz pueden simplificarse sin modificar la semántica publicada.

| Responsabilidad | Contrato existente | Consecuencia para la implementación |
|---|---|---|
| Vendedor legal y configuración de empresa | [`ConfigEmpresa`](../../domain/shared/kernel/empresa.contract.ts): `empresa`, `fiscal.regimenTributario`, establecimiento, domicilio verificado, entorno y habilitación | Reutilizar el documento existente; no crear otra identidad fiscal editable en paralelo. |
| Condiciones especiales del emisor | [`FiscalIssuerTaxProfileDocument`](../../domain/fiscal/contracts/configuracion-fiscal.contract.ts): vínculo a empresa, decisiones de renuncia a exoneración y vigencias | La pantalla actual de perfil no es por sí sola un registro completo de régimen, proveedor o activación. |
| Tratamiento de lo vendido | [`FiscalPresentationTaxConfigurationDocument`](../../domain/fiscal/contracts/configuracion-fiscal.contract.ts): emisor, presentación, categoría, tasa, unidad, vigencia y decisiones | Elegir un tratamiento explícito y reutilizarlo. El expediente documental opcional no se convierte en un formulario obligatorio por producto. |
| Publicación autorizada para el motor V1 | [`FiscalV1IssuerProfile`, reglas y capacidades](../../domain/fiscal/contracts/modulo-fiscal-v1.contract.ts) | La publicación contiene una proyección fechada del emisor/régimen y capacidades probadas; no es un segundo maestro para editar manualmente. Definir su derivación antes del cutover. |
| Cálculo y trazabilidad de una operación | [`prepareFiscalV1Sale`](../../domain/fiscal/contracts/modulo-fiscal-v1.ts), decisión y [`FiscalV1Snapshot`](../../domain/fiscal/contracts/modulo-fiscal-v1-evidencia.contract.ts) | Conservar las referencias, los importes y el régimen utilizados; una edición posterior no recalcula comprobantes históricos. |
| XML firmado y respuesta tributaria | [`FiscalSignedDocument`](../../domain/fiscal/contracts/comprobante-electronico.contract.ts) y [`FiscalProcess`](../../domain/fiscal/contracts/proceso-fiscal.contract.ts) | Separar firma, envío, resultado incierto, reporte del proveedor y CDR. La representación impresa no prueba aceptación. |

Los documentos CouchDB usan `_id` técnico opaco. No se exige un duplicado remoto
`id`; el mapper copia `_id` a la columna local `id`. Campos de negocio como
`documentId`, `issuerRuc` o `presentationId` conservan su significado explícito y
no se deducen del formato de `_id`.

## Brechas que deben resolverse antes de implementar

| Brecha observada | Decisión del plan | Evidencia de cierre requerida |
|---|---|---|
| `RegimenTributarioEmpresa` permite NRUS, RER, RMT y Régimen General; `prepareFiscalV1Sale` rechaza RMT y General con `FISCAL_V1_REGIME_NOT_IMPLEMENTED`. | Mostrar datos declarados y capacidades disponibles por separado. No presentar cuatro opciones como cuatro regímenes ya operativos para emitir. | Matriz por régimen, documento, entorno y caso, respaldada por pruebas del motor y evidencia XmlPeru/SUNAT. |
| El régimen de `ConfigEmpresa` es un valor actual; las vigencias de `FiscalIssuerTaxProfileDocument` modelan posturas, no un historial de regímenes. | Diseñar cómo publicar el régimen por período y derivar el perfil V1 sin dos calendarios editables contradictorios. **No se define un nuevo JSON en este documento.** | Contrato revisado con intervalos, autoría, corrección y snapshot histórico; casos de cambio futuro y venta histórica. |
| Existen modelo previo y publicaciones V1 con responsabilidades distintas. | Ejecutar un único camino de escritura/publicación/lectura en cada etapa del cutover. No probar V1 y luego resolver silenciosamente por el modelo previo. | Mapa de productores/consumidores, versión mínima compartida y pruebas de ausencia de fallback. |
| El enum de entorno de empresa usa `PRODUCCION`; V1 usa `PRODUCTION`. | Mantener traducción explícita en adaptadores, probada y sin inferir entorno desde el tenant. | Casos Demo/Producción, ausencia de entorno y rechazo de mezclas de evidencia. |
| Una habilitación booleana de empresa no demuestra credenciales, autorización, numeración ni capacidad del proveedor. | Conservar el significado del booleano. Si el flujo necesita estados de activación, definirlos y versionarlos antes de agregarlos; no sobrecargar el campo ni simular que guardar equivale a activar. | Tabla de transiciones y persistencia revisada, permisos, idempotencia y recuperación tras reinicio. |
| El formulario puede simplificarse, pero unidad, categoría, tasa y fechas siguen teniendo reglas. | Prefijar solo datos técnicos seguros, completar desde datos confirmados y pedir lo imprescindible. No deducir régimen o exoneración desde rubro, nombre o prefijo del RUC. | Conformidad del payload simple con el mismo validador; clasificación pendiente nunca equivale a impuesto cero. |

## Secuencia contractual para el plan transversal

1. **Cerrar el mapa de autoridad.** Identificar qué dato se edita en Empresa,
   cuál corresponde a condiciones especiales, cuál a catálogo y cuál se genera
   al publicar. Mantener el onboarding intacto.
2. **Diseñar solo las ampliaciones necesarias.** Revisar régimen por vigencia,
   estado de activación y derivación de publicación contra los contratos
   existentes. Si hacen falta cambios públicos, acordar contrato, semver,
   compatibilidad y consumidores antes de modificar almacenamiento o UI.
3. **Probar la publicación y su recepción local.** Los datos confirmados llegan por
   bootstrap/catch-up/sincronización y se leen desde SQLite. Un borrador local y un
   comando pendiente no se muestran como publicación confirmada. El transporte
   administrativo actual por outbox no se describe como si fuera réplica Couch
   sin haber realizado ese cambio.
4. **Implementar la interfaz con los contratos acordados.** Datos tributarios,
   activación XmlPeru, numeración e impuestos; condiciones especiales solo cuando
   correspondan. La UI no crea reglas tributarias adicionales.
5. **Validar el camino completo.** Preparación local, reserva idempotente,
   firma XmlPeru, XML archivado, envío y recuperación CDR. La publicación
   criptográfica de reglas y la firma electrónica del CPE son firmas distintas.

No se requiere una consulta HTTP al abrir cada ficha para leer datos ya
sincronizados. La conexión necesaria para autenticación, consultas externas,
firma o transmisión se comunica en su acción correspondiente y no se confunde
con el acceso local al catálogo o al perfil.

## Criterios mínimos de aceptación

- Un formulario breve y uno avanzado producen el mismo significado contractual;
  no se rellenan campos legales con datos inventados.
- Fecha límite, ausencia de vigencia, solapamiento, suspensión y revisión regresiva
  tienen resultados deterministas; nunca se elige por último reloj.
- Se puede guardar y reabrir un borrador sin red; la pérdida de respuesta de una
  publicación recupera el mismo resultado mediante `operationId`.
- Un equipo prepara con su publicación local válida sin pedir datos fiscales al
  servidor por operación; la evidencia identifica exactamente la publicación usada.
- NRUS no habilita factura. «No discriminado» no se representa como exoneración
  ni convirtiendo `null` en cero. RMT y General no se anuncian como soportados
  hasta completar sus gates reales.
- XML, snapshot, representación impresa y CDR coinciden en emisor, entorno,
  documento, serie, número e importes. Un estado favorable reportado por el
  proveedor permanece distinto de una respuesta tributaria verificada.
- Un timeout de firma/envío no crea otro comprobante ni consume otra identidad
  al reintentar. La conciliación conserva el XML y la referencia del proveedor.
- Cambiar régimen, catálogo o condiciones no reescribe ventas/comprobantes
  históricos; una corrección fiscal conserva vínculo al documento original.

## Límites de esta actualización

Se revisó el árbol de trabajo local; incluye cambios fiscales concurrentes que
no forman parte de esta actualización documental. Este documento no certifica
una versión publicada del paquete ni el despliegue de sus consumidores.
La ejecución se coordina desde
`FINANZAS-YOLA-FRESH/docs/facturacion-electronica/19-plan-configuracion-fiscal-simple.md`;
la decisión de producto está en `18-configuracion-fiscal-simple.md` de esa carpeta.
El backend mantiene su evidencia en `yolafresh-pos-backend/Documentacion/fiscal/`.

Lecturas relacionadas:

- [Configuración de empresa](../core/configuracion-de-empresa.md).
- [Configuración fiscal por presentación](./configuracion-fiscal-por-presentacion.md).
- [Estado del módulo V1](./modulo-fiscal-v1-implementacion.md): corte de implementación;
  no usar sus gates pendientes como si ya estuvieran completados.
