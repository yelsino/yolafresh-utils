import { TipoVentaEnum } from "./enums";
export declare function formatearNumero(numero: number): string;
export declare const singularToAbbreviation: {
    [key in TipoVentaEnum]: string;
};
export declare const singularToAbbreviationv2: {
    [key in TipoVentaEnum]: string;
};
interface FormatCantidadParams {
    cantidad: number;
    tipoVenta: TipoVentaEnum;
    mayoreo?: boolean;
    abreviado?: boolean;
    categoriaId?: string;
}
export declare function formatCantidad({ cantidad, tipoVenta, mayoreo, abreviado, categoriaId, }: FormatCantidadParams): string;
export declare function getCantidadNumerica({ cantidad }: {
    cantidad: number;
}): number;
type Versions = 'version1' | 'version2' | 'version3';
export declare function abreviarTipoVenta(texto: string, version: Versions): string;
export declare function formatSolesPeruanos(amount: number, version?: Versions): string;
export declare function formatearFecha(fecha: string | Date): string;
export declare function formatNameProduct(texto: string): string;
export declare function transformCloudinaryUrl(url: string, width?: number, height?: number | null, mode?: "fill" | "fit" | "pad", background?: "transparent" | "auto" | string): string;
export declare const normalizeUnit: (unit: string) => string;
export declare function capitalizarPrimeraLetra(texto: string): string;
export declare function convertToNumber(text: any): number;
export declare function abreviarNombreCliente(nombreCompleto: string, maxCaracteres?: number): string;
export declare function convertirPesoProducto(peso: number): number;
export declare const convertionMedidasAbarrotes: {
    [key in TipoVentaEnum]: string;
};
export declare function formatMedidaAbarrotes(tipoVenta: TipoVentaEnum, categoriaId: string): string;
export {};
