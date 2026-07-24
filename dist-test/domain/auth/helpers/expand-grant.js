"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandGrant = expandGrant;
const permission_alias_catalog_1 = require("../catalogs/permission-alias.catalog");
const permission_catalog_1 = require("../catalogs/permission.catalog");
function expandGrant(grant) {
    if (permission_catalog_1.AUTH_PERMISSIONS.includes(grant)) {
        return [grant];
    }
    const expanded = permission_alias_catalog_1.AUTH_PERMISSION_ALIASES[grant];
    return expanded ? [...expanded] : [];
}
