# Debug Session: credit-voucher-missed

## Estado

[OPEN]

## Síntoma

El usuario reporta que el contenedor `backendyolafresh` generó varios créditos el `2026-07-13` entre `17:00` y `22:00`, pero el envío de voucher al cliente solo ocurrió algunas veces.

## Hipótesis iniciales

1. Algunos créditos no tienen canal de notificación válido y el backend omite envío.
2. El backend genera crédito pero falla el dispatch al servicio de voucher/notificación.
3. Existe deduplicación o idempotencia que descarta parte de los envíos.
4. Hay ramas de negocio distintas para crédito que no siempre disparan voucher.
5. El proveedor externo devuelve errores intermitentes y no hay retry suficiente.

## Evidencia

- El contenedor real en VPS es `YolaFreshPosBackend`, no `backendyolafresh`.
- Entre `2026-07-13 17:00` y `22:00` hora Lima (`2026-07-13T22:00:00Z` a `2026-07-14T03:00:00Z`) aparecen:
  - `14` eventos `cuenta_cliente_venta_ok`
  - `14` eventos `auto_send_credito_voucher_queued`
  - `11` eventos `auto_send_credito_voucher_failed`
  - `3` eventos `auto_send_credito_voucher_sent`
- Errores observados en `auto_send_credito_voucher_failed`:
  - `venta_snapshot_not_found`
  - `venta_not_found`
- Casos confirmados con falla:
  - `5b154902-df0b-45fa-ab10-971e7ad3dcf4` -> `venta_not_found`
  - `917f0fa3-55d2-405b-90ca-eb078bda6992` -> `venta_not_found`
  - `036dcfce-fad7-4689-a74a-3258b67f4a1b` -> `venta_snapshot_not_found`
  - `c4a14ba9-ed6d-483f-859a-d3fb2b5258a6` -> primero `venta_snapshot_not_found`, luego envío exitoso
  - `82f75a8c-60d0-4c7b-8e8e-89adf0262892` -> `venta_snapshot_not_found`
  - `605118a2-a1d3-44ad-854b-0d1e9722bc5b` -> `venta_snapshot_not_found`
  - `98bf6518-5219-46d3-a123-a56e318c6fc5` -> `venta_snapshot_not_found`
  - `0cbf38a7-3638-4ca8-a1e9-4a58161708b7` -> primero `venta_not_found`, luego requeue y envío exitoso
  - `e5ffa29d-6524-412f-a214-9998379c91d5` -> `venta_snapshot_not_found`, luego envío exitoso
  - `40bc0522-cb53-4924-8783-4556966b38a3` -> `venta_snapshot_not_found`, luego envío exitoso
  - `d5831f12-773a-49f2-9524-e1c2cd25269c` -> `venta_snapshot_not_found`, luego envío exitoso
- Patrón: el backend sí encola el autoenvío al registrar el crédito, pero una parte falla porque el proceso exige `Venta` o `VentaSnapshot` disponibles en el momento de armar el voucher.
- Correlación adicional: el servicio WhatsApp (`wa-service`) muestra inestabilidad fuerte de sesión (`QR refs attempts ended`, `Bad MAC`, `No matching sessions found for message`), pero los casos exitosos demuestran que esa no es la causa primaria de la intermitencia inicial del encolado/envío.

## Próximo paso

Determinar si el backend debe:
1. reintentar automáticamente cuando falte `Venta` o `VentaSnapshot`,
2. permitir construir voucher sin depender duramente de `VentaSnapshot`,
3. desacoplar creación del crédito del envío de voucher mediante cola más robusta.
