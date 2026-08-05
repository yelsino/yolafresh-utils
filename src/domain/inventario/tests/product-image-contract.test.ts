import assert from "node:assert/strict";
import test from "node:test";

import type { ProductoBase } from "../contracts/producto.contract";
import {
  isImageSizes,
  isProductImage,
  type ProductImage,
} from "../../shared/kernel/media.contract";

const legacyImage = {
  base: "/legacy/original.jpg",
  sizes: {
    small: "/legacy/small.webp",
    medium: "/legacy/medium.webp",
    large: "/legacy/large.webp",
  },
};

const globalImage: ProductImage = {
  assetId: "img_global_pera_001",
  scope: "GLOBAL",
  base: "/g/p/pera/img_global_pera_001/o.webp",
  sizes: {
    small: "/g/p/pera/img_global_pera_001/s.webp",
    medium: "/g/p/pera/img_global_pera_001/m.webp",
    large: "/g/p/pera/img_global_pera_001/l.webp",
  },
};

function buildProduct(imagen?: ProductoBase["imagen"]): ProductoBase {
  return {
    id: "producto_pera",
    type: "producto_base",
    nombre: "Pera roja",
    unidadBaseInterna: "kilogramo",
    categoriaId: "frutas",
    imagen,
    aplicaIGV: false,
    porcentajeIGV: 0,
    activo: true,
    createdAt: 1,
    updatedAt: 1,
  };
}

test("ProductoBase admite creacion sin imagen", () => {
  assert.equal(buildProduct().imagen, undefined);
});

test("mantiene compatibilidad con ImageSizes legacy", () => {
  const product = buildProduct(legacyImage);
  assert.equal(isImageSizes(product.imagen), true);
  assert.equal(isProductImage(product.imagen), false);
});

test("identifica imagen global con asset estable", () => {
  const product = buildProduct(globalImage);
  assert.equal(isProductImage(product.imagen), true);
  assert.equal(product.imagen?.sizes.small.endsWith("/s.webp"), true);
});

test("rechaza scope o assetId invalidos", () => {
  assert.equal(isProductImage({ ...globalImage, assetId: "" }), false);
  assert.equal(isProductImage({ ...globalImage, scope: "PUBLIC" }), false);
});
