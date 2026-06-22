# Plan — Contratos de Pedido y Venta para yolafresh-utils

## Resumen

Objetivo: rehacer la spec de `Pedido` y `Venta` tomando como fuente primaria el contrato real de `yolafresh-utils`, no el frontend consumidor.

Alcance de ejecución propuesto tras aprobación:

- Crear una spec nueva en `.trae/specs/contratos-pedido-venta-yolafresh-utils/`.
- Documentar auditoría del estado actual real de `Venta`, `CarritoVenta`, `Pedido`, `snapshots` y enums.
- Definir separación canónica entre `CarritoVenta`, `Pedido`, `Venta`, `Pago`, `MovimientoCaja` y `CuentaCliente`.
- Proponer contrato objetivo mínimo de `Pedido`.
- Proponer contrato objetivo mínimo de `Venta`.
- Preservar `Pago` y `EstadoPagoCapturaEnum` sin renombre en esta fase.

Fuera de alcance en esta iteración:

- Cambiar contratos TypeScript productivos en `src/domain/**`.
- Renombrar `Pago`, `EstadoPagoCapturaEnum` o contratos monetarios existentes.
- Adaptar aún consumers como `FINANZAS-YOLA-FRESH`.

## Análisis del Estado Actual

### 1. `Venta` ya mezcla agregado comercial, pedido y caja

