"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionDefinition = getPermissionDefinition;
const permission_metadata_catalog_1 = require("../metadata/permission-metadata.catalog");
function getPermissionDefinition(permission) {
    return permission_metadata_catalog_1.PERMISSION_METADATA[permission];
}
