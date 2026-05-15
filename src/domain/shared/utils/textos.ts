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

type Versions = 'version1' | 'version2' | 'version3' | 'sinSimbolo';

// Mapa para convertir valores decimales a fracciones simbólicas para version3
const decimalToSymbolicFraction: { [key: number]: string } = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
};


export function formatSolesPeruanos(
  monto: number | null | undefined,
  opciones: {
    version?: Versions;
    locale?: string;
    decimales?: number;
    useGrouping?: boolean;
  } = {},
): string {
  const version = opciones.version ?? "version1";
  const decimales = opciones.decimales ?? 2;
  const locale = opciones.locale ?? "es-PE";
  const useGrouping = opciones.useGrouping ?? true;

  if (version === "sinSimbolo") {
    return formatMontoProfesional(monto, {
      mostrarSimbolo: false,
      locale,
      decimales,
      useGrouping,
    });
  }

  return formatMontoProfesional(monto, {
    mostrarSimbolo: true,
    simbolo: version === "version2" ? "S/." : "S/",
    locale,
    currency: "PEN",
    decimales,
    useGrouping,
  });
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

export function formatMontoProfesional(
  monto: number | null | undefined,
  opciones: {
    mostrarSimbolo?: boolean;
    simbolo?: 'S/' | 'S/.';
    decimales?: number;
    locale?: string;
    currency?: string;
    compact?: boolean;
    usarParentesisNegativo?: boolean;
    useGrouping?: boolean;
  } = {}
): string {
  const valor = monto ?? 0;
  const decimales = opciones.decimales ?? 2;
  const mostrarSimbolo = opciones.mostrarSimbolo ?? false;
  const simbolo = opciones.simbolo ?? 'S/';
  const locale = opciones.locale ?? 'es-PE';
  const currency = opciones.currency ?? 'PEN';
  const compact = opciones.compact ?? false;
  const usarParentesisNegativo = opciones.usarParentesisNegativo ?? false;
  const useGrouping = opciones.useGrouping ?? true;

  const factor = Math.pow(10, decimales);
  const redondeado = Math.round(valor * factor) / factor;
  const negativo = redondeado < 0;
  const absoluto = Math.abs(redondeado);

  const nf = new Intl.NumberFormat(locale, mostrarSimbolo
    ? {
        style: 'currency',
        currency,
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
        useGrouping,
        notation: compact ? 'compact' : 'standard',
      }
    : {
        style: 'decimal',
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
        useGrouping,
        notation: compact ? 'compact' : 'standard',
      });

  let texto = nf.format(absoluto);

  if (mostrarSimbolo && currency === 'PEN') {
    texto = texto.replace('S/.', simbolo).replace('S/', simbolo);
  }

  if (negativo) {
    if (usarParentesisNegativo) {
      texto = `(${texto.replace('-', '').trim()})`;
    } else {
      texto = `-${texto.replace('-', '').trim()}`;
    }
  }

  return texto;
}
