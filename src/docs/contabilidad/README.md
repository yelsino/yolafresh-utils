# Contabilidad

## Propósito

Este directorio agrupa la documentación vigente del Domain de contabilidad en `yolafresh-utils`.

La evidencia principal vive en:

- [AsientoContable.ts](../../domain/contabilidad/entities/AsientoContable.ts)
- [ContabilidadBase.ts](../../domain/contabilidad/entities/ContabilidadBase.ts)

## Alcance

Este Domain documenta:

- periodos fiscales;
- plan de cuentas;
- asientos contables;
- líneas contables balanceadas.

Este Domain no reemplaza:

- `MovimientoCaja` como dinero operativo;
- `Egreso` o `Ingreso` como hecho financiero de negocio;
- `MovimientoFinanciero` como vista auxiliar legacy.

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): conceptos, reglas de cuadratura y límites observados.

## Terminología canónica

- `PeriodoFiscalId`
- `CuentaId`
- `PeriodoFiscal`
- `PlanCuenta`
- `AsientoId`
- `LineaAsiento`
- `AsientoContable`

## Referencias

- [../README.md](../README.md)
- [../finanzas/README.md](../finanzas/README.md)
