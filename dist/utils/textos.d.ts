import { TipoVentaEnum, UnidadMedidaEnum } from "../interfaces/producto";
export declare function formatearNumero(numero: number): string;
export declare const abbreviations: {
    [key in UnidadMedidaEnum]?: string;
};
export declare const singularToAbbreviation: any;
export declare const singularToAbbreviationv2: any;
interface FormatCantidadParams {
    cantidad: number;
    tipoVenta: TipoVentaEnum;
    unidadMedida?: UnidadMedidaEnum;
    mayoreo?: boolean;
    abreviado?: boolean;
    categoriaId?: string;
}
export declare function formatCantidad({ cantidad, tipoVenta, unidadMedida, mayoreo, abreviado, categoriaId, }: FormatCantidadParams): string;
export declare function getCantidadNumerica({ cantidad }: {
    cantidad: number;
}): number;
type Versions = 'version1' | 'version2' | 'version3' | 'sinSimbolo';
export declare function formatSolesPeruanos(monto: number | null | undefined, version?: Versions): string;
export declare function capitalizarPrimeraLetra(texto: string): string;
export declare function formatearFecha(fecha: Date | string): string;
export declare function formatMontoProfesional(monto: number | null | undefined, opciones?: {
    mostrarSimbolo?: boolean;
    simbolo?: 'S/' | 'S/.';
    decimales?: number;
    locale?: string;
    currency?: string;
    compact?: boolean;
    usarParentesisNegativo?: boolean;
    useGrouping?: boolean;
}): string;
export {};
