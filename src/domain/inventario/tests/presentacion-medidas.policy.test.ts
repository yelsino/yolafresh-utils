import assert from "node:assert/strict";
import { test } from "node:test";
import { validarCambioMedidasPresentacion, validarMedidasPresentacion,
  obtenerUnidadesContenidoPresentacion } from "../services/presentacion-medidas.policy";

const unidad = { productoBaseId: "6ac08610-cddd-40d8-b041-aef15d2a85e0",
  unidadBaseInventario: "unidad", tipoVenta: "unidad", contenidoNeto: 1,
  unidadContenido: "unidad", equivalenciaUnidadBase: 1 };

test("rechaza peso sobre piezas y docenas con factor uno", () => {
  assert.equal(validarMedidasPresentacion({ ...unidad, tipoVenta: "peso",
    unidadContenido: "kilogramo" }).valido, false);
  const docena = validarMedidasPresentacion({ ...unidad, unidadContenido: "docena" });
  assert.equal(docena.valido, false);
  assert.equal(docena.equivalenciaCalculada, 12);
  assert.equal(validarMedidasPresentacion({ ...unidad, contenidoNeto: 12,
    unidadContenido: "docena", equivalenciaUnidadBase: 12 }).valido, false);
});

test("convierte medidas compatibles sin exigir que tengan el mismo nombre", () => {
  for (const [base, medida, neto, factor] of [
    ["unidad", "docena", 2, 24], ["kilogramo", "gramo", 500, 0.5],
    ["kilogramo", "libra", 1, 0.45359237], ["litro", "mililitro", 750, 0.75],
    ["metro", "centimetro", 50, 0.5], ["kilogramo", "kilogramo", 60, 60],
  ] as const) {
    const entrada = { ...unidad, unidadBaseInventario: base, unidadContenido: medida,
      contenidoNeto: neto, equivalenciaUnidadBase: factor };
    assert.equal(validarMedidasPresentacion(entrada).valido, true);
    assert.equal(validarMedidasPresentacion({ ...entrada, equivalenciaUnidadBase: factor * 2 }).valido, false);
  }
});

test("no inventa densidades ni equivalencias regionales", () => {
  for (const medida of ["litro", "docena", "saco", "bolsa", "arroba", "quintal", "galon"]) {
    assert.equal(validarMedidasPresentacion({ ...unidad, unidadBaseInventario: "kilogramo",
      unidadContenido: medida }).valido, false);
  }
});

test("conserva empaques fijos contados por piezas sin convertir mililitros a unidades", () => {
  const botella = { ...unidad, unidadContenido: "mililitro", contenidoNeto: 500,
    tipoEmpaque: "botella" };
  assert.deepEqual(validarMedidasPresentacion(botella), { valido: true, errores: [],
    equivalenciaCalculada: undefined, requiereEquivalenciaExplicita: true });
  assert.equal(validarMedidasPresentacion({ ...botella, tipoEmpaque: undefined }).valido, false);
  assert.equal(validarMedidasPresentacion({ ...botella, tipoVenta: "volumen" }).valido, false);
  assert.equal(validarMedidasPresentacion({ ...botella, equivalenciaUnidadBase: 0.5 }).valido, false);
});

test("rechaza valores ausentes, no finitos y factores falsos sin modificar la entrada", () => {
  for (const n of [0, -1, Infinity, NaN, "1", undefined]) {
    assert.equal(validarMedidasPresentacion({ ...unidad, contenidoNeto: n }).valido, false);
    assert.equal(validarMedidasPresentacion({ ...unidad, equivalenciaUnidadBase: n }).valido, false);
  }
  const entrada = Object.freeze({ ...unidad });
  assert.equal(validarMedidasPresentacion(entrada).valido, true);
  assert.equal(validarMedidasPresentacion({}).valido, false);
});

test("la compatibilidad histórica no permite crear ni alterar medidas inválidas", () => {
  const heredada = { ...unidad, tipoVenta: "peso", unidadContenido: "kilogramo" };
  assert.equal(validarCambioMedidasPresentacion(heredada, { ...heredada }).valido, true);
  assert.equal(validarCambioMedidasPresentacion(null, heredada).valido, false);
  assert.equal(validarCambioMedidasPresentacion(heredada, { ...heredada, contenidoNeto: 2 }).valido, false);
  assert.equal(validarCambioMedidasPresentacion(heredada, { ...heredada, productoBaseId: "otro-id-opaco" }).valido, false);
});

test("las opciones nuevas se derivan de la misma regla", () => {
  assert.deepEqual(obtenerUnidadesContenidoPresentacion("unidad"), ["unidad", "docena"]);
  assert.ok(obtenerUnidadesContenidoPresentacion("kilogramo").includes("gramo" as never));
  assert.ok(!obtenerUnidadesContenidoPresentacion("kilogramo").includes("litro" as never));
  assert.ok(obtenerUnidadesContenidoPresentacion("unidad", "botella").includes("mililitro" as never));
});
