# Documentacion de `yolafresh-utils`

## Indice principal

- `inventario-tecnico-yolafresh-utils.md`: mapa general de modulos, exports y estructura.
- `cuenta-cliente/`: documentacion modular del Domain de cuenta cliente.
  - `README.md`: indice del dominio.
  - `modelo-vigente.md`: conceptos, estados, relaciones y reglas vigentes.
  - `flujos-cobros-y-adelantos.md`: flujos operativos minimos.
  - `trazabilidad-y-auditoria.md`: separacion entre recepcion, custodia, ledger y resumen.
  - `guia-de-consumo.md`: interpretacion del modelo para consumers.
- `ventas/`: documentacion modular del Domain de ventas.
  - `README.md`: indice del dominio.
  - `modelo-vigente.md`: conceptos, contratos, estados y reglas vigentes.
  - `relaciones-interdominio.md`: relacion con cuenta cliente, inventario, almacen, stock, caja y pagos.
  - `guia-de-consumo.md`: lectura e integracion recomendada para consumers.
- `personas.md`: contratos de personas, entidades y relaciones con otros contextos.

## Nota

La fuente de verdad del modulo de cuenta cliente es el contrato vigente ya aterrizado en:

- `src/domain/shared/interfaces/customer-account.ts`

Los nombres canónicos del modelo actual son:

- `CuentaCliente`
- `MovimientoCuentaCliente`
- `ImputacionCuentaCliente`
- `RecepcionCobroCliente`
- `TransferenciaCustodiaCobro`
- `ResumenCuentaCliente`

El modelo legacy de cuenta cliente ya no forma parte de la libreria publica.
