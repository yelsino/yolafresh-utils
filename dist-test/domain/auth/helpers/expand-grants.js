"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandGrants = expandGrants;
const expand_grant_1 = require("./expand-grant");
function expandGrants(grants) {
    return [...new Set(grants.flatMap((grant) => (0, expand_grant_1.expandGrant)(grant)))];
}
