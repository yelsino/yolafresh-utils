import type {
  AccionMermaInventarioSnapshot,
  AccionVersionadaMermaInventarioSnapshot,
  AjusteInventario,
  MermaInventario,
} from "../contracts/ajuste-inventario.contract";
import {
  EstadoAprobacionInventario,
  MotivoMermaInventario,
  OrigenAjusteInventario,
} from "../contracts/ajuste-inventario.contract";
import type {
  ConteoInventario,
  ConteoInventarioLinea,
} from "../contracts/conteo-inventario.contract";
import {
  EstadoConteoInventario,
  EstadoLineaConteoInventario,
  TipoConteoInventario,
} from "../contracts/conteo-inventario.contract";
import type {
  ActorInventarioSnapshot,
  ConversionUnidadInventarioSnapshot,
  ResultadoValidacionInventario,
} from "../contracts/inventory-quantity-v2.contract";
import { INVENTORY_V2_SCHEMA_VERSION } from "../contracts/inventory-quantity-v2.contract";
import type {
  MovimientoInventarioV2,
  MovimientoInventarioV2Linea,
} from "../contracts/movimiento-inventario-v2.contract";
import {
  MOVIMIENTO_INVENTARIO_TYPE,
  OrigenMovimientoInventarioV2,
  TipoMovimientoInventarioV2,
} from "../contracts/movimiento-inventario-v2.contract";
import type {
  ConfiguracionPoliticaInventario,
  ContextoResolucionPoliticaInventario,
  PoliticaInventario,
  PoliticaInventarioResuelta,
} from "../contracts/politica-inventario.contract";
import {
  ModoControlInventario,
  NivelPoliticaInventario,
  POLITICA_INVENTARIO_TYPE,
  PRECEDENCIA_POLITICA_INVENTARIO,
} from "../contracts/politica-inventario.contract";
import type { StockProductoBaseAlmacen } from "../contracts/stock-producto-base-almacen.contract";
import {
  CONTEO_INVENTARIO_LINEA_TYPE,
  CONTEO_INVENTARIO_TYPE,
} from "../contracts/conteo-inventario.contract";
import {
  AJUSTE_INVENTARIO_TYPE,
  MERMA_INVENTARIO_TYPE,
} from "../contracts/ajuste-inventario.contract";

const esTextoNoVacio = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const esNumeroFinito = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const resultado = (errores: string[]): ResultadoValidacionInventario => ({
  valido: errores.length === 0,
  errores,
});

const casiIguales = (left: number, right: number, precision: number): boolean =>
  Math.abs(left - right) <= Math.pow(10, -precision) + Number.EPSILON;

export const redondearCantidadInventario = (
  cantidad: number,
  precisionCantidadBase: number,
): number => {
  if (!esNumeroFinito(cantidad)) {
    throw new Error("cantidad_inventario_no_finita");
  }
  if (
    !Number.isInteger(precisionCantidadBase) ||
    precisionCantidadBase < 0 ||
    precisionCantidadBase > 9
  ) {
    throw new Error("precision_cantidad_base_invalida");
  }

  const factor = Math.pow(10, precisionCantidadBase);
  return Math.round((cantidad + Number.EPSILON) * factor) / factor;
};

export const validarConversionInventario = (
  conversion: ConversionUnidadInventarioSnapshot,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  const usaPresentacion = conversion.presentacionId !== undefined;
  if (!esTextoNoVacio(conversion.productoBaseId)) {
    errores.push("conversion.productoBaseId es requerido");
  }
  if (usaPresentacion && !esTextoNoVacio(conversion.presentacionId)) {
    errores.push("conversion.presentacionId no puede estar vacío");
  }
  if (!esTextoNoVacio(conversion.unidadOperacion)) {
    errores.push("conversion.unidadOperacion es requerida");
  }
  if (!esTextoNoVacio(conversion.unidadBase)) {
    errores.push("conversion.unidadBase es requerida");
  }
  if (
    !esNumeroFinito(conversion.factorUnidadBase) ||
    conversion.factorUnidadBase <= 0
  ) {
    errores.push("conversion.factorUnidadBase debe ser mayor a 0");
  }
  if (
    !Number.isInteger(conversion.precisionCantidadBase) ||
    conversion.precisionCantidadBase < 0 ||
    conversion.precisionCantidadBase > 9
  ) {
    errores.push("conversion.precisionCantidadBase debe estar entre 0 y 9");
  }
  if (usaPresentacion) {
    if (
      !Number.isSafeInteger(conversion.versionConversion) ||
      Number(conversion.versionConversion) < 1
    ) {
      errores.push(
        "conversion.versionConversion es requerida para una presentación y debe ser un entero seguro positivo",
      );
    }
  } else {
    if (conversion.versionConversion !== undefined) {
      errores.push(
        "conversion.versionConversion no aplica sin presentacionId",
      );
    }
    if (
      conversion.factorUnidadBase !== 1 ||
      conversion.unidadOperacion !== conversion.unidadBase
    ) {
      errores.push(
        "conversion sin presentacionId exige captura directa en unidad base con factor 1",
      );
    }
  }
  if (!esNumeroFinito(conversion.capturadaAt) || conversion.capturadaAt < 0) {
    errores.push("conversion.capturadaAt es inválida");
  }
  return resultado(errores);
};

export const convertirCantidadAUnidadBase = (
  cantidadOperacion: number,
  conversion: ConversionUnidadInventarioSnapshot,
): number => {
  const validacion = validarConversionInventario(conversion);
  if (!validacion.valido) {
    throw new Error(validacion.errores.join("; "));
  }
  if (!esNumeroFinito(cantidadOperacion) || cantidadOperacion < 0) {
    throw new Error("cantidad_operacion_invalida");
  }
  return redondearCantidadInventario(
    cantidadOperacion * conversion.factorUnidadBase,
    conversion.precisionCantidadBase,
  );
};

export const calcularDiferenciaConteo = (
  cantidadContadaBase: number,
  cantidadTeoricaBase: number,
  precisionCantidadBase = 6,
): number =>
  redondearCantidadInventario(
    cantidadContadaBase - cantidadTeoricaBase,
    precisionCantidadBase,
  );

export const construirIdStockProductoBaseAlmacen = (
  productoBaseId: string,
  almacenId: string,
): string => {
  const producto = productoBaseId.trim();
  const almacen = almacenId.trim();
  if (!producto || !almacen) {
    throw new Error("clave_stock_base_almacen_incompleta");
  }
  return `stock_producto_base_almacen:${encodeURIComponent(producto)}:${encodeURIComponent(
    almacen,
  )}`;
};

export const calcularStockDisponibleBase = (
  stock: Pick<
    StockProductoBaseAlmacen,
    "cantidadFisicaBase" | "cantidadReservadaBase"
  >,
): number => stock.cantidadFisicaBase - stock.cantidadReservadaBase;

const configuracionPredeterminada: Required<
  Pick<
    ConfiguracionPoliticaInventario,
    | "modo"
    | "inventarioInicialRequerido"
    | "conteoCiego"
    | "toleranciaCantidadBase"
    | "toleranciaPorcentaje"
    | "requiereAprobacionAjuste"
    | "requiereEvidenciaMerma"
  >
> = {
  modo: ModoControlInventario.FLEXIBLE,
  inventarioInicialRequerido: false,
  conteoCiego: true,
  toleranciaCantidadBase: 0,
  toleranciaPorcentaje: 0,
  requiereAprobacionAjuste: true,
  requiereEvidenciaMerma: false,
};

