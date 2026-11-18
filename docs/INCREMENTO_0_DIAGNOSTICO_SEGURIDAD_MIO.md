# MIO — Incremento 0: inventario y diagnóstico de seguridad

Fecha: 18 de noviembre de 2026, America/Tegucigalpa. Referencia: [auditoría de autenticación](AUDITORIA_AUTENTICACION_SEGURIDAD_CUENTAS_2026-11-18.md). Base Git de referencia: `f86351b7fbabd127050190772ad2cc9a9e2412de`, **con modificaciones locales preexistentes**; este SHA no representa por sí solo el contenido auditado ni la versión desplegada.

## 1. Resumen ejecutivo

El inventario del repositorio está completado. **El estado de producción de MongoDB, SMTP, Render y respaldos permanece pendiente.** No se encontró evidencia de una conexión autorizada de solo lectura; la presencia de un archivo `.env` no demuestra autorización ni el alcance de sus permisos. No se abrió ese archivo, no se leyeron secretos ni se intentó conectar a datos.

Se identificaron **10 colecciones y 21 declaraciones de índices adicionales al `_id`**. Se comprobó la intención de los esquemas, no la existencia real de esas colecciones o índices. Las cantidades de duplicados, huérfanos e inconsistencias son **desconocidas**, no cero.

Se reconfirmaron en código los problemas principales del informe: cambio administrativo de contraseña sin revocación, baja física con comprobación incompleta de relaciones, ausencia de verificación de correo, nombres comerciales sin unicidad y diferencias de política de contraseña. No se comprobó una vulnerabilidad crítica ni explotación en producción.

Se entregan [consultas de diagnóstico para mongosh](diagnostico/incremento-0-consultas.mongosh.js), **sin ejecutar contra ninguna base**. Devuelven categorías y cantidades, no documentos, correos, nombres, IDs, contraseñas, tokens ni hashes. No contienen conexión ni operaciones de escritura. No están integradas al arranque ni al comportamiento de MIO.

### Convención de estados

- **Verificado — código:** lectura de archivos actuales o extracción local de esquemas. Describe lo implementado, no lo desplegado.
- **Verificado — simulación local:** ejecución en memoria sin base, correo ni red externa. No prueba infraestructura.
- **Pendiente:** requiere acceso autorizado, evidencia operacional o ejecución sobre entorno de datos conocido. Una consulta fallida/incompleta nunca equivale a cero conflictos.
- **No aplicable:** comprobación sin objeto actual o acción fuera del diagnóstico; no implica que el sistema esté protegido.

## 2. Comprobaciones realizadas y evidencias

| Comprobación | Estado | Evidencia y alcance |
|---|---|---|
| Informe de referencia y estado local | Verificado — código | Informe del 18/11; `git status --short` muestra cambios anteriores que se conservaron. |
| Mapa de componentes | Verificado — código | Consulta del JSON Graphify existente: login/registro llaman generarToken; recuperación llama al servicio de correo; rutas importan controladores. Se contrastó con fuentes actuales, sin regenerar grafo. |
| Colecciones e índices declarados | Verificado — código | Carga local de los diez modelos y lectura de `schema.indexes()`/`collection.collectionName`, sin `mongoose.connect`, dotenv ni inicialización de índices. |
| Sesiones, credenciales y estado | Verificado — código | `backend/src/controllers/authController.js`, `middlewares/authMiddleware.js`, `services/userService.js`, `repositories/userRepository.js`. Detalles en sección 5. |
| Recuperación y Nodemailer | Verificado — código y simulación local | Servicio de 13 líneas y controlador revisados; simulación con módulo SMTP sustituido y variables sintéticas. Se comprobó puerto 587 por defecto, ruta `/recuperar`, token en query, texto de 15 minutos y propagación de fallo del servicio. Sin sockets ni mensajes reales. |
| Pruebas de correo existentes | Verificado — código | `backend/test/auth-permisos.test.js:48–69` sustituye `correo.enviarRecuperacion`; prueba lógica de token, no transporte. No se encontró prueba dedicada de `createTransport`/`sendMail` real en `backend/test`. |
| Consultas entregadas | Verificado — sintaxis local | `node --check docs/diagnostico/incremento-0-consultas.mongosh.js`. No valida semántica de pipelines en MongoDB ni compatibilidad de versión real. |
| Consistencia del inventario de consultas | Verificado — simulación local | Comparación automática de las tablas del script con `schema.indexes()` de los diez modelos: 21 declaraciones coincidentes; 23 relaciones y 9 comparaciones. Se comprobó que, sin habilitación, la guarda rechaza antes de consultar. Se usó contexto sintético, sin ejecutar pipelines ni conectar MongoDB. |
| Express, Angular y publicación | Verificado — código/documentación | `backend/src/expressApp.js:15–22`, `backend/server.js:8–15`, `frontend/scripts/configure-production.cjs:4–12`, `frontend/angular.json:45–51`, `docs/PUBLICACION.md`. Sin acceso a panel ni solicitudes a la app publicada. |
| Respaldo/restauración | Verificado — revisión documental; capacidad operacional pendiente | Búsqueda dirigida en README, docs y scripts; `docs/diagnostico.md:111,231` ya registra ausencia de evidencia reproducible. No equivale a demostrar inexistencia de respaldos externos. |

