export enum TipoTarjetaVirtual {
  QR_PAGO = "qr_pago",
  QR_WIFI = "qr_wifi",
  DATOS_BANCARIOS = "datos_bancarios",
  CONTACTO = "contacto",
  HORARIO = "horario",
  PROMOCION = "promocion",
  INFORMATIVA = "informativa",
  INSTRUCCION = "instruccion",
  OTRO = "otro",
}

export type EstadoTarjetaVirtual = "activo" | "inactivo";

export interface TarjetaVirtual {
  id: string;
  type: "tarjeta_virtual";
  nombre: string;
  tipoTarjeta: TipoTarjetaVirtual;
  imagen: string;
  estado: EstadoTarjetaVirtual;
  orden?: number;
  createdAt: number;
  updatedAt: number;
}
