# Repaso del módulo 3 con MIO

Guía previa al reto, basada en las seis capturas del material compartido. No reproduce preguntas de una evaluación activa. Practicar decisiones explicando **qué eliges, por qué, qué regla lo respalda y cómo lo comprobarías**.

## Entidades, atributos y relaciones

Entidad: objeto del negocio con identidad; cliente, pieza o pedido. Atributo: dato de esa entidad; nombre, precio o fecha. Relación: vínculo entre entidades; un cliente solicita varios pedidos. No crear una entidad por pantalla: Resumen es una consulta, no una tabla obligatoria.

- **1:1:** un vendedor puede tener un perfil público. UNIQUE vendedorId evita dos perfiles del mismo vendedor.
- **1:N:** un cliente tiene muchos pedidos; la referencia clienteId va en pedidos, el lado muchos.
- **N:M:** si un pedido maestro incluyera varias piezas y se necesitara registrar su participación histórica, se modelaría con detalles de pedido y atributos propios como precio acordado. MIO actual guarda una línea por pedido; no afirmar que ya existe ese pedido maestro.

Diseñar todo el producto permite prever abonos, cancelaciones y auditoría, aunque se implementen después del MVP. Distinguir siempre diseño futuro y base existente.

## Cinco restricciones de integridad

| Restricción | Para qué sirve | Ejemplo |
|---|---|---|
| PRIMARY KEY | Identificar un registro sin ambigüedad | id del pedido |
| FOREIGN KEY | Exigir una referencia válida y definir qué pasa al borrar | pedido referencia a cliente existente |
| UNIQUE | Evitar duplicados de una clave | vendedorId + codigo de pieza |
| NOT NULL | Exigir un valor | clienteId del pedido |
| CHECK | Restringir valores | importe ≥ 0; cantidad = 1 para pieza única |

Validar en pantalla mejora la experiencia; validar en servidor y base protege otras entradas. **UNIQUE compara claves: no resuelve cualquier conflicto del negocio.** Por ejemplo, no evita por sí solo horarios que se superponen. En MIO, código único no equivale a impedir dos pedidos para la misma pieza. Operaciones sobre varios registros necesitan controles de concurrencia y transacciones apropiados.

MIO utiliza MongoDB: `_id` es el identificador; un `ref` de Mongoose no crea una FOREIGN KEY del motor. `required`, `min` y `enum` del ODM tampoco prueban que la colección tenga restricciones equivalentes ante escrituras directas.

## Normalización y excepciones históricas

Guardar cada dato en su lugar: el nombre actual del cliente está en clientes; el pedido guarda clienteId. No almacenar listas como "pieza1,pieza2" en un campo. No editar manualmente un saldo que puede calcularse.

**Excepción consciente:** precio y nombre acordados de la pieza pueden copiarse al pedido como instantánea histórica. Cambiar el catálogo no debe cambiar lo que se vendió.

Dinero: usar representación exacta, como decimal o centavos enteros con límites definidos. El Number actual de MIO es una brecha a resolver antes de abonos. Fechas: conservar instantes con offset/UTC y presentar en la zona del negocio; no asumir que una hora sin zona significa lo mismo para todos.

## Borrado y trazabilidad

RESTRICT impide borrar un registro referenciado; CASCADE elimina dependientes; SET NULL conserva el registro quitando el vínculo opcional. Elegir según el negocio, no aplicar cascada a todo. En MIO conviene conservar pedidos y movimientos financieros y desactivar cuentas. Los bloqueos actuales de borrado están en servicios, no en FKs de MongoDB.

## Migraciones y semillas

Migración: archivo versionado que describe un cambio persistente de estructura; se aplica en orden y queda registrado. Cambiar MongoDB por PostgreSQL es otro uso del término, no la única migración posible. Seed: datos ficticios para desarrollo/pruebas; no son datos reales de clientes.

Probar una base vacía y una base con datos previos; revisar duplicados antes de crear UNIQUE; separar seed de producción; respaldar y comprobar restauración. No modificar archivos de migraciones ya aplicadas para ocultar diferencias. MIO todavía no tiene historial de migraciones reproducibles: documentarlo no equivale a implementarlo.

## Flujo central y comprobación

En MIO: cliente + pieza → apartado → consulta tras recarga → pago/entrega → resumen. No basta con CRUD aislados o un mensaje de éxito: comprobar persistencia, vínculos, rechazos y totales. Una transacción permite que cambios relacionados se confirmen juntos o se reviertan; una compensación posterior puede fallar y no es equivalente.

Preguntas para practicar: ¿dónde va clienteId? ¿por qué el precio del pedido es histórico? ¿qué pasa al borrar un cliente con pedidos? ¿por qué UNIQUE del código no garantiza una única reserva? ¿qué prueba demuestra persistencia? ¿qué harías si una nueva restricción encuentra datos antiguos inválidos?