No se ejecutaron suites de integración, login/registro/logout/reset reales, endpoints públicos de catálogo ni tareas programadas. Algunas rutas GET inicializan perfiles o procesan vencimientos, y algunas rutas crean índices (`perfilVendedorService.js:17–24`, `catalogoPublicoService.js:53`, `solicitudApartadoRepository.js:16`, `comprobanteService.js:14–18`); no deben usarse como sustituto de consultas de solo lectura.

La prueba HTTP de autenticación aprobada descrita en el informe anterior es evidencia **de aquella ejecución**, con modelos simulados. No se vuelve a declarar ejecutada en este incremento. La primera sonda local de correo tuvo un error del arnés al reevaluar un `const` en el mismo contexto; se corrigió usando una sola evaluación y la repetición completó ambos escenarios. Ninguno contactó SMTP.

## 3. Inventario de colecciones e índices declarados

Todos los nombres siguientes están **verificados en código** y **pendientes en MongoDB real**. No hay colección de tiendas independiente: la tienda pública depende del usuario vendedor y su perfil. Las reservas se representan en `solicitudes_apartado` y mediante referencias en productos/pedidos; no se declaró una colección `reservas`.

| Colección | Modelo y líneas | Índices adicionales al `_id`, en orden de declaración |
|---|---|---|
| `usuarios` | `backend/src/models/users.js:11–16,39` | 1. `{email:1}` único. |
| `sesiones` | `backend/src/models/sesion.js:2–5` | 1. `{usuarioId:1}`; 2. `{expiresAt:1}`, TTL `expireAfterSeconds:0`. |
| `recuperaciones` | `backend/src/models/recuperacion.js:3–7` | 1. `{tokenHash:1}` único; 2. `{expiresAt:1}`, TTL 0. |
| `perfiles_vendedores` | `backend/src/models/perfilVendedor.js:6–16,55` | 1. `{vendedorId:1}` único. **Ningún índice sobre nombrePublico o slug.** |
| `clientes` | `backend/src/models/clientes.js:30,34` | 1. `{vendedorId:1,usuarioId:1}` único parcial, solo `usuarioId` de tipo ObjectId. |
| `productos` | `backend/src/models/productos.js:54,58–60` | 1. `{vendedorId:1,codigo:1}` único parcial, solo `codigo` string. |
| `lives` | `backend/src/models/lives.js:34` | Sin índices adicionales declarados. La existencia real de índices extra sigue pendiente. |
| `pedidos` | `backend/src/models/pedidos.js:67,71` | 1. `{reservaSolicitudId:1}` único parcial, solo ObjectId. |
| `solicitudes_apartado` | `backend/src/models/solicitudApartado.js:27–44` | Ocho índices detallados debajo. |
| `comprobantes` | `backend/src/models/comprobante.js:18–22` | 1. `{reservaId:1}` único parcial con estado `preparando`; 2. `{reservaId:1,createdAt:-1}`; 3. `{estado:1,finalizaCargaEn:1}`; 4. `{estado:1,limpiezaPendiente:1,ultimaLimpiezaEn:1}`. |

Índices de `solicitudes_apartado`, manteniendo el orden para interpretar las consultas:

1. `{compradorId:1,productoId:1}` único parcial `estado:'pendiente'`, nombre `solicitud_pendiente_unica`.
2. `{compradorId:1,createdAt:-1}`.
3. Misma clave comprador/producto, único parcial para `pendiente,confirmada`, nombre `solicitud_activa_unica`.
4. `{vendedorId:1,createdAt:-1}`.
5. Misma clave comprador/producto, único parcial para `pendiente,confirmada,comprobante_en_revision`, nombre `solicitud_ciclo_activo_unica`.
6. `{estado:1,esPrueba:1,venceEn:1}` sin TTL.
7. Misma clave comprador/producto, único parcial para `pendiente,confirmada,comprobante_en_revision,comprobante_rechazado,pagada`, nombre `solicitud_financiera_unica`.
8. `{estado:1,esPrueba:1,corregirHasta:1}` sin TTL.

### Estado real y diferencias por comprobar

