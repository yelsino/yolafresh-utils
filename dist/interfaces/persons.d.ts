import { CuentaBancaria, MedioPagoDigital, MetodoPago } from "./finanzas";
import { Entidad } from "./entidades";
export declare enum CargosPersonal {
    SECRETARIO = "SECRETARIO",
    ADMINISTRATIVO = "ADMINISTRATIVO",
    REPONEDOR = "REPONEDOR",
    CAJERO = "CAJERO",
    VENDEDOR = "VENDEDOR"
}
/**
 * Interfaz para Personal del sistema
 *
 * @description Representa a un trabajador de la empresa
 * Extiende de Entidad para integrarse con el sistema de usuarios y roles
 */
export interface Personal extends Entidad {
    tipo: "Personal";
    nombres: string;
    cargo: CargosPersonal;
    dni: string;
    celular: string;
    direccion: string;
    /** Área o departamento donde trabaja */
    area?: string;
    /** Salario o información salarial (opcional) */
    salario?: number;
    /** Fecha de contratación */
    fechaContratacion: Date;
    /** Supervisor directo (ID de otro Personal) */
    supervisorId?: string;
    /** Horario de trabajo */
    horarioTrabajo?: HorarioTrabajo;
    /** Información de emergencia */
    contactoEmergencia?: ContactoEmergencia;
}
/**
 * Horario de trabajo del personal
 */
export interface HorarioTrabajo {
    /** Hora de entrada (formato HH:MM) */
    horaEntrada: string;
    /** Hora de salida (formato HH:MM) */
    horaSalida: string;
    /** Días de trabajo */
    diasTrabajo: DiaSemana[];
    /** Descansos durante el día */
    descansos?: Descanso[];
}
/**
 * Días de la semana
 */
export declare enum DiaSemana {
    LUNES = "lunes",
    MARTES = "martes",
    MIERCOLES = "miercoles",
    JUEVES = "jueves",
    VIERNES = "viernes",
    SABADO = "sabado",
    DOMINGO = "domingo"
}
/**
 * Descanso durante la jornada laboral
 */
export interface Descanso {
    /** Hora de inicio del descanso */
    horaInicio: string;
    /** Hora de fin del descanso */
    horaFin: string;
    /** Descripción del descanso */
    descripcion: string;
}
/**
 * Contacto de emergencia
 */
export interface ContactoEmergencia {
    /** Nombre del contacto */
    nombre: string;
    /** Teléfono del contacto */
    telefono: string;
    /** Relación con el empleado */
    relacion: string;
}
/**
 * Interfaz para Cliente del sistema
 *
 * @description Representa a una persona que compra en la tienda
 * Extiende de Entidad para integrarse con el sistema de usuarios y roles
 */
export interface Cliente extends Entidad {
    tipoEntidad: "Cliente";
    nombres: string;
    apellidos?: string;
    celular: string;
    correo: string;
    dni: string;
    direccion: string;
    pseudonimo: string;
    /** Créditos pendientes de pago */
    creditosPendientes?: number;
    /** Límite de crédito autorizado */
    limiteCredito?: number;
    /** Historial de compras (IDs de ventas) */
    historialCompras: string[];
    /** Fecha de última compra */
    fechaUltimaCompra?: Date;
    /** Total gastado históricamente */
    totalGastado: number;
    /** Descuento especial asignado (porcentaje) */
    descuentoEspecial?: number;
    /** Categoría del cliente */
    categoriaCliente: CategoriaCliente;
    /** Preferencias del cliente */
    preferencias?: PreferenciasCliente;
    /** Información de facturación */
    facturacion?: InformacionFacturacion;
}
export interface PreferenciasCliente {
    /** Método de pago preferido */
    metodoPagoPreferido?: string;
    /** Horario preferido para compras */
    horarioPreferido?: string;
    /** Productos favoritos */
    productosFavoritos: string[];
    /** Recibir promociones por email */
    recibirPromociones: boolean;
    /** Recibir notificaciones por WhatsApp */
    notificacionesWhatsApp: boolean;
}
/**
 * Información de facturación del cliente
 */
export interface InformacionFacturacion {
    /** Razón social (para empresas) */
    razonSocial?: string;
    /** RUC (para empresas) */
    ruc?: string;
    /** Dirección fiscal */
    direccionFiscal: string;
    /** Email para envío de facturas */
    emailFacturacion: string;
}
export interface ValuesPersonals {
    personalId: string;
    personalName: string;
    metodoPago: MetodoPago;
    monto: number;
}
/**
 * Interfaz para Proveedor del sistema
 *
 * @description Representa a un socio comercial que suministra productos
 * Extiende de Entidad para integrarse con el sistema de usuarios y roles
 */
export interface Proveedor extends Entidad {
    tipo: "Proveedor";
    nombre: string;
    razonSocial: string;
    ruc: string;
    telefonos: string[];
    email: string;
    direccion: string;
    ubicacion?: string;
    categoriaProveedor?: string;
    /** Cuentas bancarias del proveedor */
    cuentasBancarias: CuentaBancaria[];
    /** Medios de pago digital aceptados */
    mediosPagoDigital?: MedioPagoDigital[];
    /** Productos que suministra (IDs de productos) */
    productosSuministrados: string[];
    /** Condiciones de pago */
    condicionesPago: CondicionesPago;
    /** Tiempo de entrega promedio (en días) */
    tiempoEntregaDias: number;
    /** Calificación del proveedor (1-5) */
    calificacion?: number;
    /** Notas sobre el proveedor */
    notas?: string;
    /** Contacto principal */
    contactoPrincipal: ContactoProveedor;
    /** Contactos adicionales */
    contactosAdicionales?: ContactoProveedor[];
    /** Estado de la relación comercial */
    estadoRelacion: EstadoRelacionProveedor;
}
/**
 * Condiciones de pago del proveedor
 */
export interface CondicionesPago {
    /** Días de crédito otorgados */
    diasCredito: number;
    /** Descuento por pronto pago */
    descuentoProntoPago?: number;
    /** Días para descuento por pronto pago */
    diasDescuentoProntoPago?: number;
    /** Monto mínimo de pedido */
    montoMinimoPedido?: number;
    /** Forma de pago preferida */
    formaPagoPreferida: string;
}
/**
 * Contacto del proveedor
 */
export interface ContactoProveedor {
    /** Nombre del contacto */
    nombre: string;
    /** Cargo del contacto */
    cargo: string;
    /** Teléfono del contacto */
    telefono: string;
    /** Email del contacto */
    email: string;
    /** Indica si es el contacto principal */
    esPrincipal: boolean;
}
/**
 * Estado de la relación comercial con el proveedor
 */
export declare enum EstadoRelacionProveedor {
    ACTIVO = "activo",
    INACTIVO = "inactivo",
    SUSPENDIDO = "suspendido",
    EN_EVALUACION = "en_evaluacion",
    BLOQUEADO = "bloqueado"
}
