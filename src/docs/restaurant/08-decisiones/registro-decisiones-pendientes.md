# Registro de decisiones pendientes

## Uso

Ninguna decisión de esta lista debe resolverse implícitamente durante implementación. Cada una necesita responsable, evidencia, fecha y RFC/ADR cuando impacte contratos o datos.

| ID | Decisión | Opciones principales | Recomendación inicial | Bloquea |
|---|---|---|---|---|
| D-01 | Perfiles y capacidades | tipo rígido / capacidades / híbrido | capacidades con presets | Fase 1 |
| D-02 | Punto de cargo a cuenta | al agregar / al enviar / al servir | al enviar, compensable | Fase 2 |
| D-03 | Punto de consumo de receta | enviar / preparar / cerrar | cierre para MVP; evaluar producción | Fase 5 |
| D-04 | Granularidad de trabajo KDS | ticket / línea / unidad | línea con proyección agrupada | Fase 3 |
| D-05 | Mesa compartida | no / varias sesiones | no en MVP | Fase 2 |
| D-06 | Asientos | obligatorios / opcionales / no | opcionales en V1 | Fase 4 |
| D-07 | División de cuenta | entidad interna / agregado | interna inicialmente; separar si contención | Fase 4 |
| D-08 | Venta por cuenta dividida | una venta / una por división | validar fiscal y operación | Fase 4 |
| D-09 | Propina | cargo, pago separado o ambos | componente separado con asignación | Fase 4 |
| D-10 | Cargo de servicio | incluido / adicional / por canal | política configurable y snapshot | Fase 2 |
| D-11 | Anulación tardía | cancelar / merma / cobro | matriz por estado y permiso | Fase 3 |
| D-12 | Reapertura | prohibida / mismo registro / compensación | excepcional y auditada | Fase 4 |
| D-13 | Numeración offline | local + consolidada / rango / UUID visible | ID técnico + secuencia operativa por dispositivo | Fase 1 |
| D-14 | Conflicto de mesa offline | ganador / conciliación | conciliación conservando sesiones | Fase 1 |
| D-15 | Documento de eventos | uno por evento / lotes | uno por comando crítico | Fase 1 |
| D-16 | Retención de eventos | indefinida / por tipo | por obligación y utilidad | Fase 1 |
| D-17 | Ruteo | categoría / ítem / receta / reglas | regla explícita con fallback de categoría | Fase 3 |
| D-18 | Impresión vs KDS | sólo impresión / sólo KDS / ambos | ambos desacoplados | Fase 3 |
| D-19 | Agotado | manual / stock / receta / mixto | mixto, explicando fuente | Fase 3/5 |
| D-20 | Cliente anónimo | alias / entidad invitado / cliente genérico | alias en sesión; nunca cliente genérico global | Fase 2 |
| D-21 | Reserva de stock | ninguna / al enviar / al aceptar canal | no en MVP; evaluar por negocio | Fase 5/6 |
| D-22 | Delivery y `Pedido` vigente | extender / adaptar / reemplazar | adaptador y extensión limitada | Fase 6 |
| D-23 | Multi-moneda | prohibida / cuenta única / conversión | una moneda por cuenta inicialmente | Fase 2 |
| D-24 | Impuestos para llevar | misma regla / regla por modalidad | configuración por modalidad validada | Fase 2 |

## Preguntas de descubrimiento operativo

### Atención

- ¿Una mesa puede atenderse por varios meseros simultáneamente?
- ¿Se toman pedidos por asiento o sólo por mesa?
- ¿Se permite cambiar precio o crear ítem abierto?
- ¿Qué ocurre si el comensal cambia una orden ya preparada?
- ¿Quién puede mover, fusionar o liberar mesas?

### Cocina

- ¿Qué estaciones reales existen y cómo se enrutan platos mixtos?
- ¿Se necesitan cursos, hold/fire o sólo rondas?
- ¿Quién marca entregado: cocina, expedición o mesero?
- ¿Qué se imprime ante adición, cancelación, cambio y refire?
- ¿Cuánto tiempo sin actualización constituye una alerta?

### Cuenta

- ¿La precuenta tiene numeración o valor fiscal?
- ¿Cómo se distribuyen descuentos, impuestos y servicio al dividir?
- ¿Se admite pagar y seguir consumiendo?
- ¿Se generan una o varias ventas al dividir?
- ¿Cómo se trata propina en efectivo frente a electrónica?

### Inventario

- ¿Qué insumos se controlan y con qué unidades?
- ¿Cuándo se reconoce consumo: preparación o cierre?
- ¿Existen preparaciones intermedias y producción por lote?
- ¿Qué mermas requieren aprobación?
- ¿Se permite stock negativo y en qué almacenes?

### Offline

- ¿Cuántos dispositivos operan sin conexión a la vez?
- ¿Existe una red local estable aunque no haya Internet?
- ¿Cuál es el máximo tolerable para ver un cambio en otro dispositivo?
- ¿Qué operaciones pueden esperar conciliación y cuáles deben bloquearse?
- ¿Quién resuelve un conflicto durante hora punta?

## ADRs/RFCs requeridos

1. RFC de perfil y capacidades.
2. RFC de lenguaje y contratos de sesión/pedido/cuenta.
3. RFC de identidad, versión, idempotencia y documentos CouchDB.
4. RFC de comandas, ruteo, impresión y KDS.
5. RFC de cálculo monetario, división, servicio y propina.
6. RFC de cierre hacia Venta/Pago/Caja.
7. RFC de receta, consumo, producción y merma.
8. RFC de reservas y canales.

## Plantilla de resolución

```markdown
### D-XX — Título

- Estado: propuesta | aceptada | rechazada | sustituida
- Fecha:
- Responsables:
- Contexto y evidencia:
- Decisión:
- Alternativas descartadas:
- Consecuencias:
- Compatibilidad/migración:
- Pruebas requeridas:
- Documentos sustituidos:
```