**Pendiente para las diez colecciones:** presencia, tipos de colección, índices `_id` y adicionales, orden de claves, unicidad, filtros parciales exactos, TTL, sparse, collation y visibilidad. Deben distinguirse índice ausente, opciones distintas e índices adicionales. Los cuatro índices parciales de la misma clave de reservas requieren especial atención al comparar por filtro, no solo por clave.

La consulta entregada realiza `listIndexes` explícito y consume su cursor completo. Resume cantidad total y número de índices explícitamente únicos, TTL y parciales; los conteos de `unique:true` no incluyen necesariamente el `_id` cuyo metadato puede omitir ese atributo. Compara las 21 especificaciones conocidas y clasifica cada una como `coincide_estructura`, `opciones_difieren` o `clave_no_encontrada`. No imprime nombres o literales de filtros desconocidos que pudieran contener información privada.

La comparación usa JSON estructural conservador: una representación u orden interno diferente puede generar `opciones_difieren` aunque dos expresiones sean equivalentes. Es una alerta para revisión, no una autorización de recreación. No certifica rendimiento, integridad física, progreso de builds ni equivalencia funcional de índices adicionales; esas comprobaciones siguen pendientes y requieren inspección del operador. No cambiar un índice por su nombre solamente.

No se invocaron `init`, `createIndexes`, `syncIndexes` ni `ensureIndexes`. `backend/src/config/db.js:6` usa conexión de aplicación sin deshabilitar explícitamente autoIndex/autoCreate; iniciar la aplicación no garantiza ausencia de escrituras DDL. Por eso se propone mongosh directo con un rol realmente limitado.

## 4. Duplicados e integridad: consultas preparadas, resultados pendientes

| Categoría | Consulta entregada | Estado de datos |
|---|---|---|
| Correos duplicados | `correo.normalizacion_actual`: JS `trim().toLowerCase()`, igual a las rutas actuales; cuenta grupos, documentos participantes y excedentes. | Pendiente; cantidad desconocida. |
| Correos ausentes/vacíos/tipo inválido | Mismo recorrido con categorías separadas. No consulta password. | Pendiente. |
| Correos de formato sospechoso | Patrón básico sin espacios, con un `@`, dominio con punto y longitud hasta 254. Es heurística, no validación RFC exhaustiva ni confirmación del buzón. | Pendiente; no etiquetar automáticamente toda coincidencia como correo inválido definitivo. |
| Nombres comerciales duplicados | `tiendas.mayusculas_espacios`: trim, minúsculas y espacios redundantes Unicode. | Pendiente. |
| Nombres bajo política propuesta | `tiendas.politica_propuesta_acentos`: NFKC, minúsculas, espacios y equivalencias explícitas de vocales acentuadas; conserva ñ. | Pendiente; escenario diagnóstico, no regla actual aprobada. |
| Perfiles repetidos por propietario | Agrupa vendedorId ObjectId y cuenta conflictos. Propietarios ausentes o de tipo incorrecto se informan por separado. | Pendiente. |
| Tiendas sin propietario válido | Perfil → usuario: ausencia requerida, tipo incorrecto, propietario inexistente, rol inesperado o usuario no activo. | Pendiente. Inactivo no significa huérfano. |
| Referencias huérfanas | 23 relaciones, detalladas abajo, con `$lookup` y agregación por categoría. | Pendiente. |
| Propiedad y enlaces inconsistentes | Nueve comparaciones entre documentos enlazados existentes; propietarios/IDs recíprocos discordantes. | Pendiente. No certifica todas las reglas de estado financiero. |

Relaciones cubiertas:

- Sesiones y recuperaciones → usuario.
- Perfil, contacto de cliente, producto, live y pedido → usuario vendedor; contacto → usuario autenticable opcional.
- Pedido → cliente obligatorio; producto, live, solicitud de reserva y comprobante opcionales según modelo.
- Solicitud → comprador, vendedor y producto obligatorios; pedido y comprobante actual opcionales.
- Comprobante → solicitud, comprador y vendedor obligatorios; revisor opcional.
- Producto → solicitud de reserva opcional.

Coherencia adicional: pedido/cliente, pedido/producto y pedido/live deben compartir vendedor; pedido/reserva debe coincidir en vendedor/producto; pedido/comprobante en vendedor/reserva; reserva/producto en vendedor; reserva/pedido en vendedor y enlace recíproco; reserva/comprobante actual en comprador/vendedor/reserva; comprobante/reserva en comprador/vendedor.

**Interpretación:** una referencia opcional nula o ausente es `no_aplicable_opcional_ausente`, no huérfana. Una referencia string se clasifica como tipo inválido, aunque parezca un ObjectId: no se convierte ni repara. Rol inesperado puede deberse a un cambio histórico; requiere revisión antes de decidir corrección. Las categorías de una relación son excluyentes en orden de prioridad; las cantidades entre relaciones pueden superponerse y no deben sumarse como número de personas afectadas.

