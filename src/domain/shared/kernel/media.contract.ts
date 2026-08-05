/** Ambito de propiedad y distribucion de una imagen. */
export type ImageScope = "TENANT" | "GLOBAL";

/** URLs o paths de entrega para una imagen y sus variantes optimizadas. */
export type ImageSizes = {
  base: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
};

/**
 * Referencia estable de una imagen asociada a una entidad de negocio.
 *
 * `TENANT` identifica recursos privados del tenant autenticado.
 * `GLOBAL` identifica recursos curados por YolaFresh y reutilizables por todos
 * los tenants sin copiar el archivo.
 */
export type ProductImage = ImageSizes & {
  assetId: string;
  scope: ImageScope;
};

/** Contrato transitorio aceptado mientras existen documentos legacy. */
export type CompatibleProductImage = ImageSizes | ProductImage;

export function isImageSizes(value: unknown): value is ImageSizes {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ImageSizes>;
  const sizes = candidate.sizes as Partial<ImageSizes["sizes"]> | undefined;
  return (
    typeof candidate.base === "string" &&
    Boolean(sizes) &&
    typeof sizes?.small === "string" &&
    typeof sizes?.medium === "string" &&
    typeof sizes?.large === "string"
  );
}

export function isProductImage(value: unknown): value is ProductImage {
  if (!isImageSizes(value)) return false;
  const candidate = value as Partial<ProductImage>;
  return (
    typeof candidate.assetId === "string" &&
    candidate.assetId.trim().length > 0 &&
    (candidate.scope === "TENANT" || candidate.scope === "GLOBAL")
  );
}
