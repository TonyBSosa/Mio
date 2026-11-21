# Segundo flujo — Programar y confirmar entregas

20 de noviembre de 2026. Implementado y probado localmente; no publicado en esta preparación.

## Necesidad y alcance

Tony indicó que el apartado de entregas necesita especificar local o zona común, lugar y fecha, además de mejoras de interfaz y experiencia. Esta es la fuente de la selección. Falta relacionarla con resultados reales del protocolo del módulo 5 para cumplir íntegramente ese criterio del curso.

Recorrido: vendedor abre **Pedidos y apartados → Por entregar → Programar entrega**, selecciona modalidad, escribe lugar y fecha y guarda. El pedido continúa pendiente. Los datos quedan visibles en el listado. **Entregar** abre una confirmación con los datos acordados; confirmar cambia únicamente la entrega. **Reprogramar** permite cambiar los datos antes de entregar. Desde las opciones se puede volver a pendiente.

## Criterios de aceptación

1. Se distingue local específico de zona común; el texto del campo y su ejemplo cambian según la modalidad.
2. Lugar y fecha son obligatorios al programar. La API rechaza fechas inexistentes, tipos desconocidos y lugares vacíos o mayores a 200 caracteres.
3. La fecha es un día de calendario, sin desplazamiento de zona horaria. Se admiten fechas entre 2000 y 2100, incluso pasadas para registro histórico.
4. Programar no marca entregado ni modifica el pago. Marcar entregado requiere programación válida; crear o editar el pedido no permite omitir esa regla.
5. Solo el vendedor propietario puede modificar su pedido; se conservan autenticación y roles del recurso. Un pedido ajeno o cancelado no se actualiza.
6. Los pedidos anteriores siguen funcionando y pueden programarse. Los ya entregados sin datos muestran «Sin datos de entrega».
7. Los controles de guardado se bloquean mientras llega la respuesta; un error conserva el formulario para corregir o reintentar.
8. Modal nativo accesible, campos etiquetados, errores anunciados y presentación en escritorio y móvil.

## API y persistencia

`PATCH /api/pedidos/:id/entrega`, con la sesión existente del vendedor:

```json
{
  "planEntrega": {
    "tipo": "zona_comun",
    "lugar": "Entrada principal del centro comercial",
    "fecha": "2026-11-25"
  }
}
```

Para confirmar: `{"estadoEntrega":"entregado"}`. Para volver a pendiente: `{"estadoEntrega":"pendiente"}`. La respuesta es el pedido actualizado. El subdocumento opcional queda en la colección `pedidos`; no se requiere migrar datos históricos. No se aceptan cambios financieros por este endpoint.

## Validación efectuada

- Suite backend final: 40 pruebas, 33 aprobadas, 7 omitidas por requisitos de otros entornos MongoDB; ninguna fallida. Incluye entregas con HTTP y MongoDB real aislado.
- Las nuevas pruebas cubren validación, normalización, modalidad, fechas inexistentes, necesidad de plan, aislamiento a través del repositorio y compatibilidad de documentos históricos. Las unitarias simulan repositorios; la integración adicional usa HTTP y repositorios reales contra MongoDB temporal.
- Compilación Angular de producción correcta con `CI=true` para evitar la caché LMDB local que cierra Node. Se conservaron optimización, dependencias y presupuestos. Hay avisos de tamaño; ningún error de compilación.
- Navegador: formulario vacío rechazado; programación de zona común; recarga conservando datos en el servidor simulado; confirmación de recepción; retorno a pendiente y reprogramación a local. Inspección visual de escritorio y móvil de 390 × 844.
- La vista previa utiliza API y datos ficticios en memoria: no prueba MongoDB, autenticación real, concurrencia o servicios productivos. La integración separada verifica autenticación y persistencia reales con cuentas ficticias: sesión ausente 401, comprador/admin 403, otra tienda 404, fechas inválidas, reprogramación, confirmación sin cambio de pago, pedidos cancelados y bloqueo de programación tardía tras confirmar. Se eliminó exclusivamente la base temporal. No se registraron ventas reales ni sesiones con usuarios.

Capturas de la interfaz con datos ficticios: [escritorio](evidencias/semana-6/entrega-escritorio-simulada.jpg) y [móvil](evidencias/semana-6/entrega-movil-simulada.jpg).

## Pendientes antes de entregar el módulo

Publicar mediante dos PR con descripción e issues y verificar el recorrido contra producción. Registrar commit desplegado y evidencia. Publicar el release `semana-6` únicamente sobre la versión final acreditada.
