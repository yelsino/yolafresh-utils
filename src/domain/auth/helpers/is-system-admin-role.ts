import { getRoleDefinition } from "./get-role-definition";

export function isSystemAdminRole(roleIds: readonly string[]): boolean {
  return roleIds.some((roleId) => {
    const definition = getRoleDefinition(roleId);
    return definition?.flags?.isSystemAdmin || definition?.grants.includes("*");
  });
}
