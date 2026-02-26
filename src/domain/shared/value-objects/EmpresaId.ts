import { ValueObject } from "@/domain/shared/base/ValueObject";

export class EmpresaId extends ValueObject<string> {
  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new Error("EmpresaId no puede estar vacío");
    }
    super(value);
  }
}
