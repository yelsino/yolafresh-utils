"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertirMedidaAUnidades = void 0;
const convertirMedidaAUnidades = (cantidad) => {
    const palabrasNumeros = {
        "un cuarto": 0.25,
        "1/4": 0.25,
        "tres cuartos": 0.75,
        "3/4": 0.75,
        medio: 0.5,
        media: 0.5,
        "1/2": 0.5,
        un: 1,
        una: 1,
        uno: 1,
        dos: 2,
        tres: 3,
        cuatro: 4,
        cinco: 5,
        seis: 6,
        siete: 7,
        ocho: 8,
        nueve: 9,
        diez: 10,
    };
    return palabrasNumeros[cantidad.toLowerCase()] || parseFloat(cantidad);
};
exports.convertirMedidaAUnidades = convertirMedidaAUnidades;
