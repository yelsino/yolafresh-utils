"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSystemAdminRole = isSystemAdminRole;
const get_role_definition_1 = require("./get-role-definition");
function isSystemAdminRole(roleIds) {
    return roleIds.some((roleId) => {
        var _a;
        const definition = (0, get_role_definition_1.getRoleDefinition)(roleId);
        return ((_a = definition === null || definition === void 0 ? void 0 : definition.flags) === null || _a === void 0 ? void 0 : _a.isSystemAdmin) || (definition === null || definition === void 0 ? void 0 : definition.grants.includes("*"));
    });
}
