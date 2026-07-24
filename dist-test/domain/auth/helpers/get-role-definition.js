"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleDefinition = getRoleDefinition;
const role_catalog_1 = require("../catalogs/role.catalog");
function getRoleDefinition(roleId) {
    return role_catalog_1.AUTH_ROLE_DEFINITIONS[roleId];
}
