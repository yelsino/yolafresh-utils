import { AUTH_PERMISSIONS } from "./permission.catalog";

const aliasSet = new Set<string>(["*"]);

for (const permission of AUTH_PERMISSIONS) {
  const [modulo, recurso] = permission.split(":");
  aliasSet.add(`${modulo}:*`);
  aliasSet.add(`${modulo}:${recurso}:*`);
}

export const AUTH_ALIAS_GRANTS = Array.from(aliasSet).sort() as readonly string[];

export const AUTH_PERMISSION_ALIASES = Object.freeze(
  AUTH_ALIAS_GRANTS.reduce<Record<string, readonly string[]>>((acc, alias) => {
    if (alias === "*") {
      acc[alias] = AUTH_PERMISSIONS;
      return acc;
    }

    const segments = alias.split(":");
    const modulo = segments[0];

    if (segments.length === 2 && segments[1] === "*") {
      acc[alias] = AUTH_PERMISSIONS.filter((permission) => permission.startsWith(`${modulo}:`));
      return acc;
    }

    if (segments.length === 3 && segments[2] === "*") {
      const recurso = segments[1];
      acc[alias] = AUTH_PERMISSIONS.filter((permission) =>
        permission.startsWith(`${modulo}:${recurso}:`),
      );
      return acc;
    }

    acc[alias] = [];
    return acc;
  }, {}),
) as Readonly<Record<string, readonly string[]>>;
