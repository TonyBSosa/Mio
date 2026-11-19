# Incremento 3 — Registro y verificación de correo electrónico MIO

Fecha: 2026-11-19 (America/Tegucigalpa).

## 1. Resultado y alcance

Implementación incremental sobre el checkout d7c7e66 confirmado al inicio, sin cambios locales ajenos. Se revisaron la auditoría de autenticación y los informes de los Incrementos 0, 1 y 2, además del diagnóstico SMTP posterior. No se asume que las pruebas productivas mencionadas por el usuario certifiquen esta versión.

**Verificado en código y entornos aislados:** las cuentas creadas por registro público, administración y script inicial de administrador se crean con `emailVerifiedAt: null` y `emailVerificationRequired: true`. El registro público no crea documentos de sesión ni entrega JWT de acceso completo. El login de una cuenta nueva pendiente entrega únicamente una credencial limitada a verificación. Los usuarios históricos no son marcados como verificados ni se modifican masivamente.

**No listo para activar sin comprobaciones operacionales:** falta validar build de producción, entrega real y plantilla en clientes de correo, configuración del hosting y recuperación asistida de registros abandonados. No se enviaron correos reales, no se conectó a SMTP, no se accedió a MongoDB de producción, no se ejecutaron migraciones, no se desplegó y no se crearon commits. El `.env` privado no fue modificado.

## 2. Registro y acceso limitado

El registro permite únicamente roles `vendedor` y `cliente`; ignora campos suministrados para forzar verificación, estado o versiones. Normaliza y valida el formato del correo. Conserva el índice único de correo existente y traduce E11000 a conflicto genérico; no se declara comprobado el índice productivo.

La respuesta de registro HTTP 201 contiene `verificationRequired`, `verificationToken` y un mensaje, sin `token` de sesión completa. La credencial limitada es JWT HS256, dura 30 minutos, contiene identificador, `credentialVersion` y `scope: email-verification`. No crea una sesión completa. El middleware general rechaza cualquier JWT con scope y cualquier cuenta nueva sin verificación, incluso si se presenta una sesión anterior. No concede permisos de comprador, vendedor ni administrador.

La identidad de los endpoints limitados se obtiene siempre del token firmado y del usuario vigente en base; no acepta un ID/correo ajeno en el cuerpo. Comprueba suspensión, baja y versión. Los JWT ordinarios existentes necesitan una sesión válida, igual que antes. Tras recargar la página o vencer la credencial limitada, se inicia sesión de nuevo para obtener otra; Angular no guarda esta credencial en localStorage/sessionStorage ni URL.

Las cuentas administrativas nuevas también requieren verificar correo: no hay excepción de bootstrap que conceda privilegios sin prueba. Su creación administrativa no envía automáticamente un correo; el primer login limitado permite solicitarlo. El script createAdmin no se ejecutó.

## 3. Token independiente y atomicidad

El token de correo tiene forma `idUsuario.aleatorioHex64`, con 32 bytes aleatorios criptográficos. La parte identificadora permite buscar por `_id`, sin añadir índices ni escanear hashes en toda la colección. Solo se persiste SHA-256 del token, junto con correo exacto, credentialVersion y vencimiento, dentro del documento del usuario. No se reutiliza la colección ni el formato de recuperación de contraseña.

`EMAIL_VERIFICATION_TTL_HOURS` es centralizado: 24 por defecto, enteros entre 1 y 72. Se rechazan valores inválidos. El vencimiento efectivo no excede el vencimiento del registro pendiente.

`verificacionService.confirmar` valida usuario activo/no eliminado, hash, dirección vigente y credentialVersion. Después aplica un CAS con la misma versión/dirección/hash, correo aún no verificado y expresión de MongoDB que exige vencimiento posterior a `$$NOW`. Una escritura registra `emailVerifiedAt` y retira la prueba pendiente. Dos confirmaciones no pueden ganar. Un reenvío sustituye la prueba anterior y una confirmación concurrente de esa prueba falla con seguridad.

