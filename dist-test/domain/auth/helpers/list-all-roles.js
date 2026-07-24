"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllRoles = listAllRoles;
const role_catalog_1 = require("../catalogs/role.catalog");
function listAllRoles() {
    return Object.values(role_catalog_1.AUTH_ROLE_DEFINITIONS);
}
