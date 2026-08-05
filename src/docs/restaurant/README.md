# Evolución gastronómica de YolaFresh

## Estado del documento

- Estado: contratos candidatos y puerta de producción de la primera historia.
- Fecha de corte: 2026-08-01.
- Aplicación inspeccionada: `D:\Proyectos\MOVILE\FINANZAS-YOLA-FRESH`.
- Contratos compartidos inspeccionados: vista previa local `yola-fresh-utils`
  `1.2.0`, todavía no aprobada para producción multidispositivo.
- Alcance técnico: aplicación móvil, dominio compartido y persistencia local SQLite/CouchDB.
- Fuera de alcance de este corte: implementación del manejador remoto de
  comandos, reservas, recetas, producción y delivery completo.

Este árbol es la fuente de verdad para la modalidad gastronómica. Los contratos
de `src/domain/restaurant` son candidatos públicos; su presencia en la vista
previa local no equivale a aprobación de lanzamiento. La puerta vinculante para
la primera historia está en [Contratos de producción para salón y cocina](./10-primera-historia-contratos-produccion.md).

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
- [Primera historia: contratos de producción para salón y cocina](./10-primera-historia-contratos-produccion.md)

## Convenciones de evidencia

Cada afirmación importante usa una de estas marcas:

- **Hecho:** comprobado en código, esquema, prueba o documentación oficial.
- **Inferencia:** conclusión razonable derivada de varios hechos.
- **Recomendación:** diseño propuesto; todavía no es contrato.
- **Decisión pendiente:** requiere validación de producto, operación, normativa o arquitectura.

## Regla de no contradicción

1. Los documentos de dominios vigentes describen los contratos retail publicados.
2. Este árbol y `src/domain/restaurant` describen la evolución gastronómica candidata.
3. Ante una diferencia, el código y la documentación de dominio vigente prevalecen para comportamiento actual.
4. Ningún nombre o campo candidato debe publicarse antes de aprobar su RFC,
   pruebas de contrato y escenarios multidispositivo de la primera historia.
5. Un documento futuro que sustituya una decisión de este árbol debe indicar explícitamente qué sección deja obsoleta.
