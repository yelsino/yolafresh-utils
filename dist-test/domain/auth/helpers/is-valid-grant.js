"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidGrant = isValidGrant;
const permission_alias_catalog_1 = require("../catalogs/permission-alias.catalog");
const permission_catalog_1 = require("../catalogs/permission.catalog");
const AUTH_GRANT_SET = new Set([...permission_catalog_1.AUTH_PERMISSIONS, ...permission_alias_catalog_1.AUTH_ALIAS_GRANTS]);
function isValidGrant(grant) {
    return AUTH_GRANT_SET.has(grant);
}
