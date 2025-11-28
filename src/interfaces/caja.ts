export type EstadoCaja =
  | 'PENDIENTE_APERTURA'
  | 'ABIERTA'
  | 'ARQUEO'
  | 'PENDIENTE_CIERRE'
  | 'CERRADA'
  | 'DEFICIT';

export interface Caja {
  id: string;
  nombre?: string;

  usuarioActivoId?: string;     // Quién está operando la caja ahora
  sucursalId?: string;          // Opcional si hay varias tiendas

  saldoEfectivo: number;
  saldoDigital: number;

  estado: EstadoCaja;

  createdAt: Date;
  updatedAt: Date;
}


export interface AperturaCaja {
  id: string;

  cajaId: string;             // Caja que se abre
  usuarioId: string;          // Quién abre
  montoEfectivoInicial: number;
  montoDigitalInicial: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface CierreCaja {
  id: string;

  cajaId: string;              // Caja que se cierra
  usuarioId: string;           // Quién cierra

  montoEfectivoFinal: number;
  montoDigitalFinal: number;
  montoTotalFinal: number;

  createdAt: Date;
  updatedAt: Date;
}


export interface ArqueoCaja {
  id: string;

  cajaId: string;
  usuarioId: string;

  conteoEfectivo: number;      // Cuánto dinero contó físicamente
  conteoDigital: number;       // Cuánto dinero verificó digitalmente
  diferencia: number;          // sistema - conteo

  createdAt: Date;
  updatedAt: Date;
}
