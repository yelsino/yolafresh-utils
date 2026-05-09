import { generarUlid } from "@/utils";
import {
  EjecucionRecurrencia,
  Recurrencia,
} from "@/interfaces/recurrencias";
import { RecurrenciaEntity } from "./Recurrencia";

export class RecurrenciaProcessor {
  static ejecutarSiCorresponde(params: {
    recurrencia: Recurrencia;
    now?: number;
  }): null | {
    recurrenciaActualizada: Recurrencia;
    ejecucion: EjecucionRecurrencia;
  } {
    const now = params.now ?? Date.now();
    const r = params.recurrencia;

    if (r.estado !== "ACTIVA") return null;
    if (r.finAt !== undefined && now > r.finAt) return null;
    if (now < r.siguienteEjecucionAt) return null;

    const runId = generarUlid("rec_run", now);

    try {
      const siguiente = RecurrenciaEntity.calcularSiguienteEjecucionAt({
        regla: r.regla,
        desde: r.siguienteEjecucionAt,
      });

      const recurrenciaActualizada: Recurrencia = {
        ...r,
        ultimaEjecucionAt: now,
        siguienteEjecucionAt: siguiente,
        updatedAt: now,
      };

      const ejecucion: EjecucionRecurrencia = {
        id: runId,
        type: "recurrencia_ejecucion",
        recurrenciaId: r.id,
        scheduledFor: r.siguienteEjecucionAt,
        accion: r.accion,
        payload: r.payload,
        estado: "DESPACHADA",
        dispatchedAt: now,
      };

      return { recurrenciaActualizada, ejecucion };
    } catch (e) {
      const ejecucion: EjecucionRecurrencia = {
        id: runId,
        type: "recurrencia_ejecucion",
        recurrenciaId: r.id,
        scheduledFor: r.siguienteEjecucionAt,
        accion: r.accion,
        payload: r.payload,
        estado: "FALLIDA",
        dispatchedAt: now,
        error: e instanceof Error ? e.message : "Error desconocido",
      };

      const recurrenciaActualizada: Recurrencia = {
        ...r,
        ultimaEjecucionAt: now,
        updatedAt: now,
      };

      return { recurrenciaActualizada, ejecucion };
    }
  }
}
