# Alcance y método

## Objetivo

Definir cómo YolaFresh puede soportar restaurantes, bares, cafeterías, comida rápida, dark kitchens y formatos híbridos sin degradar la operación retail existente.

No se propone “convertir” el POS retail en un formulario de restaurante. Se propone una plataforma común con capacidades activables y contextos gastronómicos separados.

## Preguntas de investigación

1. ¿Qué partes del producto actual se pueden reutilizar sin cambiar su significado?
2. ¿Qué conceptos gastronómicos faltan y cuáles no deben confundirse con `Pedido` o `Venta`?
3. ¿Qué operaciones deben funcionar sin conectividad y entre varios dispositivos?
4. ¿Dónde se necesitan eventos, idempotencia, versiones o intervención humana ante conflictos?
5. ¿Cuál es la secuencia de implementación de menor riesgo?

## Alcance incluido

- selección del tipo de negocio y capacidades;
- locales, ambientes, zonas, mesas, puntos de atención y estaciones;
- roles operativos y permisos;
- comensales, sesiones de servicio, pedidos, comandas, cuentas y precuentas;
- salón, barra, mostrador, recojo y delivery;
- menú, modificadores, combos, recetas y disponibilidad;
- cocina, barra, impresoras y KDS;
- pagos múltiples, división de cuenta, descuentos, servicio y propinas;
- inventario por insumos, producción, merma, rendimiento y costo teórico;
- reservas y lista de espera;
- persistencia local, sincronización, idempotencia y concurrencia;
- plan, historias, aceptación y estrategia de pruebas.

## Exclusiones

- implementación de clases, tablas, migraciones o pantallas;
- contratos definitivos de TypeScript;
- integración concreta con plataformas de delivery o procesadores de pago;
- decisiones fiscales por país no validadas;
- diseño de componentes ajenos a la aplicación y a su sincronización local;
- analítica avanzada, nómina, fidelización y compras predictivas en las primeras fases.

## Evidencia inspeccionada

### Código y documentación del producto

Se revisaron, entre otros:

- estructura `src/application`, `src/domain`, `src/infrastructure`, `src/presentation` y `src/shared`;
- configuración inicial y selección de negocio;
- POS, carrito, liquidación, venta, pedido y entrega;
- caja, turno, pago, cuenta de cliente y anulación;
- productos, presentaciones, precios, almacenes, stock, kardex, compras y transferencias;
- SQLite, procesadores de cambios, cola offline, reintentos y conflictos;
- impresoras y trabajos de impresión;
- documentación de arquitectura, módulos y sincronización multidispositivo.

### Investigación externa

Se usaron manuales oficiales de Oracle Simphony, Odoo, Apache CouchDB y SQLite. Sus hallazgos y enlaces se registran en [patrones profesionales](./02-investigacion/patrones-profesionales.md).

## Método

1. inventario estático de módulos, contratos y tablas;
2. trazado de flujos desde UI hasta persistencia;
3. identificación de acoplamientos y semánticas reutilizables;
4. contraste con flujos profesionales gastronómicos;
5. modelado estratégico por contextos delimitados;
6. modelado conceptual de agregados pequeños y referencias por identificador;
7. análisis de operaciones offline, conflictos e idempotencia;
8. planificación incremental con criterios verificables.

## Restricciones de diseño

- Mantener compatibilidad retail por defecto.
- No agregar banderas gastronómicas dispersas a `Venta` o al carrito.
- Un agregado protege sólo sus invariantes; no se intenta una transacción distribuida entre todos los contextos.
- Una operación económica confirmada no se “edita”: se compensa o revierte con trazabilidad.
- Las proyecciones SQLite pueden reconstruirse; los hechos económicos y operativos no deben perderse.
- Los conflictos deben resolverse según semántica de negocio, no sólo por marca de tiempo.

## Nivel de certeza

El diagnóstico del estado actual es verificable al corte indicado. La propuesta de dominio es suficientemente concreta para orientar RFCs, pero todavía necesita descubrimiento con operadores reales y validación fiscal antes de convertirse en contrato público.

