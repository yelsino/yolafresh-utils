# Plan por fases

## Criterio de secuenciación

Cada fase debe entregar un corte vertical operable, preservar retail y reducir un riesgo antes de aumentar alcance. No se publican todos los contratos al inicio.

## Fase 0 — Descubrimiento y RFCs

### Objetivo

Validar lenguaje, operación real y decisiones irreversibles.

### Trabajo

- observar al menos tres formatos: mesa, mostrador y cocina/delivery;
- mapear permisos, excepciones y documentos fiscales;
- medir conectividad y cantidad de dispositivos;
- aprobar RFC de capacidades/perfil;
- aprobar RFC de identidad, versión, eventos y tipos documentales;
- prototipar flujos de mesa, toma, KDS y división sin persistencia definitiva;
- definir compatibilidad y estrategia de migración.

### Salida

Glosario aprobado, decisiones críticas resueltas, diagramas validados y contratos candidatos.

## Fase 1 — Fundaciones y compatibilidad

### Objetivo

Habilitar gastronomía sin alterar retail.

### Trabajo

- perfil/capacidades persistido y versionado;
- permisos gastronómicos;
- local, ambiente, zona, mesa y estación;
- convención de comandos, idempotencia y versión;
- outbox observable y registro de conflictos;
- subpaths públicos del dominio sólo después de pruebas de contrato.

### Puerta de calidad

- suite retail sin regresiones;
- activar/desactivar capacidades no borra datos;
- dos dispositivos no ocupan una mesa silenciosamente;
- migraciones son repetibles y recuperables.

## Fase 2 — Servicio básico y cuenta abierta

### Objetivo

Operar salón/mostrador sin cocina compleja.

### Trabajo

- plano y sesión de servicio;
- pedido gastronómico y líneas;
- menú sobre Producto/Presentación/Precio;
- modificadores mínimos/máximos;
- cuenta abierta, precuenta, pago único/mixto;
- cierre idempotente hacia Venta;
- transferencia de mesa y reasignación de responsable.

### Puerta de calidad

Flujo completo offline: abrir, pedir, cobrar, generar una sola venta, cerrar y liberar mesa.

## Fase 3 — Preparación profesional

### Objetivo

Coordinar cocina, barra e impresión/KDS.

### Trabajo

- envíos por delta y estación;
- cola de impresión gastronómica idempotente;
- estados por línea, tiempos y alertas;
- cancelación tardía/refire;
- disponibilidad manual;
- proyecciones KDS y expedición;
- rondas; cursos/hold/fire si el piloto lo requiere.

### Puerta de calidad

Ningún reintento duplica comandas; un cambio enviado conserva historial y llega a la estación correcta.

## Fase 4 — División, servicio y excepciones

### Objetivo

Completar cobro de mesa profesional.

### Trabajo

- división por ítems/cantidades y luego asientos/partes;
- descuentos con autorización;
- cargo de servicio y propina;
- reversas, reapertura y conciliación;
- fusión de sesiones/cuentas si se valida;
- auditoría y panel de workflows incompletos.

### Puerta de calidad

Concurrencia de dos cajas no genera doble venta/pago y toda distribución monetaria conserva trazabilidad.

## Fase 5 — Recetas, producción y costos

### Objetivo

Pasar de descuento por producto vendido a control gastronómico por insumos.

### Trabajo

- receta simple publicada/versionada;
- consumo teórico idempotente;
- merma con motivo y permiso;
- preparaciones intermedias y lotes de producción;
- rendimiento real y costo teórico/real;
- integración con compras, almacenes, kardex y reportes.

### Puerta de calidad

El cierre/reintento no duplica consumo; las versiones antiguas reproducen costo y composición histórica.

## Fase 6 — Reservas y canales

### Objetivo

Expandir demanda y cumplimiento.

### Trabajo

- reservas y lista de espera;
- recojo y delivery propio;
- repartidor y prueba de entrega;
- aceptación/rechazo/promesa;
- integradores sólo tras estabilizar el modelo interno;
- autoservicio en una fase posterior.

## Estrategia de migración

1. añadir tablas/documentos sin reutilizar nombres ambiguos;
2. mantener perfil retail por defecto;
3. poblar proyecciones y configuración con migraciones idempotentes;
4. activar por empresa/local y bandera de capacidad;
5. ejecutar piloto con salida reversible;
6. no convertir automáticamente `Pedido` histórico en pedido gastronómico;
7. generar vínculos explícitos sólo para nuevas operaciones;
8. publicar contratos con semver y guías de consumo.

## Estrategia de despliegue

- laboratorio con datos sintéticos;
- piloto en un local y una estación;
- modo sombra de KDS/impresión para comparar salidas;
- activación gradual por capacidad;
- monitoreo de colas, conflictos, duplicados y tiempos;
- rollback funcional desactivando capacidad, sin eliminar datos.

## Indicadores de éxito

- cero ventas/pagos/comandas duplicadas en reintentos;
- cero pérdida silenciosa de líneas concurrentes;
- tiempo de actualización local dentro del SLA definido;
- porcentaje de comandas ruteadas correctamente;
- cuentas abiertas sin workflow huérfano;
- diferencias de inventario explicables por venta, producción, merma o ajuste;
- retail mantiene resultados funcionales y de rendimiento previos.

## Dependencias entre fases

```text
F0 decisiones
  -> F1 capacidades + concurrencia
      -> F2 servicio + cuenta
          -> F3 preparación
          -> F4 división/excepciones
              -> F5 recetas/costos
              -> F6 reservas/canales
```

F3 y F4 pueden solaparse después de estabilizar el cierre de F2. F5 no debe bloquear el piloto inicial: productos de reventa y una política simple permiten probar primero el servicio.