const semanticaModo: Record<
  ModoControlInventario,
  Pick<
    PoliticaInventarioResuelta,
    | "registrarMovimientos"
    | "validarStockAntesDeVender"
    | "permitirStockNegativo"
    | "accionStockInsuficiente"
  >
> = {
  [ModoControlInventario.ESTRICTO]: {
    registrarMovimientos: true,
    validarStockAntesDeVender: true,
    permitirStockNegativo: false,
    accionStockInsuficiente: "BLOQUEAR",
  },
  [ModoControlInventario.FLEXIBLE]: {
    registrarMovimientos: true,
    validarStockAntesDeVender: true,
    permitirStockNegativo: true,
    accionStockInsuficiente: "ADVERTIR",
  },
  [ModoControlInventario.REFERENCIAL]: {
    registrarMovimientos: true,
    validarStockAntesDeVender: false,
    permitirStockNegativo: true,
    accionStockInsuficiente: "PERMITIR",
  },
  [ModoControlInventario.SIN_CONTROL]: {
    registrarMovimientos: false,
    validarStockAntesDeVender: false,
    permitirStockNegativo: true,
    accionStockInsuficiente: "PERMITIR",
  },
};

const coincideAlcance = (
  politica: PoliticaInventario,
  contexto: ContextoResolucionPoliticaInventario,
): boolean => {
  const { alcance } = politica;
  if (alcance.empresaId !== contexto.empresaId) return false;
  switch (alcance.nivel) {
    case NivelPoliticaInventario.EMPRESA:
      return true;
    case NivelPoliticaInventario.ALMACEN:
      return alcance.almacenId === contexto.almacenId;
    case NivelPoliticaInventario.PRODUCTO:
      return alcance.productoBaseId === contexto.productoBaseId;
    case NivelPoliticaInventario.PRODUCTO_ALMACEN:
      return (
        alcance.almacenId === contexto.almacenId &&
        alcance.productoBaseId === contexto.productoBaseId
      );
    default:
      return false;
  }
};

const elegirPoliticaMasReciente = (
  candidatas: readonly PoliticaInventario[],
): PoliticaInventario | undefined =>
  [...candidatas].sort(
    (left, right) =>
      right.version - left.version ||
      right.updatedAt - left.updatedAt ||
      right.id.localeCompare(left.id),
  )[0];

/**
 * Materializa una política de forma determinista. Solo una política activa por
 * nivel participa: gana mayor `version`, luego `updatedAt` y finalmente `id`.
 */
export const resolverPoliticaInventario = (
  politicas: readonly PoliticaInventario[],
  contexto: ContextoResolucionPoliticaInventario,
): PoliticaInventarioResuelta => {
  const aplicadas = PRECEDENCIA_POLITICA_INVENTARIO.map((nivel) =>
    elegirPoliticaMasReciente(
      politicas.filter(
        (politica) =>
          politica.activa &&
          politica.alcance.nivel === nivel &&
          coincideAlcance(politica, contexto),
      ),
    ),
  ).filter((politica): politica is PoliticaInventario => Boolean(politica));

  const configuracion = aplicadas.reduce<ConfiguracionPoliticaInventario>(
    (acumulada, politica) => ({
      ...acumulada,
      ...politica.configuracion,
    }),
    { ...configuracionPredeterminada },
  );
  const modo = configuracion.modo ?? ModoControlInventario.FLEXIBLE;

  return {
    modo,
    ...semanticaModo[modo],
    inventarioInicialRequerido:
      configuracion.inventarioInicialRequerido ?? false,
    conteoCiego: configuracion.conteoCiego ?? true,
    frecuenciaConteoDias: configuracion.frecuenciaConteoDias,
    toleranciaCantidadBase: configuracion.toleranciaCantidadBase ?? 0,
    toleranciaPorcentaje: configuracion.toleranciaPorcentaje ?? 0,
    requiereAprobacionAjuste:
      configuracion.requiereAprobacionAjuste ?? true,
    umbralAprobacionCantidadBase:
      configuracion.umbralAprobacionCantidadBase,
    umbralAprobacionValor: configuracion.umbralAprobacionValor,
    requiereEvidenciaMerma:
      configuracion.requiereEvidenciaMerma ?? false,
    fuentesAplicadas: aplicadas.map((politica) => politica.id),
  };
};

export const validarPoliticaInventario = (
  politica: PoliticaInventario,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  if (!esTextoNoVacio(politica.id)) errores.push("politica.id es requerido");
  if (politica.type !== POLITICA_INVENTARIO_TYPE) {
    errores.push("politica.type es inválido");
  }
  if (politica.schemaVersion !== INVENTORY_V2_SCHEMA_VERSION) {
    errores.push("politica.schemaVersion debe ser 2");
  }
  if (!Object.values(NivelPoliticaInventario).includes(politica.alcance.nivel)) {
    errores.push("politica.alcance.nivel es invalido");
  }
  if (!esTextoNoVacio(politica.alcance.empresaId)) {
    errores.push("politica.alcance.empresaId es requerido");
  }
  if (
    (politica.alcance.nivel === NivelPoliticaInventario.ALMACEN ||
      politica.alcance.nivel === NivelPoliticaInventario.PRODUCTO_ALMACEN) &&
    !esTextoNoVacio(politica.alcance.almacenId)
  ) {
    errores.push("politica.alcance.almacenId es requerido");
  }
  if (
    (politica.alcance.nivel === NivelPoliticaInventario.PRODUCTO ||
      politica.alcance.nivel === NivelPoliticaInventario.PRODUCTO_ALMACEN) &&
    !esTextoNoVacio(politica.alcance.productoBaseId)
  ) {
    errores.push("politica.alcance.productoBaseId es requerido");
  }
  if (!Number.isInteger(politica.version) || politica.version < 1) {
    errores.push("politica.version debe ser un entero positivo");
  }
  if (typeof politica.activa !== "boolean") {
    errores.push("politica.activa debe ser booleana");
  }
  if (!politica.actor || !esTextoNoVacio(politica.actor.usuarioId)) {
    errores.push("politica.actor.usuarioId es requerido");
  }
  if (
    politica.actor?.usuarioNombre !== undefined &&
    !esTextoNoVacio(politica.actor.usuarioNombre)
  ) {
    errores.push("politica.actor.usuarioNombre no puede estar vacio");
  }
  if (
    politica.actor?.dispositivoId !== undefined &&
    !esTextoNoVacio(politica.actor.dispositivoId)
  ) {
    errores.push("politica.actor.dispositivoId no puede estar vacio");
  }
  if (
    politica.actor?.sesionId !== undefined &&
    !esTextoNoVacio(politica.actor.sesionId)
  ) {
    errores.push("politica.actor.sesionId no puede estar vacio");
  }
  if (!esTextoNoVacio(politica.operationId)) {
    errores.push("politica.operationId es requerido");
  }
  if (!esTextoNoVacio(politica.idempotencyKey)) {
    errores.push("politica.idempotencyKey es requerido");
  }
  if (
    !Number.isSafeInteger(politica.createdAt) ||
    politica.createdAt <= 0
  ) {
    errores.push("politica.createdAt es invalido");
  }
  if (
    !Number.isSafeInteger(politica.updatedAt) ||
    politica.updatedAt <= 0
  ) {
    errores.push("politica.updatedAt es invalido");
  }
  if (politica.updatedAt < politica.createdAt) {
    errores.push("politica.updatedAt no puede ser anterior a createdAt");
  }
  const cfg = politica.configuracion;
  if (cfg.modo !== undefined && !Object.values(ModoControlInventario).includes(cfg.modo)) {
    errores.push("politica.configuracion.modo es invalido");
  }
  for (const [campo, value] of [
    ["inventarioInicialRequerido", cfg.inventarioInicialRequerido],
    ["conteoCiego", cfg.conteoCiego],
    ["requiereAprobacionAjuste", cfg.requiereAprobacionAjuste],
    ["requiereEvidenciaMerma", cfg.requiereEvidenciaMerma],
  ] as const) {
    if (value !== undefined && typeof value !== "boolean") {
      errores.push(`politica.configuracion.${campo} debe ser booleano`);
    }
  }
  for (const [campo, value] of [
    ["toleranciaCantidadBase", cfg.toleranciaCantidadBase],
    ["toleranciaPorcentaje", cfg.toleranciaPorcentaje],
    ["umbralAprobacionCantidadBase", cfg.umbralAprobacionCantidadBase],
    ["umbralAprobacionValor", cfg.umbralAprobacionValor],
  ] as const) {
    if (value !== undefined && (!esNumeroFinito(value) || value < 0)) {
      errores.push(`politica.configuracion.${campo} no puede ser negativo`);
    }
  }
  if (
    cfg.frecuenciaConteoDias !== undefined &&
    (!Number.isSafeInteger(cfg.frecuenciaConteoDias) ||
      cfg.frecuenciaConteoDias < 1)
  ) {
    errores.push(
      "politica.configuracion.frecuenciaConteoDias debe ser un entero positivo",
    );
  }
  if (
    cfg.toleranciaPorcentaje !== undefined &&
    cfg.toleranciaPorcentaje > 100
  ) {
    errores.push(
      "politica.configuracion.toleranciaPorcentaje no puede exceder 100",
    );
  }
  return resultado(errores);
};

