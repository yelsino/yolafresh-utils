"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenciaEntity = void 0;
const AggregateRoot_1 = require("../../shared/base/AggregateRoot");
const dates_1 = require("../../shared/utils/dates");
class RecurrenciaEntity extends AggregateRoot_1.AggregateRoot {
    constructor(data) {
        super(data.id);
        this.data = data;
    }
    static crear(params) {
        var _a, _b;
        const now = (_a = params.now) !== null && _a !== void 0 ? _a : Date.now();
        const id = (_b = params.id) !== null && _b !== void 0 ? _b : (0, dates_1.generarUlid)("rec", now);
        const inicioAt = params.inicioAt;
        const siguienteEjecucionAt = RecurrenciaEntity.calcularSiguienteEjecucionAt({
            regla: params.regla,
            desde: inicioAt,
        });
        return new RecurrenciaEntity({
            id,
            type: "recurrencia",
            nombre: params.nombre,
            estado: "ACTIVA",
            regla: params.regla,
            accion: params.accion,
            payload: params.payload,
            inicioAt,
            finAt: params.finAt,
            siguienteEjecucionAt,
            createdAt: now,
            updatedAt: now,
        });
    }
    static desde(data) {
        return new RecurrenciaEntity(data);
    }
    toJSON() {
        return { ...this.data };
    }
    get estado() {
        return this.data.estado;
    }
    activar(now = Date.now()) {
        this.data = { ...this.data, estado: "ACTIVA", updatedAt: now };
    }
    pausar(now = Date.now()) {
        this.data = { ...this.data, estado: "PAUSADA", updatedAt: now };
    }
    anular(now = Date.now()) {
        this.data = { ...this.data, estado: "ANULADA", updatedAt: now };
    }
    reprogramarRegla(regla, now = Date.now()) {
        const siguienteEjecucionAt = RecurrenciaEntity.calcularSiguienteEjecucionAt({
            regla,
            desde: Math.max(this.data.inicioAt, now),
        });
        this.data = {
            ...this.data,
            regla,
            siguienteEjecucionAt,
            updatedAt: now,
        };
    }
    static calcularSiguienteEjecucionAt(params) {
        var _a, _b, _c, _d, _e;
        const desdeDate = new Date(params.desde);
        const base = this.dateUTCAtTime(desdeDate, params.regla.horarioUTC);
        const intervalo = Math.max(1, (_a = params.regla.intervalo) !== null && _a !== void 0 ? _a : 1);
        if (params.regla.frecuencia === "DIARIA") {
            return this.nextDaily(base, intervalo).getTime();
        }
        if (params.regla.frecuencia === "SEMANAL") {
            const dias = (_b = params.regla.diasSemana) !== null && _b !== void 0 ? _b : [];
            return this.nextWeekly(base, intervalo, dias).getTime();
        }
        if (params.regla.frecuencia === "MENSUAL") {
            const diaMes = (_c = params.regla.diaMes) !== null && _c !== void 0 ? _c : 1;
            return this.nextMonthly(base, intervalo, diaMes).getTime();
        }
        const mes = (_d = params.regla.mes) !== null && _d !== void 0 ? _d : 1;
        const diaMes = (_e = params.regla.diaMes) !== null && _e !== void 0 ? _e : 1;
        return this.nextYearly(base, intervalo, mes, diaMes).getTime();
    }
    static dateUTCAtTime(date, horario) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), horario.hora, horario.minuto, 0, 0));
    }
    static nextDaily(from, intervaloDias) {
        const d = new Date(from.getTime());
        d.setUTCDate(d.getUTCDate() + intervaloDias);
        return d;
    }
    static nextWeekly(from, intervaloSemanas, diasSemana) {
        const dias = diasSemana.length > 0 ? [...diasSemana].sort((a, b) => a - b) : [from.getUTCDay()];
        const start = new Date(from.getTime());
        const startDay = start.getUTCDay();
        for (const day of dias) {
            if (day > startDay) {
                const d = new Date(start.getTime());
                d.setUTCDate(d.getUTCDate() + (day - startDay));
                return d;
            }
        }
        const d = new Date(start.getTime());
        const daysToNext = (7 - startDay) + dias[0] + (intervaloSemanas - 1) * 7;
        d.setUTCDate(d.getUTCDate() + daysToNext);
        return d;
    }
    static nextMonthly(from, intervaloMeses, diaMes) {
        const year = from.getUTCFullYear();
        const month = from.getUTCMonth() + intervaloMeses;
        const target = new Date(Date.UTC(year, month, 1, from.getUTCHours(), from.getUTCMinutes(), 0, 0));
        const day = Math.min(Math.max(1, diaMes), this.daysInMonthUTC(target.getUTCFullYear(), target.getUTCMonth()));
        target.setUTCDate(day);
        return target;
    }
    static nextYearly(from, intervaloAnios, mes, diaMes) {
        const year = from.getUTCFullYear() + intervaloAnios;
        const monthIndex = Math.min(Math.max(1, mes), 12) - 1;
        const target = new Date(Date.UTC(year, monthIndex, 1, from.getUTCHours(), from.getUTCMinutes(), 0, 0));
        const day = Math.min(Math.max(1, diaMes), this.daysInMonthUTC(target.getUTCFullYear(), target.getUTCMonth()));
        target.setUTCDate(day);
        return target;
    }
    static daysInMonthUTC(year, monthIndex) {
        return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    }
}
exports.RecurrenciaEntity = RecurrenciaEntity;
