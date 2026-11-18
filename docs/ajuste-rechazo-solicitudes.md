# Ajuste de rechazo de solicitudes pendientes

15 de noviembre de 2026. Por solicitud del responsable, cambia la decisión anterior de conservar solicitudes rechazadas.

Al rechazar una solicitud pendiente, el backend elimina el documento con un filtro atómico por ID, vendedor propietario y estado pendiente. La respuesta permite retirar inmediatamente la fila del vendedor. Tras actualizar o recargar, tampoco aparece al comprador. El detalle devuelve 404 y no se guarda un registro rechazado nuevo. El inventario no cambia.

Una confirmación concurrente compite por el mismo documento: si deja de estar pendiente no puede eliminarse mediante este rechazo. Las reservas confirmadas, expiraciones, pagos y revisiones de comprobantes mantienen sus reglas existentes; este ajuste solo afecta al rechazo de solicitudes pendientes.

No se ejecutó una limpieza retrospectiva de registros en la base habitual. No se hicieron commits, push ni despliegues. Los reportes de incrementos anteriores describen el comportamiento histórico, sustituido para este caso por este ajuste.

La confirmación sigue restringida a pruebas aisladas, con replica set, flag y vendedor permitido. La configuración y validación de Supabase real siguen pendientes.
