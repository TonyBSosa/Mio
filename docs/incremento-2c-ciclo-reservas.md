# Incremento 2C — Confirmación, vencimiento y liberación

Fecha: 15 de noviembre de 2026. Cambios locales conservando 1, 2A y 2B; sin commit, push ni despliegue.

## Resultado

Se completó el ciclo de reserva **en pruebas aisladas**: solicitud pendiente → confirmación transaccional con plazo de 3 o 7 días → vencimiento → liberación segura de la pieza, conservando el historial. El vendedor puede rechazar una solicitud pendiente y consultar estados/fechas. El comprador puede consultar reserva confirmada, tiempo restante y reserva expirada.

La preferencia por vendedor ya se guardaba en `perfiles_vendedores.plazoReservaDias`; se reutiliza. Confirmar copia ese plazo a la solicitud y guarda `confirmadoEn`, `venceEn` y `estado`. Cambiar la preferencia no recalcula fechas existentes. Los días se cuentan como períodos de 24 horas desde la confirmación; las fechas se guardan en UTC.

## Consistencia y autorización

Se conserva la autorización de 2B. La confirmación exige vendedor propietario, solicitud pendiente y pieza activa sin bloqueo previo, y rechaza una pieza vinculada a un pedido. Producto y solicitud cambian juntos en una transacción; el compare-and-set del producto evita que dos compradores reserven la misma pieza individual. No se interpreta como stock por cantidad.

La confirmación sigue exigiendo simultáneamente:

- `NODE_ENV=test`.
- Base con nombre `mio_pruebas_*` y conexión activa.
- `RESERVAS_PRUEBA_HABILITADAS=true`.
- Vendedor incluido en `RESERVAS_PRUEBA_VENDEDORES`.
- Replica set o mongos con transacciones.

Está habilitada y probada bajo esas condiciones. No está habilitada en la base habitual standalone ni en producción. La aplicación de producción no recibe cambios de configuración ni datos por estas pruebas.

El barrido puede seguir limpiando reservas de prueba aunque se desactive el flag de nuevas confirmaciones o se retire un vendedor de la lista. Conserva las condiciones de entorno aislado y solo procesa `esPrueba=true`. No borra solicitudes ni procesa reservas reales.

## Cómo vence y libera

`expiracionReservasService` usa el reloj de servidor `reloj.ahora()`, sustituible en pruebas. Una reserva es candidata si está `confirmada`, tiene `venceEn <= ahora`, es de prueba y no tiene `comprobanteRecibidoEn`.

Por cada candidata, una transacción:

1. Vuelve a comprobar estado, fecha y ausencia de comprobante.
2. Lee la pieza de esa tienda y busca pedidos asociados.
3. Solo si la pieza está `apartado`, mantiene exactamente esa `reservaSolicitudId` y no tiene pedido, la cambia a `activo` y elimina la referencia.
4. Guarda `estado=expirada`, `expiradoEn`, `inventarioLiberado` y `motivoLiberacion` en el registro histórico.

Si cambió la referencia, falta el producto, está inactivo o tiene un pedido, la solicitud queda expirada pero **la pieza no se modifica**. Se registra el motivo y el vendedor ve que requiere revisión; no se fuerza disponibilidad. Un fallo de escritura revierte también la liberación del producto.

Dos procesos pueden intentar expirar la misma reserva: la transición condicional y los reintentos de la transacción evitan una doble liberación. Una reserva anterior ya expirada no puede liberar una reserva posterior de la misma pieza.

Los índices activos anteriores se conservan y se añade `solicitud_ciclo_activo_unica` para pendiente/confirmada/comprobante_en_revision. `expirada` y `rechazada` permiten una solicitud nueva sin eliminar historial. Se añade un índice de búsqueda por estado/prueba/vencimiento, **sin TTL**.

## Consultas, suspensión y ejecución sin tráfico

Antes de responder o decidir disponibilidad se procesan vencimientos relevantes en:

- Catálogo público por tienda.
- Solicitudes del comprador o vendedor y detalle propio.
- Creación de solicitud por producto, incluso si la reserva anterior corresponde a otro comprador.
- Intentos de confirmación por producto.
- Consultas y operaciones privadas de productos y pedidos por tienda; la creación de pedido también comprueba la pieza desde el servicio.

Las respuestas de esos recursos llevan `Cache-Control: no-store`. Si no se puede completar el procesamiento, se responde error en lugar de una disponibilidad no verificada. Se procesan lotes de 100, hasta 1000 por llamada; si quedan candidatas se devuelve error para reintentar. Un barrido puede haber completado transacciones anteriores antes de ese error: son operaciones idempotentes y se conserva su progreso en MongoDB.

No hay `setInterval`, temporizador de Angular ni trabajo pendiente conservado únicamente en memoria. El tiempo restante lo calcula el servidor y la interfaz lo muestra como «al actualizar»; actualizar o recargar vuelve a consultar. La pantalla abierta no cambia de estado por sí sola.

