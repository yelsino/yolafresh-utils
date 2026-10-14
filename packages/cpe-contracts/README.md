# @yolafresh/cpe-contracts

Contratos y validadores puros para solicitudes, snapshots y evidencia de CPE. El
paquete es privado y se distribuye como artefacto local. No importa ni incluye
módulos operativos de `yola-fresh-utils`.

La fuente canónica vive en `../../src/domain/fiscal/`. Esta carpeta contiene
solo la configuración de empaquetado y el `dist/` generado; el API importable
del paquete no cambia por la ubicación de la fuente.

## Integración y exports

Mantener `yola-fresh-utils` en el artefacto pre-CPE `2.4.2` y añadir
`@yolafresh/cpe-contracts` como dependencia separada. Ambos subpaths públicos
exponen el mismo API:

```ts
import {
  FISCAL_CPE_SCHEMA_VERSION,
  FISCAL_INTENT_CONTRACT_KIND,
  FISCAL_SALE_SNAPSHOT_CONTRACT_KIND,
  FISCAL_EVIDENCE_CONTRACT_KIND,
  validateFiscalIntent,
  type FiscalIntent,
} from "@yolafresh/cpe-contracts/contracts";

// También disponible desde "@yolafresh/cpe-contracts".
```

La raíz `yola-fresh-utils` no publica estos contratos fiscales. Los consumidores
deben sustituir sus imports de `yola-fresh-utils/fiscal` o
`yola-fresh-utils/fiscal/contracts` por uno de los subpaths anteriores.
Backend y móvil deben migrar sus productores, lectores y pruebas al contrato
canónico y verificar la integración antes de usar un nuevo tarball. El tarball
local `yolafresh-cpe-contracts-1.0.0-cpe.1.tgz` conserva el API experimental
anterior y se preserva como artefacto histórico. `cpe.2` fue un candidato
local con hashes distintos durante la revisión. `cpe.3` introdujo el API
canónico, pero su comprobación de IGV por línea fue demasiado restrictiva para
distribuciones de centavos cuya suma concilia exactamente. Esos tres tarballs
se preservan como artefactos históricos. `cpe.4` sigue siendo compatible para
declaraciones `TAX_INCLUDED`; `cpe.5` añade una base final estricta para líneas
exoneradas. Cada consumidor debe comprobar el SHA-256 del archivo final. No se borra
ningún dato ni tarball fiscal durante esta migración.

## Primera versión del wire

`FISCAL_CPE_SCHEMA_VERSION` vale `1`. Cada objeto lleva `schemaVersion: 1`
y un `contractKind` específico:

| Objeto | `contractKind` | Constante |
| --- | --- | --- |
| `FiscalIntent` | `YOLAFRESH_CPE_INTENT` | `FISCAL_INTENT_CONTRACT_KIND` |
| `FiscalSaleSnapshot` | `YOLAFRESH_CPE_SALE_SNAPSHOT` | `FISCAL_SALE_SNAPSHOT_CONTRACT_KIND` |
| `FiscalEvidence` | `YOLAFRESH_CPE_EVIDENCE` | `FISCAL_EVIDENCE_CONTRACT_KIND` |

El wire canónico no tiene campo `version`. `contractKind` y `schemaVersion`
identifican la forma de la primera emisión productiva sin colisionar con
payloads históricos que ya usaban `version: 1`. Los sufijos V1, V2 y V3
anteriores designaban iteraciones de desarrollo de este paquete; no forman
parte del API canónico. Los validadores nuevos rechazan esos payloads
históricos, incluso si su `version` era `1`. Los adaptadores locales de backend
y móvil conservan la lectura de filas y registros R2 anteriores según sus
propios contratos; este paquete no convierte ni elimina esos datos.

### Solicitud comercial: `FiscalIntent`

