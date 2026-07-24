"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCatalogVersion = getCatalogVersion;
const auth_catalog_version_1 = require("../version/auth-catalog.version");
function getCatalogVersion() {
    return auth_catalog_version_1.AUTH_CATALOG_VERSION;
}
