export type AuthScopeType = "tenant" | "sucursal" | "almacen" | "caja" | "organizacion";

export type AuthScope = {
  scopeType: AuthScopeType;
  scopeIds: string[];
};
