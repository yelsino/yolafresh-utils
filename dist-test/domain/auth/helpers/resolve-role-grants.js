"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRoleGrants = resolveRoleGrants;
const expand_role_grants_1 = require("./expand-role-grants");
function resolveRoleGrants(roleIds) {
    return (0, expand_role_grants_1.expandRoleGrants)(roleIds);
}
