import { AggregateRoot } from "@/domain/shared/base/AggregateRoot";
import { generarUlid } from "@/utils";
import { AccionRecurrencia, Recurrencia, RecurrenciaEstado, ReglaRecurrencia } from "@/interfaces/recurrencias";

export class RecurrenciaEntity extends AggregateRoot<string> {
  private data: Recurrencia;

  private constructor(data: Recurrencia) {
    super(data.id);
    this.data = data;
  }

  static crear(params: {
    nombre: string;
    regla: ReglaRecurrencia;
    accion: AccionRecurrencia;
    inicioAt: number;
    finAt?: number;
    now?: number;
    id?: string;
  }): RecurrenciaEntity {
    const now = params.now ?? Date.now();
    const id = params.id ?? generarUlid("rec", now);
    const inicioAt = params.inicioAt;
    const siguienteEjecucionAt = RecurrenciaEntity.calcularSiguienteEjecucionAt({
      regla: params.regla,
      desde: inicioAt,
    });

    return new RecurrenciaEntity({
      id,
      nombre: params.nombre,
      estado: "ACTIVA",
      regla: params.regla,
      accion: params.accion,
      inicioAt,
      finAt: params.finAt,
      siguienteEjecucionAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static desde(data: Recurrencia): RecurrenciaEntity {
    return new RecurrenciaEntity(data);
  }

  toJSON(): Recurrencia {
    return { ...this.data };
  }

  get estado(): RecurrenciaEstado {
    return this.data.estado;
  }

  activar(now: number = Date.now()): void {
    this.data = { ...this.data, estado: "ACTIVA", updatedAt: now };
  }

  pausar(now: number = Date.now()): void {
    this.data = { ...this.data, estado: "PAUSADA", updatedAt: now };
  }

  anular(now: number = Date.now()): void {
    this.data = { ...this.data, estado: "ANULADA", updatedAt: now };
  }

  reprogramarRegla(regla: ReglaRecurrencia, now: number = Date.now()): void {
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

  static calcularSiguienteEjecucionAt(params: {
    regla: ReglaRecurrencia;
    desde: number;
  }): number {
    const desdeDate = new Date(params.desde);
    const base = this.dateUTCAtTime(desdeDate, params.regla.horarioUTC);
    const intervalo = Math.max(1, params.regla.intervalo ?? 1);

    if (params.regla.frecuencia === "DIARIA") {
      return this.nextDaily(base, intervalo).getTime();
    }

    if (params.regla.frecuencia === "SEMANAL") {
      const dias = params.regla.diasSemana ?? [];
      return this.nextWeekly(base, intervalo, dias).getTime();
    }

    if (params.regla.frecuencia === "MENSUAL") {
      const diaMes = params.regla.diaMes ?? 1;
      return this.nextMonthly(base, intervalo, diaMes).getTime();
    }

    const mes = params.regla.mes ?? 1;
    const diaMes = params.regla.diaMes ?? 1;
    return this.nextYearly(base, intervalo, mes, diaMes).getTime();
  }

  private static dateUTCAtTime(date: Date, horario: { hora: number; minuto: number }): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), horario.hora, horario.minuto, 0, 0));
  }

  private static nextDaily(from: Date, intervaloDias: number): Date {
    const d = new Date(from.getTime());
    d.setUTCDate(d.getUTCDate() + intervaloDias);
    return d;
  }

  private static nextWeekly(from: Date, intervaloSemanas: number, diasSemana: number[]): Date {
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

  private static nextMonthly(from: Date, intervaloMeses: number, diaMes: number): Date {
    const year = from.getUTCFullYear();
    const month = from.getUTCMonth() + intervaloMeses;
    const target = new Date(Date.UTC(year, month, 1, from.getUTCHours(), from.getUTCMinutes(), 0, 0));
    const day = Math.min(Math.max(1, diaMes), this.daysInMonthUTC(target.getUTCFullYear(), target.getUTCMonth()));
    target.setUTCDate(day);
    return target;
  }

  private static nextYearly(from: Date, intervaloAnios: number, mes: number, diaMes: number): Date {
    const year = from.getUTCFullYear() + intervaloAnios;
    const monthIndex = Math.min(Math.max(1, mes), 12) - 1;
    const target = new Date(Date.UTC(year, monthIndex, 1, from.getUTCHours(), from.getUTCMinutes(), 0, 0));
    const day = Math.min(Math.max(1, diaMes), this.daysInMonthUTC(target.getUTCFullYear(), target.getUTCMonth()));
    target.setUTCDate(day);
    return target;
  }

  private static daysInMonthUTC(year: number, monthIndex: number): number {
    return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  }
}
