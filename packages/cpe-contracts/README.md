# @yolafresh/cpe-contracts

Contratos y validadores puros para solicitudes, snapshots y evidencia CPE.
Este paquete no importa ni incluye módulos operativos de `yola-fresh-utils`.

## Integración

Mantener `yola-fresh-utils` en el artefacto pre-CPE `2.4.2` y añadir
`@yolafresh/cpe-contracts` como dependencia separada. Sustituir únicamente
los imports fiscales:

```ts
import { validateFiscalIntent, type FiscalIntent } from "@yolafresh/cpe-contracts/contracts";
```

El paquete expone `.` y `./contracts`; ambos publican el mismo API CPE.
No define permisos, configuración de empresa, venta ni inventario. Los
adaptadores de cada consumidor conservan su propia traducción entre la venta
comercial y los documentos fiscales.

## Evidencia comercial por línea (intent V3)

`FiscalIntentV3` añade una declaración por línea a la solicitud fiscal. Cada
línea identifica `lineId` y `presentationId` como valores opacos, declara
`TAX_INCLUDED` o `TAX_EXCLUDED`, el precio unitario pactado en centavos y una
referencia durable al acuerdo de precio. También lleva referencia y versión
de la política de precios, una referencia/versionado fiscal independiente y el
instante `agreedAt` al que el backend debe resolver la política histórica de
precio. Una misma solicitud puede mezclar ambos modos. Incluso con impuesto
cero, el modo solo describe el precio comercial; no determina afectación ni IGV.

`validateFiscalIntentV3` y `validateFiscalIntentPricingDeclarationV3` validan
estructura, importes y duplicados de línea. Un resultado sin errores **no
aprueba el precio**: el backend todavía debe cotejar las líneas, presentaciones,
acuerdos, políticas de precio y fiscal vigentes para la presentación y período,
total y snapshot de la venta con fuentes autoritativas. Una línea sin políticas
referenciadas se rechaza, pero referencias declaradas no demuestran una política
positiva. El paquete no ofrece un estado de aprobación ni
autoriza emisión. `validateFiscalIntentReplay` exige el mismo payload V3,
incluido el orden y todas las referencias de cada línea, para la misma clave.

V1 y V2 conservan su semántica. En particular, `FiscalSaleSnapshotV2` sigue
admitiendo solo `TAX_INCLUDED`; no existe snapshot fiscal V3 ni cálculo para
canastas mixtas en este paquete. La integración y sus pruebas de cálculo fiscal
deben preceder cualquier habilitación de emisión con V3.

## Procedencia

El contrato y sus pruebas provienen de
`feature/cpe-contracts-2026-09` en el worktree
`facturacion-electronica-utils`, con cambios locales hasta
`2.4.8-cpe.7` al 2026-10-03. La única adaptación del contrato es declarar
localmente la unión `FiscalTaxRegime`, que antes se importaba desde el kernel
de empresa. Las pruebas cambian la autorreferencia del subpath fiscal al
nuevo paquete. No se trasladaron los cambios concurrentes de auth, inventario,
restaurante, venta o configuración.

El artefacto pre-CPE `yola-fresh-utils-2.4.2.tgz` tiene SHA-256
`1a20562f21b33b24df4cbb326ca0c6e22440a5b891ab527dd9b701fa9a41c885`.
