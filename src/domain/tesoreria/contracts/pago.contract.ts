import { MetodoPago } from "../../finanzas/contracts/finanzas.contract";

export enum EstadoPagoCapturaEnum {
  CAPTURADO = "CAPTURADO",     // llegó evidencia desde sistema externo
  CONFIRMADO = "CONFIRMADO",   // usuario valida que evidencia es real
  APLICADO = "APLICADO",       // evidencia se relacionó a una venta
  RECHAZADO = "RECHAZADO",     // evidencia no corresponde al flujo esperado
  ANULADO = "ANULADO",         // evidencia quedó sin efecto operativo
}

export interface Pago {
  // === IDENTIDAD ===
  id: string;
  clienteId?: string;
  movimientoCajaId?: string;
  // === RELACIÓN CON VENTA ===
  // Pago puede quedar sin venta asociada. Eso es válido cuando la evidencia llega
  // tarde, no se pudo usar a tiempo o no corresponde a una venta concreta.
  ventaId?: string;                 // se asigna SOLO cuando evidencia se aplica
  montoAplicado?: number;           // cuánto de este pago se usó
  fechaAplicacion?: number;

  // === ORIGEN FINANCIERO ===
  // La evidencia nace en sistema externo de captura y luego se valida en POS.
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
  conciliado?: boolean;
  conciliadoAt?: number;

  // === CONTEXTO POS ===
  dispositivoId?: string;
  cajaId?: string;
  turnoCajaId?: string;

  // === TÉCNICO ===
  fechaCaptura: number;
  rawMensaje?: string;
}
