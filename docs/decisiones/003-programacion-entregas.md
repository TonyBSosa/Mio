# ADR 003 — Separar programación, entrega y pago

Fecha: 20 de noviembre de 2026. Estado: implementada localmente; despliegue pendiente.

## Contexto

El responsable del proyecto pidió mejorar el flujo de entregas para indicar si se entrega en un local específico o una zona común, con fecha y lugar. Antes solo se guardaba pendiente/entregado. Es una necesidad comunicada en esta conversación; no se presenta como hallazgo de una sesión real de usabilidad.

## Decisión

Agregar `planEntrega` opcional al pedido: modalidad `local` o `zona_comun`, lugar de hasta 200 caracteres y fecha de calendario `YYYY-MM-DD`. La programación se guarda mediante el endpoint de entrega, sin modificar importes ni el pago. Para marcar una entrega como realizada se exige un plan válido y una confirmación en la interfaz.

El caso de uso valida en servidor; el repositorio limita escrituras al vendedor propietario y a pedidos no cancelados. Se admite reprogramar pedidos pendientes; una entrega realizada debe volver a pendiente antes de reprogramarse. La actualización de programación condiciona también el estado pendiente en la consulta de MongoDB, para evitar modificar una entrega confirmada concurrentemente.

## Alternativas consideradas

- Escribir fecha y lugar en observaciones: no permite exigir campos ni distinguir claramente modalidad y fecha.
- Hacer obligatorios los datos al crear todo pedido: interrumpe la captura de ventas cuando todavía no se acuerda la entrega.
- Crear una colección y agenda independiente: añade sincronización y navegación que este incremento no necesita.

## Consecuencias

La tienda puede registrar una venta primero y coordinarla después. En escritorio y móvil se ve si falta programar, y los datos acordados aparecen junto al estado. El pago sigue siendo independiente: confirmar entrega no confirma cobro.

Los pedidos históricos siguen siendo legibles sin migración y muestran que no hay datos de entrega. No se inventan lugares ni fechas históricos. Los clientes API que antes creaban pedidos directamente entregados deben registrar, programar y confirmar. Se admite una fecha pasada para documentar una entrega acordada anteriormente; no se incluye hora, notificación, ubicación por GPS ni historial completo de reprogramaciones.

## Evidencia

`backend/src/services/entregaPolicy.js`, `pedidoService.js`, `backend/src/models/pedidos.js`, `backend/test/entregas.test.js`, `frontend/src/app/shared/entrega-dialog/` y [especificación del flujo](../flujo-entregas.md).
