import { MetodoPago } from "./finanzas";

export enum EstadoPagoCapturaEnum {
  CAPTURADO = "CAPTURADO",     // llegó la notificación
  CONFIRMADO = "CONFIRMADO",   // vendedor valida que es real
  APLICADO = "APLICADO",       // impactó una venta
  RECHAZADO = "RECHAZADO",     // no corresponde
  ANULADO = "ANULADO",         // se deshizo
}

export interface Pago {
  // === IDENTIDAD ===
  id: string;
  // === RELACIÓN CON VENTA ===
  ventaId?: string;                 // se asigna SOLO cuando se aplica
  montoAplicado?: number;           // cuánto de este pago se usó
  fechaAplicacion?: number;

  // === ORIGEN FINANCIERO ===
  proveedor: "YAPE" | "PLIN" | "EFECTIVO" | "TARJETA" | "OTRO";
  tipoMedio: MetodoPago;
  idTransaccionProveedor?: string;
  emisorReferencia?: string;
  nombrePaquete?: string;
  tituloNotificacion?: string;
  origen?: string;

  // === MONTOS ===
  montoRecibido: number;             // lo que pagó el cliente
  montoEsperado?: number;            // lo que esperaba el POS
  moneda: "PEN" | "USD";

  // === ESTADO ===
  estado: EstadoPagoCapturaEnum;

  // === DECISIÓN HUMANA ===
  usuarioConfirmaId?: string;
  fechaConfirmacion?: number;

  // === CONTEXTO POS ===
  dispositivoId?: string;
  cajaId?: string;
  turnoCajaId?: string;

  // === TÉCNICO ===
  fechaCaptura: number;
  rawMensaje?: string;
}
