import type {
  AuthPermission,
  PermissionDefinition,
  PermissionCriticidad,
} from "../contracts/auth-permission.contract";
import { AUTH_PERMISSIONS } from "../catalogs/permission.catalog";

const CRITICIDAD_POR_ACCION: Record<string, PermissionCriticidad> = {
  ver: "low",
  crear: "medium",
  exportar: "medium",
  editar: "high",
  editar_imagen: "high",
  asignar: "high",
  aprobar: "high",
  anular: "high",
  activar: "high",
  desactivar: "high",
  cerrar: "high",
  abrir: "high",
  global: "critical",
  enrolar: "high",
  revocar: "critical",
  configurar: "high",
  actualizar: "high",
  enviar: "high",
  confirmar: "high",
  abandonar: "high",
  liberar_incidencia: "critical",
  cobrar: "critical",
  configurar_redondeo: "high",
  administrar: "critical",
  recibir: "high",
  cancelar: "critical",
};

const PERMISSION_METADATA_OVERRIDES: Partial<
  Record<AuthPermission, Partial<PermissionDefinition>>
> = {
  "sistema:admin:global": {
    criticidad: "critical",
    auditable: true,
    requiresActiveSession: true,
    uiVisible: false,
  },
  "iam:usuario:activar": {
    criticidad: "critical",
  },
  "iam:usuario:desactivar": {
    criticidad: "critical",
  },
  "iam:rol:asignar": {
    criticidad: "critical",
  },
  "iam:dispositivo:aprobar": {
    criticidad: "critical",
  },
  "caja:movimiento:anular": {
    criticidad: "critical",
  },
  "ventas:venta:anular": {
    criticidad: "critical",
  },
  "ventas:pedido:anular": {
    criticidad: "critical",
  },
  "inventario:ajuste:aprobar": {
    criticidad: "critical",
  },
  "inventario:almacen:administrar": {
    criticidad: "critical",
  },
  "inventario:politica:administrar": {
    criticidad: "critical",
  },
  "inventario:merma:aprobar": {
    criticidad: "critical",
  },
  "inventario:transferencia:cancelar": {
    criticidad: "critical",
  },
  "restaurante:sesion:liberar_incidencia": {
    criticidad: "critical",
  },
  "restaurante:cuenta:cobrar": {
    criticidad: "critical",
  },
};

function buildPermissionDefinition(id: AuthPermission): PermissionDefinition {
  const [modulo, recurso, accion] = id.split(":");
  const override = PERMISSION_METADATA_OVERRIDES[id] ?? {};

  return {
    id,
    modulo,
    recurso,
    accion,
    criticidad: CRITICIDAD_POR_ACCION[accion] ?? "medium",
    requiresActiveSession: true,
    auditable: true,
    uiVisible: true,
    ...override,
  };
}

export const PERMISSION_METADATA = Object.freeze(
  AUTH_PERMISSIONS.reduce<Record<AuthPermission, PermissionDefinition>>(
    (acc, permission) => {
      acc[permission] = buildPermissionDefinition(permission);
      return acc;
    },
    {} as Record<AuthPermission, PermissionDefinition>,
  ),
);
