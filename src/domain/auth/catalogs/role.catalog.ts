import type { RoleDefinition } from "../contracts/auth-role.contract";

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
] as const;

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
        "compras:compra:ver",
        "reportes:ventas:*",
        "caja:turno:ver_todos",
        "finanzas:reporte:ver",
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
      grants: ["inventario:*", "compras:compra:recepcionar"],
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
      grants: ["configuracion:sistema:*", "iam:usuario:ver"],
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
      ],
    },
  });
