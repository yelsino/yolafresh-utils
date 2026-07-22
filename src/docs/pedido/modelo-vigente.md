# Modelo Vigente de Pedido

## Propósito

Este documento fija la lectura canónica del Domain `pedido` a partir de los contratos publicados hoy por `yolafresh-utils`.

## Conceptos principales

### `Pedido`

`Pedido` representa una reserva comercial activa o histórica hecha por un cliente.

Responsabilidades observadas:

- identificar la reserva;
- vincular cliente y responsable operativo;
- congelar items solicitados y avance de atención;
- modelar prioridad y procedencia;
- registrar fecha programada y vencimiento opcional;
- dejar trazabilidad de conversión hacia `Venta`.

No representa:

- cobro;
- pago;
- caja;
- facturación;
- salida de stock;
- entrega física final.

### `PedidoEntrega`

`PedidoEntrega` representa seguimiento operativo/logístico del pedido.

Responsabilidades observadas:

- expresar modalidad `RECOJO` o `DESPACHO`;
- indicar responsable operativo actual;
- registrar fecha programada, salida y entrega;
- mantener historial de estados y observaciones;
- comunicar progreso como preparación, despacho, ruta o entrega.

No representa:

- reserva comercial primaria;
- cobro;
- deuda;
- movimiento de inventario.

## Estados comerciales

### `PedidoState`

- `ABIERTO`
- `PARCIALMENTE_ATENDIDO`
- `ATENDIDO`
- `CONVERTIDO`
- `CANCELADO`
- `VENCIDO`

Lectura correcta:

- `ABIERTO`: pedido vigente y pendiente de atención total;
- `PARCIALMENTE_ATENDIDO`: una parte fue cubierta y otra queda pendiente;
- `ATENDIDO`: todo el pedido fue cubierto comercialmente, pero todavía no necesariamente existe `Venta`;
- `CONVERTIDO`: el pedido ya originó una `Venta`;
- `CANCELADO`: reserva cerrada por decisión operativa/comercial;
- `VENCIDO`: reserva fuera de vigencia temporal según `fechaVencimiento`.

## Estados logísticos

### `PedidoEntregaState`

- `PENDIENTE`
- `EN_PREPARACION`
- `LISTO_PARA_RECOJO`
- `DESPACHADO`
- `EN_RUTA`
- `ENTREGADO`
- `NO_ENTREGADO`
- `CANCELADO`

Lectura correcta:

- `PENDIENTE`: todavía no inicia preparación ni salida;
- `EN_PREPARACION`: se está alistando pedido para entrega o recojo;
- `LISTO_PARA_RECOJO`: cliente ya puede recoger;
- `DESPACHADO`: pedido salió del punto operativo;
- `EN_RUTA`: pedido está en tránsito;
- `ENTREGADO`: entrega física completada;
- `NO_ENTREGADO`: hubo intento fallido o corte operativo;
- `CANCELADO`: flujo logístico ya no seguirá.

## Contratos nucleares

### `Pedido`

Campos canónicos observados:

- `id`
- `type`
- `codigoPedido`
- `estado`
- `prioridad`
- `procedencia`
- `clienteId`
- `responsableId`
- `creadoPorId`
- `ventaId`
- `fechaPedido`
- `fechaProgramada`
- `fechaVencimiento`
- `observaciones`
- `items`
- `subtotal`
- `total`
- `createdAt`
- `updatedAt`

### `PedidoItem`

Campos canónicos observados:

- `id`
- `presentacionId`
- `nombre`
- `cantidadSolicitada`
- `cantidadAtendida`
- `precioUnitario`
- `subtotal`
- `montoModificado`
- `unidadComercial`
- `imagenUrl`

Lectura importante:

- pendiente por item = `cantidadSolicitada - cantidadAtendida`;
- `subtotal` de item congela monto de línea en el pedido;
- `nombre` es obligatorio y congela la descripción visible;
- `montoModificado` indica que el monto de línea fue ajustado manualmente;
- `unidadComercial` e `imagenUrl` conservan contexto visual sin consultar catálogo vivo;
- `Pedido` no modela cancelación por línea como campo propio.

### `PedidoEntrega`

Campos canónicos observados:

- `id`
- `type`
- `pedidoId`
- `estado`
- `modalidad`
- `responsableId`
- `fechaProgramada`
- `fechaSalida`
- `fechaEntrega`
- `observaciones`
- `historial`
- `createdAt`
- `updatedAt`

### `PedidoEntregaSeguimiento`

Campos canónicos observados:

- `id`
- `estado`
- `fecha`
- `responsableId`
- `observaciones`

## Evidencias

El paquete no embebe evidencias dentro de `Pedido` ni de `PedidoEntrega`.

Relación observada:

