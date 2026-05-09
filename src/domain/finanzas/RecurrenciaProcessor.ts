import { generarUlid } from "@/utils";
import {
  EjecucionRecurrencia,
  Recurrencia,
  DocumentoRecurrenciaGenerado,
} from "@/interfaces/recurrencias";
import { Egreso, EntidadReferenciaEnum, MovimientoCuentaCliente } from "@/interfaces/finanzas";
import { RecurrenciaEntity } from "./Recurrencia";

export class RecurrenciaProcessor {
  static ejecutarSiCorresponde(params: {
    recurrencia: Recurrencia;
    now?: number;
  }): null | {
    recurrenciaActualizada: Recurrencia;
    ejecucion: EjecucionRecurrencia;
    egresos: Egreso[];
    movimientosCuentaCliente: MovimientoCuentaCliente[];
  } {
    const now = params.now ?? Date.now();
    const r = params.recurrencia;

    if (r.estado !== "ACTIVA") return null;
    if (r.finAt !== undefined && now > r.finAt) return null;
    if (now < r.siguienteEjecucionAt) return null;

    const runId = generarUlid("rec_run", now);
    const documentosGenerados: DocumentoRecurrenciaGenerado[] = [];
    const egresos: Egreso[] = [];
    const movimientosCuentaCliente: MovimientoCuentaCliente[] = [];

    try {
      if (r.accion.tipo === "EGRESO") {
        const egresoId = generarUlid("egr", now);
        const egreso: Egreso = {
          type: "egreso",
          id: egresoId,
          monto: r.accion.template.monto,
          tipoEgreso: r.accion.template.tipoEgreso,
          centroCostoId: r.accion.template.centroCostoId,
          quienRegistroId: r.accion.template.quienRegistroId,
          quienHizoGastoId: r.accion.template.quienHizoGastoId,
          metodoRegistro: r.accion.template.metodoRegistro,
          detalle: r.accion.template.detalle,
          observaciones: r.accion.template.observaciones,
          fechaGasto: new Date(r.siguienteEjecucionAt),
          estado: "ACTIVO",
          metodoPago: r.accion.template.metodoPago,
          entidadReferencia: EntidadReferenciaEnum.OTRO,
          referenciaId: r.id,
          prorrateable: r.accion.template.prorrateable,
          createdAt: new Date(now),
          updatedAt: new Date(now),
        };
        egresos.push(egreso);
        documentosGenerados.push({ tipo: "EGRESO", id: egresoId });
      } else if (r.accion.tipo === "CARGO_CLIENTE") {
        const movId = generarUlid("mcc", now);
        const mov: MovimientoCuentaCliente = {
          id: movId,
          clienteId: r.accion.template.clienteId,
          tipo: "CARGO",
          monto: r.accion.template.monto,
          moneda: r.accion.template.moneda,
          referenciaTipo: "RECURRENCIA",
          referenciaId: runId,
          descripcion: r.accion.template.descripcion ?? r.nombre,
          estado: "ACTIVO",
          createdAt: new Date(now),
        };
        movimientosCuentaCliente.push(mov);
        documentosGenerados.push({ tipo: "MOV_CUENTA_CLIENTE", id: movId });
      }

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
        recurrenciaId: r.id,
        scheduledFor: r.siguienteEjecucionAt,
        executedAt: now,
        estado: "EJECUTADA",
        documentosGenerados,
      };

      return {
        recurrenciaActualizada,
        ejecucion,
        egresos,
        movimientosCuentaCliente,
      };
    } catch (e) {
      const ejecucion: EjecucionRecurrencia = {
        id: runId,
        recurrenciaId: r.id,
        scheduledFor: r.siguienteEjecucionAt,
        executedAt: now,
        estado: "FALLIDA",
        documentosGenerados,
        error: e instanceof Error ? e.message : "Error desconocido",
      };

      const recurrenciaActualizada: Recurrencia = {
        ...r,
        ultimaEjecucionAt: now,
        updatedAt: now,
      };

      return {
        recurrenciaActualizada,
        ejecucion,
        egresos,
        movimientosCuentaCliente,
      };
    }
  }
}
