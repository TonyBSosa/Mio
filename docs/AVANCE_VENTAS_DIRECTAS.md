# Incremento: ventas directas y referencia de piezas

La configuración activa de desarrollo fue consultada mediante hello de MongoDB, sin mostrar credenciales ni modificar datos. Resultado: instancia standalone; no admite transacciones entre documentos. No se cambió la topología.

## Cambios

- liveId opcional en pedidos y validación del servicio. Cuando se proporciona, debe corresponder a la tienda y estar activo al crear. Vacío se normaliza a ausencia al crear o null al editar.
- productoId opcional para compatibilidad con pedidos históricos y captura manual. Cuando se selecciona catálogo, se valida propiedad de la tienda y disponibilidad actual, se toma el nombre de catálogo como referencia histórica y se exige cantidad uno. El precio sigue siendo el acordado en el formulario.
- La pieza vinculada no puede sustituirse por edición general; tampoco cambiar su nombre histórico o cantidad.
- Pedidos permite captura sin live y selección explícita de venta directa. Ambas pantallas de captura envían la referencia de pieza si se selecciona catálogo.
- Se conservan registros anteriores; no se ejecutaron migraciones.

## Límites y siguiente tarea

Este incremento NO implementa reserva atómica. Comprobar disponibilidad antes de insertar no impide dos solicitudes simultáneas. La pantalla Live activo todavía aparta en una segunda petición; Pedidos conserva su comportamiento previo de registrar sin apartar. No usar todavía este flujo como garantía de inventario.

Próximo paso: configurar un entorno de desarrollo con réplica (o elegir un diseño documentado de recuperación para standalone), implementar la operación conjunta de pedido/reserva y cubrir los caminos de edición, borrado y cambio manual de estado. Las operaciones de borrado actuales siguen siendo destructivas y deben sustituirse en la etapa de cancelación. productoId en Mongoose no es una clave foránea con integridad automática.

## Verificación

Pruebas del servicio con repositorios simulados: venta sin live, referencia y nombre de catálogo, cantidad unitaria, rechazo de precio infinito, IDs inválidos, pieza de otra tienda/no encontrada, disponibilidad y edición de referencia; validación del modelo para venta directa. No equivalen a pruebas de concurrencia en MongoDB. Ejecutar desde backend: node --test test/*.test.js. Compilar frontend con npm run build.

Resultado realizado: las dos pruebas de backend pasaron y la compilación de Angular terminó correctamente. No se probaron escrituras contra la base activa.

Prueba manual pendiente: en Pedidos elegir cliente, venta directa y pieza activa; guardar y confirmar nombre, precio y referencia persistida; registrar con live activo; abrir un pedido antiguo; confirmar que no se puede reemplazar la pieza vinculada. Sin evidencia de navegador aún.
