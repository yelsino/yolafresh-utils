# Modelo Vigente de Contabilidad

## Visión general

El Domain de contabilidad modela estructura contable balanceada: cuentas, periodos y asientos.

La evidencia vigente está en:

- [ContabilidadBase.ts](../../domain/contabilidad/entities/ContabilidadBase.ts)
- [AsientoContable.ts](../../domain/contabilidad/entities/AsientoContable.ts)

## Conceptos principales

### `PeriodoFiscal`

Representa ventana contable sobre la que pueden registrarse asientos.

Responsabilidades observadas:

- identificar año y mes;
- expresar si el periodo está abierto o cerrado;
- impedir cierres redundantes.

### `PlanCuenta`

Representa cuenta formal del sistema contable.

Responsabilidades observadas:

- declarar código y nombre;
- clasificar la cuenta como activo, pasivo, patrimonio, ingreso o egreso.

### `LineaAsiento`

Representa línea contable individual.

Responsabilidades observadas:

- referenciar cuenta;
- registrar debe u haber;
- conservar concepto de la línea.

Regla observada:

- una línea no puede tener `debe` y `haber` simultáneamente en el mismo registro.

### `AsientoContable`

Representa agregado contable balanceado.

Responsabilidades observadas:

- agrupar líneas;
- validar cuadratura entre debe y haber;
- impedir cambios después de confirmación;
- registrar asiento solo en periodo abierto.

## Estados y clasificaciones

### Estado de periodo fiscal

- `ABIERTO`
- `CERRADO`

### Estado de asiento

- `BORRADOR`
- `CONFIRMADO`

### Tipo de cuenta

- `ACTIVO`
- `PASIVO`
- `PATRIMONIO`
- `INGRESO`
- `EGRESO`

## Reglas de negocio respaldadas por evidencia

- no se pueden registrar montos negativos en `LineaAsiento`;
- una línea no puede contener debe y haber al mismo tiempo;
- un asiento confirmado ya no recibe líneas nuevas;
- un asiento solo puede registrarse si cuadra;
- un asiento no puede registrarse en periodo fiscal cerrado;
- un periodo cerrado no puede volver a cerrarse.

## Relaciones de negocio

### Con `Finanzas`

Finanzas expresa hechos monetarios. Contabilidad expresa registro balanceado posterior o consolidado.

### Con `Tesoreria`

Tesoreria conserva caja, turno y pago. Contabilidad no reemplaza esa operación diaria.

## Restricciones observadas

- el módulo modela contabilidad rica, pero no está publicado en la raíz del paquete;
- no se observaron eventos contables públicos adicionales más allá del agregado;
- la librería no define journals, repositorios ni cierre contable completo.

## Pendiente de validación

- si `AsientoContable` seguirá como comportamiento del paquete o migrará a contratos puros;
- cómo se relacionará formalmente con `MovimientoFinanciero` y `MovimientoCaja` en consumers futuros;
- si habrá documentación modular adicional para centros de costo y presupuestos.

## Referencias

- [README.md](./README.md)
- [../finanzas/README.md](../finanzas/README.md)
