export function formatToShortDate(fecha: Date): string {
  // Validar que el argumento sea una instancia de Date y que sea una fecha válida
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
    throw new Error("La fecha proporcionada no es válida.");
  }

  const meses: string[] = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const nombreMes: string = meses[fecha.getMonth()];
  const dia: number = fecha.getDate();
  const año: string = fecha.getFullYear().toString().slice(-2); // Últimos dos dígitos del año

  return `${nombreMes} ${dia},${año}`;
}