Ante una actualización que incluye el campo correo en el repositorio administrativo (incluso si se repite el valor, de forma conservadora) se retiran verificación/prueba/cuota de verificación y se conserva la rotación de credentialVersion del Incremento 1. Cambiar contraseña, suspender/reactivar o cambiar rol invalida pruebas emitidas bajo la versión anterior. No se reactiva una cuenta al confirmar un enlace. Los errores públicos son genéricos y no incluyen motores, respuestas SMTP ni datos de otros usuarios.

En la primera activación de una cuenta nueva se pide elegir la contraseña definitiva con la política central existente y se rota credentialVersion en el mismo CAS. Esto evita activar una contraseña que pudo elegir alguien que registró un correo ajeno. No cambia roles ni relaciones, no entrega sesión y exige login posterior. Verificar un correo histórico no cambia contraseña ni invalida por sí mismo sesiones vigentes. Si posteriormente se cambia el correo de una cuenta marcada nueva, se vuelve a exigir activación con clave definitiva: es una diferencia deliberada de compatibilidad.

Se probó con MongoDB 8.2 standalone, sin transacciones. Falta comprobar compatibilidad de expresiones, validadores y writeConcern con la infraestructura operacional. Como en Incremento 2, un timeout de confirmación de escritura puede tener resultado ambiguo: comprobar acceso/estado antes de repetir. Un fallo anterior a la escritura conserva la prueba. No se afirma atomicidad entre un control de middleware y todas las escrituras de otros documentos; una operación ya autorizada en curso puede terminar mientras cambia el estado de otra cuenta.

## 4. Endpoints y prevención de abuso

Todos bajo `/api/auth/email-verification` y con `Cache-Control: no-store` y `Referrer-Policy: no-referrer`:

| Método y ruta | Acceso | Función |
|---|---|---|
| GET `/status` | Identidad limitada o sesión ordinaria vigente | Estado propio, sin hashes ni credenciales |
| POST `/resend` | Identidad limitada o sesión ordinaria vigente | Solicitud uniforme de reenvío al correo propio |
| POST `/link-status` | Prueba del enlace en cuerpo | Valida sin consumir; indica si debe fijarse clave definitiva, sin devolver correo/ID/nombre |
| POST `/confirm` | Prueba del enlace en cuerpo | Confirma de un solo uso; clave definitiva solo para cuentas nuevas |

No se confirma al abrir un GET: escáneres de correo no consumen el enlace automáticamente. El formato de recuperación de contraseñas no verifica correo y viceversa.

Límites: se mantiene registro/login 20 solicitudes por IP cada 15 minutos; endpoints de verificación comparten 10 solicitudes por IP cada 15 minutos. El envío verifica cuota persistente de 3 por hora por cuenta y separación de 60 segundos. Su CAS por slot impide que solicitudes concurrentes entre procesos consuman el mismo cupo. El reenvío no revela al público si ocurrió un envío ni modifica la autenticación de una cuenta existente. Los intentos con SMTP fallido también consumen cuota: protege contra abuso y no bloquea login permanentemente.

Se reutiliza la cola acotada existente, separada de la cola de recuperación, con máximo 100 trabajos, concurrencia 2 y cooldown en memoria. No es durable: reiniciar o saturar puede descartar trabajos. Los límites por IP siguen en memoria por proceso; una instalación con varias instancias requiere almacenamiento compartido y comprobar trust proxy. No se afirma protección completa contra atacantes distribuidos que registran muchos correos distintos.

Los eventos de fallo de verificación usan `verificacion_trabajo_fallido` con los mismos campos seguros de diagnóstico. Se conservan los eventos de recuperación. No se registran tokens, contraseñas, enlaces ni destinatarios.

## 5. Correo y Angular

`correoService.enviarVerificacion` reutiliza el transporte y el bucle conservador de reintentos del Incremento 2. Mantiene TLS implícito en 465/STARTTLS obligatorio en otros puertos, validación de certificado, límites de tiempo, Message-ID estable por mensaje y ausencia de reintento cuando el resultado del envío es ambiguo.

