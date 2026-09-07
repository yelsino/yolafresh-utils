"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandGrants = expandGrants;
const expand_grant_1 = require("./expand-grant");
function expandGrants(grants) {
    const expanded = [];
    for (const grant of grants) {
        expanded.push(...(0, expand_grant_1.expandGrant)(grant));
    }
    return [...new Set(expanded)];
}
