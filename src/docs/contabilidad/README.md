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

## Por qué existe este Domain

`contabilidad` existe para representar registro balanceado posterior o consolidado del negocio.

Su valor está en separar:

- hecho comercial o financiero;
- operación diaria del dinero;
- registro contable formal.

Esa separación evita que ventas, tesorería o finanzas intenten resolver cuadratura contable dentro de sus propios contratos operativos.

## Cuándo entra en juego

Este Domain entra en juego cuando un consumer necesita:

- registrar asiento contable;
- validar cuadratura entre debe y haber;
- trabajar con periodos fiscales;
- clasificar cuentas dentro de plan contable.

## Qué problema evita

Evita errores conceptuales como:

- tratar `MovimientoCaja` como asiento balanceado;
- usar `Ingreso` o `Egreso` como contabilidad formal completa;
- mezclar operación diaria con cierre o consolidación contable.

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
