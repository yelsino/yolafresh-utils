import { Carrito } from "@interfaces/index";

// Simple store implementation
class Store<T> {
  private state: T;
  private initialState: T;

  constructor(initialState: T) {
    this.state = initialState;
    this.initialState = initialState;
  }

  get(): T {
    return this.state;
  }

  set(newState: T): void {
    this.state = newState;
  }

  reset(): void {
    this.state = this.initialState;
  }
}

// Default empty cart
const defaultCarrito: Carrito = {
  items: [],
  total: 0,
  cantidad: 0,
  subTotal: 0,
  envio: 0,
  pedidoId: "",
  usuario: {
    id: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    correo: "",
    email: "",
    rol: "",
    celular: "",
    foto: "",
    tipoDocumento: "",
    document: "",
    idExterno: ""
  },
  direccion: {
    id: "",
    nombre: "",
    referencia: "",
    coordenadas: "",
    latitud: 0,
    longitud: 0
  },
  formaEntrega: "tienda",
  horaEntrega: {
    hora: "12",
    minuto: "00",
    periodo: "PM"
  }
};

// Export cart store instance
export const carrito = new Store<Carrito>(defaultCarrito);
