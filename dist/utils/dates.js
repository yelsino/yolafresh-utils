"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtils = void 0;
exports.generarUlid = generarUlid;
exports.DateUtils = {
    // =============================
    // CREACIÓN
    // =============================
    nowUnix() {
        return Date.now();
    },
    nowISO() {
        return new Date().toISOString();
    },
    todayISODateOnly() {
        return new Date().toISOString().split("T")[0];
    },
    // =============================
    // CONVERSIONES
    // =============================
    unixToISO(unix) {
        return new Date(unix).toISOString();
    },
    isoToUnix(iso) {
        return new Date(iso).getTime();
    },
    isoToDate(iso) {
        return new Date(iso);
    },
    dateToISO(date) {
        return date.toISOString();
    },
    // =============================
    // ISO DATE ONLY
    // =============================
    isoDateOnlyToISO(dateOnly) {
        return `${dateOnly}T00:00:00.000Z`;
    },
    isoToDateOnly(iso) {
        return iso.split("T")[0];
    },
    // =============================
    // COMPARACIONES SEGURAS
    // =============================
    isBefore(a, b) {
        return new Date(a).getTime() < new Date(b).getTime();
    },
    isAfter(a, b) {
        return new Date(a).getTime() > new Date(b).getTime();
    }
};
const ULID_ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulidEncodeTime(time) {
    let t = time;
    let out = "";
    for (let i = 0; i < 10; i++) {
        out = ULID_ENCODING[t % 32] + out;
        t = Math.floor(t / 32);
    }
    return out;
}
function ulidRandomChar() {
    const cryptoObj = globalThis.crypto;
    const arr = new Uint8Array(1);
    if (cryptoObj === null || cryptoObj === void 0 ? void 0 : cryptoObj.getRandomValues) {
        cryptoObj.getRandomValues(arr);
        return ULID_ENCODING[arr[0] % 32];
    }
    return ULID_ENCODING[Math.floor(Math.random() * 32)];
}
function generarUlid(prefijo, now) {
    const timePart = ulidEncodeTime(now !== null && now !== void 0 ? now : Date.now());
    let randomPart = "";
    for (let i = 0; i < 16; i++)
        randomPart += ulidRandomChar();
    const ulid = `${timePart}${randomPart}`;
    return prefijo ? `${prefijo}_${ulid}` : ulid;
}
