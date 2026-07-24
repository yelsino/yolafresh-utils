"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllPermissions = listAllPermissions;
const permission_catalog_1 = require("../catalogs/permission.catalog");
function listAllPermissions() {
    return [...permission_catalog_1.AUTH_PERMISSIONS];
}