- `Evidencia.entidadReferencia = "PEDIDO"` para evidencia del pedido;
- `Evidencia.entidadReferencia = "PEDIDO_ENTREGA"` para evidencia del seguimiento/entrega.

## Ejemplos JSON canónicos

### Pedido finalizado completamente

El siguiente ejemplo muestra una vista de lectura compuesta de un caso finalizado:

- `Pedido` ya convertido a `Venta`;
- `PedidoEntrega` ya entregado;
- evidencias relacionadas por referencia externa.

> Nota:
> La persistencia canónica sigue siendo separada por documento.
> Este bloque sirve como ejemplo integral de lectura o detalle UI.

```json
{
  "pedido": {
    "id": "pedido-20260715-0001",
    "type": "pedido",
    "codigoPedido": "PED-0001",
    "estado": "CONVERTIDO",
    "prioridad": "URGENTE",
    "procedencia": "WHATSAPP",
    "clienteId": "cliente-001",
    "responsableId": "personal-ventas-007",
    "creadoPorId": "usuario-001",
    "ventaId": "venta-20260715-0091",
    "fechaPedido": "2026-07-15T08:15:00.000Z",
    "fechaProgramada": "2026-07-15T18:30:00.000Z",
    "fechaVencimiento": "2026-07-15T20:00:00.000Z",
    "observaciones": "Cliente solicita entrega puntual y validación previa por llamada.",
    "items": [
      {
        "id": "pedido-item-001",
        "presentacionId": "presentacion-ajo-1kg",
        "nombre": "Ajo 1 kg",
        "cantidadSolicitada": 10,
        "cantidadAtendida": 10,
        "precioUnitario": 8.5,
        "subtotal": 85,
        "montoModificado": false,
        "unidadComercial": "kilogramo",
        "imagenUrl": "https://files.yola.local/productos/ajo-1kg-small.jpg"
      },
      {
        "id": "pedido-item-002",
        "presentacionId": "presentacion-cebolla-roja-1kg",
        "nombre": "Cebolla roja 1 kg",
        "cantidadSolicitada": 5,
        "cantidadAtendida": 5,
        "precioUnitario": 4.2,
        "subtotal": 21,
        "montoModificado": true,
        "unidadComercial": "kilogramo",
        "imagenUrl": "https://files.yola.local/productos/cebolla-roja-1kg-small.jpg"
      }
    ],
    "subtotal": 106,
    "total": 106,
    "createdAt": "2026-07-15T08:15:00.000Z",
    "updatedAt": "2026-07-15T18:55:00.000Z"
  },
  "pedidoEntrega": {
    "id": "pedido-entrega-20260715-0001",
    "type": "pedido_entrega",
    "pedidoId": "pedido-20260715-0001",
    "estado": "ENTREGADO",
    "modalidad": "DESPACHO",
    "responsableId": "repartidor-003",
    "fechaProgramada": "2026-07-15T18:30:00.000Z",
    "fechaSalida": "2026-07-15T18:10:00.000Z",
    "fechaEntrega": "2026-07-15T18:47:00.000Z",
    "observaciones": "Entrega completada sin incidencias.",
    "historial": [
      {
        "id": "seg-001",
        "estado": "PENDIENTE",
        "fecha": "2026-07-15T08:15:00.000Z",
        "responsableId": "usuario-001",
        "observaciones": "Pedido registrado."
      },
      {
        "id": "seg-002",
        "estado": "EN_PREPARACION",
        "fecha": "2026-07-15T17:40:00.000Z",
        "responsableId": "personal-almacen-002",
        "observaciones": "Pedido alistado para despacho."
      },
      {
        "id": "seg-003",
        "estado": "DESPACHADO",
        "fecha": "2026-07-15T18:10:00.000Z",
        "responsableId": "repartidor-003",
        "observaciones": "Salida desde punto operativo."
      },
      {
        "id": "seg-004",
        "estado": "EN_RUTA",
        "fecha": "2026-07-15T18:18:00.000Z",
        "responsableId": "repartidor-003",
        "observaciones": "Pedido en tránsito."
      },
      {
        "id": "seg-005",
        "estado": "ENTREGADO",
        "fecha": "2026-07-15T18:47:00.000Z",
        "responsableId": "repartidor-003",
        "observaciones": "Cliente recibe conforme."
      }
    ],
    "createdAt": "2026-07-15T08:16:00.000Z",
    "updatedAt": "2026-07-15T18:47:00.000Z"
  },
  "ventaRelacionada": {
    "id": "venta-20260715-0091",
    "nombre": "Venta Pedido PED-0001",
    "type": "venta",
    "estado": "CONFIRMADA",
    "condicionPago": "CONTADO",
    "items": 2,
    "pedidoId": "pedido-20260715-0001",
    "createdAt": "2026-07-15T18:48:00.000Z",
    "updatedAt": "2026-07-15T18:48:00.000Z",
    "costoEnvio": 0,
    "subtotal": 106,
    "impuesto": 0,
    "total": 106,
    "montoRedondeo": 0,
    "procedencia": "WhatsApp",
    "clienteId": "cliente-001",
    "vendedorId": "personal-ventas-007",
    "codigoVenta": "VTA-0091",
    "numeroVenta": "91"
  },
  "ventaSnapshotRelacionada": {
    "id": "venta-20260715-0091:snapshot",
    "type": "venta_snapshot",
    "ventaId": "venta-20260715-0091",
    "createdAt": 1784141280000,
    "items": [
      {
        "id": "pedido-item-001",
        "presentacionId": "presentacion-ajo-1kg",
        "nombre": "Ajo 1 kg",
        "cantidadVendida": 10,
        "precioUnitario": 8.5,
        "total": 85,
        "unidadComercial": "kilogramo",
        "montoModificado": false
      },
      {
        "id": "pedido-item-002",
        "presentacionId": "presentacion-cebolla-roja-1kg",
        "nombre": "Cebolla roja 1 kg",
        "cantidadVendida": 5,
        "precioUnitario": 4.2,
        "total": 21,
        "unidadComercial": "kilogramo",
        "montoModificado": true
      }
    ],
    "subtotal": 106,
    "descuentoTotal": 0,
    "impuesto": 0,
    "total": 106,
    "montoRedondeo": 0,
    "procedencia": "WhatsApp",
    "codigoVenta": "VTA-0091",
    "cliente": {
      "id": "cliente-001",
      "nombre": "Cliente ejemplo"
    },
    "vendedor": {
      "id": "personal-ventas-007",
      "nombre": "Vendedor ejemplo"
    }
  },
  "evidencias": [
    {
      "_id": "evidencia-pedido-001",
      "type": "evidencia",
      "tipo": "OTRO",
      "formato": "JPG",
      "nombreArchivo": "pedido-whatsapp.jpg",
      "url": "https://files.yola.local/pedidos/pedido-whatsapp.jpg",
      "entidadReferencia": "PEDIDO",
      "referenciaId": "pedido-20260715-0001",
      "metadata": {
        "monto": 106,
        "moneda": "PEN"
      },
      "subidoPorUsuarioId": "usuario-001",
      "fechaDocumento": "2026-07-15",
      "fechaSubida": "2026-07-15T08:16:00.000Z",
      "esValido": true,
      "observaciones": "Captura de acuerdo inicial con cliente.",
      "createdAt": "2026-07-15T08:16:00.000Z",
      "updatedAt": "2026-07-15T08:16:00.000Z"
    },
    {
      "_id": "evidencia-entrega-001",
      "type": "evidencia",
      "tipo": "FOTO_MERCADERIA",
      "formato": "JPG",
      "nombreArchivo": "entrega-pedido-001.jpg",
      "url": "https://files.yola.local/pedidos/entrega-pedido-001.jpg",
      "entidadReferencia": "PEDIDO_ENTREGA",
      "referenciaId": "pedido-entrega-20260715-0001",
      "subidoPorUsuarioId": "repartidor-003",
      "fechaDocumento": "2026-07-15",
      "fechaSubida": "2026-07-15T18:47:30.000Z",
      "esValido": true,
      "observaciones": "Foto de entrega conforme.",
      "createdAt": "2026-07-15T18:47:30.000Z",
      "updatedAt": "2026-07-15T18:47:30.000Z"
    },
    {
      "_id": "evidencia-venta-001",
      "type": "evidencia",
      "tipo": "BOLETA",
      "formato": "PDF",
      "nombreArchivo": "boleta-vta-0091.pdf",
      "url": "https://files.yola.local/ventas/boleta-vta-0091.pdf",
      "entidadReferencia": "VENTA",
      "referenciaId": "venta-20260715-0091",
      "metadata": {
        "serie": "B001",
        "numero": "000091",
        "monto": 106,
        "moneda": "PEN"
      },
      "subidoPorUsuarioId": "usuario-001",
      "fechaDocumento": "2026-07-15",
      "fechaSubida": "2026-07-15T18:49:00.000Z",
      "esValido": true,
      "observaciones": "Comprobante emitido.",
      "createdAt": "2026-07-15T18:49:00.000Z",
      "updatedAt": "2026-07-15T18:49:00.000Z"
    }
  ]
}
```

## Preguntas abiertas

- si en una siguiente iteración hará falta distinguir responsable comercial y responsable logístico con contratos distintos;
- si `Pedido` necesitará versión futura de programación recurrente o múltiples ventanas horarias.

## Referencias

- [README.md](./README.md)
- [relaciones-interdominio.md](./relaciones-interdominio.md)
- [../ventas/modelo-vigente.md](../ventas/modelo-vigente.md)
