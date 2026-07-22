# Matriz de reutilización

## Criterios

- **Reutilizar:** el significado actual coincide.
- **Extender:** conserva identidad, pero necesita capacidades adicionales compatibles.
- **Adaptar:** se usa a través de un puerto o traducción; no se mezcla el modelo.
- **Crear:** el concepto no existe o su ciclo de vida es diferente.
- **No reutilizar:** compartirlo generaría una contradicción.

## Matriz

| Activo actual | Decisión | Uso gastronómico | Condición |
|---|---|---|---|
| `ProductoBase` | Reutilizar | Identidad comercial o insumo | No cargarle receta, estación ni disponibilidad |
| `Presentacion` | Extender | Unidad vendible, tamaño o formato | Separar presentación comercial de opción/modificador |
| Historial de precios | Reutilizar | Precio base vigente | Añadir reglas de canal/horario fuera del historial base |
| Categoría | Adaptar | Navegación y posible ruteo inicial | La estación no debe depender sólo de categoría |
| `Venta` | Reutilizar como salida | Resultado comercial cerrado | No usarla como cuenta abierta ni sesión de mesa |
| Snapshot de venta | Reutilizar | Auditoría de cierre | Incluir snapshot gastronómico al cerrar, no referencias mutables |
| `Pedido` | Reutilizar limitado | Encargo, recojo o despacho | No usar como comanda ni cuenta de salón |
| `PedidoEntrega` | Extender/Adaptar | Recojo y delivery propio | Añadir canal, ventana, dirección y asignación en RFC específico |
| Caja y turno | Reutilizar | Control de efectivo por dispositivo/operador | Definir pago de cuenta como origen trazable |
| `Pago` | Extender | Pago capturado/confirmado | Crear asignación de pago a cuenta o división |
| Cuenta de cliente | Reutilizar | Crédito identificado | No confundir con cuenta de consumo de mesa |
| Almacén | Reutilizar | Despensa, bar, cocina, producción | Revisar catálogo de tipos sin romper tipos retail |
| Stock/Kardex | Reutilizar | Existencia y costo por insumo | Movimientos gastronómicos deben ser explícitos e idempotentes |
| Movimiento inventario | Extender | consumo, producción, merma, devolución | Nuevos orígenes y motivos, sin mutar movimientos confirmados |
| Compras/recepción | Reutilizar | Abastecimiento | Añadir lotes/caducidad sólo si el alcance lo exige |
| Personas/usuarios | Reutilizar | Personal y clientes identificados | Comensal anónimo no debe crear una Persona obligatoriamente |
| Roles/permisos | Extender | Mesero, anfitrión, cocina, barra, caja, supervisor | Permisos por acción sensible y ámbito operativo |
| Impresora | Reutilizar | Dispositivo físico | Añadir estación, destino y capacidades de formato |
| `print_jobs` | No reutilizar tal cual | Cola de impresión de cocina | `venta_id` obligatorio y semántica centrada en ticket |
| Cola offline | Reutilizar como mecanismo | Salida durable y reintentos | Operaciones gastronómicas requieren idempotencia y dependencia explícitas |
| Feed de cambios | Reutilizar | Actualización de proyecciones | No asumir que entrega todos los estados intermedios |
| Estrategia LWW | Adaptar con restricción | Preferencias/configuración simple | Prohibida como regla por defecto para comandas, pagos y transferencias |
| Store del carrito | No extender | Puede seguir sirviendo al retail | Crear workflows gastronómicos de aplicación separados |

## Conceptos nuevos obligatorios

- `PerfilNegocio` y capacidades;
- `LocalOperativo`, `Ambiente`, `ZonaServicio`, `Mesa` y opcionalmente `Asiento`;
- `SesionServicio`;
- `PedidoGastronomico` y `LineaPedido`;
- `EnvioPreparacion`/`Comanda` y `LineaPreparacion`;
- `EstacionPreparacion` y reglas de ruteo;
- `CuentaConsumo`, `DivisionCuenta`, `Precuenta` y `AsignacionPago`;
- `GrupoModificadores`, `OpcionModificador` y selección por línea;
- `Receta`, `ComponenteReceta`, `PreparacionIntermedia` y `RegistroProduccion`;
- `Reserva` y `EntradaListaEspera`;
- eventos operativos, comandos idempotentes y conflictos pendientes.

## Límites de compatibilidad

1. Un consumidor que no habilita gastronomía debe observar el mismo comportamiento retail de `2.0.0`.
2. Los nuevos contratos deben publicarse por subpath gastronómico, sin ampliar el root innecesariamente.
3. Los enums existentes no deben recibir valores gastronómicos hasta comprobar que todos los consumidores toleran extensiones.
4. Las traducciones hacia Venta, Pago e Inventario deben ocurrir en adaptadores/casos de uso, no dentro de entidades de esos dominios.
5. La salida comercial debe conservar snapshots de nombres, precios, impuestos, modificadores y responsables usados al cerrar.