La plantilla HTML usa identidad MIO, verde de la aplicación, tablas compatibles con correo, ancho fluido con máximo 560px, bienvenida, botón «Verificar mi correo», vencimiento y aviso de solicitud no reconocida. Incluye alternativa en texto plano. No usa recursos remotos ni el nombre suministrado por un tercero. El enlace se construye con APP_URL validado y token en fragmento: `/verificar-correo#token=...`. HTTPS es obligatorio en producción; no se cambió la configuración real de Render.

Angular agrega `/registro-pendiente` y `/verificar-correo`, distingue activación nueva de prueba histórica, muestra enlace vencido/usado/inválido y permite reenvío limitado. Retira el token de la URL antes de consultar la prueba, lo conserva solo en memoria y limpia secretos al confirmar/destruir. La consulta inicial no confirma automáticamente. El reenvío tiene espera local de un minuto y el servidor sigue siendo la barrera real.

Login y registro reconocen la respuesta pendiente antes de guardar sesión/redirigir por rol. La confirmación ofrece login, sin crear una sesión automáticamente. Los perfiles de comprador y vendedor indican «Correo verificado» o pendiente y ofrecen verificar; el perfil de vendedor consulta datos actuales del servidor. La credencial limitada no se coloca en almacenamiento persistente. El interceptor conserva los mensajes controlados de los endpoints de verificación sin cerrar por error una sesión normal diferente.

## 6. Transición de usuarios históricos

`EMAIL_VERIFICATION_LEGACY_MODE=off` es el valor inicial. No escribe ninguna marca de verificación histórica. Las cuentas existentes conservan sesiones y acceso, ven la indicación de correo pendiente y pueden verificarlo voluntariamente. IDs, productos, tiendas, clientes, pedidos, reservas y comprobantes permanecen intactos.

Con `sensitive`, las cuentas históricas sin verificar conservan lectura y atención de obligaciones, pero reciben HTTP 403 con `EMAIL_VERIFICATION_REQUIRED` al intentar nuevas operaciones sensibles:

- Crear usuarios administrativos, clientes, productos, lives, pedidos o solicitudes de apartado.
- Gestionar productos, clientes, lives, perfil comercial o configuración de nuevas reservas.
- Cambiar campos comerciales de un pedido (cliente/live/producto/cantidad/precio).

Se conservan consulta de historial, pagos/entregas/observaciones de pedidos y gestión de solicitudes/comprobantes ya existentes bajo sus controles de rol/propiedad originales. La nueva recepción de solicitudes exige también que el vendedor no sea una cuenta nueva pendiente y, en modo sensitive, que tenga correo verificado. La visibilidad pública de cuentas nuevas pendientes queda bloqueada; el catálogo histórico sigue consultable.

Se probó en HTTP aislado: vendedor histórico puede consultar pedidos y registrar pago de un pedido sintético, no crear otro ni incrementar cantidades en modo sensitive. Después de verificar, la misma sesión vuelve a pasar el control de creación con su rol. No se probaron operacionalmente todas las combinaciones de obligaciones y clientes antiguos; requieren aceptación en staging antes de activar el modo.

No se añaden índices comerciales. Las únicas adaptaciones a catálogo/reservas son de autorización por verificación y baja; no se cambia su lógica comercial.

## 7. Registros abandonados y recuperación del uso de una dirección

Política implementada: los registros nuevos quedan pendientes como máximo 7 días. Vencido ese plazo, no se emiten nuevos enlaces de activación; no se borran documentos, se altera su ID, se fusionan cuentas ni se libera públicamente el correo. Pruebas emitidas cerca del límite vencen como máximo en esa fecha. La expiración no es un índice TTL ni elimina relaciones.

Política de liberación **controlada, pendiente de operación/soporte**: recuperar el uso de la dirección por su dueño sobre el mismo identificador, evitando ceder a un tercero una dirección reservada o historial ajeno. No se entrega un endpoint público para reclamar correos ocupados ni se automatiza el cambio de su dirección a un alias.

Procedimiento previo a una intervención puntual autorizada:

1. Comprobar el estado pendiente, antigüedad, ausencia de verificación y obtener prueba nueva de propiedad del buzón mediante un canal operativo aprobado. Una captura o el conocimiento de la dirección no bastan.
2. Revisar referencias de propietario/vendedor/comprador, tienda, clientes, productos, pedidos, solicitudes y comprobantes con consultas de solo lectura; revisar nombre/rol elegidos en el registro original. Si hay relaciones u obligaciones, escalar; no entregar el historial de otra persona por coincidencia de correo.
3. Preferir recuperación/activación del mismo ID, conservar relaciones y permitir al dueño fijar una contraseña nueva. Para extender un registro vencido se requiere una intervención puntual revisada: retirar pruebas antiguas, rotar credentialVersion y fijar nueva ventana de activación. La ampliación NO equivale a marcar verificado.
4. Registrar justificación y evidencia de consentimiento sin guardar secretos; completar la confirmación mediante un enlace nuevo y comprobar acceso del dueño.

No se implementó ni ejecutó un script de extensión/liberación; soporte, prueba de propiedad y revisión de referencias son dependencias operacionales pendientes. No activar masivamente caducidades ni borrar cuentas para despejar correos. La protección contra ocupación reduce abuso por IP y exige la clave definitiva al activar; no sustituye una estrategia antifraude distribuida o un procedimiento de soporte probado.

## 8. Pruebas y resultados ejecutados

**57 pruebas backend aprobadas, 0 fallos, 0 omitidas** en la ejecución final. Incluyen contenedores de suites de node:test y sus subpruebas. Se seleccionaron todos los archivos `backend/test/*.test.js` sin `mongo` en el nombre y, además, exactamente `credenciales-mongo.test.js`, `recuperacion-mongo.test.js`, `verificacion-mongo.test.js`. No se ejecutó `npm test` indiscriminadamente contra bases ajenas.

Se inició una instancia MongoDB 8.2 nueva en 127.0.0.1:27191 con directorio temporal exclusivo. Cada ejecución recibió nombres de base nuevos con UUID y prefijos de prueba validados por regex. No se cargó MONGO_URI ni dotenv en las suites de Mongo. autoIndex/autoCreate desactivados; solo la suite nueva creó explícitamente el índice único de email ya declarado en el modelo, en su base sintética para comprobar E11000 concurrente. No hubo dropDatabase, acceso productivo ni índices nuevos de negocio.

Cobertura nueva: registro sin sesión, campos inyectados/rol admin, duplicados concurrentes con índice real, token válido/vencido/reutilizado, reenvío concurrente y cuotas, expiración configurable, dirección cambiada antes/durante confirmación, suspensión/baja/reactivación, confirmación simultánea con un ganador, expiración durante escritura, fallo de escritura sin consumo, fallo SMTP, sanitización de serialización, independencia de recuperación, acceso limitado y sesiones históricas, transición de operaciones y obligaciones.

Las suites anteriores prueban además revocación por credentialVersion, sesiones heredadas, reset concurrente, bcrypt heredado, política de claves, baja lógica, rol/propiedad y recursos ajenos. Todo envío fue simulado; las nuevas pruebas no prueban entrega real, latencia ni certificados SMTP reales.

**69 pruebas Angular en 9 archivos aprobadas**, mediante `npm test -- --watch=false`. Cubren token retirado de URL, consulta sin consumo, contraseña definitiva, verificación histórica sin cambio de clave, mensajes de expiración, credencial limitada en reenvío, cooldown/429 y navegación pendiente sin sesión completa. `npx tsc --noEmit -p tsconfig.app.json` aprobado. No se hizo revisión visual real en navegador ni validación manual de teclado/lectores de pantalla/320–1440px; son pendientes, no se afirma conformidad WCAG completa.

