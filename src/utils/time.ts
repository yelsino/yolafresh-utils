import { Hora } from "@interfaces/index";

/**
 * Formatea un objeto Hora a un formato legible
 * @param hora - Objeto Hora con hora, minuto y periodo
 * @returns Hora formateada en formato "HH:MM AM/PM"
 */
export function formatearHora(hora: Hora): string {
  if (!hora || !hora.hora || !hora.minuto || !hora.periodo) {
    return 'Hora inválida';
  }
  
  return `${hora.hora}:${hora.minuto} ${hora.periodo}`;
}

/**
 * Convierte una cadena de hora en formato 24h a un objeto Hora
 * @param horaString - Hora en formato "HH:MM"
 * @returns Objeto Hora con hora, minuto y periodo
 */
export function stringToHora(horaString: string): Hora {
  // Validar formato
  if (!horaString || !/^\d{1,2}:\d{2}$/.test(horaString)) {
    return { hora: '12', minuto: '00', periodo: 'PM' };
  }
  
  const [horaStr, minutoStr] = horaString.split(':');
  let hora = parseInt(horaStr, 10);
  const minuto = minutoStr;
  
  // Determinar periodo (AM/PM)
  const periodo = hora >= 12 ? 'PM' : 'AM';
  
  // Convertir a formato 12h
  if (hora > 12) {
    hora -= 12;
  } else if (hora === 0) {
    hora = 12;
  }
  
  return {
    hora: hora.toString(),
    minuto,
    periodo
  };
}

/**
 * Formatea una fecha y hora a un formato legible
 * @param fecha - Fecha en formato Date
 * @param hora - Objeto Hora
 * @returns Fecha y hora formateada
 */
export function formatearFechaHora(fecha: Date, hora: Hora): string {
  if (!(fecha instanceof Date) || isNaN(fecha.getTime()) || !hora) {
    return 'Fecha u hora inválida';
  }
  
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  
  return `${dia}/${mes}/${anio} ${formatearHora(hora)}`;
}
