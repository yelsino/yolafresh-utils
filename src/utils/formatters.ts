import { TipoVentaEnum } from "@utils/enums";

/**
 * Formatea un número a un formato específico
 * @param numero - Número a formatear
 * @returns Número formateado como string
 */
export function formatearNumero(numero: number): string {
  if (numero >= 1000) {
    return numero.toString();
  } else {
    return numero.toString().padStart(3, '0');
  }
}

/**
 * Mapeo de tipos de venta a sus abreviaciones en singular
 */
export const singularToAbbreviation: { [key in TipoVentaEnum]: string } = {
  [TipoVentaEnum.Kilogramo]: 'kg',
  [TipoVentaEnum.Unidad]: 'und',
  [TipoVentaEnum.Saco]: 'saco',
  [TipoVentaEnum.Docena]: 'docn',
  [TipoVentaEnum.Arroba]: 'arrb',
  [TipoVentaEnum.Caja]: 'caja',
  [TipoVentaEnum.Balde]: 'blde',
  [TipoVentaEnum.Bolsa]: 'bols',
  [TipoVentaEnum.Paquete]: 'pqte',
  [TipoVentaEnum.Litro]: 'litr',
  [TipoVentaEnum.Gramo]: 'gr',
  [TipoVentaEnum.Mililitro]: 'ml',
  [TipoVentaEnum.SixPack]: 'sixpack',
};

/**
 * Versión alternativa de mapeo de tipos de venta a sus abreviaciones
 */
export const singularToAbbreviationv2: { [key in TipoVentaEnum]: string } = {
  [TipoVentaEnum.Kilogramo]: 'kg',
  [TipoVentaEnum.Unidad]: 'und',
  [TipoVentaEnum.Saco]: 'saco',
  [TipoVentaEnum.Docena]: '12 und',
  [TipoVentaEnum.Arroba]: '12 kg',
  [TipoVentaEnum.Caja]: 'caja',
  [TipoVentaEnum.Balde]: 'balde',
  [TipoVentaEnum.Bolsa]: 'bols',
  [TipoVentaEnum.Paquete]: 'pqte',
  [TipoVentaEnum.Gramo]: 'gr',
  [TipoVentaEnum.Mililitro]: 'ml',
  [TipoVentaEnum.Litro]: 'lt',
  [TipoVentaEnum.SixPack]: '6 und',
};

/**
 * Mapeo de tipos de venta a sus abreviaciones en plural
 */
export const pluralToAbbreviation: { [key in TipoVentaEnum]: string } = {
  [TipoVentaEnum.Kilogramo]: 'kg',
  [TipoVentaEnum.Unidad]: 'unds',
  [TipoVentaEnum.Saco]: 'sacos',
  [TipoVentaEnum.Docena]: 'docns',
  [TipoVentaEnum.Arroba]: 'arrbs',
  [TipoVentaEnum.Caja]: 'cajas',
  [TipoVentaEnum.Balde]: 'bldes',
  [TipoVentaEnum.Bolsa]: 'bols',
  [TipoVentaEnum.Paquete]: 'pqts',
  [TipoVentaEnum.Gramo]: 'grs',
  [TipoVentaEnum.Mililitro]: 'mls',
  [TipoVentaEnum.Litro]: 'lts',
  [TipoVentaEnum.SixPack]: 'sixpack',
};

/**
 * Formatea un monto a soles peruanos
 * @param amount - Monto a formatear
 * @param version - Versión del formato (opcional)
 * @returns Monto formateado en soles peruanos
 */
export function formatSolesPeruanos(amount: number, version?: 'version1' | 'version2'): string {
  // Redondear el monto a dos decimales
  const roundedAmount = Math.round(amount * 100) / 100;
  
  // Formatear el número con separadores de miles y dos decimales
  const formatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Obtener el monto formateado
  let formattedAmount = formatter.format(roundedAmount);
  
  // Ajustar según la versión
  if (version === 'version2') {
    formattedAmount = formattedAmount.replace('PEN', 'S/');
  } else {
    formattedAmount = formattedAmount.replace('PEN', 'S/.');
  }
  
  return formattedAmount;
}