[Render Free suspende servicios inactivos](https://render.com/docs/free). La primera petición tras reactivarse reconcilia vencimientos antes de leer disponibilidad. **Sin tráfico hace falta un ejecutor externo** si se requiere materializar vencimientos periódicamente: `npm run reservas:expirar` conecta directamente a la base de prueba y termina. Puede programarse con un [Cron Job de Render](https://render.com/docs/cronjobs) o un ejecutor equivalente; no se creó un servicio ni calendario en esta entrega. La fecha de vencimiento permanece en MongoDB aunque el proceso web se suspenda.

El comando usa el mismo servicio que las peticiones, devuelve un resumen sin datos personales y falla si se intenta usar fuera del entorno aislado o si no termina el barrido. No requiere habilitar nuevas confirmaciones para limpiar las existentes. Las transacciones requieren replica set o clúster fragmentado ([MongoDB](https://www.mongodb.com/docs/manual/data-modeling/enforce-consistency/transactions/)); no se cambió la configuración del standalone actual.

## Preparación de comprobantes

Se añadió el estado `comprobante_en_revision` y se reservó `comprobanteRecibidoEn`; no hay endpoint, botón de carga ni almacenamiento de imágenes. Las escrituras de solicitudes no aceptan estos campos del cliente.

El expirador excluye ese estado y cualquier reserva con señal de recepción, de forma conservadora. Se probó la carrera entre la transición condicional de revisión y la expiración para evitar una pieza libre con comprobante en revisión. Esa transición se preparó directamente en datos de prueba, no constituye una implementación de subida.

El siguiente incremento deberá validar la recepción en servidor, antes de `venceEn`, y actualizar estado y fecha condicionalmente frente al vencimiento. Debe resolver archivos inválidos, revisión/rechazo de comprobantes y reintentos. Hasta completarlo no se habilitan pagos ni reservas reales en producción.

## Pruebas y compilación

- Backend con MongoDB 8.2 real aislado: **20 pruebas aprobadas**, cero fallidas y cero omitidas en la ejecución completa. Incluye las pruebas anteriores de permisos, pedidos e integridad, los tests de 2B y diez escenarios de 2C con reloj inyectable. No se esperaron días reales.
- Verificado: confirmación exitosa/duplicada, dos compradores para la misma unidad, vendedor ajeno, persistencia, logout y nueva sesión conservando preferencia, cambiar plazo sin alterar reservas anteriores, límite exacto de 3 y 7 días, catálogo tras inactividad, nueva solicitud tras expiración, barridos concurrentes y protección de reserva posterior.
- Verificado además: comprobante en revisión protegido, carrera con recepción conceptual, no liberar referencia distinta/producto inactivo/pedido asociado, rollback al fallar la expiración, compatibilidad del pedido heredado, uso de una pieza vencida por un pedido nuevo, barrido CLI sin tráfico y rechazo del CLI en producción.
- Frontend: **37 pruebas aprobadas**. Se añadieron estados expirada/revisión, visualización del tiempo del servidor y aviso de inventario no liberado, sin controles de subida.
- Build de producción ejecutado con `$env:CI='true'; npm run build`: aprobado. Total inicial 709,73 kB. Siguen las advertencias de tamaño del bundle y CSS de catálogo/bienvenida; no se ampliaron umbrales. Se usa CI para evitar el problema de caché nativa documentado en 2B.
- Validación Angular de tipos/plantillas mediante `ngc -p tsconfig.app.json --noEmit`: aprobada. Revisión `git diff --check`: aprobada.

Las integraciones usan exclusivamente `127.0.0.1:27182`, replica set temporal `mioPruebas` y bases `mio_pruebas_incremento2c_20261115` y su variante `_expiracion`. Cada test elimina únicamente su base aislada al terminar; nunca usa `MONGO_URI` para seleccionar la base de integración. El proceso temporal se cerró al completar las verificaciones. Sin `MIO_MONGO_PRUEBAS_URI`, las integraciones se omiten expresamente en el test habitual.

No se ejecutó prueba visual de navegador ni se afirman capturas. La persistencia y recarga se comprobaron con MongoDB real y consultas HTTP repetidas; la presentación se verificó con pruebas de componentes.

## Archivos del incremento 2C

- Nuevos: `backend/src/services/reloj.js`, `backend/src/services/expiracionReservasService.js`, `backend/src/middlewares/expirarReservasMiddleware.js`, `backend/src/scripts/expirarReservas.js`, `backend/test/expiracion-reservas-mongo.test.js`.
- Backend actualizado: modelo y repositorio de solicitudes, servicio de solicitudes, política de pruebas, servicio de catálogo, repositorio de catálogo, controlador público de catálogo, rutas de solicitudes/productos/pedidos, servicio de pedidos y `backend/package.json`.
- Frontend actualizado: servicio de solicitudes, componente compartido de solicitudes (TS/HTML) y `solicitudes-apartado.spec.ts`.
- Documentación: `docs/permisos.md`, `docs/PUBLICACION.md` y este reporte.

No se hizo commit, push ni despliegue. No se implementaron fotos, pagos, cambio de roles ni conversión de reservas en pedidos.
