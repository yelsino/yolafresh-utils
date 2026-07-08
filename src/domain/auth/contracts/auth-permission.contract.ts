import type { AUTH_PERMISSIONS } from "../catalogs/permission.catalog";

export type AuthPermission = (typeof AUTH_PERMISSIONS)[number];

export type PermissionCriticidad = "low" | "medium" | "high" | "critical";

export type PermissionDefinition = {
  id: AuthPermission;
  modulo: string;
  recurso: string;
  accion: string;
  criticidad: PermissionCriticidad;
  requiresActiveSession?: boolean;
  auditable?: boolean;
  uiVisible?: boolean;
};
