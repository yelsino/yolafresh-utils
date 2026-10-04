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