**Límites de las consultas:** no cargan nombres personales como sustituto de nombrePublico. El catálogo puede mostrar `usuario.nombre` cuando el nombre comercial está vacío (`catalogoPublicoService.js:19–29`); el inventario de colisiones visibles por ese respaldo sigue pendiente de una consulta específica aprobada y de definir si tal nombre debe reservarse comercialmente. Los borradores sin nombre se contabilizan, no se agrupan como una tienda duplicada de nombre vacío. No hay username independiente: unicidad de username es **no aplicable** al modelo actual; no imponer unicidad a nombres personales.

### Condiciones para ejecutar posteriormente las consultas

1. Operador autorizado establece sesión mongosh por canal seguro, verifica base y rol de solo lectura; no pasar URI/contraseña por el chat, historial del shell o el informe. No usar la conexión de la aplicación por conveniencia.
2. Revisa el archivo y define en esa sesión `globalThis.MIO_DIAGNOSTICO_BASE_ESPERADA` con la base autorizada y `globalThis.MIO_DIAGNOSTICO_AUTORIZADO = true`; después carga `docs/diagnostico/incremento-0-consultas.mongosh.js`. Estos valores no conectan ni prueban permisos; solo previenen selección accidental de otra base.
3. Preferir snapshot/copia aislada consistente. Si se aprueba lectura sobre producción, acordar ventana y presupuesto: cada agregación tiene `maxTimeMS:10000`, `allowDiskUse:false` y collation simple; se ejecutan secuencialmente, no en paralelo. Las lecturas de texto limitan a 100000 documentos por escenario, con cursor de lotes pequeños. Si se supera, el resultado es **pendiente**, sin conclusión parcial de ausencia de duplicados.
4. Los valores proyectados de correo/nombre se procesan en memoria del cliente, sin impresión ni persistencia. Por ello sigue siendo acceso a datos personales y exige permiso `find` y un equipo controlado. No activar trazas ni volcados de memoria; el límite es una salvaguarda de recursos, no una muestra estadística.
5. Si falta catálogo, no inicia diagnóstico. Una colección ausente se marca pendiente y no se trata como colección sana/vacía. Sin privilegios, timeout o error, solo se emite categoría pendiente; no se imprime `error.message` del motor.
6. La salida tiene únicamente cantidades/categorías. Conservar un registro restringido de fecha, entorno aprobado, versión, consistencia de lectura y categorías completadas, sin copiar URIs, correos o tokens. Los conteos secuenciales sobre una base que cambia no son un snapshot transaccional común: repetir sobre copia consistente antes de decidir una migración.

No contiene `$out`, `$merge`, `$function`, escrituras, cambios de usuario, creación de colecciones/índices ni limpieza TTL manual. La limpieza TTL ya configurada puede seguir ocurriendo por el servidor durante una lectura; el diagnóstico no la inicia ni modifica.

## 5. Sesiones y credenciales

Todo lo siguiente es **verificado en código**, con comportamiento de producción **pendiente de confirmar versión desplegada**. No se alteraron contraseñas ni sesiones.

| Aspecto | Estado actual y evidencia |
|---|---|
| Duración | Sesión persistida vence a los 1800000 ms; JWT `expiresIn:'30m'` (`backend/src/controllers/authController.js:10–14`). Duración fija; no refresh/renovación. |
| Autorización | JWT firmado con `JWT_SECRET`; exige sid existente, usuario coincidente y expiresAt futuro; después usuario activo y rol actual de BD (`authMiddleware.js:16–34`, `roleMiddleware.js:9–12`). |
| Revocación/logout | Elimina solo la sesión actual por `_id`/usuario (`authController.js:132–134`). Expiración se verifica en consulta; no depende del borrado TTL puntual. |
| Reset por enlace | Token 256 bits, hash SHA-256, 15 min fijos; consumo con `findOneAndDelete` filtrado por fecha; cambia password y luego elimina todas las sesiones y recuperaciones (`authController.js:136–156`). No es una transacción y no comprueba matchedCount del cambio. |
| Cambio administrativo | `userService.js:133–148` cambia hash sin revocar sesiones/recuperaciones. JWT previamente obtenido puede seguir vigente hasta sus 30 min si usuario activo. |
| Suspensión | `userService.js:151–175` cambia estado a inactivo y sincroniza perfil; no borra sesiones. Middleware deniega a inactivo. Actualizar usuario con estado usa otro flujo de sincronización, también separado. |
| Reactivación | Una sesión antigua que siga existiendo y no haya vencido vuelve a cumplir el middleware. Confirmado por lógica, no mediante cuenta real. |
| Eliminación | Baja física tras comprobar solo datos por vendedor en pedidos/productos/clientes/lives (`userRepository.js:33–48`). Omite relaciones de comprador y reservas/comprobantes. Usuario ausente queda rechazado por middleware, pero relaciones pueden quedar huérfanas. |
| Almacenamiento de tokens | JWT y usuario en localStorage (`frontend/src/app/services/auth.service.ts:59–69,181–199`). Riesgo ante XSS; no se demostró XSS ni extracción. Guard de frontend no sustituye autorización backend. |

