# Incremento 2D — Comprobantes de pago

Fecha: 15 de noviembre de 2026. Cambios locales sin commit, push ni despliegue; se conservaron los incrementos anteriores.

## Auditoría de 2C

Antes de introducir comprobantes se ejecutaron las 20 pruebas de 2C sobre MongoDB 8.2 real aislado. Pasaron confirmación, persistencia de fechas, vencimiento de 3/7 días, liberación condicional, carreras y autorización. No se encontró un bloqueo nuevo en ese ciclo. La restricción de confirmación a pruebas aisladas se mantiene; no se cambió la base standalone habitual ni se habilitó producción.

No había solución de subida/almacenamiento en el repositorio. Se integró Supabase Storage privado; [configuración paso a paso](COMPROBANTES_STORAGE.md). MongoDB guarda metadatos, nunca la imagen, una URL pública o una clave del servicio.

## Funcionalidad

- El comprador abre **Mi perfil → Mis apartados → Comprobantes de pago**, selecciona una imagen y ve una vista previa. Debe confirmar el envío. La interfaz valida tipo y tamaño; el servidor comprueba firma, formato decodificado, imagen estática y hasta 20 millones de píxeles, y decodifica/re-encodea con sharp.
- Se aceptan JPG, PNG y WebP de hasta 5 MiB (5 × 1024 × 1024 bytes). Se almacenan normalizados a WebP, sin EXIF ni nombre original, con clave generada por el servidor.
- Una carga incompleta no cambia la reserva. Solo tras guardarse el objeto y completarse la transacción pasa a `comprobante_en_revision` y guarda `comprobanteRecibidoEn` y `comprobanteActualId`.
- El vendedor ve fecha, estado e imagen privada de sus propias reservas; aprueba o rechaza con motivo. Las revisiones requieren confirmación explícita en la interfaz.
- El historial conserva cargas fallidas, recibidas, aprobaciones y rechazos. Las imágenes se consultan mediante una URL firmada de 60 segundos autorizada por el backend; no se guarda en MongoDB ni en localStorage.
- **Mis comprobantes** del perfil explica dónde consultar/adjuntar por reserva; no se mantiene el aviso anterior de función inexistente.

## Estados y política de corrección

`confirmada` → `comprobante_en_revision` → `pagada` tras aprobación del vendedor. Adjuntar una imagen no confirma el dinero.

Primer rechazo: el comprobante queda `rechazado` con motivo/revisor/fecha; la reserva pasa a `comprobante_rechazado`, sin señal de recepción activa, y dispone de **una corrección durante 24 horas desde el rechazo**. El nuevo plazo `corregirHasta` es explícito y no cambia `venceEn`, que conserva la fecha original de la reserva. Una segunda imagen válida y completada dentro del plazo vuelve a revisión.

Segundo rechazo o fin de esas 24 horas: la reserva expira y el servicio de 2C libera la pieza solo si sigue vinculada a esa misma reserva y no tiene pedido. No se permiten correcciones ilimitadas. Repetir un rechazo ya aplicado no reinicia el plazo. Un comprobante anterior rechazado no puede aprobarse después de enviar una corrección.

Durante una revisión válida no se libera inventario, incluso si pasa la fecha original de vencimiento. La aprobación marca pagada y queda fuera del expirador. Fallos de carga, archivos inválidos o espera de subida no entran en revisión y no suspenden el plazo.

## Contabilidad sin duplicados

La aprobación corre en una transacción junto con el pedido y el estado de revisión. Usa exclusivamente el precio confirmado de la reserva, cantidad 1 y estado de pago pagado. No lee importes, compradores ni propietarios desde el body de revisión.

Se crea o reutiliza una ficha `clientes` vinculada por `(vendedorId, usuarioId)` con índice único. No se unen fichas antiguas por nombre o correo. El pedido registra `reservaSolicitudId` y `comprobanteId`; un índice único por reserva impide duplicarlo. Los resúmenes existentes contabilizan ese único pedido pagado. Reintentos y aprobaciones simultáneas devuelven la revisión ya aplicada sin añadir otro cobro.

Los pedidos creados por este flujo no pueden cambiar de importe/cliente/pago ni borrarse por los endpoints antiguos. Los controles correspondientes quedan deshabilitados; entrega y observaciones mantienen su operación. Los pedidos heredados conservan su flujo y se verificaron en regresión. Un pedido manual ya existente para la misma pieza provoca conflicto; no se fusiona ni se crea otra venta automáticamente.

## Privacidad, autorización y recuperación

