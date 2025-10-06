export type MetodoPago = 'DIGITAL' | 'EFECTIVO' | 'TARJETA' | 'OTRO';
export type EstadoEgreso = 'ACTIVO' | 'ANULADO';
export type TypeFinanza = 'Egreso' | 'Ingreso' | 'Cambio' | 'Anulacion';
export interface Egreso {
    id?: string;
    monto: number;
    tipoEgreso: TipoEgreso;
    quienRegistroId: string;
    quienHizoGastoId: string[] | string;
    type: TypeFinanza;
    detalle?: string;
    estado: EstadoEgreso;
    metodoPago: MetodoPago;
    createdAt: Date;
    updatedAt: Date;
}
export type TipoIngreso = 'CREDITO' | 'AL_CONTADO';
export type OrigenIngreso = "VENTA_DIA" | "RETORNO" | "PRESTAMO" | "APORTE" | "COBRO_CREDITO";
export type EstadoIngreso = 'PAGADO' | 'ANULADO' | 'PENDIENTE';
export interface Abono {
    id?: string;
    monto: number;
    fechaRegistro: Date;
    quienHizoAbonoId: string[] | string;
}
/**
 * Representa un registro de ingreso financiero en el sistema
 *
 * @description Esta interfaz define la estructura completa de un ingreso,
 * incluyendo información de trazabilidad, métodos de pago y evidencias
 *
 * @example
 * ```typescript
 * const ingreso: Ingreso = {
 *   quienRegistroId: 'user-123',
 *   fechaRegistro: new Date(),
 *   fechaActualizacion: new Date(),
 *   monto: 150.50,
 *   numeroRegistroDia: 1,
 *   codigoOperacion: 'OP-001',
 *   numeroOperacion: 12345,
 *   tipoIngreso: TipoIngreso.CONTADO,
 *   estadiIngreso: EstadoIngreso.COMPLETADO,
 *   tipoFinanza: TypeFinanza.INGRESO_PAGADO
 * };
 * ```
 */
export interface Ingreso {
    /**
     * Identificador único del ingreso
     * @description Se genera automáticamente si no se proporciona
     */
    id?: string;
    /**
     * ID del usuario que registró este ingreso
     * @description Usado para trazabilidad y auditoría
     */
    quienRegistroId: string;
    /**
     * Fecha y hora cuando se registró el ingreso
     * @description Se establece automáticamente al crear el registro
     */
    createdAt: Date;
    /**
     * Fecha y hora de la última actualización
     * @description Se actualiza automáticamente en cada modificación
     */
    updatedAt: Date;
    /**
     * Monto total del ingreso
     * @description Valor en la moneda base del sistema (generalmente soles)
     * @minimum 0
     */
    monto: number;
    /**
     * Número secuencial del registro en el día
     * @description Usado para identificar el orden de registros diarios
     * @minimum 1
     */
    numeroRegistroDia: number;
    /**
     * Código único de la operación
     * @description Código alfanumérico para identificar la operación
     * @example "OP-001", "VT-2024-001"
     */
    codigoOperacion: string;
    /**
     * Número secuencial de la operación
     * @description Número único incremental para cada operación
     * @minimum 1
     */
    numeroOperacion: number;
    /**
     * ID del cliente asociado al ingreso (opcional)
     * @description Si se proporciona, vincula el ingreso con un cliente específico
     */
    clienteId?: string;
    /**
     * Tipo de ingreso según la forma de pago
     * @description Determina si es pago al contado o a crédito
     */
    tipoIngreso: TipoIngreso;
    /**
     * Origen o fuente del ingreso (opcional)
     * @description Especifica de dónde proviene el ingreso (venta, servicio, etc.)
     */
    origenIngreso?: OrigenIngreso;
    /**
     * Estado actual del ingreso
     * @description Indica el estado del procesamiento del ingreso
     */
    estadoIngreso: EstadoIngreso;
    /**
     * Método de pago utilizado (opcional)
     * @description Especifica cómo se realizó el pago (efectivo, tarjeta, etc.)
     */
    metodoPago?: MetodoPago;
    /**
     * Lista de abonos parciales (opcional)
     * @description Para ingresos a crédito, registra los pagos parciales
     */
    abonos?: Abono[];
    /**
     * URLs o referencias a evidencias del ingreso (opcional)
     * @description Fotos de recibos, vouchers, etc.
     */
    evidencias?: string[];
    /**
     * Clasificación financiera del documento
     * @description Determina si es un ingreso pagado o a crédito
     * @readonly Este valor no debe cambiar una vez establecido
     */
    tipoFinanza: TypeFinanza;
}
export type EstadoCaja = 'ABIERTA' | 'CERRADA' | 'DEFICIT';
export interface Caja {
    id: string;
    saldo: number;
    saldoEfectivo: number;
    saldoDigital: number;
    estado: EstadoCaja;
    createdAt: Date;
    updatedAt: Date;
}
export interface Cambio {
    id?: string;
    monto: number;
    deMetodoPago: MetodoPago;
    aMetodoPago: MetodoPago;
    fechaRegistro: Date;
    fechaActualizacion: Date;
}
export interface MovimientoCaja {
    id?: string;
    tipoMovimiento: TypeFinanza;
    monto: number;
    metodoPago: MetodoPago;
    saldoEfectivo: number;
    saldoDigital: number;
    saldoTotal: number;
    codigoTransaccion: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CuentaBancaria {
    id?: string;
    entidad: string;
    numeroCuenta: string;
    tipoCuenta?: string;
}
export type MedioPagoDigital = 'YAPE' | 'PLIN' | 'TUNKI' | 'OTRO';
export type TipoEgreso = "MERCADERIA" | "FLETE" | "PASAJES" | "COMIDAS" | "SUELDOS" | "VIÁTICOS" | "SERVICIOS_BÁSICOS" | "ALQUILER" | "INSUMOS_OFICINA" | "HERRAMIENTAS" | "MANTENIMIENTO" | "PUBLICIDAD" | "GASTOS_PERSONALES" | "PAGO_DEUDAS" | "IMPUESTOS" | "PERDIDAS_INVENTARIO" | "PERDIDAS_ROBO" | "GASTOS_ADMINISTRATIVOS" | "CAPACITACIÓN" | "TECNOLOGÍA" | "HONORARIOS" | "MULTAS_Y_SANCIONES" | "DONACIONES" | "INTERESES_FINANCIEROS" | "REMODELACIÓN" | "OTROS";
