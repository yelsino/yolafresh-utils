/**
 * Valida si un correo electrónico tiene un formato válido
 * @param email - Correo electrónico a validar
 * @returns true si el correo es válido, false en caso contrario
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Valida si un número de teléfono tiene un formato válido
 * @param phone - Número de teléfono a validar
 * @returns true si el teléfono es válido, false en caso contrario
 */
export declare function isValidPhone(phone: string): boolean;
/**
 * Valida si una contraseña cumple con los requisitos mínimos de seguridad
 * @param password - Contraseña a validar
 * @returns true si la contraseña es válida, false en caso contrario
 */
export declare function isValidPassword(password: string): boolean;
/**
 * Valida si un texto está vacío o solo contiene espacios
 * @param text - Texto a validar
 * @returns true si el texto no está vacío, false en caso contrario
 */
export declare function isNotEmpty(text: string | null | undefined): boolean;
/**
 * Valida si un valor es un número válido
 * @param value - Valor a validar
 * @returns true si es un número válido, false en caso contrario
 */
export declare function isValidNumber(value: any): boolean;
/**
 * Valida si una fecha es válida
 * @param date - Fecha a validar
 * @returns true si la fecha es válida, false en caso contrario
 */
export declare function isValidDate(date: any): boolean;
/**
 * Valida si una URL tiene un formato válido
 * @param url - URL a validar
 * @returns true si la URL es válida, false en caso contrario
 */
export declare function isValidUrl(url: string): boolean;