### Política actual por emisor de contraseña

| Flujo | Validación | Hash |
|---|---|---|
| Registro público | Password string entre 10 y 128 unidades de longitud JS; nombre/correo no vacíos; correo trim/minúsculas. Rol cliente/vendedor, admin rechazado. | bcrypt costo 10 (`authController.js:19–57`). |
| Creación administrativa | Exige presencia, sin política equivalente de tipo/longitud; roles admin/vendedor/cliente. Endpoint requiere admin (`routes/userRoutes.js:16–19`). | bcrypt costo 10 (`userService.js:34–65`). |
| Actualización administrativa | Si password es truthy, lo hashea; sin longitud/tipo uniforme. | bcrypt costo 10 (`userService.js:95,133`). |
| Script createAdmin | Variables presentes, sin longitud mínima documentada en código. **No ejecutado.** | bcrypt costo 10 (`backend/src/scripts/createAdmin.js:17–38`). |
| Reset | String 10–128; token hex de 64 caracteres. | bcrypt costo 12 (`authController.js:148–155`). |

El máximo por caracteres no controla el límite de 72 bytes de bcrypt: el informe anterior incluye sonda local que confirmó truncamiento. No se rehashó ni inspeccionó ningún hash de usuario en este incremento. No se encontró lista de claves comprometidas, MFA o verificación persistente de correo. El modelo solo posee rol único y estado activo/inactivo (`models/users.js:25–35`); no estados separados suspendido/eliminado/no verificado.

Enumeración y abuso: registro revela correo existente (`authController.js:30–35`); login distingue inactivo antes de verificar contraseña (92–104); respuestas internas incluyen error.message en ciertos catches (69–72,120–124). Hay limitador real de 20 solicitudes/15 min compartido entre cuatro rutas auth, por IP y proceso (`authRoutes.js:12–14`); no es ausencia total de defensa. Store compartido, configuración efectiva de proxy y resistencia distribuida siguen pendientes.

## 6. Estado del servicio de correo

**Implementación verificada; configuración, disponibilidad, entrega y reputación reales pendientes.** No se envió correo ni se hizo `transport.verify()` contra SMTP.

| Variable | Uso real |
|---|---|
| `SMTP_HOST` | Obligatoria explícita antes de construir transporte. |
| `SMTP_PORT` | Opcional en código; 587 por defecto. `Number(SMTP_PORT) === 465` activa TLS implícito. No valida rango/formato explícitamente. |
| `SMTP_USER` | Opcional en código; si existe activa auth. La necesidad operacional depende del proveedor. |
| `SMTP_PASSWORD` | Se usa como pass cuando existe SMTP_USER; no comprobada como obligatoria explícita. |
| `MAIL_FROM` | Obligatoria explícita; remitente, no prueba dominio autorizado. |
| `APP_URL` | Obligatoria explícita; base de URL de recuperación, sin exigir HTTPS en este servicio. |
| `MONGO_URI` | El controlador necesita persistir recuperación; no es variable de Nodemailer. No se leyó su valor. |
| `JWT_SECRET` | Necesaria para sesiones de aplicación; el token de recuperación usa crypto aleatorio/SHA-256, no JWT_SECRET. |

`backend/src/services/correoService.js:5–12` construye `new URL('/recuperar', APP_URL)`, agrega `token` por `searchParams` y envía texto plano con el enlace. La ruta absoluta reemplaza cualquier subruta de APP_URL. El frontend usa `ActivatedRoute` y envía a `/auth/forgot-password` o `/auth/reset-password` (`frontend/src/app/pages/login/recuperar.ts`). El texto y persistencia dicen 15 min; no existe variable para ajustar a los 30 min propuestos.

Si falla SMTP o la construcción/configuración del correo, el servicio rechaza su promesa. El controlador captura, escribe un mensaje genérico y responde el mismo mensaje de cuenta existente/inexistente (`authController.js:139–146`). Como la recuperación se guarda **antes** del envío, un fallo deja el registro persistido hasta consumo/limpieza TTL; no lo revierte. No hay cola durable, reintento propio, alerta ni garantía de entrega implementada. Esperar SMTP solo para cuentas existentes también puede diferenciar tiempos; no se midió esa fuga en producción.