/**
 * Redondea un monto a dos decimales
 * @param amount - Monto a redondear
 * @returns Monto redondeado
 */
export function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Capitaliza la primera letra de un texto
 * @param texto - Texto a capitalizar
 * @returns Texto con la primera letra en mayúscula
 */
export function capitalizarPrimeraLetra(texto: string): string {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Convierte un texto a número
 * @param text - Texto a convertir
 * @returns Número convertido o 0 si no es válido
 */
export function convertToNumber(text: any): number {
  if (text === null || text === undefined) {
    return 0;
  }
  
  if (typeof text === 'number') {
    return text;
  }
  
  if (typeof text === 'string') {
    // Eliminar caracteres no numéricos excepto el punto decimal
    const cleanedText = text.replace(/[^\d.]/g, '');
    
    // Si no hay nada que convertir, devolver 0
    if (!cleanedText) {
      return 0;
    }
    
    // Intentar convertir a número
    const num = parseFloat(cleanedText);
    
    // Verificar si es un número válido
    if (isNaN(num)) {
      return 0;
    }
    
    return num;
  }
  
  return 0;
}

/**
 * Abrevia el nombre de un cliente
 * @param nombreCompleto - Nombre completo del cliente
 * @param maxCaracteres - Máximo de caracteres permitidos
 * @returns Nombre abreviado
 */
export function abreviarNombreCliente(nombreCompleto: string, maxCaracteres: number = 20): string {
  if (!nombreCompleto) {
    return '';
  }
  
  // Si el nombre ya es más corto que el máximo, devolverlo tal cual
  if (nombreCompleto.length <= maxCaracteres) {
    return nombreCompleto;
  }
  
  // Dividir el nombre en palabras
  const palabras = nombreCompleto.split(' ');
  
  // Si solo hay una palabra, truncarla
  if (palabras.length === 1) {
    return palabras[0].substring(0, maxCaracteres - 3) + '...';
  }
  
  // Obtener la primera palabra completa
  let resultado = palabras[0];
  
  // Añadir iniciales de las palabras restantes
  for (let i = 1; i < palabras.length; i++) {
    if (palabras[i].length > 0) {
      resultado += ' ' + palabras[i][0] + '.';
    }
  }
  
  // Si aún es demasiado largo, truncarlo
  if (resultado.length > maxCaracteres) {
    resultado = resultado.substring(0, maxCaracteres - 3) + '...';
  }
  
  return resultado;
}

/**
 * Formatea el nombre de un producto
 * @param texto - Nombre del producto
 * @returns Nombre formateado
 */
export function formatNameProduct(texto: string): string {
  if (!texto) return '';
  
  // Dividir el texto en palabras
  const palabras = texto.split(' ');
  
  // Capitalizar cada palabra
  const palabrasCapitalizadas = palabras.map(palabra => {
    if (palabra.length === 0) return '';
    return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
  });
  
  // Unir las palabras capitalizadas
  return palabrasCapitalizadas.join(' ');
}

/**
 * Normaliza una unidad de medida
 * @param unit - Unidad a normalizar
 * @returns Unidad normalizada
 */
export function normalizeUnit(unit: string): string {
  if (!unit) return '';
  
  const unitLower = unit.toLowerCase().trim();
  
  // Mapeo de unidades comunes a su forma normalizada
  const unitMap: Record<string, string> = {
    'kg': 'kg',
    'kilo': 'kg',
    'kilos': 'kg',
    'kilogramo': 'kg',
    'kilogramos': 'kg',
    'g': 'g',
    'gr': 'g',
    'gramo': 'g',
    'gramos': 'g',
    'l': 'l',
    'lt': 'l',
    'litro': 'l',
    'litros': 'l',
    'ml': 'ml',
    'mililitro': 'ml',
    'mililitros': 'ml',
    'u': 'und',
    'un': 'und',
    'und': 'und',
    'unidad': 'und',
    'unidades': 'und'
  };
  
  return unitMap[unitLower] || unitLower;
}
