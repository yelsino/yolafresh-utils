import { DomainEvent } from "@/domain/shared/base/DomainEvent";

export class VentaConfirmada implements DomainEvent {
  occurredOn = new Date();

  constructor(
    public readonly ventaId: string,
    public readonly total: number
  ) {}
}
