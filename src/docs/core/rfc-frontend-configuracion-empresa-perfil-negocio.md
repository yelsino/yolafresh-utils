# RFC-FE-YF-CORE-001: Configuración de empresa con país y perfil de negocio

**Estado:** Propuesto  
**Objetivo:** implementación en frontend  
**Contrato compartido:** `yola-fresh-utils >= 1.1.1`

## 1. Resumen

El frontend debe evolucionar la pantalla de configuración de empresa para soportar dos ampliaciones aditivas del contrato `ConfigEmpresa`:

- `empresa.pais?`
- `perfilNegocio?`

El cambio **no rompe** el documento existente `type: "config_empresa"`. La pantalla actual puede seguir leyendo documentos históricos y, de forma progresiva, empezar a capturar:

- localización base de la empresa;
- vertical operativa del negocio;
- capacidades habilitadas para esa vertical.

El frontend no debe modelar esto como “rubro comercial”. Debe tratarlo como **perfil operativo**.

## 2. Alcance

Incluye:

- lectura y edición de `empresa.pais`;
- lectura y edición de `perfilNegocio.vertical`;
- lectura y edición de `perfilNegocio.capacidades`;
- manejo de `perfilNegocio.bloqueado`;
- defaults seguros para empresas legacy sin `perfilNegocio`;
- validaciones visuales y UX para formularios existentes.

No incluye:

- inferencia automática de vertical a partir de datos históricos;
- migración masiva de documentos en backend;
- activación real de features gastronómicas en consumers;
- reglas de permisos o rollout por feature flag.

## 3. Dependencia y contratos

Actualizar la dependencia:

```json
{
  "dependencies": {
    "yola-fresh-utils": "^1.1.1"
  }
}
```

Import oficial:

```ts
import type {
  ConfigEmpresa,
  PaisEmpresa,
  VerticalNegocio,
  CapacidadNegocio,
  PerfilNegocioConfigEmpresa,
} from "yola-fresh-utils/shared/kernel";
```

Campos nuevos publicados:

```ts
interface ConfigEmpresa {
  empresa: {
    pais?: PaisEmpresa;
  };
  perfilNegocio?: {
    vertical: VerticalNegocio;
    capacidades?: CapacidadNegocio[];
    bloqueado?: boolean;
    version?: number;
  };
}
```

## 4. Motivación para frontend

Antes de este cambio, la configuración de empresa solo distinguía datos legales/comerciales y settings operativos genéricos.

Eso no alcanzaba para:

- diferenciar localización base por país;
- persistir la familia operativa real del negocio;
- habilitar capacidades por vertical sin multiplicar “rubros” ambiguos;
- preparar el crecimiento futuro hacia gastronomía, servicios, distribución u otras verticales.

La decisión aprobada es:

- `pais` vive en `empresa`;
- `vertical` y `capacidades` viven en `perfilNegocio`;
- `rubro` no se usa como eje principal del frontend.

## 5. Arquitectura propuesta en frontend

Separar la implementación en tres secciones visuales:

1. **Datos de empresa**
   - razón social
   - nombre comercial
   - RUC
   - país
   - dirección
   - contacto

2. **Perfil del negocio**
   - vertical
   - capacidades
   - estado bloqueado

3. **Configuración operativa existente**
   - fiscal
   - tickets
   - impresión
   - inventario
   - sistema

El frontend no debe incrustar `vertical` dentro del bloque visual “empresa” aunque viva en la misma pantalla.

## 6. Comportamiento de lectura

### 6.1 Empresas legacy

Si el documento no trae `perfilNegocio`, el frontend debe:

- seguir cargando la pantalla sin error;
- tratar el perfil como “no configurado”;
- permitir completar `vertical` y `capacidades` en edición;
- no asumir automáticamente que el documento ya fue migrado.

### 6.2 País legacy

Si `empresa.pais` no existe:

- mostrar selector vacío o estado “sin configurar”;
- no romper lectura ni guardado del resto del formulario.

## 7. Comportamiento de escritura

### 7.1 Escritura mínima válida

El frontend puede guardar:

```json
{
  "perfilNegocio": {
    "vertical": "RETAIL"
  }
}
```

porque `capacidades`, `bloqueado` y `version` son opcionales.

### 7.2 Regla de merge

Al guardar, el frontend debe preservar el documento existente y enviar patch lógico/merge sobre:

- `empresa.pais`
- `perfilNegocio`

No debe reconstruir manualmente `ConfigEmpresa` desde cero si la pantalla no controla todos los campos.

## 8. UX propuesta

### 8.1 Campo país

Control recomendado:

- `select` de país con allowlist inicial;
- fallback para valores no reconocidos si el documento histórico trae un string fuera del catálogo UI.

Opciones iniciales sugeridas:

- `PERU`
- `MEXICO`
- `COLOMBIA`
- `ARGENTINA`
- `CHILE`
- `ECUADOR`
- `ESPANA`
- `USA`

### 8.2 Campo vertical

Control recomendado:

- selector simple de una sola opción;
- texto de ayuda aclarando que define el modelo operativo del negocio.

Opciones publicadas hoy:

- `RETAIL`
- `GASTRONOMIA`
- `SERVICIOS`
- `DISTRIBUCION`
- `PRODUCCION`
- `SALUD`

### 8.3 Campo capacidades

Control recomendado:

- checklist múltiple;
- agrupación visual por familia funcional;
- autoselección inicial según vertical;
- edición manual permitida mientras `bloqueado !== true`.

### 8.4 Estado bloqueado

Si `perfilNegocio.bloqueado === true`, el frontend debe:

- permitir lectura de vertical/capacidades;
- deshabilitar edición;
- mostrar mensaje explícito tipo “Perfil operativo bloqueado”.

No debe ocultar el valor.

## 9. Presets sugeridos para frontend

### 9.1 Preset retail inicial

Para empresas que hoy operan con el flujo vigente del sistema:

```json
{
  "vertical": "RETAIL",
  "capacidades": [
    "VENTA_MOSTRADOR",
    "PEDIDOS",
    "COMPRAS",
    "INVENTARIO",
    "CAJA",
    "CREDITO_CLIENTE"
  ],
  "version": 1
}
```

### 9.2 Preset gastronómico ilustrativo

Este preset sirve para UI y persistencia del perfil, pero **no implica soporte funcional completo**:

```json
{
  "vertical": "GASTRONOMIA",
  "capacidades": [
    "PEDIDOS",
    "COMPRAS",
    "INVENTARIO",
    "CAJA",
    "MESAS",
    "CUENTA_ABIERTA",
    "COMANDAS",
    "DELIVERY",
    "RESERVAS",
    "RECETAS",
    "PRODUCCION"
  ],
  "version": 1
}
```

## 10. Validaciones de frontend

Reglas mínimas:

- `empresa.pais` opcional a nivel de contrato, pero recomendable como requerido en onboarding nuevo;
- `perfilNegocio.vertical` requerido si existe `perfilNegocio`;
- `perfilNegocio.capacidades` no debe tener duplicados;
- si `perfilNegocio.bloqueado === true`, impedir guardar cambios del bloque;
- no asumir que todas las capacidades son válidas para todas las verticales sin una tabla explícita del consumer.

## 11. Estrategia de migración en consumer frontend

1. actualizar dependency a `^1.1.1`;
2. añadir lectura tolerante de `empresa.pais` y `perfilNegocio`;
3. separar visualmente “empresa” de “perfil del negocio”;
4. introducir preset `RETAIL` para empresas nuevas o migraciones asistidas;
5. bloquear edición solo cuando el backend o la operación lo decidan.

## 12. Riesgos y decisiones

### Riesgo 1: tratar vertical como promesa de features

No debe hacerse.  
`vertical = "GASTRONOMIA"` no significa que el frontend ya tenga toda la operación gastronómica implementada.

### Riesgo 2: usar rubro comercial como fuente de verdad

No debe hacerse.  
`bodega` y `minimarket` pueden compartir el mismo perfil operativo `RETAIL`.

### Riesgo 3: romper empresas viejas

No debe hacerse.  
El formulario debe tolerar documentos sin `pais` ni `perfilNegocio`.

## 13. Ejemplo de documento para frontend

```json
{
  "id": "config_empresa",
  "type": "config_empresa",
  "empresa": {
    "razonSocial": "Inversiones Sabor Criollo S.A.C.",
    "nombreComercial": "Sabor Criollo",
    "ruc": "20614567891",
    "pais": "PERU",
    "direccion": "Av. Guardia Civil 845, San Borja, Lima, Peru",
    "telefono": "+51 987654321",
    "email": "admin@saborcriollo.pe"
  },
  "perfilNegocio": {
    "vertical": "GASTRONOMIA",
    "capacidades": [
      "PEDIDOS",
      "COMPRAS",
      "INVENTARIO",
      "CAJA",
      "MESAS",
      "CUENTA_ABIERTA",
      "COMANDAS",
      "DELIVERY",
      "RESERVAS",
      "RECETAS",
      "PRODUCCION"
    ],
    "bloqueado": true,
    "version": 1
  },
  "fiscal": {
    "moneda": "PEN",
    "simboloMoneda": "S/",
    "porcentajeIGV": 0.18,
    "incluyeIGVEnPrecios": true
  },
  "tickets": {
    "mostrarLogo": true,
    "mostrarRuc": true,
    "mostrarDireccion": true,
    "anchoTicket": 80,
    "cortarAutomaticamente": true
  },
  "impresion": {
    "tipoConexion": "USB",
    "autoImprimirVenta": true
  },
  "inventario": {
    "permitirStockNegativo": false,
    "validarStockAntesDeVender": true
  },
  "sistema": {
    "zonaHoraria": "America/Lima",
    "formatoFecha": "DD/MM/YYYY"
  },
  "updatedAt": "2026-07-29T15:30:00.000Z"
}
```

## 14. Criterio de terminado

La implementación frontend se considera alineada con este RFC cuando:

- la pantalla lee documentos legacy sin error;
- permite capturar `pais`;
- permite capturar `vertical` y `capacidades`;
- respeta `bloqueado`;
- no introduce DTOs paralelos al contrato compartido;
- no mezcla perfil operativo con datos legales/comerciales;
- mantiene compatibilidad con `type: "config_empresa"`.
