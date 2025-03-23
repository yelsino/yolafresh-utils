/**
 * Valida si un correo electrónico tiene un formato válido
 * @param email - Correo electrónico a validar
 * @returns true si el correo es válido, false en caso contrario
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // Expresión regular para validar correos electrónicos
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida si un número de teléfono tiene un formato válido
 * @param phone - Número de teléfono a validar
 * @returns true si el teléfono es válido, false en caso contrario
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Eliminar espacios y caracteres especiales
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[()-]/g, '');
  
  // Verificar que solo contenga dígitos y tenga una longitud adecuada (entre 7 y 15 dígitos)
  return /^\d{7,15}$/.test(cleanPhone);
}

/**
 * Valida si una contraseña cumple con los requisitos mínimos de seguridad
 * @param password - Contraseña a validar
 * @returns true si la contraseña es válida, false en caso contrario
 */
export function isValidPassword(password: string): boolean {
  if (!password) return false;
  
  // Verificar longitud mínima
  if (password.length < 8) return false;
  
  // Verificar que contenga al menos un número
  if (!/\d/.test(password)) return false;
  
  // Verificar que contenga al menos una letra mayúscula
  if (!/[A-Z]/.test(password)) return false;
  
  // Verificar que contenga al menos una letra minúscula
  if (!/[a-z]/.test(password)) return false;
  
  return true;
}

/**
 * Valida si un texto está vacío o solo contiene espacios
 * @param text - Texto a validar
 * @returns true si el texto no está vacío, false en caso contrario
 */
export function isNotEmpty(text: string | null | undefined): boolean {
  if (text === null || text === undefined) return false;
  return text.trim().length > 0;
}

/**
 * Valida si un valor es un número válido
 * @param value - Valor a validar
 * @returns true si es un número válido, false en caso contrario
 */
export function isValidNumber(value: any): boolean {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }
  
  return false;
}

/**
 * Valida si una fecha es válida
 * @param date - Fecha a validar
 * @returns true si la fecha es válida, false en caso contrario
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  
  // Si ya es una instancia de Date, verificar que sea válida
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  // Si es un string, intentar convertirlo a Date
  if (typeof date === 'string') {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }
  
  return false;
}

/**
 * Valida si una URL tiene un formato válido
 * @param url - URL a validar
 * @returns true si la URL es válida, false en caso contrario
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    // Intentar crear un objeto URL (lanzará una excepción si la URL no es válida)
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}
