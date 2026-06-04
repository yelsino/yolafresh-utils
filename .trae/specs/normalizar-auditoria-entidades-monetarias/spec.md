# Especificación de Auditoría y Trazabilidad en Entidades Monetarias

## Por qué
Hoy la librería tiene varias entidades monetarias (`Venta`, `Pago`, `CobroCliente`, `MovimientoCaja`, `MovimientoCuentaCliente`, `Egreso`, `Ingreso`) y no existe un criterio único para decidir qué auditoría debe vivir dentro de cada contrato y qué auditoría debe resolverse con registros separados. Sin esa regla, el modelo corre el riesgo de inflarse con campos redundantes o, al contrario, quedarse corto para trazabilidad profesional.

## Qué cambia
- Definir un criterio formal para `yolafresh-utils`: **no toda auditoría debe embutirse en cada entidad**.
- Separar explícitamente cuatro capas de trazabilidad:
  - auditoría mínima de negocio dentro de la entidad,
  - ledger/journal oficial (`MovimientoCaja`, `MovimientoCuentaCliente`),
  - workflow/custodia cuando el proceso humano lo requiera,
  - audit log separado para cambios de campos y trazas técnicas.
- Establecer qué entidades deben mantenerse simples y cuáles sí requieren trazabilidad operativa adicional.
- Definir a `Pago` como entidad de captura/conciliación y no como reemplazo universal de cobro ni de caja.
- Definir a `CobroCliente` como el punto principal para modelar recepción/custodia/entrega de dinero cuando exista intervención humana antes de caja.
- Proponer un contrato separado de auditoría de cambios (por ejemplo `RegistroAuditoria`) para futuros casos donde se necesiten before/after values, contexto técnico o historial detallado de modificaciones.

## Impacto
- Especificaciones afectadas: cobros de clientes, cuentas por cobrar, flujo de caja, captura de pagos, trazabilidad operativa, auditoría funcional.
- Código afectado:
  - `src/domain/shared/interfaces/finanzas.ts`
  - `src/domain/shared/interfaces/pagos.ts`
  - `src/domain/shared/interfaces/caja.ts`
  - `src/domain/shared/interfaces/index.ts`
  - posible nuevo contrato compartido de auditoría en `src/domain/shared/interfaces/`

## Requisitos agregados

### Requisito: Auditoría mínima por entidad
El sistema DEBE definir que cada entidad de negocio almacena solo la auditoría mínima necesaria para su propósito funcional.

#### Escenario: Entidad monetaria simple
- **CUANDO** una entidad monetaria solo necesita trazabilidad básica de creación, estado y anulación
- **ENTONCES** el contrato debe incluir únicamente campos mínimos de negocio relevantes
- **Y** no debe incorporar historial completo de cambios de campos, valores anteriores/posteriores o metadata técnica innecesaria

### Requisito: Ledger y caja como trazabilidad oficial
El sistema DEBE usar entidades de ledger/journal como rastro oficial del dinero, en lugar de sobrecargar todas las entidades monetarias con auditoría extensa.

#### Escenario: Movimiento de dinero oficial
- **CUANDO** una operación impacta saldo de caja o saldo de cuenta
- **ENTONCES** la trazabilidad oficial debe descansar en `MovimientoCaja` o `MovimientoCuentaCliente`
- **Y** esos movimientos deben considerarse el registro principal para auditoría financiera/operativa

### Requisito: CobroCliente modela custodia y entrega
El sistema DEBE reservar a `CobroCliente` la trazabilidad operativa humana de recepción, custodia y confirmación de cobros cuando el flujo no termina inmediatamente en caja.

#### Escenario: Vendedor recibe dinero y luego lo entrega a caja
- **CUANDO** un usuario comercial recibe dinero de un cliente pero no es el custodio final de caja
- **ENTONCES** `CobroCliente` debe poder representar quién recibió, quién entregó y quién confirmó en caja
- **Y** `MovimientoCaja` solo debe existir cuando la caja acepta oficialmente el dinero

### Requisito: Audit log separado
El sistema DEBE prever un contrato separado para historial detallado de cambios y eventos de auditoría.

#### Escenario: Cambio de un campo sensible
- **CUANDO** se necesite saber quién cambió un campo, cuándo lo hizo, desde qué contexto y cuál era el valor anterior
- **ENTONCES** esa información debe vivir en un contrato de auditoría separado
- **Y** no debe repetirse como columnas especializadas en todas las entidades monetarias

## Requisitos modificados

### Requisito: Rol de Pago
El sistema DEBE tratar `Pago` como una entidad de captura, conciliación o evidencia de medio de pago, especialmente útil para digital, integración externa o validación previa.

#### Escenario: Cobro manual en efectivo
- **CUANDO** un cobro manual en efectivo es simple y presencial
- **ENTONCES** el modelo no debe exigir `Pago`
- **Y** la trazabilidad puede resolverse con la entidad de negocio correspondiente y `MovimientoCaja`

### Requisito: Rol de CobroCliente
El sistema DEBE tratar `CobroCliente` como la entidad principal para registrar dinero recibido de un cliente y su aplicación a deuda, venta o saldo a favor, incluyendo su flujo de confirmación operativa.

## Requisitos eliminados

### Requisito: Auditoría completa embebida en todas las entidades
**Razón**: inflar todos los contratos con muchos campos de auditoría produce duplicidad, baja coherencia y peores controles que un modelo con capas separadas.
**Migración**: mantener solo auditoría mínima contextual por entidad y mover el historial detallado a un contrato de auditoría separado cuando sea necesario.