**Build de producción pendiente:** `npm run build` falló inicialmente al intentar descargar Google Fonts (ENOTFOUND). Los intentos posteriores con permisos de red, modo verbose y límite local de trabajadores terminaron con exit 1 sin diagnóstico adicional útil; tampoco se certificó build de desarrollo. Una captura posterior del proceso hijo identificó salida nativa 3221225477 (0xC0000005) al compilar en desarrollo; no hubo stderr adicional. Esto identifica una terminación nativa del proceso, pero no demuestra su causa ni descarta un problema de compilación del proyecto. No se atribuye la salida a una causa raíz no comprobada. No se modificó la configuración ni se deshabilitó optimización para simular un resultado aprobado. La compilación para tests y TypeScript sí pasa. Reproducir y resolver el build en un entorno controlado antes de publicar; `build:deploy` no se ejecutó.

`git diff --check` sin errores; advertencias de conversión LF/CRLF. Se observaron advertencias previas de Mongoose sobre validateSync y opción new en código existente. Se adaptaron dos pruebas previas: respuesta de registro ahora limitada y log estructurado de recuperación introducido por el diagnóstico SMTP anterior; se mantienen aserciones de confidencialidad.

## 9. Archivos modificados y justificación

| Archivos | Motivo |
|---|---|
| backend/src/config/verificacionConfig.js (nuevo), backend/.env.example | TTL y modo histórico explícitos |
| backend/src/models/users.js | Estado, prueba hash, cuota y caducidad pendiente; campos internos fuera de JSON |
| backend/src/services/verificacionService.js (nuevo) | Emisión, cuota, CAS, comprobación/confirmación y cola |
| backend/src/controllers/verificacionController.js (nuevo), backend/src/routes/authRoutes.js | Endpoints limitados, enlace, controles de IP/caché |
| backend/src/controllers/authController.js, backend/src/middlewares/authMiddleware.js | Registro sin sesión completa, login limitado y separación de scopes |
| backend/src/middlewares/verificacionMiddleware.js (nuevo) | Identidad limitada y control gradual de operaciones |
| backend/src/repositories/userRepository.js | Invalidar verificación al cambiar dirección |
| backend/src/services/userService.js, backend/src/scripts/createAdmin.js | Cuentas administrativas nuevas pendientes y validación de correo |
| backend/src/services/correoService.js | Plantilla HTML/texto y transporte/reintentos compartidos |
| backend/src/services/recoveryQueue.js, backend/src/services/diagnosticoRecuperacion.js | Callback de error y evento seguro específico, conservando recuperación |
| backend/src/routes/clienteRoutes.js, liveRoutes.js, productoRoutes.js, perfilVendedorRoutes.js, pedidoRoutes.js, solicitudApartadoRoutes.js, userRoutes.js | Controles de operaciones sensibles, sin sustituir rol/propiedad |
| backend/src/repositories/explorarPublicoRepository.js, backend/src/services/catalogoPublicoService.js, solicitudApartadoService.js | Evitar publicación/venta de cuentas nuevas pendientes |
| backend/test/verificacion-correo.test.js, verificacion-mongo.test.js (nuevos) | SMTP simulado, configuración y pruebas Mongo/HTTP aisladas |
| backend/test/credenciales-errores.test.js, recuperacion-mongo.test.js | Regresión ajustada al contrato seguro actual |
| frontend/src/app/pages/verificacion/verificacion.ts, verificacion.spec.ts (nuevos) | Pantallas de estado/confirmación, reenvío y pruebas |
| frontend/src/app/app.routes.ts | Rutas públicas de verificación |
| frontend/src/app/services/auth.service.ts, auth-session.interceptor.ts | Credencial limitada en memoria y manejo de respuestas |
| frontend/src/app/pages/register/register.ts, register.spec.ts, frontend/src/app/pages/login/login.ts | Navegación pendiente y evitar guardar sesión limitada |
| frontend/src/app/pages/cliente/perfil-cliente/perfil-cliente.html, frontend/src/app/pages/perfil-vendedor/perfil-vendedor.ts, perfil-vendedor.html | Estado visible del correo y consulta actual del perfil |
| docs/INCREMENTO_3_VERIFICACION_CORREO_MIO.md | Evidencias, límites y activación/reversión |

Los nombres abreviados de una fila pertenecen a la misma carpeta que el primer archivo correspondiente.