- Todas las rutas requieren sesión vigente y rol. Comprador propietario para carga; comprador o vendedor de esa reserva para historial/acceso; vendedor propietario para revisar. Administrador no recibe acceso adicional.
- Máximo 5 intentos de carga por comprador cada 10 minutos y 120 peticiones por IP cada 10 minutos en el recurso. Los contadores son por proceso; antes de escalar a varias instancias se necesita un almacén compartido para el limitador.
- Un archivo por petición, sin campos multipart adicionales. Multer usa memoria limitada; no escribe archivos locales. No se aceptan SVG/GIF/HTML, MIME falsificado, imagen dañada, animación o imágenes por encima de los límites.
- El bucket se verifica privado antes de cada operación. Las credenciales solo se leen del entorno del backend. No se registran buffers, nombres originales, claves del servicio ni URLs firmadas en logs o documentos.
- Se registra una carga `preparando` con clave generada antes del envío remoto. La concesión de 2 minutos y el índice único de carga en curso previenen cargas solapadas sin bloquear la reserva indefinidamente.
- Si falla Supabase o MongoDB, la reserva no se da por revisada. El intento queda fallido o recuperable. No se borra de inmediato un objeto cuyo commit podría haberse completado; la limpieza actúa solo sobre metadatos fallidos, conservando archivos de revisiones válidas.
- El barrido externo de 2C marca cargas abandonadas y elimina objetos fallidos, con intentos repetidos para cubrir finalizaciones remotas tardías. La limpieza conserva la auditoría y nunca borra evidencia aprobada/rechazada.

## API

Prefijo: `/api/solicitudes-apartado/:id/comprobantes`.

| Método | Ruta | Resultado |
|---|---|---|
| GET | `/` | Historial propio, capacidad de carga, fecha límite y política de corrección |
| POST | `/` | Un campo multipart `archivo`; 201 solo tras persistir la recepción |
| GET | `/:comprobanteId/acceso` | URL privada temporal, autorizada en servidor |
| PATCH | `/:comprobanteId/aprobar` | Pago aprobado una sola vez y pedido pagado |
| PATCH | `/:comprobanteId/rechazar` | Motivo obligatorio, revisión e historial; corrección limitada |

En este incremento las escrituras siguen restringidas a `NODE_ENV=test` y base `mio_pruebas_*`; la confirmación conserva además flag, lista de vendedores y requisito de transacciones. No se abrió producción automáticamente. Sin variables Supabase la interfaz informa que no está configurado y la carga falla sin alterar la reserva.

## Validación

La suite inicial de 2C pasó antes de implementar. Las pruebas nuevas usan MongoDB real aislado en `127.0.0.1:27182` y almacenamiento de objetos simulado; se eliminaron sus bases al terminar y se cerró el proceso temporal. El SDK Supabase se probó también con respuestas HTTP controladas: bucket privado/público, upload, firma de 60 segundos y eliminación. **No es una prueba contra Supabase real**.

Casos cubiertos: JPG/PNG/WebP decodificados; archivo falso/no permitido/dañado; más de 5 MiB; comprador ajeno; pendiente/rechazada/expirada; lectura de vendedor ajeno; revisión protegida del vencimiento; aprobación concurrente/idempotente y totales exactos; rollback si falla el pedido; dos cargas concurrentes; motivo de rechazo; una corrección/24 horas/segundo rechazo; carga tardía, fallo de almacenamiento y carga abandonada; limpieza repetida; ausencia de configuración; límites de frecuencia; reservas y pedidos anteriores.

Frontend: vista previa antes de enviar, multipart autenticado, doble clic, selección inválida, liberación del blob, configuración ausente, acceso temporal, motivo obligatorio, confirmación de revisión y errores sin falso éxito.

Resultados finales: **34 pruebas backend aprobadas** (incluidas las integraciones reales de MongoDB), cero fallidas y cero omitidas en la ejecución completa; **44 pruebas frontend aprobadas** en seis archivos. `ngc -p tsconfig.app.json --noEmit` y `git diff --check` aprobados. La compilación de producción pasó con `CI=true`, salida inicial 722,72 kB y advertencias de tamaño de bundle/CSS, sin ampliar umbrales. Se mantiene el modo CI para evitar la caché nativa defectuosa documentada en 2B.

`npm audit --omit=dev`: cero vulnerabilidades de producción. El SDK instalado requiere Node >=22; se dejó declarado en el backend y el lockfile. No se ejecutó prueba visual en navegador ni se afirman capturas.

## Archivos del incremento 2D

- Nuevos backend: `src/models/comprobante.js`, `src/services/comprobanteStorage.js`, `src/services/validarComprobante.js`, `src/services/comprobanteService.js`, `src/routes/comprobanteRoutes.js`, `test/comprobante-imagen-storage.test.js`, `test/comprobantes-mongo.test.js`.
- Backend actualizado: modelos de solicitudes/clientes/pedidos, expiración, política de pruebas, servicio/repositorio de pedidos, montaje en `expressApp.js`, comando de barrido, `.env.example`, `package.json` y lockfile.
- Nuevos frontend: `src/app/services/comprobante.service.ts`, componente compartido `comprobantes-reserva/` (TS/HTML/CSS/spec).
- Frontend actualizado: servicio de solicitudes, componente de solicitudes (TS/HTML), perfil del comprador (HTML) y controles de pedidos (HTML).
- Documentación: esta bitácora, `COMPROBANTES_STORAGE.md`, permisos y publicación.

## Pendiente externo

Crear bucket privado, configurar las tres variables del backend y comprobar el recorrido real, expiración de enlaces y límites del proveedor con imágenes ficticias. Programar el barrido externo y revisar retención/operación antes de decidir apertura a producción. No se guardaron claves ni se crearon servicios externos. No se implementaron banco, pasarela, OCR, fotos de chat/live, correos o cambio de modalidad.
