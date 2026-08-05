"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const media_contract_1 = require("../../shared/kernel/media.contract");
const legacyImage = {
    base: "/legacy/original.jpg",
    sizes: {
        small: "/legacy/small.webp",
        medium: "/legacy/medium.webp",
        large: "/legacy/large.webp",
    },
};
const globalImage = {
    assetId: "img_global_pera_001",
    scope: "GLOBAL",
    base: "/g/p/pera/img_global_pera_001/o.webp",
    sizes: {
        small: "/g/p/pera/img_global_pera_001/s.webp",
        medium: "/g/p/pera/img_global_pera_001/m.webp",
        large: "/g/p/pera/img_global_pera_001/l.webp",
    },
};
function buildProduct(imagen) {
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
(0, node_test_1.default)("ProductoBase admite creacion sin imagen", () => {
    strict_1.default.equal(buildProduct().imagen, undefined);
});
(0, node_test_1.default)("mantiene compatibilidad con ImageSizes legacy", () => {
    const product = buildProduct(legacyImage);
    strict_1.default.equal((0, media_contract_1.isImageSizes)(product.imagen), true);
    strict_1.default.equal((0, media_contract_1.isProductImage)(product.imagen), false);
});
(0, node_test_1.default)("identifica imagen global con asset estable", () => {
    var _a;
    const product = buildProduct(globalImage);
    strict_1.default.equal((0, media_contract_1.isProductImage)(product.imagen), true);
    strict_1.default.equal((_a = product.imagen) === null || _a === void 0 ? void 0 : _a.sizes.small.endsWith("/s.webp"), true);
});
(0, node_test_1.default)("rechaza scope o assetId invalidos", () => {
    strict_1.default.equal((0, media_contract_1.isProductImage)({ ...globalImage, assetId: "" }), false);
    strict_1.default.equal((0, media_contract_1.isProductImage)({ ...globalImage, scope: "PUBLIC" }), false);
});
