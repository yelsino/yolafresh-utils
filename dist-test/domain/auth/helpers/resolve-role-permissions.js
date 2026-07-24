"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRolePermissions = resolveRolePermissions;
const expand_grants_1 = require("./expand-grants");
const expand_role_grants_1 = require("./expand-role-grants");
function resolveRolePermissions(roleIds) {
    return (0, expand_grants_1.expandGrants)((0, expand_role_grants_1.expandRoleGrants)(roleIds));
}
