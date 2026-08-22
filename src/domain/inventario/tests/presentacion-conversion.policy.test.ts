import assert from "node:assert/strict";
import test from "node:test";

import {
  TipoVentaEnum,
  UnidadMedidaEnum,
  VERSION_CONVERSION_PRESENTACION_INICIAL,
  aplicarVersionConversionPresentacion,
  calcularVersionConversionPresentacion,
  crearVersionConversionPresentacion,
  esMismaConversionSemanticaPresentacion,
  esVersionConversionPresentacionValida,
  incrementarVersionConversionPresentacion,
  normalizarPresentacionLegacy,
  validarTransicionVersionConversionPresentacion,
  type Presentacion,
  type PresentacionLegacyInput,
} from "../index";

const ahora = 1_787_256_000_000;

const buildLegacy = (
  cambios: Partial<PresentacionLegacyInput> = {},
): PresentacionLegacyInput => ({
  id: "presentacion_arroz_5kg",
  type: "presentacion",
  productoBaseId: "producto_arroz",
  nombre: "Bolsa de arroz 5 kg",
  precioVenta: 24.9,
  tipoVenta: TipoVentaEnum.Unidad,
  contenidoNeto: 5,
  unidadContenido: UnidadMedidaEnum.Kilogramo,
  equivalenciaUnidadBase: 5,
  unidadBaseInventario: "kilogramo",
  fraccionable: false,
  visibleEnPOS: true,
  visibleOnline: true,
  createdAt: ahora,
  updatedAt: ahora,
  ...cambios,
});

const buildPresentacion = (
  cambios: Partial<Presentacion> = {},
): Presentacion => ({
  ...buildLegacy(),
  versionConversion: 3,
  ...cambios,
});

test("normaliza solo la ausencia legacy a la versión inicial", () => {
  const normalizada = normalizarPresentacionLegacy(buildLegacy());

  assert.equal(
    normalizada.versionConversion,
    VERSION_CONVERSION_PRESENTACION_INICIAL,
  );
  assert.equal(normalizarPresentacionLegacy(buildLegacy({ versionConversion: 7 })).versionConversion, 7);
  assert.equal(crearVersionConversionPresentacion(), 1);
});

test("rechaza una versión legacy presente pero inválida", () => {
  for (const invalida of [null, 0, -1, 1.5, Number.NaN, "1"]) {
    assert.equal(esVersionConversionPresentacionValida(invalida), false);
    assert.throws(
      () => normalizarPresentacionLegacy(buildLegacy({ versionConversion: invalida })),
      /entero positivo seguro/,
    );
  }
});

test("creación inicia en 1 y cambios cosméticos conservan la versión", () => {
  const actual = buildPresentacion();
  const cosmetica = buildPresentacion({
    nombre: "Arroz extra 5 kg",
    precioVenta: 26.5,
    visibleEnPOS: false,
  });

  assert.equal(calcularVersionConversionPresentacion(undefined, cosmetica), 1);
  assert.equal(esMismaConversionSemanticaPresentacion(actual, cosmetica), true);
  assert.equal(calcularVersionConversionPresentacion(actual, cosmetica), 3);
  assert.equal(
    aplicarVersionConversionPresentacion(actual, cosmetica).versionConversion,
    3,
  );
});

test("cada cambio semántico incrementa exactamente una versión", () => {
  const actual = buildPresentacion();
  const cambios: Presentacion[] = [
    buildPresentacion({ equivalenciaUnidadBase: 6 }),
    buildPresentacion({ productoBaseId: "producto_arroz_integral" }),
    buildPresentacion({ unidadBaseInventario: "unidad" }),
  ];

  for (const candidata of cambios) {
    assert.equal(esMismaConversionSemanticaPresentacion(actual, candidata), false);
    assert.equal(calcularVersionConversionPresentacion(actual, candidata), 4);
    assert.equal(
      aplicarVersionConversionPresentacion(actual, candidata).versionConversion,
      4,
    );
  }
});

test("cambio de unidad base del producto padre incrementa cada hija", () => {
  const actual = buildPresentacion();

  assert.equal(incrementarVersionConversionPresentacion(actual), 4);
  assert.equal(incrementarVersionConversionPresentacion(3), 4);
  assert.throws(
    () => incrementarVersionConversionPresentacion(0),
    /entero positivo seguro/,
  );
  assert.throws(
    () => incrementarVersionConversionPresentacion(Number.MAX_SAFE_INTEGER),
    /entero positivo seguro/,
  );
});

test("acepta únicamente la versión esperada para cada transición", () => {
  const actual = buildPresentacion();
  const cosmetica = buildPresentacion({ nombre: "Nombre nuevo" });
  const conversion = buildPresentacion({
    equivalenciaUnidadBase: 6,
    versionConversion: 4,
  });

  assert.deepEqual(validarTransicionVersionConversionPresentacion(actual, cosmetica), {
    valido: true,
    errores: [],
    cambioSemantico: false,
    versionEsperada: 3,
  });
  assert.deepEqual(validarTransicionVersionConversionPresentacion(actual, conversion), {
    valido: true,
    errores: [],
    cambioSemantico: true,
    versionEsperada: 4,
  });
});

test("rechaza versión inválida, regresión, salto y versión cosmética alterada", () => {
  const actual = buildPresentacion();
  const casos = [
    {
      candidata: { ...buildPresentacion(), versionConversion: 0 },
      error: /entero positivo seguro/,
    },
    {
      candidata: buildPresentacion({ versionConversion: 2 }),
      error: /no puede retroceder/,
    },
    {
      candidata: buildPresentacion({
        equivalenciaUnidadBase: 6,
        versionConversion: 3,
      }),
      error: /incrementar exactamente en uno/,
    },
    {
      candidata: buildPresentacion({
        equivalenciaUnidadBase: 6,
        versionConversion: 5,
      }),
      error: /incrementar exactamente en uno/,
    },
    {
      candidata: buildPresentacion({ versionConversion: 4 }),
      error: /conservarse sin cambio semántico/,
    },
  ];

  for (const caso of casos) {
    const resultado = validarTransicionVersionConversionPresentacion(
      actual,
      caso.candidata,
    );
    assert.equal(resultado.valido, false);
    assert.match(resultado.errores.join("; "), caso.error);
  }
});
