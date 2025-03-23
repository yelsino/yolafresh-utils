"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carrito = void 0;
// Simple store implementation
class Store {
    constructor(initialState) {
        this.state = initialState;
        this.initialState = initialState;
    }
    get() {
        return this.state;
    }
    set(newState) {
        this.state = newState;
    }
    reset() {
        this.state = this.initialState;
    }
}
// Default empty cart
const defaultCarrito = {
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
exports.carrito = new Store(defaultCarrito);