const serializarPoliticaEstable = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => serializarPoliticaEstable(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, item]) =>
          `${JSON.stringify(key)}:${serializarPoliticaEstable(item)}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

export const validarCreacionPoliticaInventario = (
  politica: PoliticaInventario,
): ResultadoValidacionInventario => {
  const validacion = validarPoliticaInventario(politica);
  const errores = [...validacion.errores];
  if (politica.version !== 1) {
    errores.push("la creacion de politica exige version 1");
  }
  return resultado(errores);
};

/**
 * Valida CAS de dominio para una politica. Un replay estructuralmente identico
 * es idempotente; una edicion real conserva alcance/createdAt e incrementa una
 * sola version con nuevas claves de operacion.
 */
export const validarEvolucionPoliticaInventario = (
  actual: PoliticaInventario,
  candidata: PoliticaInventario,
): ResultadoValidacionInventario => {
  const errores = [
    ...validarPoliticaInventario(actual).errores.map(
      (error) => `actual.${error}`,
    ),
    ...validarPoliticaInventario(candidata).errores.map(
      (error) => `candidata.${error}`,
    ),
  ];
  if (errores.length > 0) return resultado(errores);
  const actualSerializada = serializarPoliticaEstable(actual);
  const candidataSerializada = serializarPoliticaEstable(candidata);
  if (actualSerializada === candidataSerializada) return resultado([]);
  if (actual.id !== candidata.id) errores.push("politica.id es inmutable");
  if (actual.type !== candidata.type) errores.push("politica.type es inmutable");
  if (actual.schemaVersion !== candidata.schemaVersion) {
    errores.push("politica.schemaVersion es inmutable");
  }
  if (
    serializarPoliticaEstable(actual.alcance) !==
    serializarPoliticaEstable(candidata.alcance)
  ) {
    errores.push("politica.alcance es inmutable; cree otra politica");
  }
  if (actual.createdAt !== candidata.createdAt) {
    errores.push("politica.createdAt es inmutable");
  }
  if (candidata.version !== actual.version + 1) {
    errores.push("politica.version debe incrementar exactamente en uno");
  }
  if (candidata.updatedAt < actual.updatedAt) {
    errores.push("politica.updatedAt no puede retroceder");
  }
  if (candidata.operationId === actual.operationId) {
    errores.push("una edicion exige un operationId nuevo");
  }
  if (candidata.idempotencyKey === actual.idempotencyKey) {
    errores.push("una edicion exige una idempotencyKey nueva");
  }
  return resultado(errores);
};

const signoEsperadoMovimiento = (
  tipo: TipoMovimientoInventarioV2,
): -1 | 0 | 1 => {
  switch (tipo) {
    case TipoMovimientoInventarioV2.ENTRADA:
    case TipoMovimientoInventarioV2.TRANSFERENCIA_ENTRADA:
      return 1;
    case TipoMovimientoInventarioV2.SALIDA:
    case TipoMovimientoInventarioV2.TRANSFERENCIA_SALIDA:
      return -1;
    case TipoMovimientoInventarioV2.AJUSTE:
      return 0;
  }
};

export const validarMovimientoInventarioV2 = (
  movimiento: MovimientoInventarioV2,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  if (!esTextoNoVacio(movimiento.id)) errores.push("movimiento.id es requerido");
  if (movimiento.type !== MOVIMIENTO_INVENTARIO_TYPE) {
    errores.push("movimiento.type es inválido");
  }
  if (movimiento.schemaVersion !== INVENTORY_V2_SCHEMA_VERSION) {
    errores.push("movimiento.schemaVersion debe ser 2");
  }
  if (!esTextoNoVacio(movimiento.almacenId)) {
    errores.push("movimiento.almacenId es requerido");
  }
  if (!esTextoNoVacio(movimiento.operationId)) {
    errores.push("movimiento.operationId es requerido");
  }
  if (!esTextoNoVacio(movimiento.idempotencyKey)) {
    errores.push("movimiento.idempotencyKey es requerido");
  }
  if (!esTextoNoVacio(movimiento.correlationId)) {
    errores.push("movimiento.correlationId es requerido");
  }
  if (!esTextoNoVacio(movimiento.origen.documentoId)) {
    errores.push("movimiento.origen.documentoId es requerido");
  }
  if (!Array.isArray(movimiento.items) || movimiento.items.length === 0) {
    errores.push("movimiento.items requiere al menos una línea");
    return resultado(errores);
  }

  const ids = new Set<string>();
  const signoEsperado = signoEsperadoMovimiento(movimiento.tipo);
  movimiento.items.forEach((linea, index) => {
    const ruta = `movimiento.items[${index}]`;
    if (!esTextoNoVacio(linea.id)) errores.push(`${ruta}.id es requerido`);
    else if (ids.has(linea.id)) errores.push(`${ruta}.id está duplicado`);
    else ids.add(linea.id);
    if (!esTextoNoVacio(linea.productoBaseId)) {
      errores.push(`${ruta}.productoBaseId es requerido`);
    }
    if (linea.almacenId !== movimiento.almacenId) {
      errores.push(`${ruta}.almacenId no coincide con la cabecera`);
    }
    if (!esNumeroFinito(linea.cantidadOperacion) || linea.cantidadOperacion <= 0) {
      errores.push(`${ruta}.cantidadOperacion debe ser mayor a 0`);
    }
    if (!esNumeroFinito(linea.cantidadBaseDelta) || linea.cantidadBaseDelta === 0) {
      errores.push(`${ruta}.cantidadBaseDelta debe ser no cero`);
    }
    const conversion = validarConversionInventario(linea.conversionSnapshot);
    errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
    if (
      linea.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
      linea.conversionSnapshot.unidadBase !== linea.unidadBase
    ) {
      errores.push(`${ruta}.conversionSnapshot no corresponde a la línea`);
    }
    if (
      esNumeroFinito(linea.cantidadOperacion) &&
      linea.cantidadOperacion > 0 &&
      conversion.valido &&
      esNumeroFinito(linea.cantidadBaseDelta)
    ) {
      const esperada = convertirCantidadAUnidadBase(
        linea.cantidadOperacion,
        linea.conversionSnapshot,
      );
      if (
        !casiIguales(
          Math.abs(linea.cantidadBaseDelta),
          esperada,
          linea.conversionSnapshot.precisionCantidadBase,
        )
      ) {
        errores.push(`${ruta}.cantidadBaseDelta no coincide con la conversión`);
      }
    }
    if (
      signoEsperado !== 0 &&
      esNumeroFinito(linea.cantidadBaseDelta) &&
      Math.sign(linea.cantidadBaseDelta) !== signoEsperado
    ) {
      errores.push(`${ruta}.cantidadBaseDelta tiene signo incompatible`);
    }
  });
  return resultado(errores);
};

export const validarConteoInventario = (
  conteo: ConteoInventario,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  if (!esTextoNoVacio(conteo.id)) errores.push("conteo.id es requerido");
  if (conteo.type !== CONTEO_INVENTARIO_TYPE) {
    errores.push("conteo.type es inválido");
  }
  if (conteo.schemaVersion !== INVENTORY_V2_SCHEMA_VERSION) {
    errores.push("conteo.schemaVersion debe ser 2");
  }
  if (!esTextoNoVacio(conteo.empresaId)) {
    errores.push("conteo.empresaId es requerido");
  }
  if (!esTextoNoVacio(conteo.almacenId)) {
    errores.push("conteo.almacenId es requerido");
  }
  const totales = conteo.totales;
  const valores = [
    totales.lineasEsperadas,
    totales.lineasPendientes,
    totales.lineasContadas,
    totales.lineasReconteo,
    totales.lineasValidadas,
    totales.lineasConDiferencia,
  ];
  if (valores.some((value) => !Number.isInteger(value) || value < 0)) {
    errores.push("conteo.totales solo admite enteros no negativos");
  }
  if (
    totales.lineasPendientes +
      totales.lineasContadas +
      totales.lineasReconteo +
      totales.lineasValidadas !==
    totales.lineasEsperadas
  ) {
    errores.push("conteo.totales no concilia con lineasEsperadas");
  }
  if (totales.lineasConDiferencia > totales.lineasEsperadas) {
    errores.push("conteo.totales.lineasConDiferencia excede lineasEsperadas");
  }
  if (
    (conteo.estado === EstadoConteoInventario.APROBADO ||
      conteo.estado === EstadoConteoInventario.APLICADO) &&
    (!conteo.aprobadoPor || !esNumeroFinito(conteo.aprobadoAt))
  ) {
    errores.push("conteo aprobado requiere actor y fecha de aprobación");
  }
  if (
    (conteo.estado === EstadoConteoInventario.APROBADO ||
      conteo.estado === EstadoConteoInventario.APLICADO) &&
    (totales.lineasValidadas !== totales.lineasEsperadas ||
      totales.lineasPendientes !== 0 ||
      totales.lineasContadas !== 0 ||
      totales.lineasReconteo !== 0)
  ) {
    errores.push("conteo aprobado requiere todas sus líneas validadas");
  }
  if (conteo.estado === EstadoConteoInventario.APLICADO) {
    const tieneAjuste = esTextoNoVacio(conteo.ajusteInventarioId);
    const tieneMovimiento = esTextoNoVacio(conteo.movimientoInventarioId);
    if (
      totales.lineasConDiferencia > 0 &&
      (!tieneAjuste || !tieneMovimiento)
    ) {
      errores.push(
        "conteo aplicado con diferencias requiere ajuste y movimiento resultante",
      );
    }
    if (
      totales.lineasConDiferencia === 0 &&
      (tieneAjuste || tieneMovimiento)
    ) {
      errores.push(
        "conteo aplicado sin diferencias no debe generar ajuste ni movimiento cero",
      );
    }
  }
  if (
    conteo.estado === EstadoConteoInventario.CANCELADO &&
    (!conteo.canceladoPor ||
      !esNumeroFinito(conteo.canceladoAt) ||
      !esTextoNoVacio(conteo.motivoCancelacion))
  ) {
    errores.push("conteo cancelado requiere actor, fecha y motivo");
  }
  return resultado(errores);
};

export const validarConteoInventarioLinea = (
  linea: ConteoInventarioLinea,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  if (!esTextoNoVacio(linea.id)) errores.push("linea.id es requerido");
  if (linea.type !== CONTEO_INVENTARIO_LINEA_TYPE) {
    errores.push("linea.type es inválido");
  }
  if (linea.schemaVersion !== INVENTORY_V2_SCHEMA_VERSION) {
    errores.push("linea.schemaVersion debe ser 2");
  }
  if (!esTextoNoVacio(linea.conteoId)) {
    errores.push("linea.conteoId es requerido");
  }
  if (!esTextoNoVacio(linea.productoBaseId)) {
    errores.push("linea.productoBaseId es requerido");
  }
  if (!esTextoNoVacio(linea.almacenId)) {
    errores.push("linea.almacenId es requerido");
  }
  if (!Number.isInteger(linea.versionProyeccionAlCorte) || linea.versionProyeccionAlCorte < 0) {
    errores.push("linea.versionProyeccionAlCorte debe ser entero no negativo");
  }
  if (!esNumeroFinito(linea.cantidadTeoricaBaseAlCorte)) {
    errores.push("linea.cantidadTeoricaBaseAlCorte debe ser finita");
  }

  const ids = new Set<string>();
  const rondas = new Set<number>();
  linea.capturas.forEach((captura, index) => {
    const ruta = `linea.capturas[${index}]`;
    if (!esTextoNoVacio(captura.id)) errores.push(`${ruta}.id es requerido`);
    else if (ids.has(captura.id)) errores.push(`${ruta}.id está duplicado`);
    else ids.add(captura.id);
    if (!Number.isInteger(captura.ronda) || captura.ronda < 1) {
      errores.push(`${ruta}.ronda debe ser entero positivo`);
    } else if (rondas.has(captura.ronda)) {
      errores.push(`${ruta}.ronda está duplicada`);
    } else rondas.add(captura.ronda);
    if (!esNumeroFinito(captura.cantidadOperacion) || captura.cantidadOperacion < 0) {
      errores.push(`${ruta}.cantidadOperacion no puede ser negativa`);
    }
    if (!esNumeroFinito(captura.cantidadBase) || captura.cantidadBase < 0) {
      errores.push(`${ruta}.cantidadBase no puede ser negativa`);
    }
    const conversion = validarConversionInventario(captura.conversionSnapshot);
    errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
    if (
      captura.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
      captura.conversionSnapshot.unidadBase !== linea.unidadBase
    ) {
      errores.push(`${ruta}.conversionSnapshot no corresponde a la línea`);
    }
    if (
      conversion.valido &&
      esNumeroFinito(captura.cantidadOperacion) &&
      captura.cantidadOperacion >= 0 &&
      esNumeroFinito(captura.cantidadBase)
    ) {
      const esperada = convertirCantidadAUnidadBase(
        captura.cantidadOperacion,
        captura.conversionSnapshot,
      );
      if (
        !casiIguales(
          captura.cantidadBase,
          esperada,
          captura.conversionSnapshot.precisionCantidadBase,
        )
      ) {
        errores.push(`${ruta}.cantidadBase no coincide con la conversión`);
      }
    }
  });

  const capturaVigente = linea.capturas.find(
    (captura) => captura.id === linea.capturaVigenteId,
  );
  if (linea.capturaVigenteId && !capturaVigente) {
    errores.push("linea.capturaVigenteId no existe en capturas");
  }
  if (
    linea.estado !== EstadoLineaConteoInventario.PENDIENTE &&
    !capturaVigente
  ) {
    errores.push("linea no pendiente requiere una captura vigente");
  }
  if (capturaVigente && esNumeroFinito(linea.cantidadTeoricaBaseAlCorte)) {
    if (
      linea.cantidadContadaBase === undefined ||
      !casiIguales(
        linea.cantidadContadaBase,
        capturaVigente.cantidadBase,
        capturaVigente.conversionSnapshot.precisionCantidadBase,
      )
    ) {
      errores.push("linea.cantidadContadaBase no coincide con la captura vigente");
    }
    const diferencia = calcularDiferenciaConteo(
      capturaVigente.cantidadBase,
      linea.cantidadTeoricaBaseAlCorte,
      capturaVigente.conversionSnapshot.precisionCantidadBase,
    );
    if (
      linea.diferenciaBase === undefined ||
      !casiIguales(
        linea.diferenciaBase,
        diferencia,
        capturaVigente.conversionSnapshot.precisionCantidadBase,
      )
    ) {
      errores.push("linea.diferenciaBase no coincide con el conteo");
    }
  }
  if (linea.estado === EstadoLineaConteoInventario.VALIDADA) {
    if (!linea.revisadaPor || !esTextoNoVacio(linea.revisadaPor.usuarioId)) {
      errores.push("linea validada requiere actor revisor");
    }
    if (!esNumeroFinito(linea.revisadaAt)) {
      errores.push("linea validada requiere fecha de revisión");
    }
    if (
      esNumeroFinito(linea.diferenciaBase) &&
      !casiIguales(
        linea.diferenciaBase,
        0,
        capturaVigente?.conversionSnapshot.precisionCantidadBase ?? 9,
      ) &&
      !esTextoNoVacio(linea.motivoDiferenciaCodigo)
    ) {
      errores.push("linea validada con diferencia requiere código de motivo");
    }
  }
  return resultado(errores);
};

const transicionesConteo: Record<
  EstadoConteoInventario,
  readonly EstadoConteoInventario[]
> = {
  [EstadoConteoInventario.BORRADOR]: [
    EstadoConteoInventario.EN_CURSO,
    EstadoConteoInventario.CANCELADO,
  ],
  [EstadoConteoInventario.EN_CURSO]: [
    EstadoConteoInventario.EN_REVISION,
    EstadoConteoInventario.CANCELADO,
  ],
  [EstadoConteoInventario.EN_REVISION]: [
    EstadoConteoInventario.EN_CURSO,
    EstadoConteoInventario.APROBADO,
    EstadoConteoInventario.CANCELADO,
  ],
  [EstadoConteoInventario.APROBADO]: [
    EstadoConteoInventario.APLICADO,
    EstadoConteoInventario.CANCELADO,
  ],
  [EstadoConteoInventario.APLICADO]: [],
  [EstadoConteoInventario.CANCELADO]: [],
};

export const puedeTransicionarConteoInventario = (
  estadoActual: EstadoConteoInventario,
  estadoDestino: EstadoConteoInventario,
): boolean => transicionesConteo[estadoActual].includes(estadoDestino);

const validarAprobacion = (
  documento: AjusteInventario | MermaInventario,
  errores: string[],
): void => {
  if (!documento.aprobacion?.solicitadoPor || !esNumeroFinito(documento.aprobacion.solicitadoAt)) {
    errores.push("aprobacion requiere solicitante y fecha");
  }
  if (
    (documento.estado === EstadoAprobacionInventario.APROBADO ||
      documento.estado === EstadoAprobacionInventario.APLICADO) &&
    (!documento.aprobacion.aprobadoPor ||
      !esNumeroFinito(documento.aprobacion.aprobadoAt))
  ) {
    errores.push("documento aprobado requiere actor y fecha de aprobación");
  }
  if (
    documento.estado === EstadoAprobacionInventario.RECHAZADO &&
    (!documento.aprobacion.rechazadoPor ||
      !esNumeroFinito(documento.aprobacion.rechazadoAt))
  ) {
    errores.push("documento rechazado requiere actor y fecha de rechazo");
  }
  if (
    documento.estado === EstadoAprobacionInventario.APLICADO &&
    !esTextoNoVacio(documento.movimientoInventarioId)
  ) {
    errores.push("documento aplicado requiere movimiento resultante");
  }
};

export const validarAjusteInventario = (
  ajuste: AjusteInventario,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  if (!esTextoNoVacio(ajuste.id)) errores.push("ajuste.id es requerido");
  if (ajuste.type !== AJUSTE_INVENTARIO_TYPE) {
    errores.push("ajuste.type es inválido");
  }
  if (ajuste.schemaVersion !== INVENTORY_V2_SCHEMA_VERSION) {
    errores.push("ajuste.schemaVersion debe ser 2");
  }
  if (!esTextoNoVacio(ajuste.operationId)) {
    errores.push("ajuste.operationId es requerido");
  }
  if (!esTextoNoVacio(ajuste.idempotencyKey)) {
    errores.push("ajuste.idempotencyKey es requerido");
  }
  if (!Array.isArray(ajuste.lineas) || ajuste.lineas.length === 0) {
    errores.push("ajuste.lineas requiere al menos una línea");
  } else {
    ajuste.lineas.forEach((linea, index) => {
      const ruta = `ajuste.lineas[${index}]`;
      if (linea.almacenId !== ajuste.almacenId) {
        errores.push(`${ruta}.almacenId no coincide con la cabecera`);
      }
      if (
        linea.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
        linea.conversionSnapshot.unidadBase !== linea.unidadBase
      ) {
        errores.push(`${ruta}.conversionSnapshot no corresponde a la línea`);
      }
      const conversion = validarConversionInventario(linea.conversionSnapshot);
      errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
      if (!esNumeroFinito(linea.cantidadTeoricaBase)) {
        errores.push(`${ruta}.cantidadTeoricaBase debe ser finita`);
      }
      if (!esNumeroFinito(linea.cantidadObjetivoBase)) {
        errores.push(`${ruta}.cantidadObjetivoBase debe ser finita`);
      }
      const cantidadesValidas =
        esNumeroFinito(linea.cantidadTeoricaBase) &&
        esNumeroFinito(linea.cantidadObjetivoBase);
      const esperada = cantidadesValidas
        ? calcularDiferenciaConteo(
            linea.cantidadObjetivoBase,
            linea.cantidadTeoricaBase,
            linea.conversionSnapshot.precisionCantidadBase,
          )
        : undefined;
      if (
        !esNumeroFinito(linea.cantidadBaseDelta) ||
        (esperada !== undefined &&
          !casiIguales(
            linea.cantidadBaseDelta,
            esperada,
            linea.conversionSnapshot.precisionCantidadBase,
          ))
      ) {
        errores.push(`${ruta}.cantidadBaseDelta no concilia con el objetivo`);
      }
      if (!esTextoNoVacio(linea.motivoCodigo)) {
        errores.push(`${ruta}.motivoCodigo es requerido`);
      }
    });
  }
  validarAprobacion(ajuste, errores);
  return resultado(errores);
};

const validarActorMerma = (
  actor: ActorInventarioSnapshot | null | undefined,
  ruta: string,
  errores: string[],
): void => {
  if (!actor || !esTextoNoVacio(actor.usuarioId)) {
    errores.push(`${ruta}.actor.usuarioId es requerido`);
  }
  if (actor?.usuarioNombre !== undefined && !esTextoNoVacio(actor.usuarioNombre)) {
    errores.push(`${ruta}.actor.usuarioNombre no puede estar vacio`);
  }
  if (actor?.dispositivoId !== undefined && !esTextoNoVacio(actor.dispositivoId)) {
    errores.push(`${ruta}.actor.dispositivoId no puede estar vacio`);
  }
  if (actor?.sesionId !== undefined && !esTextoNoVacio(actor.sesionId)) {
    errores.push(`${ruta}.actor.sesionId no puede estar vacio`);
  }
};

const validarAccionMerma = (
  accion: AccionMermaInventarioSnapshot | null | undefined,
  ruta: string,
  errores: string[],
): void => {
  if (!accion) {
    errores.push(`${ruta} es requerida`);
    return;
  }
  if (!esTextoNoVacio(accion.operationId)) {
    errores.push(`${ruta}.operationId es requerido`);
  }
  if (!esTextoNoVacio(accion.idempotencyKey)) {
    errores.push(`${ruta}.idempotencyKey es requerido`);
  }
  validarActorMerma(accion.actor, ruta, errores);
  if (!Number.isSafeInteger(accion.registradaAt) || accion.registradaAt <= 0) {
    errores.push(`${ruta}.registradaAt es invalida`);
  }
};

const validarAccionVersionadaMerma = (
  accion: AccionVersionadaMermaInventarioSnapshot | null | undefined,
  ruta: string,
  expectedVersion: number,
  errores: string[],
): void => {
  validarAccionMerma(accion, ruta, errores);
  if (accion?.expectedVersion !== expectedVersion) {
    errores.push(`${ruta}.expectedVersion debe ser ${expectedVersion}`);
  }
};

const mismoActorMerma = (
  left: ActorInventarioSnapshot | undefined,
  right: ActorInventarioSnapshot | undefined,
): boolean => JSON.stringify(left) === JSON.stringify(right);

export const construirIdMovimientoMermaInventarioV2 = (
  mermaId: string,
): string => {
  const id = mermaId.trim();
  if (!id) throw new Error("merma_id_requerido");
  return `movimiento_inventario_v2:merma:${encodeURIComponent(id)}:salida`;
};

export const validarMermaInventario = (
  merma: MermaInventario,
): ResultadoValidacionInventario => {
  const errores: string[] = [];
  if (!esTextoNoVacio(merma.id)) errores.push("merma.id es requerido");
  if (merma.type !== MERMA_INVENTARIO_TYPE) {
    errores.push("merma.type es inválido");
  }
  if (merma.schemaVersion !== INVENTORY_V2_SCHEMA_VERSION) {
    errores.push("merma.schemaVersion debe ser 2");
  }
  if (!esTextoNoVacio(merma.operationId)) {
    errores.push("merma.operationId es requerido");
  }
  if (!esTextoNoVacio(merma.idempotencyKey)) {
    errores.push("merma.idempotencyKey es requerido");
  }
  if (!esTextoNoVacio(merma.empresaId)) {
    errores.push("merma.empresaId es requerido");
  }
  if (!esTextoNoVacio(merma.almacenId)) {
    errores.push("merma.almacenId es requerido");
  }
  if (
    merma.evidenciaIds !== undefined &&
    (!Array.isArray(merma.evidenciaIds) ||
      merma.evidenciaIds.some((id) => !esTextoNoVacio(id)))
  ) {
    errores.push("merma.evidenciaIds solo admite IDs no vacios");
  }
  if (!Array.isArray(merma.lineas) || merma.lineas.length === 0) {
    errores.push("merma.lineas requiere al menos una línea");
  } else {
    const ids = new Set<string>();
    merma.lineas.forEach((linea, index) => {
      const ruta = `merma.lineas[${index}]`;
      if (!esTextoNoVacio(linea.id)) errores.push(`${ruta}.id es requerido`);
      else if (ids.has(linea.id)) errores.push(`${ruta}.id esta duplicado`);
      else ids.add(linea.id);
      if (!esTextoNoVacio(linea.productoBaseId)) {
        errores.push(`${ruta}.productoBaseId es requerido`);
      }
      if (linea.almacenId !== merma.almacenId) {
        errores.push(`${ruta}.almacenId no coincide con la cabecera`);
      }
      const conversion = validarConversionInventario(linea.conversionSnapshot);
      errores.push(...conversion.errores.map((error) => `${ruta}.${error}`));
      if (
        linea.conversionSnapshot.productoBaseId !== linea.productoBaseId ||
        linea.conversionSnapshot.unidadBase !== linea.unidadBase
      ) {
        errores.push(`${ruta}.conversionSnapshot no corresponde a la línea`);
      }
      if (!esNumeroFinito(linea.cantidadOperacion) || linea.cantidadOperacion <= 0) {
        errores.push(`${ruta}.cantidadOperacion debe ser mayor a 0`);
      }
      if (!esNumeroFinito(linea.cantidadBase) || linea.cantidadBase <= 0) {
        errores.push(`${ruta}.cantidadBase debe ser mayor a 0`);
      }
      if (
        conversion.valido &&
        esNumeroFinito(linea.cantidadOperacion) &&
        linea.cantidadOperacion > 0 &&
        esNumeroFinito(linea.cantidadBase)
      ) {
        const esperada = convertirCantidadAUnidadBase(
          linea.cantidadOperacion,
          linea.conversionSnapshot,
        );
        if (
          !casiIguales(
            linea.cantidadBase,
            esperada,
            linea.conversionSnapshot.precisionCantidadBase,
          )
        ) {
          errores.push(`${ruta}.cantidadBase no coincide con la conversión`);
        }
      }
      if (
        linea.motivo === MotivoMermaInventario.OTRO &&
        !esTextoNoVacio(linea.motivoDetalle)
      ) {
        errores.push(`${ruta}.motivoDetalle es requerido para OTRO`);
      }
      if (!Object.values(MotivoMermaInventario).includes(linea.motivo)) {
        errores.push(`${ruta}.motivo es invalido`);
      }
      if (
        linea.costoUnitarioBaseSnapshot !== undefined &&
        (!esNumeroFinito(linea.costoUnitarioBaseSnapshot) ||
          linea.costoUnitarioBaseSnapshot < 0)
      ) {
        errores.push(`${ruta}.costoUnitarioBaseSnapshot no puede ser negativo`);
      }
    });
  }
  validarAprobacion(merma, errores);

  const tieneVersion = merma.version !== undefined;
  const tieneFlujo = merma.flujo !== undefined;
  if (tieneVersion !== tieneFlujo) {
    errores.push("merma.version y merma.flujo deben coexistir");
  }
  if (tieneVersion && tieneFlujo) {
    const flujo = merma.flujo!;
    if (!Number.isSafeInteger(merma.version) || merma.version! < 1) {
      errores.push("merma.version debe ser un entero positivo");
    }
    validarAccionMerma(flujo.creacion, "merma.flujo.creacion", errores);
    if (flujo.solicitud) {
      validarAccionVersionadaMerma(
        flujo.solicitud,
        "merma.flujo.solicitud",
        1,
        errores,
      );
    }
    if (flujo.aprobacion) {
      validarAccionVersionadaMerma(
        flujo.aprobacion,
        "merma.flujo.aprobacion",
        2,
        errores,
      );
    }
    if (flujo.rechazo) {
      validarAccionVersionadaMerma(
        flujo.rechazo,
        "merma.flujo.rechazo",
        2,
        errores,
      );
      if (!esTextoNoVacio(flujo.rechazo.comentario)) {
        errores.push("merma.flujo.rechazo.comentario es requerido");
      }
    }
    if (flujo.aplicacion) {
      validarAccionVersionadaMerma(
        flujo.aplicacion,
        "merma.flujo.aplicacion",
        3,
        errores,
      );
    }
    if (flujo.cancelacion) {
      const expectedVersion = flujo.solicitud ? 2 : 1;
      validarAccionVersionadaMerma(
        flujo.cancelacion,
        "merma.flujo.cancelacion",
        expectedVersion,
        errores,
      );
      if (!esTextoNoVacio(flujo.cancelacion.comentario)) {
        errores.push("merma.flujo.cancelacion.comentario es requerido");
      }
    }

    const acciones = [
      flujo.creacion,
      flujo.solicitud,
      flujo.aprobacion,
      flujo.rechazo,
      flujo.aplicacion,
      flujo.cancelacion,
    ].filter((accion): accion is AccionMermaInventarioSnapshot => Boolean(accion));
    const operationIds = new Set<string>();
    const idempotencyKeys = new Set<string>();
    let fechaAnterior = merma.createdAt;
    for (const accion of acciones) {
      if (operationIds.has(accion.operationId)) {
        errores.push("cada accion de merma exige operationId diferente");
      }
      if (idempotencyKeys.has(accion.idempotencyKey)) {
        errores.push("cada accion de merma exige idempotencyKey diferente");
      }
      operationIds.add(accion.operationId);
      idempotencyKeys.add(accion.idempotencyKey);
      if (accion.registradaAt < fechaAnterior) {
        errores.push("las acciones de merma deben conservar orden temporal");
      }
      fechaAnterior = accion.registradaAt;
    }
    if (merma.updatedAt < fechaAnterior) {
      errores.push("merma.updatedAt no puede ser anterior a una accion");
    }

    const accionVigente =
      merma.estado === EstadoAprobacionInventario.BORRADOR
        ? flujo.creacion
        : merma.estado === EstadoAprobacionInventario.PENDIENTE_APROBACION
          ? flujo.solicitud
          : merma.estado === EstadoAprobacionInventario.APROBADO
            ? flujo.aprobacion
            : merma.estado === EstadoAprobacionInventario.RECHAZADO
              ? flujo.rechazo
              : merma.estado === EstadoAprobacionInventario.APLICADO
                ? flujo.aplicacion
                : flujo.cancelacion;
    if (
      accionVigente &&
      (merma.operationId !== accionVigente.operationId ||
        merma.idempotencyKey !== accionVigente.idempotencyKey)
    ) {
      errores.push("merma operationId/idempotencyKey deben reflejar la accion vigente");
    }

    if (flujo.solicitud) {
      if (
        !mismoActorMerma(
          flujo.solicitud.actor,
          merma.aprobacion.solicitadoPor,
        ) || flujo.solicitud.registradaAt !== merma.aprobacion.solicitadoAt
      ) {
        errores.push("merma.aprobacion no concilia con flujo.solicitud");
      }
    }
    if (flujo.aprobacion) {
      if (
        !mismoActorMerma(
          flujo.aprobacion.actor,
          merma.aprobacion.aprobadoPor,
        ) || flujo.aprobacion.registradaAt !== merma.aprobacion.aprobadoAt
      ) {
        errores.push("merma.aprobacion no concilia con flujo.aprobacion");
      }
    }
    if (flujo.rechazo) {
      if (
        !mismoActorMerma(flujo.rechazo.actor, merma.aprobacion.rechazadoPor) ||
        flujo.rechazo.registradaAt !== merma.aprobacion.rechazadoAt
      ) {
        errores.push("merma.aprobacion no concilia con flujo.rechazo");
      }
    }

    const movimientoEsperado = esTextoNoVacio(merma.id)
      ? construirIdMovimientoMermaInventarioV2(merma.id)
      : undefined;
    switch (merma.estado) {
      case EstadoAprobacionInventario.BORRADOR:
        if (
          merma.version !== 1 ||
          flujo.solicitud ||
          flujo.aprobacion ||
          flujo.rechazo ||
          flujo.aplicacion ||
          flujo.cancelacion ||
          merma.movimientoInventarioId
        ) {
          errores.push("merma BORRADOR auditada solo admite creacion/version 1");
        }
        break;
      case EstadoAprobacionInventario.PENDIENTE_APROBACION:
        if (
          merma.version !== 2 ||
          !flujo.solicitud ||
          flujo.aprobacion ||
          flujo.rechazo ||
          flujo.aplicacion ||
          flujo.cancelacion ||
          merma.movimientoInventarioId
        ) {
          errores.push("merma PENDIENTE_APROBACION exige solicitud/version 2");
        }
        break;
      case EstadoAprobacionInventario.APROBADO:
        if (
          merma.version !== 3 ||
          !flujo.solicitud ||
          !flujo.aprobacion ||
          flujo.rechazo ||
          flujo.aplicacion ||
          flujo.cancelacion ||
          merma.movimientoInventarioId
        ) {
          errores.push("merma APROBADO exige aprobacion/version 3 y aun no mueve stock");
        }
        break;
      case EstadoAprobacionInventario.RECHAZADO:
        if (
          merma.version !== 3 ||
          !flujo.solicitud ||
          flujo.aprobacion ||
          !flujo.rechazo ||
          flujo.aplicacion ||
          flujo.cancelacion ||
          merma.movimientoInventarioId
        ) {
          errores.push("merma RECHAZADO exige rechazo/version 3 y no mueve stock");
        }
        break;
      case EstadoAprobacionInventario.APLICADO:
        if (
          merma.version !== 4 ||
          !flujo.solicitud ||
          !flujo.aprobacion ||
          flujo.rechazo ||
          !flujo.aplicacion ||
          flujo.cancelacion ||
          merma.movimientoInventarioId !== movimientoEsperado
        ) {
          errores.push(
            "merma APLICADO exige aprobacion, aplicacion/version 4 y movimiento determinista",
          );
        }
        break;
      case EstadoAprobacionInventario.CANCELADO: {
        const versionEsperada = flujo.solicitud ? 3 : 2;
        if (
          merma.version !== versionEsperada ||
          flujo.aprobacion ||
          flujo.rechazo ||
          flujo.aplicacion ||
          !flujo.cancelacion ||
          merma.movimientoInventarioId
        ) {
          errores.push("merma CANCELADO exige cancelacion antes de decidir/aplicar");
        }
        break;
      }
    }
  }

  if (!Number.isSafeInteger(merma.createdAt) || merma.createdAt <= 0) {
    errores.push("merma.createdAt es invalido");
  }
  if (!Number.isSafeInteger(merma.updatedAt) || merma.updatedAt <= 0) {
    errores.push("merma.updatedAt es invalido");
  }
  if (merma.updatedAt < merma.createdAt) {
    errores.push("merma.updatedAt no puede ser anterior a createdAt");
  }
  return resultado(errores);
};

export const validarMermaInventarioConPolitica = (
  merma: MermaInventario,
  politica: PoliticaInventarioResuelta,
): ResultadoValidacionInventario => {
  const errores = [...validarMermaInventario(merma).errores];
  if (
    politica.requiereEvidenciaMerma &&
    (!Array.isArray(merma.evidenciaIds) || merma.evidenciaIds.length === 0)
  ) {
    errores.push("la politica exige evidencia para registrar la merma");
  }
  return resultado(errores);
};

const serializarMermaEstable = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => serializarMermaEstable(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${serializarMermaEstable(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const transicionesMerma: Record<
  EstadoAprobacionInventario,
  readonly EstadoAprobacionInventario[]
> = {
  [EstadoAprobacionInventario.BORRADOR]: [
    EstadoAprobacionInventario.PENDIENTE_APROBACION,
    EstadoAprobacionInventario.CANCELADO,
  ],
  [EstadoAprobacionInventario.PENDIENTE_APROBACION]: [
    EstadoAprobacionInventario.APROBADO,
    EstadoAprobacionInventario.RECHAZADO,
    EstadoAprobacionInventario.CANCELADO,
  ],
  [EstadoAprobacionInventario.APROBADO]: [
    EstadoAprobacionInventario.APLICADO,
  ],
  [EstadoAprobacionInventario.RECHAZADO]: [],
  [EstadoAprobacionInventario.APLICADO]: [],
  [EstadoAprobacionInventario.CANCELADO]: [],
};

export const puedeTransicionarMermaInventario = (
  estadoActual: EstadoAprobacionInventario,
  estadoDestino: EstadoAprobacionInventario,
): boolean => transicionesMerma[estadoActual]?.includes(estadoDestino) ?? false;

export const validarEvolucionMermaInventario = (
  actual: MermaInventario,
  candidata: MermaInventario,
): ResultadoValidacionInventario => {
  const errores = [
    ...validarMermaInventario(actual).errores.map((error) => `actual.${error}`),
    ...validarMermaInventario(candidata).errores.map(
      (error) => `candidata.${error}`,
    ),
  ];
  if (errores.length > 0) return resultado(errores);
  if (!actual.flujo || actual.version === undefined || !candidata.flujo || candidata.version === undefined) {
    errores.push("una evolucion nueva exige flujo auditado y version");
    return resultado(errores);
  }
  if (serializarMermaEstable(actual) === serializarMermaEstable(candidata)) {
    return resultado([]);
  }
  if (actual.version === candidata.version) {
    errores.push("la misma version de merma solo admite un replay identico");
    return resultado(errores);
  }
  if (candidata.version !== actual.version + 1) {
    errores.push("merma.version debe incrementar exactamente en uno");
  }
  if (!puedeTransicionarMermaInventario(actual.estado, candidata.estado)) {
    errores.push(`transicion de merma no permitida: ${actual.estado} -> ${candidata.estado}`);
  }
  for (const campo of [
    "id",
    "type",
    "schemaVersion",
    "empresaId",
    "almacenId",
    "lineas",
    "evidenciaIds",
    "createdAt",
  ] as const) {
    if (
      serializarMermaEstable(actual[campo]) !==
      serializarMermaEstable(candidata[campo])
    ) {
      errores.push(`merma.${campo} es inmutable despues de crear`);
    }
  }
  for (const campo of [
    "creacion",
    "solicitud",
    "aprobacion",
    "rechazo",
    "aplicacion",
    "cancelacion",
  ] as const) {
    if (
      actual.flujo[campo] !== undefined &&
      serializarMermaEstable(actual.flujo[campo]) !==
        serializarMermaEstable(candidata.flujo[campo])
    ) {
      errores.push(`merma.flujo.${campo} es append-only`);
    }
  }
  const agregadas = [
    "solicitud",
    "aprobacion",
    "rechazo",
    "aplicacion",
    "cancelacion",
  ].filter(
    (campo) =>
      actual.flujo?.[campo as keyof typeof actual.flujo] === undefined &&
      candidata.flujo?.[campo as keyof typeof candidata.flujo] !== undefined,
  );
  if (agregadas.length !== 1) {
    errores.push("cada evolucion de merma debe anexar exactamente una accion");
  } else {
    const accion = candidata.flujo[
      agregadas[0] as keyof typeof candidata.flujo
    ] as AccionVersionadaMermaInventarioSnapshot;
    if (accion.expectedVersion !== actual.version) {
      errores.push("la accion de merma tiene expectedVersion obsoleta");
    }
  }
  if (candidata.updatedAt < actual.updatedAt) {
    errores.push("merma.updatedAt no puede retroceder");
  }
  return resultado(errores);
};

/**
 * Construye la unica salida posible al aplicar una merma previamente aprobada.
 * El adapter persiste candidata + movimiento + proyeccion atomica y deduplica
 * por ID/idempotencyKey.
 */
export const construirMovimientoAplicacionMermaInventarioV2 = (
  actualAprobada: MermaInventario,
  candidataAplicada: MermaInventario,
): MovimientoInventarioV2 => {
  const evolucion = validarEvolucionMermaInventario(
    actualAprobada,
    candidataAplicada,
  );
  if (
    !evolucion.valido ||
    actualAprobada.estado !== EstadoAprobacionInventario.APROBADO ||
    candidataAplicada.estado !== EstadoAprobacionInventario.APLICADO ||
    !candidataAplicada.flujo?.aplicacion ||
    !candidataAplicada.flujo.aprobacion ||
    !candidataAplicada.movimientoInventarioId
  ) {
    throw new Error(
      evolucion.valido
        ? "la salida de merma exige transicion APROBADO -> APLICADO"
        : evolucion.errores.join("; "),
    );
  }
  const aplicacion = candidataAplicada.flujo.aplicacion;
  const items: MovimientoInventarioV2Linea[] = candidataAplicada.lineas.map(
    (linea) => ({
      id: `${linea.id}:salida`,
      productoBaseId: linea.productoBaseId,
      almacenId: candidataAplicada.almacenId,
      cantidadOperacion: linea.cantidadOperacion,
      conversionSnapshot: linea.conversionSnapshot,
      cantidadBaseDelta: -linea.cantidadBase,
      unidadBase: linea.unidadBase,
      costoUnitarioBase: linea.costoUnitarioBaseSnapshot,
      lote: linea.lote,
    }),
  );
  return {
    id: candidataAplicada.movimientoInventarioId!,
    type: MOVIMIENTO_INVENTARIO_TYPE,
    schemaVersion: INVENTORY_V2_SCHEMA_VERSION,
    estado: "APLICADO",
    tipo: TipoMovimientoInventarioV2.SALIDA,
    almacenId: candidataAplicada.almacenId,
    origen: {
      tipo: OrigenMovimientoInventarioV2.MERMA,
      documentoId: candidataAplicada.id,
    },
    items,
    operationId: aplicacion.operationId,
    idempotencyKey: `${aplicacion.idempotencyKey}:movimiento_salida`,
    correlationId: candidataAplicada.id,
    causationId: candidataAplicada.flujo.aprobacion.operationId,
    motivoCodigo: "MERMA_APROBADA",
    evidenciaIds: candidataAplicada.evidenciaIds,
    actor: aplicacion.actor,
    fechaEfectiva: aplicacion.registradaAt,
    registradoAt: aplicacion.registradaAt,
  };
};
