# Cancelar un apartado desde el perfil del comprador

15 de noviembre de 2026. Cambios locales sin commit, push ni despliegue.

En **Mi perfil → Mis apartados**, cada solicitud pendiente o reserva confirmada muestra **Cancelar apartado**. La persona confirma en un segundo paso; la fila se retira solo después de recibir éxito del servidor. La cancelación la elimina de ambas cuentas, sin conservar la solicitud cancelada en MongoDB.

`PATCH /api/solicitudes-apartado/:id/cancelar` exige sesión y rol cliente. El propietario se toma de la sesión; no se acepta un comprador o vendedor del body.

- Una solicitud pendiente se elimina atómicamente por ID, comprador y estado. No modifica inventario y funciona también en el entorno habitual sin transacciones.
- Una reserva confirmada solo se cancela en el entorno aislado con transacciones. La transacción comprueba que no tenga señal de comprobante, comprobante recibido o pedido; libera la pieza únicamente si mantiene la referencia exacta de esa reserva y elimina la solicitud. Si falla la eliminación, también se revierte la liberación.
- Si la pieza tiene otro bloqueo o ya existe un comprobante/pago, se rechaza la operación. No hay cancelación de pagos, comprobantes en revisión, correcciones, expiraciones o solicitudes ajenas mediante esta acción.
- Una carga incompleta no equivale a comprobante recibido. Si compite con la cancelación, la recepción necesita que la reserva siga existiendo y bloqueando la pieza; de lo contrario falla y la limpieza de 2D retira el archivo fallido.

Se preservan los cambios locales de los incrementos anteriores. La confirmación de reservas sigue restringida al entorno de pruebas; este ajuste no cambia su configuración ni habilita producción.

Archivos: repositorio/servicio/controlador/rutas de solicitudes; servicio Angular y componente compartido de Mis apartados (TS/HTML); pruebas de reservas/comprobantes/backend e interfaz; matriz de permisos.

Verificación: 34 pruebas backend aprobadas con MongoDB real aislado, incluidas cancelación propia, cliente ajeno/vendedor rechazados, cancelación pendiente sin flags, liberación de reserva, rollback ante fallo de eliminación, confirmación concurrente y bloqueo de cancelación con comprobante/pago. Las 46 pruebas del frontend y el build de producción con `CI=true` pasaron. Se mantienen las advertencias de tamaño de bundle/CSS. El proceso temporal se cerró tras las pruebas; no se alteraron datos de la base habitual.
