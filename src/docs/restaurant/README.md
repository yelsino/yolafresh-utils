# Evolución gastronómica de YolaFresh

## Estado del documento

- Estado: propuesta de dominio y plan de evolución.
- Fecha de corte: 2026-07-21.
- Aplicación inspeccionada: `D:\Proyectos\MOVILE\FINANZAS-YOLA-FRESH`.
- Contratos compartidos inspeccionados: `yola-fresh-utils` `2.0.0`.
- Alcance técnico: aplicación móvil, dominio compartido y persistencia local SQLite/CouchDB.
- Fuera de alcance: implementación de código y diseño de servicios externos.

Este árbol es la fuente de verdad para la futura modalidad gastronómica. No declara contratos ya publicados: separa evidencia actual, inferencias, recomendaciones y decisiones pendientes para evitar que una propuesta se confunda con una API vigente.

## Resultado ejecutivo

YolaFresh ya posee una base reutilizable: catálogo, precios, ventas, caja, pagos, inventario, compras, personas, permisos, SQLite, cola offline y materialización de cambios. Sin embargo, el flujo actual sigue siendo retail. El selector visual `restaurante` no persiste un perfil de negocio ni activa capacidades, y el `PEDIDO` actual representa atención comercial/entrega, no una sesión de servicio gastronómico.

La evolución recomendada es incremental y aditiva:

1. introducir un perfil de negocio con capacidades explícitas;
2. modelar espacios, mesas, turnos de servicio y cuentas abiertas;
3. separar pedido del cliente, envíos a preparación, cuenta y venta cerrada;
4. añadir modificadores, recetas, estaciones y disponibilidad;
5. extender cobro, inventario y costos sin alterar la semántica retail existente;
6. aplicar políticas de concurrencia por operación, no una regla global de última escritura.

## Árbol de lectura

### Alcance y diagnóstico

- [Alcance y método](./00-alcance-y-metodo.md)
- [Estado actual y brechas](./01-diagnostico/estado-actual-y-brechas.md)
- [Matriz de reutilización](./01-diagnostico/matriz-reutilizacion.md)

### Investigación y dominio

- [Patrones profesionales y fuentes](./02-investigacion/patrones-profesionales.md)
- [Lenguaje ubicuo y contextos](./03-dominio/lenguaje-y-contextos.md)
- [Modelo conceptual](./03-dominio/modelo-conceptual.md)
- [Estados, invariantes y eventos](./03-dominio/estados-invariantes-eventos.md)

### Flujos y arquitectura

- [Flujos funcionales](./04-flujos/flujos-funcionales.md)
- [Arquitectura modular offline](./05-arquitectura/arquitectura-modular-offline.md)
- [Persistencia SQLite/CouchDB](./05-arquitectura/persistencia-y-concurrencia.md)

### Alcance, ejecución y calidad

- [Matriz de capacidades](./06-alcance/matriz-capacidades.md)
- [Plan por fases](./07-plan/fases-de-implementacion.md)
- [Épicas, historias y aceptación](./07-plan/epicas-historias-aceptacion.md)
- [Decisiones pendientes](./08-decisiones/registro-decisiones-pendientes.md)
- [Estrategia de pruebas](./09-calidad/estrategia-de-pruebas.md)

## Convenciones de evidencia

Cada afirmación importante usa una de estas marcas:

- **Hecho:** comprobado en código, esquema, prueba o documentación oficial.
- **Inferencia:** conclusión razonable derivada de varios hechos.
- **Recomendación:** diseño propuesto; todavía no es contrato.
- **Decisión pendiente:** requiere validación de producto, operación, normativa o arquitectura.

## Regla de no contradicción

1. Los documentos de dominios vigentes describen los contratos publicados en `2.0.0`.
2. Este árbol describe la evolución gastronómica propuesta.
3. Ante una diferencia, el código y la documentación de dominio vigente prevalecen para comportamiento actual.
4. Ningún nombre o campo propuesto debe publicarse antes de aprobar su RFC y pruebas de contrato.
5. Un documento futuro que sustituya una decisión de este árbol debe indicar explícitamente qué sección deja obsoleta.
