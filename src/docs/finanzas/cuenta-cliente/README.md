# Cuenta Cliente

## Propósito

Esta subcarpeta concentra la documentación del subdominio `CuentaCliente` dentro del Domain `finanzas`.

Aquí vive el material canónico para entender:

- qué representa la relación financiera con cliente;
- qué contratos la modelan;
- qué casos de uso cubre hoy;
- cómo se separan recepción, custodia, ledger e imputación;
- qué RFCs y ERFCs orientan la implementación en consumers.

La evidencia vigente principal está en [cuenta-cliente.contract.ts](../../../domain/finanzas/contracts/cuenta-cliente.contract.ts).

## Documentos

- [modelo-vigente.md](./modelo-vigente.md): modelo, contratos, estados y reglas de negocio.
- [casos-de-uso.md](./casos-de-uso.md): casuísticas que cubre hoy el subdominio.
- [operacion-y-auditoria.md](./operacion-y-auditoria.md): flujos mínimos, custodia y trazabilidad.
- [rfcs/erfc-implementacion-cuenta-cliente.md](./rfcs/erfc-implementacion-cuenta-cliente.md): guía de implementación respetando contratos oficiales.
- [rfcs/rfc-reestructuracion-cuenta-cliente-opcion-a.md](./rfcs/rfc-reestructuracion-cuenta-cliente-opcion-a.md): decisión implementada para modelo ERP sin deltas embebidos.
- [rfcs/migracion-ingles-espanol.md](./rfcs/migracion-ingles-espanol.md): RFC de transición para consumers legacy.

## Conceptos principales

- `CuentaCliente`
- `MovimientoCuentaCliente`
- `ImputacionCuentaCliente`
- `RecepcionCobroCliente`
- `TransferenciaCustodiaCobro`
- `ResumenCuentaCliente`

## Regla de consumo

Frontend y backend deben consumir contratos oficiales de `yola-fresh-utils` o `yola-fresh-utils/finanzas`.

No corresponde:

- crear interfaces locales paralelas;
- importar desde rutas internas `dist/...` o `src/...`;
- reinterpretar `Pago` como si fuera efecto financiero automático.

## Referencias

- [../README.md](../README.md)
- [../modelo-vigente.md](../modelo-vigente.md)