TLS: `secure:false` con puerto 587 no prueba envío sin cifrado: Nodemailer intenta STARTTLS cuando está disponible. El servicio no fija `requireTLS:true`, de modo que falta exigir y verificar esa política con el proveedor. Referencia: [Nodemailer SMTP](https://nodemailer.com/smtp). No se inspeccionó negociación real, certificado, SPF, DKIM, DMARC ni cuotas.

**Pruebas:** la suite existente simula la función de envío completa, por lo que no comprueba construcción del enlace ni transporte real. La simulación puntual de este incremento ejecutó el servicio con Nodemailer sustituido y variables ficticias; sí comprueba construcción y rechazo del servicio, **no** envío. Falta prueba automatizada mantenida del servicio, contrato de timeout/fallo SMTP y futura integración con buzón aislado autorizado.

**Verificación de correo faltante:** estado persistente ligado al correo actual, token hash separado por propósito, expiración, consumo atómico, límites de reenvío, plantilla/enlace/ruta frontend/backend y política gradual para usuarios existentes. Definir qué nuevas operaciones requieren verificación y preservar acceso al historial y obligaciones existentes. No reutilizar tokens de reset para verificar correo ni activar usuarios antiguos como verificados por defecto.

## 7. Seguridad de despliegue: evidencia disponible

| Área | Verificado en repositorio | Pendiente operacional |
|---|---|---|
| Render | `docs/PUBLICACION.md:18–53` documenta backend `npm ci`/`npm start`, sitio estático `build:deploy`, variables y rewrite SPA. No se encontró blueprint Render/IaC del servicio en búsqueda de YAML. README y releases mencionan URLs/evidencia HTTPS histórica. | Configuración efectiva, commit servido, dominio/certificado, redirección HTTP→HTTPS, cabeceras y salud actuales. No se consultó panel ni URLs de producción. |
| HTTPS | Comentario Express sitúa terminación TLS en proxy. Generador Angular exige HTTPS sin credenciales/query/hash y path `/api` (`configure-production.cjs:4–8`). | TLS real en navegador/proxy/API y rechazo de tráfico inseguro. URL HTTPS documentada no prueba política completa. |
| CORS | Lista por `CORS_ORIGINS`; fallback localhost solo fuera de production; sin lista en production no habilita lectura cross-origin. No hay `credentials:true` (`expressApp.js:19–21`). | Valor aplicado, origen exacto, NODE_ENV y comportamiento de preflight/orígenes no permitidos. CORS no bloquea clientes no navegador ni reemplaza permisos. |
| Proxy/rate limit | `TRUST_PROXY_HOPS` se convierte a Number, por defecto 0 (`expressApp.js:17`); docs proponen 1 tras confirmar topología. | Topología real y riesgo de confiar encabezados falsificados o agrupar todo tráfico como una IP. No cambiarlo en diagnóstico. |
| JWT | Arranque exige presencia de MONGO_URI/JWT_SECRET (`server.js:8–10`), pero no longitud/entropía. verify valida firma y exp; no fija explícitamente algorithms/issuer/audience. | Rotación, custodia, entropía y separación real por entorno; no se accedió al secreto. No se demuestra aceptación de JWT sin firma. |
| Angular | Reemplaza environment de desarrollo por producción (`angular.json:45–51`). `environment.production.ts` actual usa `/api`; el script de deploy lo sobrescribe con PUBLIC_API_URL. | Artefacto servido y uso real de build:deploy. Con frontend/API separados, un build sin generador puede apuntar `/api` al host equivocado; no se ejecutó build porque escribe configuración generada. |
| Tokens | Persistidos en localStorage. Logout elimina en servidor y local cuando obtiene éxito/401; fallos de red muestran error (`auth.service.ts:201–217`). | CSP, dependencias/terceros, exposición por logs/referrer en recuperación, comportamiento de múltiples pestañas. No hay XSS comprobada. |
| Secretos | `.env` está ignorado y no aparece como archivo seguido en `git ls-files`; sí hay `.env.example`. Solo se comprobó presencia/ruta del `.env`. | Secret scanning de historia, CI, artefactos y paneles; no se certifica ausencia de fugas. No se abrió `.env`, ni se enumeraron valores del entorno. |

La documentación contiene estados de momentos diferentes: `docs/PUBLICACION.md:3` conserva una declaración de preparación no publicada mientras README/releases refieren publicación posterior. Por ello no se toma esa guía como evidencia del estado vivo. También `PUBLICACION.md:86` conserva texto de límites de incrementos anteriores; el código de comprobantes existe, con activación restringida por `reservasPruebaPolicy.js`. Las discrepancias se registran, sin modificar documentos históricos ni configuración.

## 8. Estado de respaldos y restauración

**Verificado — revisión documental:** no se encontró evidencia reproducible de una política operacional vigente, ejecución de copia exitosa, retención ni restauración comprobada. `docs/diagnostico.md:111,231` señala expresamente la limitación. `docs/modelo-datos.md:320` propone procedimiento, no registra su ejecución. `docs/PLAN_DE_TRABAJO.md:21` agenda copia/restauración para 19–25 de noviembre; un plan no acredita respaldo realizado.

**Pendiente:** proveedor/topología y versión efectivos, backup habilitado, último punto recuperable, periodicidad, retención, cifrado, ubicación, control de acceso y una restauración aislada verificable. No se deduce capacidad de backup por usar Atlas ni por el nivel de servicio sugerido en documentación. Un CSV o reinicio con persistencia no es respaldo consistente de todas las relaciones.

Evidencia mínima solicitada al operador: metadatos sanitizados de último respaldo y resultado, política de retención/RPO/RTO aprobados, procedimiento y responsable, registro de una restauración a base aislada con versión compatible y conciliación de conteos/relaciones. No aportar un dump al chat ni subirlo al repositorio. La restauración es una escritura en un entorno aparte y **no se realizó ni se autoriza implícitamente como parte de este diagnóstico**.

## 9. Riesgos confirmados y potenciales

| Severidad | Estado | Riesgo y evidencia |
|---|---|---|
| Alto | Verificado — código | A-01: cambio administrativo de clave sin revocar sesiones ni recuperaciones (`userService.js:133–148`); reactivación puede reutilizar sesión no vencida. |
| Alto | Verificado — código | A-03: baja física con relaciones incompletas (`userRepository.js:37–48`, `userService.js:178–200`). Daño real/datos huérfanos pendientes. |
| Alto | Verificado — código | A-02: no hay verificación de correo persistente ni flujo de enlace. No demuestra toma de una cuenta existente. |
| Medio | Verificado — código | Nombres comerciales sin normalización/unicidad efectiva en aplicación/esquema (`perfilVendedorService.js:27–51`). Duplicados reales pendientes. |
| Medio | Verificado — código, con evidencia local previa | Política 10–128 incompatible con límite de bcrypt y validación administrativa más débil. |
| Medio | Verificado — código | Reset consume, cambia y revoca en pasos separados; SMTP guarda token antes de entregar y oculta fallo al cliente. |
| Medio | Verificado — código | Enumeración por mensajes, localStorage y limitador por proceso. Explotación, XSS y evasión real pendientes. |
| Bajo | Verificado — código | Error.message enviado al cliente y carreras E11000 sin traducción uniforme; GET de perfil crea y guardado fuerza activo. |
| Alto potencial | Pendiente | Índices efectivos ausentes/diferentes, duplicados o referencias huérfanas. No hay conteos reales. |
| Alto potencial | Pendiente | Recuperación ante desastre no demostrada. Ausencia de evidencia no equivale a ausencia de copias externas. |
| Medio potencial | Pendiente | TLS, CORS/proxy, secreto/rotación, correo y artefacto desplegado distintos de lo esperado. |

No se elevaron riesgos potenciales a vulnerabilidades comprobadas de producción. La clasificación mantiene la auditoría de referencia y explicita el alcance de cada evidencia.

## 10. Comprobaciones pendientes y permiso mínimo

| Qué falta | Por qué es necesario | Acceso mínimo o alternativa |
|---|---|---|
| Índices reales y catálogo | `unique:true` no demuestra creación exitosa. | `listCollections` en la base y `listIndexes` en las diez colecciones; sin permisos de escritura. El rol integrado `read` incluye listIndexes, aunque un rol personalizado acotado puede ser menor. |
| Conteos de duplicados/relaciones | Requieren comparar documentos, no solo esquemas. | `find` sobre las diez colecciones y lectura con `$lookup`; credencial temporal con alcance a la base autorizada, TLS y red permitida solo al operador. Sin readWrite, createIndex, collMod, drop ni administración de usuarios. |
| Versión/topología | Necesaria para transacciones y sintaxis de índices/pipelines. | Metadatos sanitizados proporcionados por operador, o autorización específica para `buildInfo`/`hello`; no requiere entregar hostnames/secretos al informe. Las consultas entregadas no ejecutan esos comandos. |
| Configuración Render | No está representada completamente como código. | Operador comparte evidencia sanitizada de build/start/branch/commit, nombres/presencia de variables, proxy y dominios; sin mostrar valores secretos ni conceder edición. |
| SMTP | Entrega/TLS/cuotas no se prueban con mocks. | Configuración sanitizada y metadatos del proveedor por operador. Envío real requiere autorización posterior y buzón de pruebas; no es necesario para concluir diagnóstico documental. |
| Respaldos | No hay evidencia de recuperación. | Lectura de metadatos de política/tareas del proveedor o evidencia sanitizada. Para restaurar, permiso posterior de crear/escribir únicamente destino aislado, nunca restaurar encima de producción. |

Referencia del alcance de listIndexes: [MongoDB — listIndexes](https://www.mongodb.com/docs/manual/reference/command/listindexes/). El rol de solo lectura debe verificarse antes de uso por el operador; los flags del script no demuestran la autorización. Si no se desea entregar acceso, el operador puede ejecutar las consultas revisadas y proporcionar únicamente resultados agregados, versión/entorno y categorías pendientes. No hace falta entregar credenciales al agente.

## 11. Requisitos previos para modificar MongoDB

Estos requisitos son condiciones para un incremento posterior; **no se ejecutan aquí**.

1. Identificar la versión desplegada y la base objetivo, fijar alcance y obtener autorización concreta de escritura. Reproducir el checkout con sus cambios locales revisados; no asumir que HEAD coincide con producción.
2. Completar inventario real de índices/datos con copia consistente, revisar resultados y resolver titularidad de cada conflicto mediante proceso humano. No deduplicar por nombre ni fusionar cuentas automáticamente.
3. Verificar respaldo restaurable de todas las colecciones relacionadas; acordar RPO/RTO, responsables y ventana. Guardar evidencia de restauración/conteos, no solo de tarea de copia.
4. Preparar entorno aislado con misma versión y topología compatible con transacciones: réplica o clúster equivalente. Credenciales, base, red y secretos exclusivos, sin acceso de escritura a producción; comenzar con fixtures sintéticos y solo después copia anonimizada autorizada.
5. Separar correo y almacenamiento: SMTP de prueba sin destinatarios externos y bucket privado de prueba, sin claves de producción. No copiar sesiones, tokens de recuperación ni secretos activos a fixtures. Mantener IDs/referencias de forma coherente si se anonimiza una copia.
6. Los tests existentes usan `MIO_MONGO_PRUEBAS_URI` y validan URI local de `127.0.0.1:27182`, réplica `mioPruebas` y bases `mio_pruebas_*` (`backend/test/consistencia-mongo.test.js:10–16`, otros `*-mongo.test.js`). Algunos ejecutan `dropDatabase` al terminar: reservarles bases desechables. No ejecutarlos sobre una copia valiosa ni cambiar sus guardas para apuntar a producción.
7. Mantener flags de prueba de reservas: `NODE_ENV=test`, base `mio_pruebas_*`, vendedor permitido y `RESERVAS_PRUEBA_HABILITADAS` (`backend/src/services/reservasPruebaPolicy.js:4–16`). Esos flags no convierten por sí solos un entorno en seguro; deben acompañarse de credenciales y red aisladas.
8. Definir cambios versionados e idempotentes con precondiciones, dry-run agregado, canario/lotes y conciliación posterior. Separar DDL del arranque/tráfico y comprobar autoIndex/autoCreate antes de levantar la aplicación contra cualquier copia.
9. Tener pruebas de carreras, fallos parciales y acceso cruzado aprobadas, rollback de aplicación compatible con hashes/estados nuevos y criterio de parada. Revocaciones de seguridad no se revierten reactivando tokens anteriores.

## 12. Recomendación para iniciar el Incremento 1

**Listo para diseñar y desarrollar sobre fixtures aislados; no listo para migrar o modificar producción.** El cierre del Incremento 0 es documental y de inventario de código; la verificación operacional queda abierta con las dependencias de la sección 10.

Priorizar el Incremento 1 en revocación uniforme de sesiones/recuperaciones ante cambio de contraseña y suspensión, impedir resurrección al reactivar, baja lógica con conservación de identificadores y comprobación de todas las relaciones. Unificar validación backend y respuestas internas sin rediseñar autenticación. Antes de implementar atomicidad, elegir transacción o protocolo de versión de credenciales según topología confirmada.

Criterios de aceptación mínimos del siguiente incremento: sesión y enlace previos rechazados tras cambio administrativo, suspensión/reactivación sin revalidación de sesión antigua, historial conservado tras baja, administración y registro con política coherente, y ausencia de acceso cruzado. Probar en base desechable con fallos/concurrencia, no solo mocks. Índices comerciales, backfills, verificación de correo y migración de almacenamiento frontend requieren sus incrementos coordinados.

**Registro de acciones no aplicables a esta ejecución:** modificar datos, índices o configuraciones; restaurar base; crear backups; enviar correo real; cambiar claves o revocar sesiones existentes; publicar/desplegar. Ninguna se realizó. Solo se añadieron este informe y consultas documentales independientes.
