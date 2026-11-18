# MIO — Auditoría de autenticación, seguridad e integridad de cuentas

Fecha: 18 de noviembre de 2026. Alcance: estado actual del checkout, incluidos cambios locales anteriores a esta auditoría.

## 1. Dictamen y límites

La autenticación existente es aprovechable: hay bcrypt, JWT de 30 minutos respaldado por sesiones revocables, autorización por rol consultado en MongoDB, filtros de propiedad y recuperación por correo. Se recomienda corregirla por incrementos, conservando los identificadores y las relaciones actuales.

No se identificó una vulnerabilidad crítica demostrada. Los hallazgos altos principales son sesiones que sobreviven al cambio administrativo de contraseña, ausencia de verificación de correo y eliminación de identidades sin comprobar todas sus relaciones. Hay problemas medios de unicidad comercial, truncamiento de contraseñas, enumeración y consistencia de recuperación.

Se realizó revisión estática y comprobaciones locales con datos sintéticos. No se conectó a MongoDB, no se inspeccionaron datos personales ni valores de secretos, no se enviaron correos, no se ejecutaron migraciones, scripts de administración ni creación de índices. Solo se añade este informe; el código y los cambios previos se conservan.

**Importante:** un defecto comprobado en código no implica explotación observada en producción. Los índices declarados no prueban índices desplegados. No es posible afirmar cuántos duplicados existen sin inspeccionar los datos. Las líneas citadas corresponden a este checkout y pueden cambiar posteriormente.

Se consultó el grafo existente de Graphify y sus relaciones de autenticación como orientación; las evidencias finales se contrastaron con archivos actuales. Su CLI no estaba disponible; se consultó el JSON directamente, sin regenerarlo.

## 2. Arquitectura actual y funcionalidades

