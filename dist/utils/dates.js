"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatToShortDate = formatToShortDate;
function formatToShortDate(fecha) {
    // Validar que el argumento sea una instancia de Date y que sea una fecha válida
    if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
        throw new Error("La fecha proporcionada no es válida.");
    }
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const nombreMes = meses[fecha.getMonth()];
    const dia = fecha.getDate();
    const año = fecha.getFullYear().toString().slice(-2); // Últimos dos dígitos del año
    return `${nombreMes} ${dia},${año}`;
}
