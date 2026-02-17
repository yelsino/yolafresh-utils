import {
  Almacen,
  EstadoMovimientoEnum,
  KardexLinea,
  MovimientoInventario,
  MovimientoInventarioItem,
  StockLote,
  StockProductoAlmacen,
  TipoMovimientoInventarioEnum,
} from "@/interfaces";

type ResultadoLinea = {
  stock: StockProductoAlmacen;
  kardex: KardexLinea;
};

export class MovimientoInventarioProcessor {
  static aplicar(data: {
    movimiento: MovimientoInventario;
    stocksActuales: StockProductoAlmacen[];
    almacenes: Almacen[];
    now?: Date;
  }): {
    stocksActualizados: StockProductoAlmacen[];
    kardexLineas: KardexLinea[];
  } {
    this.validarMovimiento(data.movimiento);

    const documento =
      data.movimiento.documentoReferenciaId ?? data.movimiento._id;
    const fechaMovimiento = data.movimiento.fechaMovimiento;

    const stockMap = new Map<string, StockProductoAlmacen>();
    const inputOrder: string[] = [];
    data.stocksActuales.forEach((s) => {
      const key = this.stockKey(s.productoId, s.almacenId);
      inputOrder.push(key);
      stockMap.set(key, this.clonarStock(s));
    });

    const almacenesPorId = new Map<string, Almacen>();
    data.almacenes.forEach((almacen) =>
      almacenesPorId.set(almacen._id, almacen),
    );

    const kardexLineas: KardexLinea[] = [];

    const agregarResultado = (resultado: ResultadoLinea) => {
      const key = this.stockKey(
        resultado.stock.productoId,
        resultado.stock.almacenId,
      );
      if (!stockMap.has(key)) inputOrder.push(key);
      stockMap.set(key, resultado.stock);
      kardexLineas.push(resultado.kardex);
    };

    const tipo = data.movimiento.tipo;

    if (tipo === TipoMovimientoInventarioEnum.ENTRADA) {
      const almacenId = this.requerirAlmacenDestinoId(data.movimiento);
      const almacen = this.requerirAlmacen(almacenesPorId, almacenId);
      data.movimiento.items.forEach((item) => {
        agregarResultado(
          this.procesarEntrada({
            item,
            almacen,
            almacenId,
            documento,
            fechaMovimiento,
            stockMap,
          }),
        );
      });
    } else if (tipo === TipoMovimientoInventarioEnum.SALIDA) {
      const almacenId = this.requerirAlmacenOrigenId(data.movimiento);
      const almacen = this.requerirAlmacen(almacenesPorId, almacenId);
      data.movimiento.items.forEach((item) => {
        agregarResultado(
          this.procesarSalida({
            item,
            almacen,
            almacenId,
            documento,
            fechaMovimiento,
            stockMap,
          }),
        );
      });
    } else if (tipo === TipoMovimientoInventarioEnum.TRANSFERENCIA) {
      const origenId = this.requerirAlmacenOrigenId(data.movimiento);
      const destinoId = this.requerirAlmacenDestinoId(data.movimiento);
      const almacenOrigen = this.requerirAlmacen(almacenesPorId, origenId);
      const almacenDestino = this.requerirAlmacen(almacenesPorId, destinoId);
      data.movimiento.items.forEach((item) => {
        const salida = this.procesarSalida({
          item: { ...item, cantidad: Math.abs(item.cantidad) },
          almacen: almacenOrigen,
          almacenId: origenId,
          documento,
          fechaMovimiento,
          stockMap,
        });
        agregarResultado(salida);
        const entrada = this.procesarEntrada({
          item: {
            ...item,
            cantidad: Math.abs(item.cantidad),
            costoUnitario: salida.kardex.costoUnitario,
          },
          almacen: almacenDestino,
          almacenId: destinoId,
          documento,
          fechaMovimiento,
          stockMap,
        });
        agregarResultado(entrada);
      });
    } else if (tipo === TipoMovimientoInventarioEnum.AJUSTE) {
      data.movimiento.items.forEach((item) => {
        if (item.cantidad === 0) {
          throw new Error("Un ajuste no puede tener cantidad 0");
        }
        if (item.cantidad > 0) {
          const almacenId = this.requerirAlmacenDestinoId(data.movimiento);
          const almacen = this.requerirAlmacen(almacenesPorId, almacenId);
          agregarResultado(
            this.procesarEntrada({
              item,
              almacen,
              almacenId,
              documento,
              fechaMovimiento,
              stockMap,
            }),
          );
        } else {
          const almacenId = this.requerirAlmacenOrigenId(data.movimiento);
          const almacen = this.requerirAlmacen(almacenesPorId, almacenId);
          agregarResultado(
            this.procesarSalida({
              item: { ...item, cantidad: Math.abs(item.cantidad) },
              almacen,
              almacenId,
              documento,
              fechaMovimiento,
              stockMap,
            }),
          );
        }
      });
    } else {
      throw new Error("Tipo de movimiento no soportado");
    }

    const stocksActualizados = inputOrder
      .map((key) => stockMap.get(key))
      .filter((s): s is StockProductoAlmacen => Boolean(s));

    return { stocksActualizados, kardexLineas };
  }

