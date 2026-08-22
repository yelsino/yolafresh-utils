import type {
  Presentacion,
  PresentacionLegacyInput,
} from "../contracts/producto.contract";

/** Primera versión de cualquier conversión comercial persistida. */
export const VERSION_CONVERSION_PRESENTACION_INICIAL = 1 as const;

export type ConversionSemanticaPresentacion = Readonly<
  Pick<
    Presentacion,
    | "productoBaseId"
    | "equivalenciaUnidadBase"
    | "unidadBaseInventario"
  >
>;

export type ConversionVersionadaPresentacion =
  ConversionSemanticaPresentacion & {
    readonly versionConversion: unknown;
  };

export interface ResultadoTransicionVersionConversionPresentacion {
  valido: boolean;
  errores: string[];
  cambioSemantico: boolean;
  versionEsperada?: number;
}

/**
 * La versión se conserva como entero seguro para que `+ 1` sea determinista en
 * todos los consumidores JavaScript.
 */
export const esVersionConversionPresentacionValida = (
  value: unknown,
): value is number => Number.isSafeInteger(value) && Number(value) >= 1;

const assertVersionConversionPresentacionValida: (
  value: unknown,
  campo: string,
) => asserts value is number = (value, campo) => {
  if (!esVersionConversionPresentacionValida(value)) {
    throw new Error(`${campo} debe ser un entero positivo seguro`);
  }
};

/**
 * Normaliza exclusivamente documentos legacy que todavía no tienen la versión.
 * Una ausencia real (`undefined`) inicia en 1; un valor presente pero inválido se
 * rechaza para no ocultar corrupción de datos.
 */
export const normalizarPresentacionLegacy = (
  entrada: PresentacionLegacyInput,
): Presentacion => {
  const versionConversion =
    entrada.versionConversion === undefined
      ? VERSION_CONVERSION_PRESENTACION_INICIAL
      : entrada.versionConversion;

  assertVersionConversionPresentacionValida(
    versionConversion,
    "presentacion.versionConversion",
  );

  return {
    ...entrada,
    versionConversion,
  };
};

/** Devuelve 1 para una presentación que todavía no existe. */
export const crearVersionConversionPresentacion = (): number =>
  VERSION_CONVERSION_PRESENTACION_INICIAL;

/**
 * Incrementa explícitamente una conversión cuando la unidad base cambia en el
 * `ProductoBase` padre. Ese cambio ocurre entre documentos y no siempre puede
 * inferirse comparando dos presentaciones.
 */
export const incrementarVersionConversionPresentacion = (
  actual: number | Pick<Presentacion, "versionConversion">,
): number => {
  const versionActual =
    typeof actual === "number" ? actual : actual.versionConversion;
  assertVersionConversionPresentacionValida(
    versionActual,
    "presentacionActual.versionConversion",
  );

  const siguiente = versionActual + 1;
  assertVersionConversionPresentacionValida(
    siguiente,
    "presentacionSiguiente.versionConversion",
  );
  return siguiente;
};

/**
 * Compara únicamente los datos que cambian la conversión física a inventario.
 * Precio, nombre, imagen, códigos, visibilidad y demás campos son cosméticos para
 * esta política.
 */
export const esMismaConversionSemanticaPresentacion = (
  actual: ConversionSemanticaPresentacion,
  candidata: ConversionSemanticaPresentacion,
): boolean =>
  actual.productoBaseId === candidata.productoBaseId &&
  actual.equivalenciaUnidadBase === candidata.equivalenciaUnidadBase &&
  actual.unidadBaseInventario === candidata.unidadBaseInventario;

/**
 * Calcula la única versión válida para una creación o actualización interna.
 * La versión propuesta por un cliente no participa en el cálculo.
 */
export const calcularVersionConversionPresentacion = (
  actual: ConversionVersionadaPresentacion | null | undefined,
  candidata: ConversionSemanticaPresentacion,
): number => {
  if (!actual) return crearVersionConversionPresentacion();

  assertVersionConversionPresentacionValida(
    actual.versionConversion,
    "presentacionActual.versionConversion",
  );

  if (esMismaConversionSemanticaPresentacion(actual, candidata)) {
    return actual.versionConversion;
  }

  return incrementarVersionConversionPresentacion(actual.versionConversion);
};

/**
 * Materializa una presentación canónica ignorando cualquier versión enviada en
 * la candidata y aplicando la versión calculada por el dominio.
 */
export const aplicarVersionConversionPresentacion = (
  actual: Presentacion | null | undefined,
  candidata: PresentacionLegacyInput,
): Presentacion => {
  const { versionConversion: _versionPropuesta, ...datosCandidatos } = candidata;

  return {
    ...datosCandidatos,
    versionConversion: calcularVersionConversionPresentacion(
      actual,
      datosCandidatos,
    ),
  };
};

/**
 * Valida una transición recibida desde fuera del dominio. A diferencia del
 * calculador, esta función no corrige la candidata: rechaza valores inválidos,
 * regresiones, saltos y cambios de versión sin cambio semántico.
 */
export const validarTransicionVersionConversionPresentacion = (
  actual: ConversionVersionadaPresentacion,
  candidata: ConversionVersionadaPresentacion,
): ResultadoTransicionVersionConversionPresentacion => {
  const errores: string[] = [];
  const cambioSemantico = !esMismaConversionSemanticaPresentacion(
    actual,
    candidata,
  );
  const versionActualValida = esVersionConversionPresentacionValida(
    actual.versionConversion,
  );
  const versionCandidataValida = esVersionConversionPresentacionValida(
    candidata.versionConversion,
  );

  if (!versionActualValida) {
    errores.push(
      "presentacionActual.versionConversion debe ser un entero positivo seguro",
    );
  }
  if (!versionCandidataValida) {
    errores.push(
      "presentacionCandidata.versionConversion debe ser un entero positivo seguro",
    );
  }

  if (!versionActualValida) {
    return { valido: false, errores, cambioSemantico };
  }

  const versionEsperada = cambioSemantico
    ? actual.versionConversion + 1
    : actual.versionConversion;

  if (!esVersionConversionPresentacionValida(versionEsperada)) {
    errores.push("presentacion.versionConversion excede el entero seguro");
    return { valido: false, errores, cambioSemantico };
  }

  if (versionCandidataValida && candidata.versionConversion !== versionEsperada) {
    if (candidata.versionConversion < actual.versionConversion) {
      errores.push("presentacion.versionConversion no puede retroceder");
    } else if (cambioSemantico) {
      errores.push(
        "presentacion.versionConversion debe incrementar exactamente en uno",
      );
    } else {
      errores.push(
        "presentacion.versionConversion debe conservarse sin cambio semántico",
      );
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    cambioSemantico,
    versionEsperada,
  };
};
