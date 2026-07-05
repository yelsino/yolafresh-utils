# Guía de Onboarding

## Propósito

Este documento propone ruta de lectura para una persona nueva que llega a `yolafresh-utils`.

La meta no es explicar cada contrato, sino ayudar a entender rápido:

- qué es el paquete;
- por qué existe;
- cómo se organiza;
- dónde empezar según tipo de tarea.

## Ruta rápida de 15 minutos

### Paso 1. Entender qué es el paquete

Leer:

- [vision-general-del-paquete.md](./vision-general-del-paquete.md)
- [arquitectura-vigente.md](./arquitectura-vigente.md)

Objetivo:

- entender por qué existe librería;
- entender qué publica y qué no;
- entender por qué la raíz es mínima.

### Paso 2. Entender cómo se conectan módulos

Leer:

- [mapa-del-dominio.md](./mapa-del-dominio.md)

Objetivo:

- entender qué verdad preserva cada dominio;
- no confundir venta, cobro, deuda, stock o contabilidad.

### Paso 3. Entrar al dominio que te toca

Leer luego uno de estos puntos de entrada:

- [../ventas/README.md](../ventas/README.md)
- [../finanzas/README.md](../finanzas/README.md)
- [../compras/README.md](../compras/README.md)
- [../inventario/README.md](../inventario/README.md)
- [../tesoreria/README.md](../tesoreria/README.md)
- [../personas/README.md](../personas/README.md)
- [../contabilidad/README.md](../contabilidad/README.md)

## Ruta según perfil

### Si vienes a integrar app o frontend

Lee en este orden:

1. [vision-general-del-paquete.md](./vision-general-del-paquete.md)
2. [mapa-del-dominio.md](./mapa-del-dominio.md)
3. [../ventas/README.md](../ventas/README.md)
4. [../ventas/modelo-vigente.md](../ventas/modelo-vigente.md)
5. [../finanzas/cuenta-cliente/modelo-vigente.md](../finanzas/cuenta-cliente/modelo-vigente.md)
6. [../tesoreria/modelo-vigente.md](../tesoreria/modelo-vigente.md)

Razón:

- normalmente tocarás venta, cobro, caja y deuda del cliente antes que contabilidad formal.

### Si vienes a integrar backend o procesos

Lee en este orden:

1. [vision-general-del-paquete.md](./vision-general-del-paquete.md)
2. [mapa-del-dominio.md](./mapa-del-dominio.md)
3. [../finanzas/README.md](../finanzas/README.md)
4. [../tesoreria/README.md](../tesoreria/README.md)
5. [../compras/README.md](../compras/README.md)
6. [../contabilidad/README.md](../contabilidad/README.md)

Razón:

- normalmente backend debe orquestar más relaciones interdominio y no solo contrato comercial.

### Si vienes a tocar catálogo o stock

Lee en este orden:

1. [../inventario/README.md](../inventario/README.md)
2. [../inventario/modelo-vigente.md](../inventario/modelo-vigente.md)
3. [../ventas/relaciones-interdominio.md](../ventas/relaciones-interdominio.md)
4. [../compras/modelo-vigente.md](../compras/modelo-vigente.md)

### Si vienes a tocar identidad y permisos

Lee en este orden:

1. [../personas/README.md](../personas/README.md)
2. [../personas/modelo-vigente.md](../personas/modelo-vigente.md)
3. [../personas/autorizacion-y-sesion.md](../personas/autorizacion-y-sesion.md)

## Preguntas guía para no perderse

Cuando leas un módulo, intenta responder:

- ¿qué verdad del negocio preserva?;
- ¿por qué existe separado de otros módulos cercanos?;
- ¿qué cosas no debe absorber?;
- ¿con qué dominios se relaciona?;
- ¿qué error conceptual evita?

## Errores de lectura frecuentes

### Pensar que `Venta` resuelve todo

No.

`Venta` resuelve hecho comercial, no cobro, caja, deuda ni stock.

### Pensar que `CuentaCliente` pertenece a módulo separado

No en estructura vigente.

Su lenguaje vive dentro de `finanzas`.

### Pensar que `shared/` contiene negocio difuso

No.

`shared/` solo conserva base, kernel, utilidades mínimas y value objects transversales.

### Pensar que el paquete resuelve infraestructura

No.

El paquete fija lenguaje y límites; el consumer resuelve persistencia, sincronización y operación.

## Qué leer después del onboarding

Después de entender panorama general:

- baja al `README` del dominio;
- luego a `modelo-vigente.md`;
- luego a relaciones interdominio o guías específicas si tu caso lo requiere.

## Extensiones recomendadas

- si el ecosistema crece, conviene complementar esta guía con casos de negocio frecuentes como venta contado, venta a crédito, compra y cobro cliente;
- esa posible ampliación no cambia la ruta de lectura actual ni la documentación oficial vigente por dominio.

## Referencias

- [README.md](./README.md)
- [vision-general-del-paquete.md](./vision-general-del-paquete.md)
- [mapa-del-dominio.md](./mapa-del-dominio.md)
