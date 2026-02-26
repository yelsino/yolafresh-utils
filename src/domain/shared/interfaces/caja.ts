import { MetodoPago } from "./finanzas";


  export type TipoCaja = 'FIJA' | 'MOVIL' | 'DIGITAL';
export interface Caja {
  id: string;
  nombre: string;
  tipo: TipoCaja;
  sucursalId?: string;
  activa: boolean;
  createdAt: Date;
}

export type EstadoTurno =
  | 'ABIERTO'
  | 'ARQUEO'
  | 'CERRADO'
  | 'DEFICIT';

export interface TurnoCaja {
  id: string;

  cajaId: string;
  usuarioId: string;       // Cajero
  deviceId: string;

  estado: EstadoTurno;

  // Apertura
  montoEfectivoInicial: number;
  montoDigitalInicial: number;

  // Sistema
  montoEfectivoEsperado: number;
  montoDigitalEsperado: number;

  // Conteo
  montoEfectivoContado?: number;
  montoDigitalContado?: number;
  diferencia?: number;
  motivoDiferencia?: string;

  // 🔑 VALIDACIÓN
  validadoPorId?: string;        // 👈 SUPERVISOR
  validadoAt?: Date;
  observacionSupervisor?: string;

  inicioAt: Date;
  finAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type TipoMovimientoCaja =
  | 'INGRESO'
  | 'EGRESO';
export type SubtipoMovimientoCaja =
  | 'VENTA'
  | 'GASTO'
  | 'CAMBIO'
  | 'ANULACION'
  | 'AJUSTE';

export type OrigenMovimiento =
  | 'VENTA'
  | 'PAGO'
  | 'RETIRO'
  | 'GASTO'
  | 'AJUSTE';

export interface MovimientoCaja {
  id: string;

  turnoId: string;          // Turno activo
  cajaDestinoId: string;   // Caja física o digital

  tipo: TipoMovimientoCaja;       // INGRESO | EGRESO
  subtipo?: SubtipoMovimientoCaja; // VENTA | GASTO | CAMBIO | ANULACION

  monto: number;           // Siempre positivo
  metodoPago: MetodoPago;

  referenciaId?: string;   // ventaId | egresoId | ingresoId
  generadoPorId: string;

  createdAt: Date;
}

