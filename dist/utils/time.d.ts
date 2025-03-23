import { Hora } from "../interfaces/index";
/**
 * Formatea un objeto Hora a un formato legible
 * @param hora - Objeto Hora con hora, minuto y periodo
 * @returns Hora formateada en formato "HH:MM AM/PM"
 */
export declare function formatearHora(hora: Hora): string;
/**
 * Convierte una cadena de hora en formato 24h a un objeto Hora
 * @param horaString - Hora en formato "HH:MM"
 * @returns Objeto Hora con hora, minuto y periodo
 */
export declare function stringToHora(horaString: string): Hora;
/**
 * Formatea una fecha y hora a un formato legible
 * @param fecha - Fecha en formato Date
 * @param hora - Objeto Hora
 * @returns Fecha y hora formateada
 */
export declare function formatearFechaHora(fecha: Date, hora: Hora): string;
