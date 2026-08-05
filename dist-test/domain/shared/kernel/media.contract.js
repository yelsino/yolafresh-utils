"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isImageSizes = isImageSizes;
exports.isProductImage = isProductImage;
function isImageSizes(value) {
    if (!value || typeof value !== "object")
        return false;
    const candidate = value;
    const sizes = candidate.sizes;
    return (typeof candidate.base === "string" &&
        Boolean(sizes) &&
        typeof (sizes === null || sizes === void 0 ? void 0 : sizes.small) === "string" &&
        typeof (sizes === null || sizes === void 0 ? void 0 : sizes.medium) === "string" &&
        typeof (sizes === null || sizes === void 0 ? void 0 : sizes.large) === "string");
}
function isProductImage(value) {
    if (!isImageSizes(value))
        return false;
    const candidate = value;
    return (typeof candidate.assetId === "string" &&
        candidate.assetId.trim().length > 0 &&
        (candidate.scope === "TENANT" || candidate.scope === "GLOBAL"));
}