La solicitud contiene identidad estable (`intentId`, `idempotencyKey`,
`tenantId`, `actorId`, `saleId`, `saleSnapshotId`), tipo de documento solicitado,
comprador y tiempos comerciales. `pricingDeclaration` es obligatoria y declara
`NOT_COMPUTED`, moneda `PEN`, total comercial en centavos y evidencia por cada
línea. Cada línea usa identificadores opacos de línea y presentación, precio
unitario pactado en centavos, referencia durable al acuerdo de precio,
referencia y versión de la política de precios, referencia y versión de la
política fiscal, e instante `agreedAt`. La forma histórica declara
`unitPriceTaxMode: "TAX_INCLUDED"`. La alternativa
`commercialAmountBasis: "FINAL_AMOUNT_AS_CHARGED"` omite ese modo y sólo puede
enlazarse con un snapshot cuya línea sea `EXONERADA`/`20`/tasa 0/impuesto 0.
La validación de forma no acredita la clasificación ni el precio comercial:
ambos requieren pruebas independientes del backend antes de emitir.

```ts
const pricingDeclaration: FiscalIntent["pricingDeclaration"] = {
  taxComputationMode: "NOT_COMPUTED",
  currency: "PEN",
  commercialTotalCents: 1680,
  lines: [{
    lineId: "linea-opaca",
    presentationId: "presentacion-opaca",
    unitPriceTaxMode: "TAX_INCLUDED",
    agreedUnitPriceCents: 1680,
    agreedPriceSourceRef: "acuerdo-opaco",
    pricePolicyRef: "politica-precio-opaca",
    pricePolicyVersion: "revision-precio-opaca",
    fiscalPolicyRef: "politica-fiscal-opaca",
    fiscalPolicyVersion: "revision-fiscal-opaca",
    agreedAt: "2026-10-04T10:00:00-05:00",
  }],
};
```

`validateFiscalIntentPricingDeclaration` comprueba estructura e importes de la
declaración, y `validateFiscalIntent` comprueba la solicitud completa.
`validateFiscalIntentReplay` exige el mismo payload, incluido el orden y todas
las referencias por línea, para repetir una clave de idempotencia. Los
validadores rechazan `TAX_EXCLUDED` hasta que el snapshot y el emisor soporten
ese modo. Una solicitud no asigna serie ni correlativo y no confirma que exista
un CPE.

### Hecho congelado: `FiscalSaleSnapshot`

El backend concilia venta y `venta_snapshot` antes de congelar el snapshot
fiscal. `FiscalSaleSnapshot` conserva la identidad de la venta, emisor,
comprador, moneda, pago o entrega diferida admisible, total y líneas. Cada línea
expresa explícitamente su categoría, código de afectación, esquema, tasa, base
e importe tributario, además del modo `TAX_INCLUDED` histórico o la base final
exonerada explícita y la descomposición
comercial y fiscal del descuento. El subconjunto actual del validador admite
`GRAVADA`, `EXONERADA` e `INAFECTA`; un impuesto cero por sí solo no determina
la categoría. El validador
`validateFiscalSaleSnapshot` comprueba consistencia estructural y aritmética,
y `validateFiscalIntentSnapshotLink` coteja identidad, comprador, moneda,
total y líneas con la solicitud.

Para líneas `GRAVADA` con precio `TAX_INCLUDED`, la cuota de IGV por línea
puede ser el piso o el techo de `bruto × 1800 / 11800`, en centavos. Antes del
descuento, `bruto` es `commercialGrossBeforeDiscountCents`; después, es
`totalCents`. En cada fase se exige que la suma de las cuotas de las líneas
`GRAVADA` coincida con el IGV de la suma de sus brutos, redondeado half-up al
centavo. También se conserva `base + IGV = bruto` por línea. El validador no
fija un orden para asignar los centavos entre líneas. Un descuento comercial
mínimo puede dejar `baseDiscountCents` en cero cuando la descomposición
conciliada lo exige. Esta comprobación local no sustituye la determinación
fiscal ni la conciliación del backend con fuentes autoritativas.

### Resultado y evidencia: `FiscalEvidence`

`FiscalDocumentIdentity` identifica emisor, tipo, serie y número.
`FiscalCdrVerification` representa la lectura y cotejo del CDR con el XML
firmado; `FiscalEvidence` conserva estado terminal, referencias de
almacenamiento y hashes del XML firmado y CDR, respuesta y observaciones.
`isSameFiscalDocumentIdentity`, `validateFiscalCdrVerification` y
`validateFiscalEvidence` ayudan a comprobar esa evidencia. El payload de
interfaz usa referencias y hashes; no transporta XML/CDR crudos ni credenciales.
Un HTTP 200 o un estado de envío no sustituyen la verificación terminal.

