import { ValueObject } from "@/domain/shared/base/ValueObject";

export class SucursalId extends ValueObject<string> {
  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error("SucursalId no puede estar vacío");
    }
    super(value);
  }
}
