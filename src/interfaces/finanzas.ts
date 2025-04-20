
export type MetodoPago = 'DIGITAL' | 'EFECTIVO'
export type EstadoEgreso = 'ACTIVO' | 'ANULADO'
// export type TypeFinanza = 'Egreso' | 'Ingreso' | 'Credito' | 'Cambio'
export type TypeFinanza = 'Egreso' | 'Ingreso' | 'Credito' | 'Cambio' | 'Anulacion'

export interface Egreso {
  id?: string;
  monto: number;
  fechaRegistro: Date
  tipoEgreso: TipoEgreso
  quienRegistroId: string;
  quienHizoGastoId: string[] | string;
  type: TypeFinanza;
  detalle?: string;
  estado: EstadoEgreso;
  metodoPago: MetodoPago
}

// Ingresos
export type TipoIngreso = 'CREDITO' | 'AL_CONTADO'
export type OrigenIngreso = "VENTA_DIA" | "RETORNO" | "PRESTAMO" | "APORTE"
export type EstadoIngreso = 'PAGADO' | 'ANULADO' | 'PENDIENTE'

export interface Abono {
  id?: string;
  monto: number;
  fechaRegistro: Date
  quienHizoAbonoId: string[] | string;
}

export interface Ingreso {
  id?: string;
  quienRegistroId: string;
  fechaRegistro: Date
  fechaActualizacion: Date
  monto: number;
  numeroRegistroDia: number;
  codigoOperacion: string;
  numeroOperacion: number;
  clienteId?: string;
  tipoIngreso: TipoIngreso
  origenIngreso?: OrigenIngreso
  estado: EstadoIngreso;
  metodoPago?: MetodoPago;
  abonos?: Abono[];
  evidencias?: string[];
  type: TypeFinanza
}

export type EstadoCaja = 'ABIERTA' | 'CERRADA' | 'DEFICIT'

  export interface Caja {
    saldo: number;
    saldoEfectivo: number;
    saldoDigital: number; 
    estado: EstadoCaja; 
  }

  export interface Cambio {
    id?: string;
    monto: number;
    deMetodoPago: MetodoPago;
    aMetodoPago: MetodoPago;
    fechaRegistro: Date
    fechaActualizacion: Date
  }

  export interface MovimientoCaja {
    id?: string;
    tipoMovimiento: TypeFinanza; 
    monto: number; 
    metodoPago: MetodoPago; 
    saldoEfectivo: number; 
    saldoDigital: number; 
    saldoTotal: number; 
    fechaRegistro: Date; 
    codigoTransaccion: string; 
    finanzaType: TypeFinanza
  }

  export interface CuentaBancaria {
    id?: string;
    entidad: string;
    numeroCuenta: string;
    tipoCuenta?: string;
  }
  
  export type MedioPagoDigital = 'YAPE' | 'PLIN' | 'TUNKI' | 'OTRO';


export type TipoEgreso =
  | "MERCADERIA"            // Compra de productos para la venta (muy frecuente)
  | "FLETE"                 // Transporte de mercadería
  | "PASAJES"               // Movilidad del personal o jefes
  | "COMIDAS"               // Alimentación de trabajadores o personal
  | "SUELDOS"               // Pago a trabajadores
  | "VIÁTICOS"              // Dinero entregado para viajes de compra
  | "SERVICIOS_BÁSICOS"     // Agua, luz, internet, teléfono
  | "ALQUILER"              // Pago de renta del local
  | "INSUMOS_OFICINA"       // Papel, lapiceros, cuadernos
  | "HERRAMIENTAS"          // Equipos para el negocio (balanzas, cuchillos)
  | "MANTENIMIENTO"         // Reparaciones del local o equipo
  | "PUBLICIDAD"            // Anuncios, marketing, redes sociales
  | "GASTOS_PERSONALES"     // Dinero del negocio usado para fines personales
  | "PAGO_DEUDAS"           // Pago de préstamos o créditos adquiridos
  | "IMPUESTOS"             // IGV, renta, otros tributos
  | "PERDIDAS_INVENTARIO"   // Productos dañados, vencidos o pérdidas desconocidas
  | "PERDIDAS_ROBO"         // Dinero o mercadería robada
  | "GASTOS_ADMINISTRATIVOS" // Gastos en trámites, permisos, licencias
  | "CAPACITACIÓN"          // Cursos o entrenamientos para empleados o jefes
  | "TECNOLOGÍA"            // Compra de software, apps, hardware
  | "HONORARIOS" // Contadores, abogados, asesores
  | "MULTAS_Y_SANCIONES"    // Pagos por infracciones o multas
  | "DONACIONES"            // Aportes a eventos o caridad
  | "INTERESES_FINANCIEROS" // Intereses de préstamos, financiamiento o créditos
  | "REMODELACIÓN"          // Construcciones o mejoras del local
  | "OTROS";               // Cualquier otro egreso no clasificado