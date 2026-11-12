import { TipoVentaEnum, UnidadMedidaEnum } from "../contracts/producto.contract";

/** Datos físicos de un comando; la unidad de inventario la resuelve el padre. */
export interface MedidasPresentacionInput {
  productoBaseId?: unknown;
  unidadBaseInventario?: unknown;
  tipoVenta?: unknown;
  contenidoNeto?: unknown;
  unidadContenido?: unknown;
  equivalenciaUnidadBase?: unknown;
  tipoEmpaque?: unknown;
}

export interface ResultadoMedidasPresentacion {
  valido: boolean;
  errores: string[];
  equivalenciaCalculada?: number;
  requiereEquivalenciaExplicita: boolean;
}

/**
 * Solo para altas y cambios de medidas, nunca para materializar datos históricos.
 * Es autocontenida y usa JavaScript compatible con el validador de CouchDB:
 * móvil, gateway y legacy_direct ejecutan exactamente la misma regla.
 */
export function validarMedidasPresentacion(
  entrada: MedidasPresentacionInput,
): ResultadoMedidasPresentacion {
  var errores: string[] = [];
  var unidades: Record<string, [string, number]> = {
    unidad: ["unidad", 1], docena: ["unidad", 12],
    gramo: ["kilogramo", 0.001], kilogramo: ["kilogramo", 1],
    libra: ["kilogramo", 0.45359237], onza: ["kilogramo", 0.028349523125],
    tonelada: ["kilogramo", 1000],
    mililitro: ["litro", 0.001], litro: ["litro", 1],
    centimetro: ["metro", 0.01], metro: ["metro", 1],
  };
  var base = entrada.unidadBaseInventario;
  var contenido = entrada.contenidoNeto;
  var factor = entrada.equivalenciaUnidadBase;
  var unidad = typeof entrada.unidadContenido === "string" &&
    Object.prototype.hasOwnProperty.call(unidades, entrada.unidadContenido)
    ? unidades[entrada.unidadContenido] : undefined;
  var baseValida = base === "unidad" || base === "kilogramo" ||
    base === "litro" || base === "metro";
  var contenidoValido = typeof contenido === "number" && isFinite(contenido) && contenido > 0;
  var factorValido = typeof factor === "number" && isFinite(factor) && factor > 0;
  var venta = entrada.tipoVenta;
  var empaque = entrada.tipoEmpaque;
  var empaques = ["saco", "bolsa", "caja", "balde", "lata", "botella", "paquete",
    "bandeja", "frasco", "malla", "blister", "tetrapack", "sixpack", "bidon", "manojo", "atado"];
  var empaqueFijo = base === "unidad" && venta === "unidad" && unidad &&
    (unidad[0] === "kilogramo" || unidad[0] === "litro") &&
    typeof empaque === "string" && empaques.indexOf(empaque) >= 0;
  var calculada: number | undefined;

  if (!baseValida) errores.push("El producto base debe indicar una unidad de inventario válida.");
  if (!contenidoValido) errores.push("El contenido neto debe ser mayor que cero.");
  if (!factorValido) errores.push("La equivalencia de inventario debe ser mayor que cero.");
  if (!unidad) errores.push("Usa una medida física explícita; indica saco, bolsa o atado en el empaque.");
  if (venta !== "unidad" && venta !== "peso" && venta !== "volumen") {
    errores.push("Selecciona un tipo de venta válido.");
  } else if ((venta === "peso" && (base !== "kilogramo" || !unidad || unidad[0] !== "kilogramo")) ||
    (venta === "volumen" && (base !== "litro" || !unidad || unidad[0] !== "litro"))) {
    errores.push("La venta por " + venta + " requiere inventario y contenido de esa misma magnitud.");
  }

  if (baseValida && unidad) {
    if (unidad[0] === base) {
      if (contenidoValido) {
        calculada = Number(((contenido as number) * unidad[1]).toPrecision(12));
        if (!isFinite(calculada) || calculada <= 0) {
          calculada = undefined;
          errores.push("El contenido excede el rango de conversión admitido.");
        } else if (factorValido && Math.abs((factor as number) - calculada) >
          Math.max(Math.abs(factor as number), Math.abs(calculada)) * 1e-9) {
          errores.push("La equivalencia debe ser " + calculada + " " + base + " según el contenido neto.");
        }
      }
    } else if (!empaqueFijo) {
      errores.push("El contenido no es compatible con el inventario en " + base +
        ". No se puede convertir peso, volumen o longitud a piezas sin un empaque fijo.");
    } else if (factorValido && Math.floor(factor as number) !== factor) {
      errores.push("Indica cuántas unidades enteras de inventario contiene el empaque fijo.");
    }
  }

  return { valido: errores.length === 0, errores: errores,
    equivalenciaCalculada: calculada, requiereEquivalenciaExplicita: Boolean(empaqueFijo) };
}

/** Mantiene operables los registros heredados sin corregirlos ni exigir su reparación. */
export function validarCambioMedidasPresentacion(
  actual: MedidasPresentacionInput | null | undefined,
  candidata: MedidasPresentacionInput,
): ResultadoMedidasPresentacion {
  var campos: (keyof MedidasPresentacionInput)[] = ["productoBaseId", "unidadBaseInventario",
    "tipoVenta", "contenidoNeto", "unidadContenido", "equivalenciaUnidadBase", "tipoEmpaque"];
  if (actual && campos.every(function(campo) { return actual[campo] === candidata[campo]; })) {
    return { valido: true, errores: [], requiereEquivalenciaExplicita: false };
  }
  return validarMedidasPresentacion(candidata);
}

export function obtenerTiposVentaPresentacion(unidadBase: unknown): TipoVentaEnum[] {
  if (unidadBase === "kilogramo") return [TipoVentaEnum.Unidad, TipoVentaEnum.Peso];
  if (unidadBase === "litro") return [TipoVentaEnum.Unidad, TipoVentaEnum.Volumen];
  return [TipoVentaEnum.Unidad];
}

export function obtenerUnidadesContenidoPresentacion(
  unidadBase: unknown,
  tipoEmpaque?: unknown,
): UnidadMedidaEnum[] {
  return Object.values(UnidadMedidaEnum).filter((unidadContenido) => {
    const resultado = validarMedidasPresentacion({ unidadBaseInventario: unidadBase,
      tipoVenta: "unidad", contenidoNeto: 1, unidadContenido,
      equivalenciaUnidadBase: 1, tipoEmpaque });
    return resultado.valido || resultado.equivalenciaCalculada !== undefined;
  });
}
