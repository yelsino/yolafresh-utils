"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_PERMISSION_ALIASES = exports.AUTH_ALIAS_GRANTS = void 0;
const permission_catalog_1 = require("./permission.catalog");
const aliasSet = new Set(["*"]);
for (const permission of permission_catalog_1.AUTH_PERMISSIONS) {
    const [modulo, recurso] = permission.split(":");
    aliasSet.add(`${modulo}:*`);
    aliasSet.add(`${modulo}:${recurso}:*`);
}
exports.AUTH_ALIAS_GRANTS = Array.from(aliasSet).sort();
exports.AUTH_PERMISSION_ALIASES = Object.freeze(exports.AUTH_ALIAS_GRANTS.reduce((acc, alias) => {
    if (alias === "*") {
        acc[alias] = permission_catalog_1.AUTH_PERMISSIONS;
        return acc;
    }
    const segments = alias.split(":");
    const modulo = segments[0];
    if (segments.length === 2 && segments[1] === "*") {
        acc[alias] = permission_catalog_1.AUTH_PERMISSIONS.filter((permission) => permission.startsWith(`${modulo}:`));
        return acc;
    }
    if (segments.length === 3 && segments[2] === "*") {
        const recurso = segments[1];
        acc[alias] = permission_catalog_1.AUTH_PERMISSIONS.filter((permission) => permission.startsWith(`${modulo}:${recurso}:`));
        return acc;
    }
    acc[alias] = [];
    return acc;
}, {}));