## 10. Activación productiva propuesta — no ejecutada

1. Resolver build y validar pantallas reales, enlaces directos, refresh de rutas, fragmentos, limpieza de secretos y teclado/responsividad. Probar HTML en Gmail/Outlook/móvil y versión texto.
2. Comprobar backup y restauración en entorno aislado antes de activar. Mantener datos/secretos de staging separados. Repetir la regresión con la versión/topología objetivo; no se considera probado un backup por usar Atlas.
3. Verificar índice único real de email y ausencia de conflictos en lectura autorizada. Si falta o hay duplicados, tratarlo en un incremento específico; este no hace migración ni crea índices productivos. Comprobar validadores de colección que podrían rechazar campos nuevos.
4. Comprobar APP_URL como origen HTTPS correcto, SMTP_HOST/PORT/USER/PASSWORD y MAIL_FROM en el entorno de despliegue, salida de red, TLS, límites del proveedor y aceptación/entrega real con autorización explícita. No copiar secretos locales al repositorio.
5. La documentación de [Render Free](https://render.com/docs/free) y su [aviso de bloqueo SMTP](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports) indica restricción de puertos 25/465/587 en instancias gratuitas. Si el backend usa ese plan, Nodemailer/Gmail local no prueba entrega productiva. Resolver alojamiento/transporte autorizado antes de exigir verificación a nuevos registros; no se añadió proveedor HTTPS ni se cambió el plan en este incremento.
6. Publicar primero frontend compatible con la respuesta pendiente y después backend coordinado. Las versiones anteriores no deben seguir escribiendo cuentas nuevas sin marcador ni validar sesiones sin estos controles. Emplear mantenimiento de registro si hace falta, no un despliegue mixto que permita acceso completo a pendientes.
7. Mantener EMAIL_VERIFICATION_LEGACY_MODE=off inicialmente y EMAIL_VERIFICATION_TTL_HOURS=24. Nuevos registros requieren verificación siempre; off solo afecta históricos. Probar cuenta sintética nueva, reenvío, expiración, suspensión, confirmación y acceso sin borrar usuarios reales.
8. Comunicar la transición a usuarios históricos, verificar soporte y observabilidad segura y probar atención de obligaciones. Activar sensitive solo después de aceptación de esa matriz. Los registros vencidos requieren procedimiento de soporte disponible.
9. Si hay múltiples instancias, establecer limitador IP compartido, verificar proxy y considerar cola/outbox durable. CAS de cuota y prueba funciona por documento, pero no garantiza exactamente una entrega SMTP ni entrega tras caída del proceso.

## 11. Reversión

Ante fallos, desactivar solo la exigencia histórica (`EMAIL_VERIFICATION_LEGACY_MODE=off`) y pausar nuevos registros si el correo no funciona. Esto no debe conceder sesiones completas a nuevas cuentas pendientes.

No volver sin más a un backend anterior al Incremento 3: desconoce emailVerificationRequired y permitiría entrar con la contraseña original pendiente. Usar una versión de reversión compatible que conserve rechazo de scopes limitados, bloqueo de cuentas nuevas no verificadas, credentialVersion y baja lógica. Revertir plantillas/pantallas o transporte solo preservando esas barreras; mantener compatibilidad con enlaces emitidos hasta su expiración o mostrar mantenimiento controlado.

No borrar campos, restaurar versiones antiguas de credenciales, marcar históricos como verificados, fusionar cuentas ni eliminar relaciones para revertir. Las contraseñas definitivas fijadas al activar no se restauran a las de registro. Conservar IDs y datos. No se ejecutó este procedimiento.

## 12. Cierre del entorno de pruebas

Se verificó el dbpath de la instancia temporal antes de solicitar shutdown. El proceso terminó con código 0, el log confirmó mongod shutdown complete y no quedó listener en 27191. Se retiraron únicamente su directorio temporal y el archivo de metadatos, tras validar sus rutas absolutas dentro de workspace/tmp. No se conservaron volcados ni datos sintéticos en Git.