| Área | Implementación y estado |
|---|---|
| Entrada | Express monta `/api/auth`, usuarios, tiendas y recursos en `backend/src/expressApp.js:28–39`. CORS usa una lista configurable y `trust proxy` depende del entorno (17–22). |
| Registro público | `authController.js:17–74`: normaliza correo con trim/minúsculas, comprueba existencia, bcrypt costo 10, permite cliente/vendedor y rechaza admin. Emite sesión y JWT. |
| Login | `authController.js:76–126`: normaliza correo, selecciona hash explícitamente, comprueba estado y contraseña. No existe renovación de sesión. |
| Sesión | `authController.js:10–14`, `models/sesion.js:2–5`: sesión de 30 minutos, JWT con `id` y `sid`, TTL declarado. No depende únicamente de la limpieza TTL. |
| Middleware | `authMiddleware.js:16–34`: verifica firma y caducidad JWT, sesión existente y no vencida, usuario existente y activo; consulta rol actual de BD. `roleMiddleware.js:9` valida roles. |
| Logout | `authController.js:132–134`: elimina la sesión actual. Frontend llama al servidor y limpia almacenamiento al recibir éxito o 401 (`auth.service.ts:201–217`). |
| Recuperación | `/forgot-password` y `/reset-password` ya existen. Token aleatorio de 32 bytes, SHA-256 persistido, consumo con `findOneAndDelete`, revocación posterior de sesiones y demás recuperaciones (`authController.js:136–156`). Vence en **15 minutos**, no 30, y no es configurable. |
| Correo | Nodemailer usa `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `APP_URL` (`correoService.js:3–12`). Envía enlace, nunca contraseña. Entrega real no verificada. |
| Antifuerza bruta | Limitador compartido de 20 solicitudes/15 min para registro, login y recuperación (`authRoutes.js:12–14`). No es ausencia total de protección. |
| Frontend | Angular guarda token y usuario en localStorage, programa vencimiento y atiende 401. Guard de rol es ayuda de navegación; backend sigue siendo la barrera real. |
| Usuarios | Colección `usuarios`: nombre, correo, hash, rol único y estado activo/inactivo. Hash excluido por defecto y retirado al serializar (`models/users.js:19–22,43–47`). No hay username independiente, correo verificado ni capacidades múltiples. |
| Tienda | `perfiles_vendedores` vincula un perfil por `vendedorId` con unicidad declarada; nombre público opcional sin unicidad. El perfil se crea perezosamente al consultar `/me`. |
| Compradores | `clientes` son contactos de cada tienda, con `usuarioId` opcional e inmutable; no son necesariamente cuentas autenticables. Índice único parcial por vendedor/usuario (`models/clientes.js:5,34`). |

Rutas de archivos abreviadas en tablas: controladores bajo `backend/src/controllers/`, modelos bajo `backend/src/models/`, servicios bajo `backend/src/services/`, middleware bajo `backend/src/middlewares/`; frontend de autenticación bajo `frontend/src/app/services/`.

## 3. Hallazgos comprobados

La severidad considera impacto y condiciones necesarias; «alto» no equivale automáticamente a acceso remoto sin autenticación.

### A-01 — Alto: cambiar contraseña desde administración conserva sesiones y enlaces de recuperación

**Evidencia:** `backend/src/services/userService.js:133–148` actualiza el hash y retorna sin eliminar sesiones ni recuperaciones. El middleware comprueba sesión/estado, no una versión de credenciales (`authMiddleware.js:17–34`). El reset público sí intenta revocar ambos (`authController.js:155`).

**Impacto:** un token sustraído sigue siendo válido hasta su vencimiento aunque el administrador cambie la contraseña. Un enlace de recuperación previo aún válido puede volver a cambiarla. La operación administrativa está protegida por rol admin (`userRoutes.js:16–22`); no se ha observado bypass de ese rol.

**Corrección:** centralizar mutaciones de credenciales y revocar todas las sesiones y recuperaciones de forma atómica, o incrementar una versión de credenciales validada en cada solicitud. Revocar también al suspender; al reactivar no deben resucitar sesiones antiguas. Hoy la suspensión impide uso, pero la reactivación antes del vencimiento permite volver a usar la sesión anterior.

### A-02 — Alto: correo no verificado como identidad de cuenta

**Evidencia:** el modelo completo `backend/src/models/users.js:3–40` no contiene estado de verificación. Registro permite crear cuenta y sesión inmediatamente (`authController.js:53–66`); no hay rutas de verificación en `authRoutes.js:16–21`.

**Impacto:** se puede ocupar una dirección ajena sin demostrar control y operar con ella como identidad; la ocupación de correo y el envío de recuperación a su propietario pueden producir disputas de identidad. Esto no demuestra apropiación de una cuenta ya existente ni acceso al buzón ajeno.

**Corrección:** verificación independiente con token hasheado, propósito, caducidad y reenvío limitado. No considerar verificado a un usuario por ser antiguo.

### A-03 — Alto: eliminación física omite relaciones de comprador y de reservas

**Evidencia:** `userService.js:178–200` autoriza eliminación tras `tieneDatosDeTienda`; `userRepository.js:37–48` comprueba pedidos/productos/clientes/lives únicamente por `vendedorId`. Después usa `findByIdAndDelete` (33–35). No consulta `clientes.usuarioId`, `solicitudes_apartado.compradorId/vendedorId` ni `comprobantes.compradorId/vendedorId`, definidos en `models/clientes.js:5`, `models/solicitudApartado.js:4–6` y `models/comprobante.js:4–5`.

**Impacto:** la eliminación administrativa de un comprador con reservas puede dejar referencias huérfanas e impedirle acceder a su historial. Las comprobaciones existentes protegen parcialmente vendedores; no cubren todo el grafo. Comprobar y borrar son operaciones separadas, por lo que hay además una ventana de carrera.

**Corrección:** preferir baja lógica y retención de identificadores e historial; impedir eliminación física con cualquier relación, y serializar carreras con operaciones que crean relaciones. No borrar ni reasignar datos existentes automáticamente.

### M-01 — Medio: nombres comerciales duplicables y sin reglas canónicas

**Evidencia:** `models/perfilVendedor.js:13–16` solo declara trim. `perfilVendedorService.js:27–51` solo recorta extremos y actualiza por propietario, sin consultar nombres de otros perfiles. `perfilVendedorRepository.js:13–19` hace upsert sin clave comercial única.

**Impacto:** dos vendedores pueden crear o renombrar tiendas con el mismo nombre exacto, variantes de mayúsculas o espacios interiores. También pueden hacerlo simultáneamente. Permite confusión comercial; no cambia la propiedad de los documentos.

**Corrección:** clave canónica única en BD para creación y renombrado, con resolución previa de conflictos. La URL actual ya usa un identificador único de usuario (`frontend/src/app/app.routes.ts:39`, `/catalogo/:vendedorId`); lo que falta es un slug comercial independiente, no toda identificación pública única.

### M-02 — Medio: se aceptan contraseñas que bcrypt trunca

**Evidencia:** `authController.js:24,38,150–151` acepta 10–128 unidades de longitud JavaScript y pasa directamente a bcrypt. Comprobación local de la dependencia instalada: hash de 72 letras ASCII más un sufijo aceptó otro sufijo distinto. Una cadena de 40 letras acentuadas ocupa 80 bytes UTF-8 aunque tenga longitud 40.

**Impacto:** la aplicación presenta como diferentes contraseñas que autentican igual después de 72 bytes. No implica que todas las contraseñas sean débiles. El costo 10 del registro cumple el mínimo de bcrypt citado por OWASP; el problema no es ausencia de hashing.

**Corrección:** preferir Argon2id para nuevos hashes y conservar verificación bcrypt heredada. Migrar al autenticar, sin recalcular hashes sin la contraseña. Para bcrypt aún emitido, rechazar entradas superiores a 72 bytes de forma explícita. No imponer ese rechazo retroactivamente al login de usuarios existentes antes de darles una ruta compatible de actualización.

### M-03 — Medio: política de contraseña y validación de correo inconsistentes

**Evidencia:** alta administrativa solo exige valores no vacíos (`userService.js:35–41,58`) y edición hashea cualquier password truthy (133). El registro y reset sí comprueban tipo y longitud. El esquema de correo solo aplica required/trim/lowercase (`models/users.js:11–17`), sin formato ni límite. `createAdmin.js:17–35` comprueba presencia de contraseña, sin política de longitud.

**Impacto:** administración puede asignar contraseñas cortas y crear correos inválidos; tipos incorrectos pueden acabar en errores internos. No es un endpoint público de asignación de claves administrativas.

**Corrección:** misma política backend para todos los emisores de credenciales; validación explícita de tipos, límites y correo. Para nuevas contraseñas sin MFA, proponer mínimo 15 caracteres, admitir frases y Unicode con reglas documentadas, comprobar lista de claves comprometidas y evitar composición arbitraria o rotaciones periódicas obligatorias. Conservar temporalmente compatibilidad de login heredado.

### M-04 — Medio: enumeración explícita y por tiempo

**Evidencia:** registro responde que el correo ya existe (`authController.js:30–35`). Login responde 403 para usuario inactivo **antes de comprobar contraseña**, frente a 401 para inexistente (`92–104`). Para usuario inexistente no realiza bcrypt. Recuperación responde texto genérico pero espera envío SMTP solo cuando existe la cuenta (`139–146`).

**Impacto:** se puede distinguir existencia/estado; los tiempos requieren medición real para cuantificar su fiabilidad. El limitador reduce volumen pero no elimina estas diferencias.

**Corrección:** errores públicos uniformes, hash ficticio para inexistentes y envío asíncrono por cola con respuesta uniforme. Evitar bloquear globalmente una cuenta por intentos de terceros; aplicar controles por IP y cuenta con identificadores no expuestos.

### M-05 — Medio: reset no atómico entre consumo, cambio y revocación

**Evidencia:** `authController.js:151–156` hashea antes de validar token persistido; consume el token, actualiza usuario y luego borra sesiones/recuperaciones en operaciones separadas. No comprueba `matchedCount` del cambio.

**Impacto:** fallo posterior al consumo puede inutilizar enlace sin cambiar clave; fallo de revocación puede dejar sesiones activas después del cambio. Dos tokens distintos del mismo usuario pueden atravesar el flujo simultáneamente. Si la cuenta se inactivó entre emisión y consumo, puede devolverse éxito aunque no se actualice contraseña. El mismo token sí tiene consumo atómico mediante `findOneAndDelete`; no se afirma que sea reutilizable secuencialmente.

**Corrección:** transacción en réplica MongoDB compatible o protocolo equivalente con versión de credenciales y comparación atómica. Revalidar usuario, consumo y revocación en una unidad coherente, con resultado explícito. Prevalidar token antes del trabajo costoso y revalidarlo al confirmar, sin introducir carrera. Incluir concurrencia entre login y reset en pruebas.

### M-06 — Medio: token de sesión persistente accesible a JavaScript

**Evidencia:** `frontend/src/app/services/auth.service.ts:59–69` guarda JWT en localStorage. No se ha demostrado XSS en esta auditoría.

**Impacto:** una futura ejecución de JavaScript malicioso en el origen podría extraer el token, que conserva acceso hasta revocación/vencimiento. La lectura local del rol no permite por sí sola superar el rol consultado por backend.

**Corrección:** evaluar sesión en cookie HttpOnly, Secure y SameSite con estrategia CSRF y CORS de credenciales, o token en memoria con protocolo de renovación seguro si hay necesidad real. No añadir refresh tokens solo por comodidad. Migrar frontend/backend coordinadamente, conservando inicialmente el JWT y la colección de sesiones.

### B-01 — Bajo: errores internos expuestos y carrera de duplicados mal traducida

**Evidencia:** registro y login devuelven `error.message` (`authController.js:69–72,120–124`); perfil también (`perfilVendedorController.js:28–32`). Carrera de registro termina en catch genérico si MongoDB devuelve E11000; el índice, si existe, evita duplicación pero la respuesta será 500 y puede incluir el correo conflictivo.

**Corrección:** traducir errores esperados a respuesta estable, nunca devolver texto del motor. Logs internos sanitizados con identificador de correlación. Elegir respuesta pública que evite enumeración, manteniendo 409 para conflictos comerciales o administrativos cuando corresponda.

### B-02 — Bajo: GET de perfil escribe y guardar reactiva perfil

**Evidencia:** `perfilVendedorService.js:17–24` consulta y luego crea; dos primeras consultas simultáneas pueden competir por `vendedorId` único. Guardado fuerza `activo: true` (42–51). Estado de cuenta y perfil se sincronizan en pasos separados (`userService.js:135–145,164–173`).

**Impacto:** errores transitorios de perfil, estados divergentes tras fallos, y una futura moderación separada de tienda sería anulable por su guardado. No permite a una cuenta actualmente inactiva pasar el middleware.

**Corrección:** creación explícita/idempotente; separar estado de cuenta, publicación y moderación, y no reactivar por editar texto.

## 4. Autorización e integridad: controles conservables y límites

| Operación | Evidencia actual | Conclusión |
|---|---|---|
| Administración de cuentas | `backend/src/routes/userRoutes.js:16–24` | Todas las rutas requieren autenticación y admin. Alta pública rechaza admin. No hay escalamiento público comprobado. |
| Tienda propia | `perfilVendedorController.js:3,22–24`; `perfilVendedorRepository.js:14–19` | Propietario derivado de sesión; body no permite apropiarse de otra tienda. |
| Productos, clientes y lives | Controladores derivan propietario de `req.usuario`; repositorios `productoRepository.js:15–35`, `clienteRepository.js:15–36`, `liveRepository.js:9–51` | Filtros por recurso y vendedor. No se encontró IDOR en los caminos revisados. |
| Pedidos y relaciones | `pedidoRepository.js:17–60` | Consultas y mutaciones por vendedor; búsqueda de cliente/live/producto también por vendedor. |
| Apartados | `solicitudApartadoService.js:18–21,61–67,83–86` y rutas | Comprador/vendedor se obtiene de sesión; creación obtiene vendedor desde producto. |
| Comprobantes | `comprobanteService.js:23–33,110–126` | Primero autoriza reserva propia; después vincula comprobante a reserva antes de firmar acceso. No hay descarga cruzada demostrada. |
| Público | `explorarPublicoService.js:13–17,54–78` | Filtra por vendedores activos de usuarios. Catálogo directo tiene excepción pendiente descrita abajo. |

Modelo actual: un solo `rol`; un vendedor no puede comprar mediante endpoints exclusivos de cliente. Cambiar rol administrativamente conserva `_id`, pero no hay flujo de conversión a vendedor con múltiples capacidades. No se encontró un flujo que cree automáticamente una segunda cuenta al convertirse en vendedor; tampoco hay una conversión completa que pueda certificarse.

Propuesta: identidad única en `usuarios`, capacidades `comprar`/`vender` y privilegio admin separado, perfil vendedor opcional por identidad. Introducir adaptador para `rol` heredado antes de cambiar guards o contratos. Conservar `vendedorId`, `compradorId`, `usuarioId` y todos los identificadores; nunca fusionar por coincidencia de nombre o correo sin revisión.

`nombre` no es username ni identificador de login. Los nombres personales repetidos están permitidos y no deben hacerse únicos. No convertir contactos `clientes` en cuentas automáticamente ni colapsar contactos de distintas tiendas.

## 5. Riesgos potenciales que requieren verificación

| Prioridad provisional | Riesgo pendiente | Verificación necesaria |
|---|---|---|
| Alta | Índices únicos ausentes, fallidos o distintos en MongoDB | `listIndexes` de las colecciones reales, opciones/collation y estado de construcción. `unique: true` del esquema expresa intención. No se comprobó un índice efectivo. |
| Alta | Duplicados heredados o escrituras externas sin normalizar | Inventario de correos canónicos, tipos inválidos y perfiles/nombres en snapshot protegido. No se afirma que existan duplicados reales. |
| Media | Limitador eludible/distribuido o bloqueo de usuarios compartiendo IP | `authRoutes.js:13` usa store por defecto de proceso; revisar cantidad de instancias, reinicios, proxy e IP efectiva. `expressApp.js:17` depende de `TRUST_PROXY_HOPS`. Añadir store compartido cuando haya múltiples instancias, límites por cuenta y presupuesto SMTP. |
| Media | Catálogo de usuario eliminado aún visible si quedaron documentos | `catalogoPublicoService.js:58–75` rechaza vendedor no activo si existe; si no existe, puede devolver perfil/productos/lives huérfanos. Defecto condicional del flujo comprobado; datos huérfanos y exposición real no comprobados. Debe exigir propietario existente y activo. |
| Media | Seguridad operacional de JWT y transporte | No se inspeccionaron valores de `JWT_SECRET`, TLS del despliegue, cabeceras CSP/referrer/cache ni logs del proxy. `jwt.verify` valida firma/expiración; falta fijar explícitamente algoritmo/audience/issuer (`authMiddleware.js:17`) es endurecimiento, no evidencia de aceptación de `alg:none`. |
| Media | Entrega SMTP y fuga de token por URL/logs | Validar HTTPS de `APP_URL`, TLS SMTP requerido, proveedor, límites, SPF/DKIM/DMARC y no registrar query de recuperación. Retirar token del historial del navegador y usar referrer-policy no-referrer. No se comprobó fuga. |
| Baja | Índices creados desde rutas de comprobantes | `comprobanteService.js:14–18` llama `createIndexes`; aislar futuros cambios de índices del arranque/rutas y desplegarlos de forma controlada. No se ejecutó esa ruta. |

No se realizó auditoría de dependencias/CVE ni pentest de infraestructura; no se adjudican vulnerabilidades a paquetes por su versión declarada.

## 6. Duplicados: respuesta concreta y diagnóstico posterior

- **Mismo correo exacto normalizado:** las rutas revisadas normalizan y existe índice único declarado. Con ese índice efectivo no deberían persistir dos registros iguales, incluso en concurrencia. Sin él, el patrón consultar-y-crear permite la carrera. No se puede decidir el estado real de la colección desde el repositorio.
- **Variantes heredadas:** el índice simple distingue cadenas guardadas de forma diferente. Trim/minúsculas de Mongoose no sanea documentos antiguos ni escrituras externas. No eliminar puntos ni sufijos `+` de direcciones; no asumir equivalencia entre proveedores.
- **Tiendas:** sí se permite duplicar nombres en el código; no hay restricción ni siquiera por igualdad exacta. El índice por propietario no lo evita.
- **Usuarios eliminados:** la baja física libera el correo para nueva cuenta con otro `_id`; no recupera relaciones antiguas. Definir retención/reserva de identidad antes de habilitar reutilización.

Diagnóstico propuesto, **no ejecutado**: snapshot o réplica de lectura autorizada con credenciales de solo lectura; registrar versión MongoDB y listar índices; calcular claves canónicas con la misma función versionada que usará la aplicación; agrupar por clave y contar grupos con más de un documento; distinguir valores ausentes, vacíos y tipos inválidos. Para correo, un primer `$match` por string y agrupación sobre `$toLower($trim(email))` detecta variantes básicas; contrastar con función final de Unicode/IDNA, pues no son equivalentes para todo Unicode.

Para tiendas incluir nombres visibles de respaldo (`perfil.nombrePublico || usuario.nombre`), colisiones de slug, perfiles repetidos por propietario, nombres reservados y caracteres invisibles. Revisar referencias huérfanas y roles/estados discordantes entre usuarios, perfiles, contactos, reservas, comprobantes y pedidos.

El informe público contendrá solo conteos y categorías; la lista de documentos afectados irá a un artefacto de acceso restringido con identificadores, sin correos ni hashes de contraseñas. No se crean esos listados en esta ejecución. Un conflicto no autoriza fusionar, renombrar ni eliminar cuentas.

## 7. Índices y restricciones propuestas

Propuestas de diseño; **ningún índice se ha creado ni sincronizado**.

| Colección | Restricción propuesta | Compatibilidad y condición previa |
|---|---|---|
| `usuarios` | Mantener único `{email:1}` existente, si se verifica. Añadir `emailCanonical` único durante transición con filtro parcial por string. | Inventariar conflictos antes de rellenar. El parcial es temporal y no protege documentos sin clave: bloquear nuevas escrituras sin ella y completar cobertura antes de depender de él. No recrear índices equivalentes con otro nombre sin necesidad. |
| `usuarios` | Validador de tipos, correo canónico no vacío, hash, estados y capacidades admitidas. | Activar primero observación/validación de aplicación y luego enforcement controlado tras revisar legados. La BD no valida que un hash corresponda a una contraseña fuerte. |
| `perfiles_vendedores` | Mantener único `{vendedorId:1}`. Nuevo único `{nombreCanonical:1}`, parcial por string durante transición. | Resolver colisiones y definir estado borrador sin nombre. No indexar todos los borradores como cadena vacía. Reservar nombres aun al suspender. |
| `perfiles_vendedores` | Único `{slug:1}` con clave ASCII lowercase. | Mantener `/catalogo/:vendedorId`; nueva ruta de slug sin romper enlaces anteriores. Reservar aliases antiguos mediante registro de nombres/rutas único si se permiten cambios. |
| `sesiones` | Conservar TTL `{expiresAt:1}` y búsqueda por usuario; opcional índice por usuario/expiración según medición. | La autorización siempre compara caducidad; TTL no elimina inmediatamente. Añadir versión de credenciales si se adopta esa estrategia. |
| `recuperaciones` | Conservar único `{tokenHash:1}` y TTL; añadir `{usuarioId:1}` para revocación. | Definir si se admite un solo token vigente por usuario; si se adopta, único por usuario y reemplazo atómico, tras revisar registros existentes. |
| Verificación de correo | Colección separada con único tokenHash, usuario, emailCanonical objetivo, expiresAt TTL y propósito. | Token de verificación no sirve para reset ni sesión. Índice de usuario para revocación/reenvío. |
| `clientes` | Conservar único parcial `{vendedorId:1,usuarioId:1}` existente. | Permitir múltiples contactos sin cuenta; no imponer unicidad global de nombre o teléfono. |

Política propuesta de nombres comerciales: guardar nombre de exhibición separado; para clave usar NFKC, minúsculas, trim y colapso de espacios Unicode con función versionada. Proponer equivalencia de vocales acentuadas para evitar variantes triviales, conservando `ñ` distinta de `n`; documentar tabla exacta antes de backfill. Rechazar controles, caracteres invisibles/bidireccionales y símbolos fuera de letras, números, espacios, apóstrofo y guion; prohibir nombres vacíos y reservar al menos `admin`, `api`, `login`, `register`, `recuperar`, `mio`, `soporte` y equivalentes normalizados. Es una propuesta, no una regla ya existente.

El slug puede usar transliteración ASCII más sufijo estable ante colisión, sin afectar unicidad comercial. Validar el candidato y realizar escritura respaldada por índice; consultar disponibilidad no es garantía. En renombrado, conflicto debe dejar intacto el nombre anterior. Conservar alias/reserva para evitar apropiación de enlaces antiguos.

## 8. Plan incremental por riesgo

| Incremento | Trabajo concreto | Criterio de salida |
|---|---|---|
| 0 — Inventario verificable | Congelar una referencia del checkout, inspección de índices y diagnóstico de duplicados/relaciones en snapshot autorizado, confirmar réplica y respaldo restaurable. Sin reparaciones automáticas. | Conteos, conflictos y dependencias revisados; estrategia de despliegue definida. |
| 1 — Credenciales y ciclo de cuenta | Corregir A-01 y A-03: revocación consistente en cada cambio de clave/estado, baja lógica, comprobar todas las relaciones. Unificar validación backend y retirar errores internos. | Sesión vieja rechazada tras cambio; reactivación no resucita sesiones; historial conserva los mismos IDs. |
| 2 — Recuperación robusta | Corregir atomicidad de reset, concurrencia con login, límites por cuenta/IP y cola de correo; configurar inicialmente 30 minutos con una sola variable compartida por backend y plantilla; controlar reintentos y fallos del proveedor. | Token de un uso, expiración exacta, revocación coherente y respuestas genéricas. No enviar claves temporales. |
| 3 — Contraseñas y sesión frontend | Hash versionado Argon2id para nuevos cambios, lectura bcrypt heredada y rehash compatible; política uniforme. Migración coordinada de almacenamiento de sesión y protección CSRF si se usan cookies. | Login heredado funciona, sufijos no se ignoran en nuevas claves; pruebas de navegador y logout pasan. |
| 4 — Identidad de correo | Tokens de verificación separados; cambios de correo requieren demostrar control del nuevo buzón; límites de reenvío y revocación de verificaciones previas. | Verificación persistente, expirable y ligada al correo vigente; no habilita recuperación ni roles. |
| 5 — Unicidad de cuentas y tiendas | Escritura dual de claves canónicas; diagnóstico/revisión humana, backfill aprobado por lotes; índices únicos y validadores; traducción E11000; slug y alias compatibles. | Cero conflictos sin resolver antes del índice; registros/renombrados concurrentes no duplican. |
| 6 — Capacidades y consistencia | Introducir identidad con capacidades conservando rol como adaptador; conversión a vendedor sobre mismo `_id`; perfil idempotente y estados separados. Corregir catálogo sin propietario. | Misma cuenta compra y vende según permisos, sin nuevas identidades ni acceso cruzado. |

No introducir Google OAuth, no cambiar MongoDB ni reestructurar módulos ajenos. Se pueden adelantar correcciones pequeñas de errores públicos o catálogo si no dependen de migraciones.

Verificación de correo y legado: agregar `emailVerifiedAt: null` y estado pendiente, sin inferir verificación. Durante transición permitir login, lectura del historial y resolución de obligaciones existentes; exigir verificación para nuevas tiendas/publicación, nuevas solicitudes de reserva y cambios sensibles cuando la transición esté habilitada. No bloquear pagos, cancelaciones o entregas ya comprometidos sin una alternativa operativa. Comunicar ventana de transición y ofrecer reenvío limitado; activación por bandera tras comprobar entrega SMTP.

## 9. Compatibilidad y reversión

1. Conservar `_id` y relaciones; una deduplicación exige decisión humana sobre titularidad y mapa explícito de referencias, nunca un merge por correo automático. Mantener snapshots de nombres/precios en reservas como historial, no sincronizarlos con renombrados.
2. Desplegar campos opcionales y lectura dual antes de exigirlos; rellenar por lotes idempotentes con journal protegido y comparación de versión para no sobreescribir cambios recientes. Separar build de índices del tráfico. Detener escrituras relevantes durante el corte final o usar un protocolo que cierre la ventana de carrera.
3. Probar restore y rollback en staging. La reversión de aplicación no debe reactivar sesiones revocadas ni recuperar tokens consumidos. No restaurar colecciones de usuarios aisladas de pedidos/reservas.
4. Revertir UI/rutas mediante flags conservando claves canónicas y reservas de nombres. No quitar un índice único como primera reacción a un conflicto; corregir compatibilidad de escritura. Si se decide retirarlo, requiere ventana controlada y evaluación explícita de duplicados.
5. Argon2id requiere que todas las versiones candidatas a rollback lo verifiquen antes de emitir nuevos hashes. No existe conversión de hash Argon2id a bcrypt sin contraseña; no guardar ambos por rutina. Sesiones de cookie y bearer necesitan transición acotada, no aceptación indefinida de dos canales sin política.
6. La nueva política de contraseña puede afectar cuentas antiguas: permitir login compatible y pedir actualización segura sin revelar longitud/hash. Cambios de rol no deben ocultar o reasignar historia; usar capacidades y autorización de cada recurso.
7. Transacciones requieren topología MongoDB adecuada. Si no está disponible, no dar por completada la atomicidad: diseñar versión de credenciales/protocolo equivalente y probar fallos antes de habilitarlo.

## 10. Pruebas ejecutadas y cobertura pendiente

### Evidencia de esta ejecución

- `node --test test/auth-permisos.test.js`, desde `backend`: **1 prueba aprobada, 0 fallidas**. Primer intento bloqueado por EACCES del sandbox al conectar a loopback; repetición con ejecución autorizada fuera de esa restricción aprobada. Usa modelos simulados, datos sintéticos y HTTP local; no conecta MongoDB ni entrega SMTP.
- La prueba existente comprueba rol obtenido de BD frente a rol incluido en JWT, rechazo por rol, lectura de producto ajeno, logout, JWT vencido/sin sid, token de recuperación hasheado, consumo secuencial único, revocación tras reset y login correcto/incorrecto (`backend/test/auth-permisos.test.js:13–87`). No demuestra índices ni atomicidad de MongoDB real.
- Sonda en memoria contra bcrypt instalado: sufijo posterior a 72 bytes ignorado. No escribió hashes ni claves en archivos.
- Se revisaron pruebas de integridad existentes; no se ejecutó la suite completa porque incluye integraciones con configuración de base y no es necesaria para una auditoría sin cambios de código. No se añadieron pruebas al repositorio.

### Matriz de aceptación para los incrementos

| Caso | Prueba necesaria | Aceptación |
|---|---|---|
| Correo duplicado | Registro y edición, variantes de mayúsculas/espacios, escritura directa y 20 registros concurrentes en MongoDB aislado | Un solo usuario canónico; sin 500 ni detalles de motor. Índice efectivo comprobado con listIndexes. |
| Nombres de tienda | Creación/renombrado con mayúsculas, espacios Unicode, acentos, `ñ`, reservados, invisibles y colisiones concurrentes | Política determinista; una sola clave comercial; conflicto no altera tienda previa. |
| Slug y enlaces | Colisiones, cambio de nombre, alias antiguo y URL histórica por ID | No se toma ruta ajena; enlaces anteriores siguen asociados al dueño original. |
| Credenciales | Inexistente, incorrecta, inactivo, eliminado, entradas objeto/array/null, límites Unicode/bytes | Respuesta pública uniforme; sin bypass ni errores internos; contraseña válida se verifica sin truncamiento nuevo. |
| JWT | Firma modificada, algoritmo no permitido, sid ajeno/ausente, expiración, sesión ausente, usuario eliminado, rol falsificado y cambio de rol en BD | 401/403 según contrato; ninguna operación no autorizada; exp se verifica aunque TTL no haya limpiado. |
| Recuperación | Token malformado, vencido, reutilizado, dos consumos simultáneos del mismo token y tokens distintos del mismo usuario | Un único cambio coherente por operación; no hay reapertura por token anterior. Vencimiento configurable de 30 min. |
| Fallos de reset | Error entre consumo/cambio/revocación, cuenta inactivada, login simultáneo | No se anuncia éxito sin cambio; ninguna sesión anterior queda válida después del compromiso de revocación; reintento documentado. |
| Cambio administrativo | Contraseña corta/tipo incorrecto, cambio válido con sesiones y enlaces previos | Política uniforme; sesiones y tokens previos revocados; posterior login usa solo nueva clave. |
| Suspensión/baja | Inactivar/reactivar y eliminar cuenta con contactos, reservas y comprobantes; creación de relación concurrente | No resucitan sesiones ni se generan huérfanos; historial e IDs se conservan. |
| Verificación | Enlace vencido/reutilizado, propósito incorrecto, cambio de correo, reenvío y usuario legado | Solo acredita correo objetivo; no modifica privilegios; ventana de compatibilidad aplicada. |
| Acceso cruzado | Dos vendedores y dos compradores: GET/listado/PUT/PATCH/DELETE de productos, clientes, lives, pedidos, perfiles, reservas y comprobantes; IDs ajenos en body y URL | Sin lectura/mutación/firma de enlace ajeno; filtros por propietario en todas las operaciones y relaciones. |
| Escalamiento | Registro admin, campos extra, cambio de rol por no admin, rol alterado en localStorage/JWT | Ningún privilegio extra; admin solo por rutas/operación autorizadas. |
| Abuso | Límite 21, varias instancias/IP, cuenta compartida, reinicio de proceso y caída SMTP | 429 consistente, presupuesto por cuenta y proveedor, sin bloqueo permanente inducido por terceros ni enumeración obvia. |
| Navegador | Logout, vencimiento, varias pestañas, ausencia de red, CSRF y cookies si se adoptan | Token no queda en almacenamiento persistente tras migración; credenciales no se envían a orígenes ajenos; sesión revocada no vuelve. |

Las pruebas de índices, carreras y transacciones deben ejecutarse en MongoDB aislado con réplica y misma versión/configuración objetivo; mocks no bastan. Usar buzón de pruebas para correo y reloj controlado para expiración, sin esperas reales largas. No ejecutar estas pruebas sobre producción.

## 11. Referencias de prácticas

Los hallazgos se basan en el repositorio; las referencias sustentan las propuestas, no prueban el estado del despliegue.

- [OWASP — Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): Argon2id como opción preferida y bcrypt heredado con costo mínimo 10 y límite de 72 bytes.
- [OWASP — Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html): respuestas uniformes, tokens aleatorios de un uso, expiración, límites y protección del enlace.

**Decisión propuesta:** conservar la arquitectura y comenzar por inventario, revocación uniforme y bajas seguras. Los índices únicos y backfills solo se ejecutarán en incrementos posteriores, una vez resueltos los conflictos existentes.
