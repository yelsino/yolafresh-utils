"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarModificadoresRestaurante = validarModificadoresRestaurante;
exports.validarRutasPreparacionRestaurante = validarRutasPreparacionRestaurante;
exports.validarProductoRestaurante = validarProductoRestaurante;
exports.crearClaveLineaPedidoRestaurante = crearClaveLineaPedidoRestaurante;
function validarModificadoresRestaurante(groups, selections) {
    const errors = [];
    for (const group of groups) {
        const selected = selections.filter((item) => item.grupoId === group.id);
        const count = selected.reduce((total, item) => total + item.cantidad, 0);
        if (count < group.minimoSelecciones) {
            errors.push(`${group.nombre}: requiere al menos ${group.minimoSelecciones} seleccion(es)`);
        }
        if (count > group.maximoSelecciones) {
            errors.push(`${group.nombre}: permite como maximo ${group.maximoSelecciones} seleccion(es)`);
        }
        if (!group.permiteRepeticion && selected.some((item) => item.cantidad > 1)) {
            errors.push(`${group.nombre}: no permite repetir opciones`);
        }
        const options = new Map(group.opciones.map((option) => [option.id, option]));
        for (const selection of selected) {
            const option = options.get(selection.opcionId);
            if (!option || !option.activa) {
                errors.push(`${group.nombre}: contiene una opcion inexistente o inactiva`);
            }
            if (!Number.isInteger(selection.cantidad) || selection.cantidad <= 0) {
                errors.push(`${group.nombre}: la cantidad debe ser un entero positivo`);
            }
        }
    }
    const groupIds = new Set(groups.map((group) => group.id));
    if (selections.some((selection) => !groupIds.has(selection.grupoId))) {
        errors.push("Se recibio una seleccion para un grupo inexistente");
    }
    return { valid: errors.length === 0, errors };
}
function validarRutasPreparacionRestaurante(rutas, estacionesActivasIds) {
    const errors = [];
    if (rutas.length === 0)
        errors.push("El producto debe tener al menos una ruta de preparacion");
    const ids = new Set();
    for (const ruta of rutas) {
        if (!ruta.estacionPreparacionId.trim())
            errors.push("La ruta requiere una estacion");
        if (ids.has(ruta.estacionPreparacionId))
            errors.push("La estacion no puede repetirse en las rutas");
        ids.add(ruta.estacionPreparacionId);
        if (estacionesActivasIds && !estacionesActivasIds.has(ruta.estacionPreparacionId)) {
            errors.push(`La estacion ${ruta.estacionPreparacionId} no esta activa`);
        }
    }
    return { valid: errors.length === 0, errors };
}
function validarProductoRestaurante(product, estacionesActivasIds) {
    const errors = [...validarRutasPreparacionRestaurante(product.rutasPreparacion, estacionesActivasIds).errors];
    for (const group of product.gruposModificadores) {
        if (group.minimoSelecciones < 0 || group.maximoSelecciones < group.minimoSelecciones) {
            errors.push(`${group.nombre}: limites de seleccion invalidos`);
        }
    }
    return { valid: errors.length === 0, errors };
}
/** Clave de agrupacion: cualquier configuracion especial produce otra linea. */
function crearClaveLineaPedidoRestaurante(line) {
    var _a, _b, _c;
    const modifiers = [...line.modificadores]
        .sort((a, b) => `${a.grupoId}:${a.opcionId}`.localeCompare(`${b.grupoId}:${b.opcionId}`))
        .map((item) => `${item.grupoId}:${item.opcionId}:${item.cantidad}`)
        .join("|");
    const routes = [...line.rutasPreparacion]
        .sort((a, b) => a.estacionPreparacionId.localeCompare(b.estacionPreparacionId))
        .map((item) => `${item.estacionPreparacionId}:${item.modo}`)
        .join("|");
    return [
        line.productoRestauranteId,
        modifiers,
        ((_a = line.instrucciones) !== null && _a !== void 0 ? _a : "").trim().toLocaleLowerCase(),
        (_b = line.asiento) !== null && _b !== void 0 ? _b : "",
        (_c = line.curso) !== null && _c !== void 0 ? _c : "",
        routes,
    ].join("::");
}