  private static validarMovimiento(movimiento: MovimientoInventario): void {
    if (movimiento.estado !== EstadoMovimientoEnum.APLICADO) {
      throw new Error("El movimiento debe estar APLICADO para procesar stock");
    }
    if (!movimiento.items.length) {
      throw new Error("El movimiento debe contener al menos un item");
    }

    const tipo = movimiento.tipo;
    if (tipo === TipoMovimientoInventarioEnum.ENTRADA) {
      this.requerirAlmacenDestinoId(movimiento);
    } else if (tipo === TipoMovimientoInventarioEnum.SALIDA) {
      this.requerirAlmacenOrigenId(movimiento);
    } else if (tipo === TipoMovimientoInventarioEnum.TRANSFERENCIA) {
      this.requerirAlmacenOrigenId(movimiento);
      this.requerirAlmacenDestinoId(movimiento);
    } else if (tipo === TipoMovimientoInventarioEnum.AJUSTE) {
      if (!movimiento.almacenOrigenId && !movimiento.almacenDestinoId) {
        throw new Error("Un ajuste requiere almacén origen o destino");
      }
    }

    movimiento.items.forEach((item) => {
      if (tipo === TipoMovimientoInventarioEnum.AJUSTE) {
        if (item.cantidad === 0)
          throw new Error("Un ajuste no puede tener cantidad 0");
        return;
      }
      if (item.cantidad <= 0) throw new Error("La cantidad debe ser mayor a 0");
    });
  }

  private static procesarEntrada(data: {
    item: MovimientoInventarioItem;
    almacen: Almacen;
    almacenId: string;
    documento: string;
    fechaMovimiento: string;
    stockMap: Map<string, StockProductoAlmacen>;
  }): ResultadoLinea {
    const cantidad = this.validarCantidadPositiva(data.item.cantidad);
    const costoUnitario = data.item.costoUnitario;
    if (costoUnitario == null || Number.isNaN(Number(costoUnitario))) {
      throw new Error("CostoUnitario es requerido para ENTRADA");
    }

    const stockActual = this.getOrCreateStock(
      data.stockMap,
      data.item.productoId,
      data.almacenId,
      data.documento,
    );

    if (data.almacen.permitirLotes) {
      this.aplicarEntradaLote({
        stock: stockActual,
        lote: data.item.lote,
        fechaVencimiento: data.item.fechaVencimiento,
        cantidad,
      });
    }

    const nuevoStockActual = stockActual.stockActual + cantidad;
    const nuevoValorInventario =
      stockActual.valorInventario + cantidad * costoUnitario;
    const nuevoCostoPromedio =
      nuevoStockActual === 0 ? 0 : nuevoValorInventario / nuevoStockActual;

    const actualizado: StockProductoAlmacen = {
      ...stockActual,
      stockActual: nuevoStockActual,
      stockDisponible: this.calcularDisponible(
        nuevoStockActual,
        stockActual.stockReservado,
      ),
      valorInventario: nuevoValorInventario,
      costoPromedioActual: nuevoCostoPromedio,
      ultimoMovimiento: data.documento,
    };

    const kardex: KardexLinea = {
      fechaMovimiento: data.fechaMovimiento,
      documento: data.documento,
      tipo: "ENTRADA",
      cantidadEntrada: cantidad,
      cantidadSalida: 0,
      costoUnitario,
      costoTotal: cantidad * costoUnitario,
      stockFinal: actualizado.stockActual,
      costoPromedioFinal: actualizado.costoPromedioActual,
      saldoCostoTotal: actualizado.valorInventario,
    };

    return { stock: actualizado, kardex };
  }

  private static procesarSalida(data: {
    item: MovimientoInventarioItem;
    almacen: Almacen;
    almacenId: string;
    documento: string;
    fechaMovimiento: string;
    stockMap: Map<string, StockProductoAlmacen>;
  }): ResultadoLinea {
    const cantidad = this.validarCantidadPositiva(data.item.cantidad);
    const stockActual = this.getOrCreateStock(
      data.stockMap,
      data.item.productoId,
      data.almacenId,
      data.documento,
    );

    if (!data.almacen.permitirNegativos && stockActual.stockActual < cantidad) {
      throw new Error("Stock negativo no permitido");
    }

    if (data.almacen.permitirLotes) {
      this.aplicarSalidaLote({
        stock: stockActual,
        lote: data.item.lote,
        cantidad,
        permitirNegativos: data.almacen.permitirNegativos,
      });
    }

    const costoUnitario = stockActual.costoPromedioActual;
    const costoTotal = cantidad * costoUnitario;
    const nuevoStockActual = stockActual.stockActual - cantidad;
    const nuevoValorInventario =
      nuevoStockActual === 0 ? 0 : stockActual.valorInventario - costoTotal;
    const nuevoCostoPromedio =
      nuevoStockActual === 0 ? 0 : stockActual.costoPromedioActual;

    const actualizado: StockProductoAlmacen = {
      ...stockActual,
      stockActual: nuevoStockActual,
      stockDisponible: this.calcularDisponible(
        nuevoStockActual,
        stockActual.stockReservado,
      ),
      valorInventario: nuevoValorInventario,
      costoPromedioActual: nuevoCostoPromedio,
      ultimoMovimiento: data.documento,
    };

    const kardex: KardexLinea = {
      fechaMovimiento: data.fechaMovimiento,
      documento: data.documento,
      tipo: "SALIDA",
      cantidadEntrada: 0,
      cantidadSalida: cantidad,
      costoUnitario,
      costoTotal,
      stockFinal: actualizado.stockActual,
      costoPromedioFinal: actualizado.costoPromedioActual,
      saldoCostoTotal: actualizado.valorInventario,
    };

    return { stock: actualizado, kardex };
  }

