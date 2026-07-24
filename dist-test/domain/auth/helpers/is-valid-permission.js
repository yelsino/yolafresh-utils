"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPermission = isValidPermission;
const permission_catalog_1 = require("../catalogs/permission.catalog");
const AUTH_PERMISSION_SET = new Set(permission_catalog_1.AUTH_PERMISSIONS);
function isValidPermission(permission) {
    return AUTH_PERMISSION_SET.has(permission);
}
