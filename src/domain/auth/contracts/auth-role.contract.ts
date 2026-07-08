import type { AUTH_BASE_ROLE_IDS } from "../catalogs/role.catalog";
import type { AuthGrant } from "./auth-grant.contract";
import type { AuthPermission } from "./auth-permission.contract";
import type { AuthScope } from "./auth-scope.contract";

export type AuthBaseRoleId = (typeof AUTH_BASE_ROLE_IDS)[number];

export type RoleId = AuthBaseRoleId | (string & {});

export type AuthRoleFlags = {
  isSystemAdmin?: boolean;
};

export type RoleDefinition = {
  id: RoleId;
  nombre: string;
  descripcion?: string;
  grants: AuthGrant[];
  flags?: AuthRoleFlags;
};

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
  grants: AuthGrant[];
  permissionsExpanded?: AuthPermission[];
  flags?: AuthRoleFlags;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SesionContexto {
  usuarioId: string;
  entidadActivaId?: string;
  entidadActivaTipo?: string;
  rolesActivos: Rol[];
  permissionsExpanded: AuthPermission[];
  scopes?: AuthScope[];
  inicioSesion: Date;
  ultimaActividad: Date;
  sessionId?: string;
}
