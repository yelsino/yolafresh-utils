import { AggregateRoot } from "@/domain/shared/base/AggregateRoot";
import { ValueObject } from "@/domain/shared/base/ValueObject";
import { CuentaId, PeriodoFiscal } from "./ContabilidadBase";

export class AsientoId extends ValueObject<string> {}

export class LineaAsiento {
  constructor(
    public readonly cuentaId: CuentaId,
    public readonly debe: number = 0,
    public readonly haber: number = 0,
    public readonly concepto: string
  ) {
    if (this.debe < 0 || this.haber < 0) {
      throw new Error("Los montos no pueden ser negativos");
    }
    if (this.debe > 0 && this.haber > 0) {
      throw new Error("Una línea no puede tener debe y haber simultáneamente en un sistema puro, usar múltiples líneas si se requiere");
    }
  }
}

export class AsientoContable extends AggregateRoot<AsientoId> {
  private lineas: LineaAsiento[] = [];
  public estado: 'BORRADOR' | 'CONFIRMADO' = 'BORRADOR';

  constructor(
    id: AsientoId,
    public readonly fecha: Date,
    public readonly conceptoGeneral: string,
    public readonly periodoId: string // Referencia al periodo fiscal
  ) {
    super(id);
  }

  agregarLinea(linea: LineaAsiento): void {
    if (this.estado === 'CONFIRMADO') {
      throw new Error("No se pueden agregar líneas a un asiento confirmado.");
    }
    this.lineas.push(linea);
  }

  cuadra(): boolean {
    const totalDebe = this.lineas.reduce((sum, linea) => sum + linea.debe, 0);
    const totalHaber = this.lineas.reduce((sum, linea) => sum + linea.haber, 0);
    // Para evitar problemas de punto flotante en JS al sumar dinero
    return Math.abs(totalDebe - totalHaber) < 0.001;
  }

  registrar(periodo: PeriodoFiscal): void {
    if (this.estado === 'CONFIRMADO') {
      throw new Error("El asiento ya está confirmado.");
    }
    
    if (!periodo.estaAbierto()) {
      throw new Error("No se puede registrar un asiento en un periodo fiscal cerrado.");
    }

    if (!this.cuadra()) {
      throw new Error("El asiento no cuadra. Total Debe y Total Haber deben ser iguales.");
    }

    this.estado = 'CONFIRMADO';
    
    // Aquí se podrían despachar eventos de dominio adicionales
  }
  
  getLineas(): ReadonlyArray<LineaAsiento> {
    return this.lineas;
  }
}
