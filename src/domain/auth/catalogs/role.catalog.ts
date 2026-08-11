import type { RoleDefinition } from "../contracts/auth-role.contract";
import type { PerfilNegocioConfigEmpresa } from "../../shared/kernel/empresa.contract";

export const AUTH_BASE_ROLE_IDS = [
  "admin",
  "supervisor",
  "cajero",
  "ventas",
  "inventario",
  "compras",
  "finanzas",
  "contador",
  "auditor",
  "soporte-tecnico",
  "solo-lectura",
  "cliente",
  "gastronomia-anfitrion",
  "gastronomia-mesero",
  "gastronomia-capitan-salon",
  "gastronomia-cocinero",
  "gastronomia-jefe-cocina",
  "gastronomia-barra",
] as const;

const SOLO_GASTRONOMIA = ["GASTRONOMIA"] as const;

export const AUTH_ROLE_DEFINITIONS: Readonly<Record<(typeof AUTH_BASE_ROLE_IDS)[number], RoleDefinition>> =
  Object.freeze({
    admin: {
      id: "admin",
      nombre: "ADMIN",
      descripcion: "Administrador global del tenant",
      grants: ["*"],
      flags: {
        isSystemAdmin: true,
      },
    },
    supervisor: {
      id: "supervisor",
      nombre: "SUPERVISOR",
      descripcion: "Supervisa operación comercial e inventario",
      grants: [
        "ventas:*",
        "inventario:stock:ver",
        "inventario:conteo:*",
        "inventario:ajuste:*",
        "productos:producto:editar_imagen",
        "compras:compra:ver",
        "reportes:ventas:*",
        "caja:turno:ver_todos",
        "finanzas:reporte:ver",
        "restaurante:salon:ver",
        "restaurante:sesion:*",
        "restaurante:pedido:*",
        "restaurante:ronda:*",
        "restaurante:entrega:*",
        "restaurante:preparacion:*",
        "restaurante:preparacion_cocina:*",
        "restaurante:preparacion_barra:*",
        "restaurante:cuenta:*",
      ],
    },
    cajero: {
      id: "cajero",
      nombre: "CAJERO",
      descripcion: "Caja operativa y ventas de mostrador",
      grants: [
        "ventas:venta:crear",
        "ventas:venta:ver",
        "ventas:cliente:asignar",
        "caja:turno:abrir",
        "caja:turno:cerrar",
        "caja:turno:ver_propio",
        "caja:movimiento:ver",
        "restaurante:cuenta:*",
      ],
    },
    ventas: {
      id: "ventas",
      nombre: "VENTAS",
      descripcion: "Operación comercial de cotizaciones, pedidos y ventas",
      grants: ["ventas:*", "reportes:ventas:ver"],
    },
    inventario: {
      id: "inventario",
      nombre: "INVENTARIO",
      descripcion: "Control de stock, conteos, ajustes y transferencias",
      grants: [
        "inventario:*",
        "productos:producto:editar_imagen",
        "compras:compra:recepcionar",
      ],
    },
    compras: {
      id: "compras",
      nombre: "COMPRAS",
      descripcion: "Abastecimiento y flujo de compras",
      grants: ["compras:*", "inventario:transferencia:ver"],
    },
    finanzas: {
      id: "finanzas",
      nombre: "FINANZAS",
      descripcion: "Cuentas cliente, caja histórica y reportes financieros",
      grants: [
        "finanzas:*",
        "reportes:finanzas:ver",
        "caja:turno:ver_todos",
        "caja:movimiento:ver",
        "restaurante:salon:ver",
        "restaurante:pedido:ver",
        "restaurante:preparacion:ver",
        "restaurante:cuenta:ver",
      ],
    },
    contador: {
      id: "contador",
      nombre: "CONTADOR",
      descripcion: "Consulta financiera, auditoría y exportación de reportes",
      grants: [
        "finanzas:*",
        "reportes:*",
        "auditoria:accion:ver",
        "auditoria:accion:exportar",
      ],
    },
    auditor: {
      id: "auditor",
      nombre: "AUDITOR",
      descripcion: "Revisión de auditoría sin operación transaccional",
      grants: [
        "reportes:*",
        "auditoria:*",
        "ventas:venta:ver",
        "compras:compra:ver",
        "inventario:stock:ver",
        "caja:movimiento:ver",
      ],
    },
    "soporte-tecnico": {
      id: "soporte-tecnico",
      nombre: "SOPORTE_TECNICO",
      descripcion: "Configuración y soporte técnico operativo",
      grants: [
        "configuracion:sistema:*",
        "iam:usuario:ver",
        "iam:dispositivo:*",
        "restaurante:ambiente:*",
        "restaurante:mesa:*",
        "restaurante:estacion:*",
        "restaurante:carta:*",
      ],
    },
    "solo-lectura": {
      id: "solo-lectura",
      nombre: "SOLO_LECTURA",
      descripcion: "Consulta autorizada sin modificar registros",
      grants: [
        "ventas:cotizacion:ver",
        "ventas:pedido:ver",
        "ventas:venta:ver",
        "compras:compra:ver",
        "inventario:stock:ver",
        "finanzas:cuenta_cliente:ver",
        "finanzas:reporte:ver",
        "caja:movimiento:ver",
        "restaurante:salon:ver",
        "restaurante:pedido:ver",
        "restaurante:preparacion:ver",
        "restaurante:cuenta:ver",
      ],
    },
    cliente: {
      id: "cliente",
      nombre: "CLIENTE",
      descripcion: "Usuario cliente autenticado, sin privilegios del ERP por defecto",
      grants: [],
    },
    "gastronomia-anfitrion": {
      id: "gastronomia-anfitrion",
      nombre: "ANFITRION",
      descripcion: "Recepción, disponibilidad de salón y apertura de atenciones",
      grants: [
        "restaurante:salon:ver",
        "restaurante:mesa:ver",
        "restaurante:sesion:abrir",
        "restaurante:sesion:abandonar",
      ],
      availability: { verticales: SOLO_GASTRONOMIA },
    },
    "gastronomia-mesero": {
      id: "gastronomia-mesero",
      nombre: "MOZO_MESERO",
      descripcion: "Salón, pedido, rondas y entrega a mesa",
      grants: [
        "restaurante:salon:ver",
        "restaurante:mesa:ver",
        "restaurante:sesion:abrir",
        "restaurante:sesion:abandonar",
        "restaurante:sesion:cerrar",
        "restaurante:pedido:*",
        "restaurante:ronda:enviar",
        "restaurante:entrega:confirmar",
        "restaurante:cuenta:ver",
      ],
      availability: { verticales: SOLO_GASTRONOMIA },
    },
    "gastronomia-capitan-salon": {
      id: "gastronomia-capitan-salon",
      nombre: "CAPITAN_SALON",
      descripcion: "Supervisión de atenciones e incidencias del salón",
      grants: [
        "restaurante:salon:ver",
        "restaurante:mesa:ver",
        "restaurante:sesion:*",
        "restaurante:pedido:*",
        "restaurante:ronda:enviar",
        "restaurante:entrega:confirmar",
        "restaurante:cuenta:ver",
      ],
      availability: { verticales: SOLO_GASTRONOMIA },
    },
    "gastronomia-cocinero": {
      id: "gastronomia-cocinero",
      nombre: "COCINERO",
      descripcion: "Preparación de comandas asignadas a estaciones de cocina",
      grants: ["restaurante:preparacion_cocina:*"],
      availability: { verticales: SOLO_GASTRONOMIA },
    },
    "gastronomia-jefe-cocina": {
      id: "gastronomia-jefe-cocina",
      nombre: "JEFE_COCINA",
      descripcion: "Supervisión de preparación en todas las estaciones",
      grants: [
        "restaurante:preparacion:*",
        "restaurante:preparacion_cocina:*",
        "restaurante:preparacion_barra:*",
      ],
      availability: { verticales: SOLO_GASTRONOMIA },
    },
    "gastronomia-barra": {
      id: "gastronomia-barra",
      nombre: "BARRA",
      descripcion: "Preparación de comandas asignadas a estaciones de barra",
      grants: ["restaurante:preparacion_barra:*"],
      availability: { verticales: SOLO_GASTRONOMIA },
    },
  });

export const listarRolesAuthDisponibles = (
  perfil?: PerfilNegocioConfigEmpresa | null,
): RoleDefinition[] => {
  const vertical = perfil?.vertical ?? "RETAIL";
  const capacidades = new Set(perfil?.capacidades ?? []);

  return Object.values(AUTH_ROLE_DEFINITIONS).filter((definition) => {
    const availability = definition.availability;
    if (availability?.verticales && !availability.verticales.includes(vertical)) {
      return false;
    }
    if (
      availability?.requiereAlgunaCapacidad?.length &&
      !availability.requiereAlgunaCapacidad.some((capacidad) =>
        capacidades.has(capacidad),
      )
    ) {
      return false;
    }
    return true;
  });
};
