# Modelo Vigente de Personas

## Visión general

El Domain de personas modela actores reales del negocio y su relación con la identidad digital del sistema.

La evidencia vigente está en:

- [persons.contract.ts](../../domain/personas/contracts/persons.contract.ts)
- [entidad.contract.ts](../../domain/personas/contracts/entidad.contract.ts)
- [usuario.contract.ts](../../domain/personas/contracts/usuario.contract.ts)
- [direccion.contract.ts](../../domain/personas/contracts/direccion.contract.ts)

## Conceptos principales

### `Entidad`

Representa actor real sobre el que opera el negocio.

Responsabilidades observadas:

- declarar identidad base;
- expresar tipo de entidad;
- conservar trazabilidad mínima de creación y actualización;
- indicar si el actor está activo.

Tipos observados:

- `Cliente`
- `Personal`
- `Proveedor`

### `Cliente`

Representa comprador o contraparte comercial del negocio.

Responsabilidades observadas:

- conservar identidad y contacto;
- clasificar categoría comercial;
- mantener historial, última compra y total gastado;
- registrar preferencias e información de facturación.

Lectura importante:

- crédito, deuda y saldo del cliente no se resuelven aquí de manera canónica;
- esos conceptos se documentan en `finanzas/cuenta-cliente-modelo-vigente.md`.

### `Personal`

Representa trabajador interno del negocio.

Responsabilidades observadas:

- conservar identidad laboral;
- declarar cargo;
- vincular área, salario, fecha de contratación o supervisor cuando existen;
- expresar horario de trabajo y contacto de emergencia.

### `Proveedor`

Representa socio comercial que abastece al negocio.

Responsabilidades observadas:

- conservar razón social, RUC y contacto;
- expresar estado de relación;
- declarar condiciones de pago y tiempos de entrega referenciales;
- soportar contactos, cuentas bancarias y relación con productos.

### `IUsuario`

Representa cuenta digital del sistema.

Responsabilidades observadas:

- conservar credenciales e identidad de acceso;
- vincular roles y entidades;
- mantener estado de activación, bloqueo y verificación;
- guardar configuración personal y sesión actual cuando existe.

### `Usuario`

Representa entidad de dominio con comportamiento asociado a la cuenta digital.

Responsabilidades observadas:

- verificar roles y permisos;
- validar estado operacional;
- reconstruirse desde JSON tipado.

### `Direccion` y `DireccionRelacion`

Representan catálogo de direcciones y vínculo polimórfico con entidades.

Responsabilidades observadas:

- registrar ubicación y referencia;
- declarar rol de la dirección;
- enlazar dirección con cliente, proveedor, sucursal, almacén u otras entidades soportadas.

## Clasificaciones relevantes

### Tipo de entidad

- `Cliente`
- `Personal`
- `Proveedor`

### Cargos de personal

El contrato define un catálogo amplio que incluye, entre otros:

- `ADMINISTRADOR`
- `SUPERVISOR`
- `CAJERO`
- `VENDEDOR`
- `ENCARGADO_COMPRAS`
- `ENCARGADO_INVENTARIO`
- `CONTADOR`
- `AUDITOR`

### Categorías de cliente

- `REGULAR`
- `PREMIUM`
- `VIP`
- `MAYORISTA`
- `CORPORATIVO`

### Estado de relación con proveedor

- `ACTIVO`
- `BLOQUEADO`
- `SUSPENDIDO`
- `INACTIVO`

## Relaciones de negocio

### Con `Acceso`

Un `IUsuario` puede vincularse a una o varias `Entidad`. La autorización no nace de la entidad, sino de roles y permisos.

### Con `Ventas`

`Cliente` y `Personal` aparecen como actores de la operación comercial, pero el hecho comercial se resuelve en `Venta`.

### Con `Compras`

`Proveedor` es contraparte principal del Domain de compras, pero no reemplaza la compra ni la cuenta financiera con proveedor.

### Con `Cuenta cliente`

Los datos maestros del cliente viven aquí. La deuda y el saldo se resuelven en `CuentaCliente`.

## Reglas de negocio respaldadas por evidencia

- `Entidad` separa actor real de cuenta digital;
- `Cliente`, `Personal` y `Proveedor` comparten base común, pero mantienen responsabilidades distintas;
- `IUsuario` puede tener múltiples roles y múltiples entidades;
- direcciones polimórficas requieren mapeo explícito entre `DireccionEntidadTipo` y `EntidadTipo` cuando ambos mundos se conectan;
- cargo laboral y rol de acceso no son mismo concepto.

## Restricciones observadas

- la autorización formal no debe deducirse desde `cargo`;
- varias interfaces mantienen campos de contacto, facturación y preferencias sin validadores funcionales explícitos en la librería;
- la librería publica contratos y algo de comportamiento en `Usuario`, no autenticación técnica completa.

## Decisiones vigentes observables

- `IUsuario.entidades` permite múltiples actores reales asociados al mismo usuario y `SesionContexto.entidadActiva` fija una entidad activa por sesión;
- `ValuesPersonals` se conserva como contrato auxiliar liviano para relacionar personal, método de pago y monto;
- el Domain convive hoy con direcciones embebidas en algunos contratos y con modelo reusable `Direccion` + `DireccionRelacion`.

## Referencias

- [README.md](./README.md)
- [autorizacion-y-sesion.md](./autorizacion-y-sesion.md)
- [../finanzas/cuenta-cliente-modelo-vigente.md](../finanzas/cuenta-cliente-modelo-vigente.md)
