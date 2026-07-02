import { UnixMillis } from "@/domain/shared/utils/dates";

export type DireccionEntidadTipo =
  | "usuario"
  | "proveedor"
  | "evento_compra"
  | "cliente"
  | "sucursal"
  | "almacen";

export type DireccionRol =
  | "origen"
  | "destino"
  | "principal"
  | "entrega"
  | "facturacion"
  | "recojo"
  | "domicilio";

export interface Direccion {
  id: string;
  nombre: string;
  referencia?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  latitud?: number;
  longitud?: number;
  activo: boolean;
  createdAt: UnixMillis;
  updatedAt: UnixMillis;
}

export interface DireccionRelacion {
  id: string;
  direccionId: string;
  entidadTipo: DireccionEntidadTipo;
  entidadId: string;
  rol?: DireccionRol;
  esPrincipal?: boolean;
  createdAt: UnixMillis;
}
