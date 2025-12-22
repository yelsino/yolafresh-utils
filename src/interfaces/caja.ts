export type EstadoCaja =
  | 'PENDIENTE_APERTURA'
  | 'ABIERTA'
  | 'ARQUEO'
  | 'PENDIENTE_CIERRE'
  | 'CERRADA'
  | 'DEFICIT';


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
  usuarioId: string;
  deviceId: string;            // clave offline

  estado: EstadoTurno;

  // Apertura
  montoEfectivoInicial: number;
  montoDigitalInicial: number;

  // Sistema (calculado)
  montoEfectivoEsperado: number;
  montoDigitalEsperado: number;

  // Arqueo / Cierre
  montoEfectivoContado?: number;
  montoDigitalContado?: number;
  diferencia?: number;
  motivoDiferencia?: string;

  inicioAt: Date;
  finAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type TipoMovimientoCaja =
  | 'INGRESO'
  | 'EGRESO';

export type OrigenMovimiento =
  | 'VENTA'
  | 'PAGO'
  | 'RETIRO'
  | 'GASTO'
  | 'AJUSTE';

  