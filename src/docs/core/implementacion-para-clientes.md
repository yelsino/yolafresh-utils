# Implementación Para Clientes

## Propósito

Este documento define instrumentación oficial para proyectos consumidores de `yola-fresh-utils`.

Aplica a:

- backend;
- cliente móvil;
- paneles o apps internas;
- cualquier repo que jale paquete directo desde GitHub.

## Regla no negociable

Consumer nunca debe instalar rama flotante:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils"
  }
}
```

Forma correcta:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v1.0.3"
  }
}
```

## Versión oficial actual

Desde hoy, versión recomendada para consumidores es:

```txt
v1.0.3
```

`v1.0.2` queda solo como rollback exacto si un proyecto necesita congelarse en release anterior.

## Paso 1. Actualizar dependencia

En `package.json` del cliente:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v1.0.3"
  }
}
```

O por comando:

```bash
npm install github:yelsino/yolafresh-utils#v1.0.3
```

## Paso 2. Reinstalación limpia

Si proyecto ya tenía dependencia anterior, hacer instalación limpia:

```bash
rm -rf node_modules package-lock.json
npm install
```

En Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## Paso 3. Verificar versión instalada

Validar que cliente realmente quedó fijado en `v1.0.3`.

Revisar:

- `package.json`
- `package-lock.json`
- `node_modules/yola-fresh-utils/package.json`

Valor esperado:

```json
{
  "version": "1.0.3"
}
```

## Paso 4. Validar imports oficiales

Consumer debe usar solo:

- raíz oficial;
- subpaths públicos oficiales.

Ejemplos correctos:

```ts
import { Venta } from "yola-fresh-utils";
import type { MovimientoCuentaCliente } from "yola-fresh-utils/finanzas/contracts";
import {
  AUTH_ROLE_DEFINITIONS,
  expandGrants,
  type AuthSnapshot,
} from "yola-fresh-utils/auth";
```

Ejemplos prohibidos:

```ts
import { Cambio } from "yola-fresh-utils/dist/domain/finanzas/contracts/finanzas.contract";
import { AuthSnapshot } from "yola-fresh-utils/src/domain/auth/contracts/auth-snapshot.contract";
```

## Paso 5. Integración por tipo de cliente

### Backend

Backend debe:

- consumir contratos compartidos desde `yola-fresh-utils`;
- usar `AuthSnapshot`, `AuthGrant`, `AuthPermission` y helpers oficiales;
- dejar contratos auth transicionales locales;
- no inventar catálogo paralelo.

### Cliente móvil

Cliente móvil debe:

- consumir `AuthSnapshot` oficial;
- persistir snapshot en SQLite;
- usar permisos y grants compartidos para guards UI offline;
- no redefinir shapes auth;
- no crear enums locales alternos.

### Otros clientes

Cualquier otro consumer debe:

- fijar mismo tag;
- usar imports públicos;
- leer `src/docs/` del paquete instalado como documentación oficial.

## Paso 6. Verificación mínima de consumo

Después de instalar, proyecto consumidor debe validar:

- compila imports desde raíz;
- compila imports desde subpaths públicos;
- no quedan imports `dist/` ni `src/`;
- si usa auth, compila `AuthSnapshot`;
- si usa guards, compila `expandGrants()` o `resolveRolePermissions()`.

## Paso 7. Rollback

Si consumer necesita volver al estado anterior:

```json
{
  "dependencies": {
    "yola-fresh-utils": "github:yelsino/yolafresh-utils#v1.0.2"
  }
}
```

Luego:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Checklist corto para PR de cliente

- dependencia fijada a `#v1.0.3`
- lockfile actualizado
- imports internos eliminados
- compilación verde
- guards auth alineados a `yola-fresh-utils/auth`
- documentación local del repo actualizada si referencia versión vieja

## Referencias

- [README.md](../../../README.md)
- [versionado-del-paquete.md](./versionado-del-paquete.md)
- [../auth/README.md](../auth/README.md)
- [../auth/migracion-v1-0-2-a-v1-0-3.md](../auth/migracion-v1-0-2-a-v1-0-3.md)