  private static aplicarEntradaLote(data: {
    stock: StockProductoAlmacen;
    lote?: string;
    fechaVencimiento?: string;
    cantidad: number;
  }): void {
    if (!data.lote) {
      throw new Error(
        "Se requiere lote para ENTRADA en almacén con lotes habilitados",
      );
    }
    const lotes = data.stock.lotes
      ? data.stock.lotes.map((l) => ({ ...l }))
      : [];
    const index = lotes.findIndex((l) => l.lote === data.lote);
    if (index >= 0) {
      lotes[index] = {
        ...lotes[index],
        cantidad: lotes[index].cantidad + data.cantidad,
        fechaVencimiento:
          data.fechaVencimiento ?? lotes[index].fechaVencimiento,
      };
    } else {
      const nuevoLote: StockLote = {
        lote: data.lote,
        fechaVencimiento: data.fechaVencimiento,
        cantidad: data.cantidad,
      };
      lotes.push(nuevoLote);
    }
    data.stock.lotes = lotes;
  }

  private static aplicarSalidaLote(data: {
    stock: StockProductoAlmacen;
    lote?: string;
    cantidad: number;
    permitirNegativos: boolean;
  }): void {
    if (!data.lote) {
      throw new Error(
        "Se requiere lote para SALIDA en almacén con lotes habilitados",
      );
    }
    const lotes = data.stock.lotes
      ? data.stock.lotes.map((l) => ({ ...l }))
      : [];
    const index = lotes.findIndex((l) => l.lote === data.lote);
    if (index < 0) throw new Error("Lote no encontrado en stock");
    const disponible = lotes[index].cantidad;
    if (!data.permitirNegativos && disponible < data.cantidad) {
      throw new Error("Stock de lote insuficiente");
    }
    const nuevo = disponible - data.cantidad;
    lotes[index] = { ...lotes[index], cantidad: nuevo };
    data.stock.lotes = lotes.filter((l) => l.cantidad !== 0);
  }

  private static getOrCreateStock(
    stockMap: Map<string, StockProductoAlmacen>,
    productoId: string,
    almacenId: string,
    documento: string,
  ): StockProductoAlmacen {
    const key = this.stockKey(productoId, almacenId);
    const existing = stockMap.get(key);
    if (existing) return this.clonarStock(existing);
    return {
      productoId,
      almacenId,
      stockActual: 0,
      stockDisponible: 0,
      costoPromedioActual: 0,
      valorInventario: 0,
      ultimoMovimiento: documento,
      lotes: [],
    };
  }

  private static requerirAlmacen(
    almacenesPorId: Map<string, Almacen>,
    almacenId: string,
  ): Almacen {
    const almacen = almacenesPorId.get(almacenId);
    if (!almacen) throw new Error("Almacén no encontrado");
    if (!almacen.activo) throw new Error("El almacén no está activo");
    return almacen;
  }

  private static requerirAlmacenDestinoId(
    movimiento: MovimientoInventario,
  ): string {
    if (!movimiento.almacenDestinoId) {
      throw new Error("El movimiento requiere almacenDestinoId");
    }
    return movimiento.almacenDestinoId;
  }

  private static requerirAlmacenOrigenId(
    movimiento: MovimientoInventario,
  ): string {
    if (!movimiento.almacenOrigenId) {
      throw new Error("El movimiento requiere almacenOrigenId");
    }
    return movimiento.almacenOrigenId;
  }

  private static validarCantidadPositiva(cantidad: number): number {
    if (cantidad <= 0) throw new Error("La cantidad debe ser mayor a 0");
    return cantidad;
  }

  private static calcularDisponible(
    stockActual: number,
    stockReservado?: number,
  ): number {
    return stockActual - (stockReservado ?? 0);
  }

  private static stockKey(productoId: string, almacenId: string): string {
    return `${productoId}_${almacenId}`;
  }

  private static clonarStock(
    stock: StockProductoAlmacen,
  ): StockProductoAlmacen {
    return {
      ...stock,
      lotes: stock.lotes ? stock.lotes.map((l) => ({ ...l })) : stock.lotes,
    };
  }
}
