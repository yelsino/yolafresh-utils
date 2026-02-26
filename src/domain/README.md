# 🏛 Core Domain Architecture

## Bounded Contexts y Reglas de Comunicación

Esta arquitectura implementa un **Monolito Modular** puro enfocado en el dominio, basado en principios fundamentales de DDD.

### 🚫 Reglas Estrictas de Importación (Inmutables)

1. **Ventas NO importa Tesorería**
2. **Tesorería NO importa Inventario**
3. **Contabilidad NO importa Ventas**
4. **Ventas NO importa Compras**
5. **Ningún contexto de dominio importa Infraestructura (BD, Express, etc.)**

Las importaciones desde `shared/` están permitidas en cualquier Bounded Context.

### 📡 Comunicación entre Contextos

La única vía de comunicación permitida entre distintos contextos (ej. Ventas -> Contabilidad) es mediante **Domain Events** (ej. `VentaConfirmada`).

### 🧱 Reglas de Agregados

- Cualquier modificación de estado que requiera integrarse con otro contexto debe disparar un evento usando `this.addDomainEvent()`.
- Un Agregado (Aggregate Root) solo contiene lógica de negocio y encapsula sus invariantes.
