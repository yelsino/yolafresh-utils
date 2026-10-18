const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

/** Alias histórico de transporte, nunca un segundo tipo de cliente operativo. */
export function normalizeClienteDocumentType(value: unknown): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toLowerCase();
  return normalized === "cliente_institucional" || normalized === "cliente"
    ? "cliente" : value;
}

/**
 * Adaptador de borde para el antiguo payload institucional. Conserva identidades
 * opacas y datos desconocidos; no crea un DNI ni otra identidad de persona.
 */
export function canonicalizeClienteDocument(
  document: Record<string, unknown>,
): Record<string, unknown> {
  const sourceType = typeof document.type === "string"
    ? document.type.trim().toLowerCase() : document.type;
  const sourceEntity = typeof document.tipoEntidad === "string"
    ? document.tipoEntidad.trim().toLowerCase() : document.tipoEntidad;
  if (normalizeClienteDocumentType(document.type) !== "cliente" &&
    !(sourceType == null && sourceEntity === "clienteinstitucional")) {
    return document;
  }
  const legacy = sourceType === "cliente_institucional" ||
    sourceEntity === "clienteinstitucional";
  if (!legacy) return document.type === "cliente" && document.tipoEntidad === "Cliente" ? document :
    { ...document, type: "cliente", tipoEntidad: "Cliente" };
  const billing = document.facturacion && typeof document.facturacion === "object" &&
    !Array.isArray(document.facturacion)
    ? document.facturacion as Record<string, unknown> : {};
  const razonSocial = text(billing.razonSocial) ?? text(document.razonSocial);
  const ruc = text(billing.ruc) ?? text(document.ruc);
  const direccionFiscal = text(billing.direccionFiscal) ?? text(document.direccion);
  const nombres = text(document.nombres) ?? text(document.nombreComercial) ?? razonSocial;
  const pseudonimo = text(document.pseudonimo) ?? text(document.nombreComercial);
  return {
    ...document,
    type: "cliente",
    tipoEntidad: "Cliente",
    ...(nombres !== undefined ? { nombres } : {}),
    ...(pseudonimo !== undefined ? { pseudonimo } : {}),
    ...(Object.keys(billing).length || razonSocial || ruc || direccionFiscal ? {
      facturacion: { ...billing,
        ...(razonSocial !== undefined ? { razonSocial } : {}),
        ...(ruc !== undefined ? { ruc } : {}),
        ...(direccionFiscal !== undefined ? { direccionFiscal } : {}),
      },
    } : {}),
  };
}
