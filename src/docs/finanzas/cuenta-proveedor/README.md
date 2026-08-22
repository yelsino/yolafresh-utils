# Cuenta de proveedor

## Estado

El libro append-only, su resumen reconstruible, operaciones, desembolsos,
imputaciones y reversas están publicados desde `yola-fresh-utils` 1.5.0. La
trazabilidad opcional hacia `egresoId` y `movimientoCajaId` forma parte de 1.7.0.
El razonamiento y las reglas se conservan en
[rfc-modelo-propuesto.md](./rfc-modelo-propuesto.md).

## Propósito

Este subdominio modela las obligaciones del negocio con un proveedor y la
aplicación auditable de pagos, adelantos, notas de crédito y devoluciones.

No reemplaza:

- `Compra`, que representa el hecho comercial;
- `RecepcionMercaderia`, que representa el ingreso físico;
- `Egreso`, `MovimientoCaja` o una transacción bancaria, que prueban la salida de
  fondos;
- `Evidencia`, que conserva archivos o constancias.

## Documentos

- [Decisión del modelo](./rfc-modelo-propuesto.md): libro append-only,
  imputaciones, desembolso, resumen reconstruible, idempotencia y migración.
- [Modelo vigente de finanzas](../modelo-vigente.md): contrato reducido que hoy se
  publica desde el paquete.
- [CuentaCliente](../cuenta-cliente/README.md): patrón de referencia, no plantilla
  para copiar literalmente.