Archivo principal: [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts#L17-L646)

Hechos observados:

- `IVenta` incluye identidad, estado, fechas y `detalleVenta: ICarritoVenta`, pero además mete `tipoPago`, `finanzaId`, `turnoCajaId`, `codigoVenta`, `numeroVenta` y `esPedido`.
- La clase expone lógica derivada desde `detalleVenta`, por lo que `Venta` depende estructuralmente de `CarritoVenta` como snapshot congelado.
- `confirmar()` cambia `estado` a `OrderState.DESPACHADO`, con comentario explícito de que está “simulando `CONFIRMADA`”.
- `esUnPedido`, `tieneFinanzaAsociada` y `requiereFinanza` muestran que `Venta` hoy también carga semántica de pedido/crédito.
- `fromCarritoVenta()` arrastra `metodoPago` del carrito hacia `tipoPago` y también propaga `esPedido`.

Conclusión:

- `Venta` hoy no es solo hecho comercial emitido.
- También funciona como documento de cobro, de caja y de clasificación pedido/venta.
- Esa mezcla vuelve difuso el agregado porque un mismo documento intenta responder origen comercial, situación de cobro, impacto de caja y relación con crédito.

### 2. `CarritoVenta` ya opera como pre-venta mutable con contaminación financiera

Archivo principal: [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts#L38-L1440)

Hechos observados:

- `ICarritoVenta` incluye `items`, cálculos, `cliente`, `personal`, `clienteColor`, `metodoPago`, `dineroRecibido`, `procedencia`, `configuracionFiscal`, `esPedido`, `finanzaId`, `clienteId` y `personalId`.
- La clase es mutable: agrega items, cambia cantidades, aplica descuentos, configura trazabilidad y pago.
- Existen APIs explícitas de pedido dentro del carrito: `marcarComoPedido()`, `convertirAVentaNormal()`, `marcarItemComoPedido()`, `itemsPedido`, `totalesSeparados`.
- Comentarios del propio archivo dicen que marcar como pedido implica crear finanza de crédito y dejar venta pendiente de pago.

Conclusión:

- `CarritoVenta` no solo captura productos.
- Hoy funciona como estado mutable de captura operativa, pero cargado con configuración financiera y semántica de pedido.
- Debe quedar como estado de trabajo, no como documento histórico canónico final.

### 3. `Pedido` sí existe, pero es legacy y desacoplado de `Venta`

Archivo principal: [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts#L1-L118)

Hechos observados:

- Existe `Pedido` con `id`, `fechaEntrega`, `estado`, `datosPedido: Carrito`, `numeroPedido`, `porcentajeDescuento`, `subTotal`, `total`, `codigo`, `costoEnvio`, `usuarioId`, `creacion` y `actualizacion`.
- Usa `Carrito` legacy, no `ICarritoVenta`.
- Reusa `OrderState`.
- El archivo importa `OrderState` desde `"@/utils/enums"` mientras dominio actual usa `"@/domain/shared/utils/enums"`, señal adicional de legado/desalineación.
- También existe [ventas/pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/pedido.ts#L1-L33), que define otro `Carrito`/`CarItem` viejo para ventas.
- [mappers.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/mappers.ts#L26-L41) mantiene mapping legacy `pedidodbToPedido()`.

Conclusión:

- `Pedido` ya existe y debe auditarse como contrato real.
- Pero está fuera del agregado moderno de `Venta` y apoyado en tipos legacy.
- La spec debe tratarlo como punto de partida real, no como modelo final correcto.

### 4. `OrderState` hoy mezcla ciclo de vida de pedido y venta

Archivo principal: [enums.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/enums.ts#L2-L8)

Hechos observados:

- `OrderState` contiene `PENDIENTE`, `ATENDIENDO`, `ENTREGADO`, `CANCELADO`, `DESPACHADO`.
- `Venta.ts` usa `PENDIENTE` y `DESPACHADO` como si fueran estados del agregado venta.
- `Pedido` legacy también reutiliza el mismo enum.
- Documentación existente de [venta-turno-caja.md](file:///d:/Proyectos/WEB/yola-fresh-utils/src/docs/venta-turno-caja.md#L21-L100) refuerza uso de `PENDIENTE` y `DESPACHADO` para venta POS.

Conclusión:

- Mismo enum intenta cubrir pedido, venta y parte del flujo operativo.
- `PENDIENTE` y `ATENDIENDO` no son buenos estados canónicos finales de `Venta`.
- La spec debe separar estado de captura/operación de estado de documento comercial.

### 5. Snapshots consolidan mezcla actual y serán parte del delta

Archivo principal: [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts#L41-L183)

Hechos observados:

- `VentaDetalleSnapshot` replica datos de carrito más `metodoPago`, `dineroRecibido`, `esPedido`, `finanzaId`.
- `VentaPersistenceSnapshot` y `VentaCouchMinimalSnapshot` además repiten `tipoPago`, `finanzaId`, `turnoCajaId`, `esPedido`.
- El problema no está solo en `IVenta`; ya está persistido en snapshots.

Conclusión:

- La spec debe incluir delta de persistencia y compatibilidad.
- No basta con redefinir `IVenta`; hay que declarar cómo se depura `snapshots.ts`.

### 6. Contratos vecinos ya ayudan a separar responsabilidades

Archivos principales:

- [pagos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pagos.ts#L3-L52)
- [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts#L214-L369)

Hechos observados:

- `Pago` ya está modelado como captura/conciliación con `estado`, `ventaId?`, `montoAplicado?`, contexto POS y trazabilidad humana.
- `MovimientoCuentaCliente` y `CuentaCliente` ya existen como contratos separados para deuda/saldo.
- `CobroCliente` ya modela recepción y custodia humana, reforzando que cobro/caja no tienen por qué vivir dentro de `Venta`.

Conclusión:

- La nueva spec debe apoyarse en contratos vecinos reales.
- Hay base suficiente para sacar cobro, caja y deuda de `Venta` sin inventar entidades nuevas.

## Cambios Propuestos

### 1. Crear spec formal nueva

Archivos a crear:

- `.trae/specs/contratos-pedido-venta-yolafresh-utils/spec.md`
- `.trae/specs/contratos-pedido-venta-yolafresh-utils/checklist.md`
- `.trae/specs/contratos-pedido-venta-yolafresh-utils/tasks.md`

Qué:

- Redactar spec completa con secciones `Por qué`, `Qué cambia`, `Impacto`, requisitos agregados/modificados/eliminados y escenarios.

Por qué:

- Usuario pidió reiniciar spec desde librería real.
- Hoy no existe carpeta de spec con ese nombre en `.trae/specs/`.

Cómo:

- Basar cada apartado en hallazgos concretos de `Venta.ts`, `CarritoVenta.ts`, `pedido.ts`, `snapshots.ts`, `enums.ts`, `pagos.ts` y `finanzas.ts`.
- Dejar referencias cruzadas a specs vecinas afectadas por impacto conceptual, aunque no existan todavía en este repo.

### 2. Auditar contrato actual real dentro de `spec.md`

Archivos fuente:

- [Venta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/Venta.ts)
- [CarritoVenta.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/CarritoVenta.ts)
- [pedido.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pedido.ts)
- [snapshots.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/ventas/snapshots.ts)
- [enums.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/utils/enums.ts)

Qué:

- Listar campos reales actuales de `IVenta`, `ICarritoVenta` y `Pedido`.
- Explicar mezclas semánticas ya observadas.
- Registrar estados actuales observados y por qué son ambiguos.

Por qué:

- Requisito central del usuario: no especular desde frontend.

Cómo:

- Incluir tablas o listas compactas por contrato.
- Señalar explícitamente qué conceptos pertenecen a venta, pedido, pago, caja, deuda o captura operativa.

### 3. Definir separación canónica de responsabilidades

Archivos de soporte conceptual:

- [pagos.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/pagos.ts)
- [finanzas.ts](file:///d:/Proyectos/WEB/yola-fresh-utils/src/domain/shared/interfaces/finanzas.ts)

Qué:

- Establecer rol canónico de:
  - `CarritoVenta`
  - `Pedido`
  - `Venta`
  - `Pago`
  - `MovimientoCaja`
  - `CuentaCliente`

Por qué:

- Usuario necesita relación correcta entre agregados antes de migrar app consumidora.

Cómo:

- Formular escenarios canónicos:
  - contado,
  - pedido sin pago,
  - pedido convertido al recoger,
  - venta a crédito.
- Mantener `Pago` como entidad válida de captura/conciliación, sin renombre.

### 4. Proponer contrato objetivo mínimo de `Pedido`

Archivo a especificar:

- `.trae/specs/contratos-pedido-venta-yolafresh-utils/spec.md`

Qué:

- Definir contrato mínimo profesional de `Pedido` con:
  - identidad,
  - estado,
  - cliente,
  - creador,
  - items,
  - totales,
  - fechas.
- Definir `PedidoItem` con soporte explícito para atención parcial y cancelación parcial.

Por qué:

- Pedido actual es legacy y no sirve como contrato moderno canónico.

Cómo:

- Proponer campos mínimos no derivados.
- Derivar pendiente por fórmula `cantidadSolicitada - cantidadAtendida - cantidadCancelada`.
- Dejar fuera `turnoCajaId`, `movimientoCajaId`, `finanzaId`, `metodoPago`, `dineroRecibido` y demás campos ajenos al agregado.

### 5. Proponer contrato objetivo mínimo de `Venta`

Archivo a especificar:

- `.trae/specs/contratos-pedido-venta-yolafresh-utils/spec.md`

Qué:

- Partir de `IVenta` actual y definir versión objetivo con:
  - identidad,
  - estado,
  - `pedidoId?`,
  - cliente,
  - vendedor,
  - items,
  - totales,
  - fechas.

Por qué:

- `Venta` debe quedar como hecho comercial confirmado, no como contenedor de cobro/caja/crédito/pedido.

Cómo:

- Conservar campos útiles de negocio.
- Marcar `finanzaId`, `turnoCajaId`, `tipoPago`, `dineroRecibido` y `esPedido` como candidatos a salir del agregado.
- Explicar destino correcto de cada concepto:
  - `Pago` para captura/conciliación,
  - `MovimientoCaja` para tesorería,
  - `CuentaCliente` para deuda/saldo,
  - `pedidoId` como relación con reserva comercial.

### 6. Declarar delta de refactor para librería

Archivos impactados en ejecución futura:

- `src/domain/ventas/Venta.ts`
- `src/domain/ventas/CarritoVenta.ts`
- `src/domain/ventas/snapshots.ts`
- `src/domain/shared/interfaces/pedido.ts`
- `src/domain/shared/utils/enums.ts`

Qué:

- En la spec, separar por categorías:
  - qué se conserva,
  - qué se mueve fuera del agregado,
  - qué se depreca,
  - qué se agrega.

Por qué:

- Usuario pidió delta de refactor, no solo modelo objetivo abstracto.

Cómo:

- Expresar compatibilidad temporal:
  - `esPedido` queda como deuda técnica/deprecación, sustituido por `pedidoId`.
  - `detalleVenta` debe revisarse como snapshot interno/compatibilidad, no como forma ideal final del contrato público.
  - `OrderState` compartido debe dejarse marcado para separación futura entre estados de pedido y venta.

### 7. Preparar checklist y tasks accionables

Archivos a crear:

- `.trae/specs/contratos-pedido-venta-yolafresh-utils/checklist.md`
- `.trae/specs/contratos-pedido-venta-yolafresh-utils/tasks.md`

Qué:

- Checklist de completitud de spec.
- Tasks ejecutables para siguiente fase de implementación contractual.

Por qué:

- Dejar transición ordenada entre análisis, spec y futura ejecución.

Cómo:

- Checklist debe verificar:
  - auditoría fiel del contrato real,
  - separación de responsabilidades,
  - contrato objetivo de `Pedido`,
  - contrato objetivo de `Venta`,
  - preservación temporal de `Pago`.
- Tasks deben ordenar luego implementación en código:
  - redefinir enums/estados,
  - separar `pedidoId` de `esPedido`,
  - depurar snapshots,
  - migrar contrato legacy de `Pedido`,
  - revisar impacto en docs existentes.

## Decisiones y Supuestos

### Decisiones tomadas

- Esta entrega será documental: spec + checklist + tasks.
- Fuente primaria será código real bajo `src/domain/**`, no consumers externos.
- Se respetarán contratos existentes de `yolafresh-utils`; no se inventarán interfaces productivas nuevas fuera de lo que la spec proponga explícitamente como evolución.
- `Pago` y `EstadoPagoCapturaEnum` se preservan sin renombre en esta fase.
- `CarritoVenta` quedará definido como estado mutable de captura, no documento histórico final.
- `Pedido` quedará definido como reserva/solicitud comercial pendiente de conversión.
- `Venta` quedará definida como hecho comercial confirmado o emitido.

### Supuestos

- Las specs afectadas mencionadas por usuario viven fuera de este repo o aún no existen localmente; se las referenciará como impacto, no como archivos a editar ahora.
- No se requiere cambiar código TypeScript todavía para considerar satisfecha esta petición de spec.
- La relación con deuda/cobro/caja puede resolverse apoyándose en contratos ya presentes: `Pago`, `CobroCliente`, `MovimientoCuentaCliente`, `CuentaCliente`.

## Pasos de Implementación

1. Crear carpeta `.trae/specs/contratos-pedido-venta-yolafresh-utils/`.
2. Redactar `spec.md` con auditoría fiel del estado actual real, citando contratos fuente.
3. Incluir sección de diagnóstico de mezcla semántica en `Venta` y `CarritoVenta`.
4. Incluir sección específica para `Pedido` legacy y su desalineación con modelo moderno.
5. Definir relación canónica entre `CarritoVenta`, `Pedido`, `Venta`, `Pago`, `MovimientoCaja` y `CuentaCliente`.
6. Proponer contrato mínimo objetivo de `Pedido`, con invariantes y estados propios.
7. Proponer contrato mínimo objetivo de `Venta`, con `pedidoId?`, invariantes y estados propios.
8. Documentar delta de refactor: conservar, mover, deprecar, agregar.
9. Redactar `checklist.md` para validar completitud de la spec.
10. Redactar `tasks.md` para siguiente fase de implementación en código y migración documental.

## Verificación

La ejecución se considerará correcta si cumple todo esto:

1. La spec enumera campos reales actuales de `IVenta`, `ICarritoVenta` y `Pedido`, sin inventarlos.
2. La spec deja explícita la mezcla actual de `esPedido`, `finanzaId`, `turnoCajaId`, `tipoPago`, `codigoVenta` y `numeroVenta` dentro de `Venta`.
3. La spec deja explícito que `CarritoVenta` hoy mezcla captura operativa con datos financieros y de pedido.
4. La spec deja explícito que `Pedido` ya existe, pero es legacy y no alineado con `Venta` moderna.
5. La spec define responsabilidades separadas para `CarritoVenta`, `Pedido`, `Venta`, `Pago`, `MovimientoCaja` y `CuentaCliente`.
6. La spec propone contratos mínimos profesionales de `Pedido` y `Venta`.
7. La spec mantiene `Pago` y `EstadoPagoCapturaEnum` sin renombre.
8. `checklist.md` y `tasks.md` permiten continuar luego con implementación contractual sin reabrir decisiones de negocio.
