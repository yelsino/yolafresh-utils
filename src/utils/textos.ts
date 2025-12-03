import { TipoVentaEnum, UnidadMedidaEnum } from "../interfaces/producto";

export function formatearNumero(numero: number) {
  if (numero >= 1000) {
    return numero.toString();
  } else {
    return numero.toString().padStart(3, '0');
  }
}

export const abbreviations: { [key in UnidadMedidaEnum]?: string } = {
  [UnidadMedidaEnum.Unidad]: 'und',
  [UnidadMedidaEnum.Gramo]: 'g',
  [UnidadMedidaEnum.Kilogramo]: 'kg',
  [UnidadMedidaEnum.Mililitro]: 'ml',
  [UnidadMedidaEnum.Litro]: 'l',
  [UnidadMedidaEnum.Libra]: 'lb',
  [UnidadMedidaEnum.Onza]: 'oz',
  [UnidadMedidaEnum.Arroba]: 'arr',
  [UnidadMedidaEnum.Quintal]: 'qq',
  [UnidadMedidaEnum.Tonelada]: 't',
  [UnidadMedidaEnum.Metro]: 'm',
  [UnidadMedidaEnum.Centimetro]: 'cm',
  [UnidadMedidaEnum.Galon]: 'gal',
  [UnidadMedidaEnum.Saco]: 'saco',
  [UnidadMedidaEnum.Bolsa]: 'bolsa',
  [UnidadMedidaEnum.Porcion]: 'porción',
};

// Compatibilidad con código antiguo que use estos mapas
export const singularToAbbreviation = abbreviations as any;
export const singularToAbbreviationv2 = abbreviations as any;

interface FormatCantidadParams {
  cantidad: number;
  tipoVenta: TipoVentaEnum;
  unidadMedida?: UnidadMedidaEnum;
  mayoreo?: boolean;
  abreviado?: boolean;
  categoriaId?: string;
}

export function formatCantidad({
  cantidad,
  tipoVenta,
  unidadMedida,
  mayoreo = false,
  abreviado = false,
  categoriaId,
}: FormatCantidadParams): string {
  // Si tenemos unidadMedida, usémosla
  if (unidadMedida) {
    const unitStr = abbreviations[unidadMedida] || unidadMedida;
    if (mayoreo) return `${cantidad}`;
    return `${cantidad} ${unitStr}`;
  }

  // Fallback para lógica antigua si unidadMedida no está presente (aunque debería)
  if (tipoVenta === TipoVentaEnum.Peso) {
     return `${cantidad} kg`;
  }
  if (tipoVenta === TipoVentaEnum.Volumen) {
     return `${cantidad} l`;
  }
  
  return `${cantidad} und`;
}

export function getCantidadNumerica({ cantidad }: { cantidad: number }): number {
  // Asumimos que la cantidad ya viene en la unidad base correcta en el nuevo sistema
  return cantidad;
}

type Versions = 'version1' | 'version2' | 'version3';

// Mapa para convertir valores decimales a fracciones simbólicas para version3
const decimalToSymbolicFraction: { [key: number]: string } = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
};

export function formatSolesPeruanos(monto: number | null | undefined, version: Versions = 'version1'): string {
  if (monto === null || monto === undefined) return 'S/ 0.00';
  
  // Redondear a 2 decimales
  const montoRedondeado = Math.round(monto * 100) / 100;
  
  if (version === 'version1') {
    return `S/ ${montoRedondeado.toFixed(2)}`;
  } else if (version === 'version2') {
    return `S/. ${montoRedondeado.toFixed(2)}`;
  } else {
    // version3: lógica de fracciones si aplica (ej: 0.50 -> 1/2)
    // Aquí simplificado
    return `S/ ${montoRedondeado.toFixed(2)}`;
  }
}

export function capitalizarPrimeraLetra(texto: string): string {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

export function formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
