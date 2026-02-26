import { ValueObject } from "@/domain/shared/base/ValueObject";
import { Entity } from "@/domain/shared/base/Entity";

export class PeriodoFiscalId extends ValueObject<string> {}
export class CuentaId extends ValueObject<string> {}

export class PeriodoFiscal extends Entity<PeriodoFiscalId> {
  constructor(
    id: PeriodoFiscalId,
    public readonly anio: number,
    public readonly mes: number,
    public estado: 'ABIERTO' | 'CERRADO' = 'ABIERTO'
  ) {
    super(id);
  }

  estaAbierto(): boolean {
    return this.estado === 'ABIERTO';
  }

  cerrar(): void {
    if (this.estado === 'CERRADO') {
      throw new Error("El periodo ya está cerrado");
    }
    this.estado = 'CERRADO';
  }
}

export class PlanCuenta extends Entity<CuentaId> {
  constructor(
    id: CuentaId,
    public readonly codigo: string,
    public readonly nombre: string,
    public readonly tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'EGRESO'
  ) {
    super(id);
  }
}
