# Configuración de empresa

## Propósito

Este documento fija cómo debe modelarse la configuración de empresa en `shared/kernel` sin romper compatibilidad con producción.

## Evidencia principal

- [empresa.contract.ts](../../domain/shared/kernel/empresa.contract.ts)
- [fiscal.contract.ts](../../domain/shared/kernel/fiscal.contract.ts)
- [contratos-compartidos.md](./contratos-compartidos.md)
- [restaurant/README.md](../restaurant/README.md)
- [restaurant/03-dominio/lenguaje-y-contextos.md](../restaurant/03-dominio/lenguaje-y-contextos.md)
- [restaurant/03-dominio/modelo-conceptual.md](../restaurant/03-dominio/modelo-conceptual.md)

## Estado actual del contrato

`ConfigEmpresa` mantiene el documento canónico:

- `id`
- `type: "config_empresa"`
- `empresa`
- `fiscal`
- `tickets`
- `impresion`
- `inventario`
- `sistema`
- `updatedAt`

La evolución aplicada en esta librería es aditiva:

- `empresa.pais?`
- `perfilNegocio?`

No se cambió el `type`, no se renombraron bloques existentes y no se introdujo un documento nuevo para reemplazar `config_empresa`.

## Decisión de modelado

### 1. `pais` sí pertenece a `empresa`

`pais` forma parte de la identidad legal y operativa básica de la empresa. Se relaciona con localización fiscal, moneda e información regulatoria. Por eso se publica dentro de `empresa`.

### 2. `vertical` y `capacidades` no pertenecen a `empresa`

La conversación funcional y la evidencia del árbol `restaurant` distinguen entre:

- identidad legal/comercial de la empresa;
- perfil o modo de operación del negocio;
- capacidades activables.

Por eso se publica un bloque separado:

- `perfilNegocio.vertical`
- `perfilNegocio.capacidades`
- `perfilNegocio.bloqueado`
- `perfilNegocio.version`

Esta separación evita mezclar en `empresa` datos legales con decisiones de workflow.

### 3. No se publica `rubro` como eje principal

En el estado actual del producto, nombres como `bodega` y `minimarket` describen variantes comerciales del mismo flujo retail. No justifican contratos distintos por sí solos.

La clasificación principal publicada es la **vertical operativa**. Si en el futuro hace falta conservar etiquetas comerciales más finas, eso debe evaluarse aparte y no reemplaza `vertical`.

## Atributos aprobados

### Bloque `empresa`

| Campo | Estado | Motivo |
|---|---|---|
| `razonSocial` | vigente | identidad legal principal |
| `nombreComercial` | vigente | identidad comercial |
| `slogan` | vigente | comunicación comercial |
| `descripcion` | vigente | descripción libre |
| `ruc` | vigente | identificador fiscal actual |
| `pais` | nuevo, opcional | localización legal y fiscal |
| `direccion` | vigente | contacto/ubicación |
| `telefono` | vigente | contacto |
| `email` | vigente | contacto |
| `logoUrl` | vigente | identidad visual |

### Bloque `perfilNegocio`

| Campo | Estado | Motivo |
|---|---|---|
| `vertical` | nuevo, obligatorio dentro del bloque | familia operativa principal |
| `capacidades` | nuevo, opcional | activa funciones sin depender de textos comerciales |
| `bloqueado` | nuevo, opcional | congela cambios estructurales tras onboarding o migración |
| `version` | nuevo, opcional | permite evolucionar presets sin romper compatibilidad |

## Verticales publicadas

La librería publica un catálogo inicial de verticales:

- `RETAIL`
- `GASTRONOMIA`
- `SERVICIOS`
- `DISTRIBUCION`
- `PRODUCCION`
- `SALUD`

### Lectura correcta

Este catálogo **no significa soporte funcional completo** para todas las verticales.

Lectura basada en evidencia actual del repositorio:

| Vertical | Evidencia actual | Lectura |
|---|---|---|
| `RETAIL` | contratos vigentes de ventas, inventario, compras, caja y finanzas | flujo base soportado |
| `GASTRONOMIA` | árbol `src/docs/restaurant` en estado de propuesta | vertical prevista, no equivalente a soporte ya operativo |
| `SERVICIOS` | sin evidencia específica en contratos compartidos | requiere validación futura |
| `DISTRIBUCION` | sin modelado específico publicado | requiere validación futura |
| `PRODUCCION` | evidencia parcial por recetas/producción sólo en documentación propuesta | requiere modelado futuro |
| `SALUD` | sin modelado regulatorio específico | requiere validación futura |

## Capacidades publicadas

Las capacidades permiten activar workflow sin proliferar rubros rígidos. El catálogo inicial publicado es:

- `VENTA_MOSTRADOR`
- `PEDIDOS`
- `COMPRAS`
- `INVENTARIO`
- `CAJA`
- `CREDITO_CLIENTE`
- `MESAS`
- `CUENTA_ABIERTA`
- `COMANDAS`
- `DELIVERY`
- `RESERVAS`
- `RECETAS`
- `PRODUCCION`
- `RUTAS_REPARTO`
- `CITAS`
- `ORDEN_SERVICIO`
- `LOTES_VENCIMIENTO`

## Reglas de compatibilidad

1. `ConfigEmpresa` sigue siendo el contrato publicado.
2. `type` sigue siendo `config_empresa`.
3. `pais` y `perfilNegocio` son aditivos y opcionales.
4. Un consumer viejo debe seguir pudiendo leer documentos históricos sin migración obligatoria inmediata.
5. La semántica de `vertical` no debe usarse como promesa automática de cobertura funcional completa.

## Preguntas abiertas

- Si `ruc` debe generalizarse a un nombre más neutro por país sin romper compatibilidad.
- Si `logoUrl` debe dejar de depender de `inventario/contracts/producto.contract.ts`.
- Si en una siguiente etapa conviene separar explícitamente configuración legal, fiscal y operativa en subdocumentos o subinterfaces internas sin cambiar el documento raíz.