Los validadores de este paquete comprueban forma y coherencia local del
payload. Su resultado sin errores no aprueba precios, políticas, afectación
tributaria ni emisión. El backend debe cotejar acuerdos, políticas históricas,
presentaciones, importes, venta y snapshot con sus fuentes autoritativas antes
de emitir; es la única autoridad de emisor, serie y emisión.

## Migración de nombres

| API experimental | API canónico |
| --- | --- |
| `FISCAL_CPE_CONTRACT_VERSION`, `FISCAL_INTENT_CONTRACT_VERSION`, `FISCAL_INTENT_V2_CONTRACT_VERSION`, `FISCAL_INTENT_V3_CONTRACT_VERSION`, `FISCAL_SALE_SNAPSHOT_V1_CONTRACT_VERSION`, `FISCAL_SALE_SNAPSHOT_CONTRACT_VERSION`, `FISCAL_EVIDENCE_CONTRACT_VERSION` y campo `version` | `FISCAL_CPE_SCHEMA_VERSION`, campo `schemaVersion` y el `contractKind` propio de cada objeto |
| `FiscalIntentV1`, `FiscalIntentV2`, `FiscalIntentV3` | `FiscalIntent` |
| `FiscalIntentPricingDeclarationV2`, `FiscalIntentPricingDeclarationV3` | `FiscalIntentPricingDeclaration` |
| `FiscalIntentPriceLineEvidenceV3` | `FiscalIntentPriceLineEvidence` |
| `FiscalSaleSnapshotV1`, `FiscalSaleSnapshotV2` | `FiscalSaleSnapshot` |
| `FiscalSaleLineV1`, `FiscalSaleLineV2`, `FiscalLineTaxV1` | `FiscalSaleLine`, `FiscalLineTax` |
| `FiscalBuyerV1`, `FiscalPaidSaleV1`, `FiscalDeferredSaleV1` | `FiscalBuyer`, `FiscalPaidSale`, `FiscalDeferredSale` |
| `FiscalDocumentIdentityV1`, `FiscalCdrVerificationV1`, `FiscalEvidenceV1` | `FiscalDocumentIdentity`, `FiscalCdrVerification`, `FiscalEvidence` |
| `validateFiscalIntentV1`, `validateFiscalIntentV2`, `validateFiscalIntentV3` | `validateFiscalIntent` |
| `validateFiscalIntentPricingDeclarationV3` | `validateFiscalIntentPricingDeclaration` |
| `validateFiscalSaleSnapshotV1`, `validateFiscalSaleSnapshotV2` | `validateFiscalSaleSnapshot` |
| `validateFiscalIntentSnapshotLinkV1` | `validateFiscalIntentSnapshotLink` |
| `validateFiscalCdrVerificationV1`, `validateFiscalEvidenceV1` | `validateFiscalCdrVerification`, `validateFiscalEvidence` |
| `FISCAL_SALE_SNAPSHOT_V2_CAPABILITY` y el campo `capability` | Eliminados; `FISCAL_SALE_SNAPSHOT_CONTRACT_KIND` y `schemaVersion: 1` determinan el contrato |

La migración requiere construir el nuevo payload por línea y verificarlo con
las fuentes de la venta; renombrar imports o añadir discriminadores no convierte
datos experimentales en datos válidos. La lectura de datos históricos permanece
en sus adaptadores locales.

## Procedencia

La base histórica del contrato y sus pruebas proviene de
`feature/cpe-contracts-2026-09` en el worktree
`facturacion-electronica-utils`, con cambios locales hasta
`2.4.8-cpe.7` al 2026-10-03. Al aislarla se declaró localmente la unión
`FiscalTaxRegime`, antes importada desde el kernel de empresa. No se
trasladaron los cambios concurrentes de auth, inventario, restaurante, venta o
configuración.

El artefacto pre-CPE `yola-fresh-utils-2.4.2.tgz` tiene SHA-256
`1a20562f21b33b24df4cbb326ca0c6e22440a5b891ab527dd9b701fa9a41c885`.
