"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandRoleGrants = expandRoleGrants;
const role_catalog_1 = require("../catalogs/role.catalog");
function expandRoleGrants(roleIds) {
    var _a;
    const grants = [];
    for (const roleId of roleIds) {
        const definition = role_catalog_1.AUTH_ROLE_DEFINITIONS[roleId];
        grants.push(...((_a = definition === null || definition === void 0 ? void 0 : definition.grants) !== null && _a !== void 0 ? _a : []));
    }
    return [...new Set(grants)];
}
