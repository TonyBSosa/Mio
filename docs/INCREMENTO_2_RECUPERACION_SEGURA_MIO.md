# MIO — Incremento 2: recuperación segura de contraseñas

Fecha: 18 de noviembre de 2026 (America/Tegucigalpa).

## Resultado y punto de partida

Se fortaleció el flujo existente, conservando JWT, bcrypt, sesiones, MongoDB y la revocación por credentialVersion del Incremento 1. Se partió del commit **`1f43037` — Mejoras de seguridad y autenticacion**, con árbol de trabajo limpio, y se revisaron la [auditoría](AUDITORIA_AUTENTICACION_SEGURIDAD_CUENTAS_2026-11-18.md), el [Incremento 0](INCREMENTO_0_DIAGNOSTICO_SEGURIDAD_MIO.md) y el [Incremento 1](INCREMENTO_1_SEGURIDAD_CREDENCIALES_MIO.md).

**Verificado:** 39 pruebas backend y 62 frontend aprobadas; TypeScript y revisión de whitespace aprobados. Las dos integraciones MongoDB seleccionadas usaron bases sintéticas desechables en un servidor standalone local independiente. SMTP, sockets de correo y entregas fueron simulados. No se enviaron correos reales, no se abrió `.env`, no se modificaron datos/configuración de producción, no se ejecutaron migraciones, no se crearon índices comerciales, no se desplegó y no se creó ningún commit.

**Pendiente:** configuración/entrega real del proveedor SMTP, certificados negociados, topología/respaldos de producción, cola durable y límites IP compartidos para un despliegue con varias instancias. Este incremento no afirma que esa infraestructura exista.

## 1. Recuperación y consumo seguro

### Expiración y token

`backend/src/config/recuperacionConfig.js` centraliza `RECOVERY_TOKEN_TTL_MINUTES`: predeterminado **30**, entero permitido entre **1 y 120**. Un valor inválido falla cerrado antes de emitir un enlace. Se usa el mismo valor para persistencia y texto del correo; solo cambia la vigencia de enlaces nuevos. Los existentes conservan su expiresAt original, incluidos los de 15 minutos.

Se conservan 32 bytes aleatorios criptográficos, representación hex de 64 caracteres y almacenamiento **solo SHA-256** del token en recuperaciones. El secreto solo transita por memoria del proceso, mensaje SMTP y navegador; no se añade a logs, respuestas, storage del frontend o documentos de usuario. No hay contraseñas temporales ni contraseñas enviadas por correo.

### Cambio atómico con credentialVersion

El reset comprueba token, expiración, usuario activo/no eliminado y la generación a la que fue emitido. Después calcula el hash de contraseña con la política del Incremento 1 y vuelve a comprobar que el registro de recuperación siga presente/no vencido.

La escritura **compare-and-set** de usuario requiere generación esperada, activo y deletedAt nulo; además usa una condición de expiración con el reloj de MongoDB (`$expr`, `$literal`, `$$NOW`). Password y nueva generación se confirman juntos en un solo documento, con writeConcern majority existente. No se necesitan transacciones.

La rotación de generación es también el **consumo lógico del enlace**: invalida el usado y todos los demás enlaces/sesiones de la generación anterior. Dos resets del mismo token o de tokens distintos de una misma generación no pueden ambos reemplazar la contraseña. Si otro cambio de clave, suspensión o baja gana antes, el CAS del enlace anterior no coincide. Se conserva compatibilidad con documentos/sesiones sin versión, interpretados como generación null mientras el usuario no haya rotado.

### Fallos parciales

Se eliminó el consumo físico del token **antes** del cambio. Si falla la escritura antes de aplicarse, el enlace no se gasta y puede reintentarse mientras siga vigente. Tras un cambio confirmado se intenta borrar su registro; si falla esa limpieza, se devuelve éxito y se registra únicamente `recuperacion_limpieza_pendiente`. El documento conservado ya es inutilizable por generación y queda sujeto al TTL existente.

Una desconexión/timeout de writeConcern puede dejar resultado incierto: no se promete rollback ni que todo error signifique “no se aplicó”. Si el cambio sí se aplicó, el enlace anterior será inválido y se debe probar la contraseña nueva o solicitar otro. Tampoco se cancelan operaciones de negocio que ya hubieran superado autorización antes de la revocación.

## 2. Respuesta pública y procesamiento de correo

`POST /api/auth/forgot-password` conserva HTTP **200** y la respuesta genérica: “Si la cuenta existe, recibiras un enlace de recuperacion.” No espera consulta de usuario, cuota ni SMTP. También mantiene esa respuesta si la entrada no permite emisión, se agota cuota o capacidad, no existe cuenta, la cuenta está suspendida/eliminada o falla el proveedor. Los errores de sintaxis JSON y límites IP son independientes de la existencia de la cuenta.

Una cola en memoria pospone el procesamiento a otro turno del event loop, con **100 trabajos como máximo y 2 activos**. La deduplicación temporal local aplica también a direcciones inexistentes mediante HMAC con secreto efímero, sin imprimir ni persistir claves/direcciones. El mapa tiene límite de tamaño y expira entradas. El worker solo considera usuarios activos sin baja y comprueba de nuevo su generación antes de enviar.

**Límite deliberado:** la cola no es durable. Reinicio, suspensión del proceso, saturación o fallo tras tomar una cuota pueden perder una solicitud; el usuario debe solicitar otra cuando corresponda. No se informa “correo enviado” ni se promete entrega en la respuesta pública. Un job retrasado genera la expiración al emitir el token, no al recibir la petición HTTP.

Para entrega recuperable después de reinicios haría falta un outbox/cola durable y proteger el secreto necesario para enviar (por ejemplo, cifrado con clave administrada). No se almacenó el token en claro para simular esa garantía ni se introdujo una infraestructura sin verificar.

## 3. SMTP: configuración, cifrado y reintentos

`correoConfig.js` valida sin exponer valores:

| Variable | Contrato |
|---|---|
| `SMTP_HOST` | Host sin esquema/ruta, etiquetas DNS válidas y longitud acotada. |
| `SMTP_PORT` | Entero de 1 a 65535; predeterminado 587. 465 usa TLS implícito; otros, incluyendo 587/2525 habituales en proveedores gratuitos, exigen STARTTLS. |
| `SMTP_USER`, `SMTP_PASSWORD` | Ambos requeridos y sin CR/LF/NUL. Se usa autenticación SMTP de proveedor; no requiere Google OAuth. |
| `MAIL_FROM` | Buzón simple válido y sin inyección de cabeceras, por ejemplo dirección sin nombre de exhibición. La autorización real del remitente se verifica con el proveedor. |
| `APP_URL` | Origen HTTPS en producción, sin credenciales, subruta, query o fragmento. Solo desarrollo local admite HTTP sobre localhost/loopback. No se usa Host de la petición para construir enlaces. |
| `RECOVERY_TOKEN_TTL_MINUTES` | Fuente central de expiración; 30 por defecto, 1–120. |

Solo se modificó el archivo **de ejemplo** de variables; no la configuración real. La validación se ejecuta cuando el worker intenta enviar. Configuración inválida falla de forma genérica y no envía; verificarla antes de habilitar el servicio es un requisito operacional pendiente.

### Transporte

- TLS mínimo 1.2, validación de certificado y nombre del servidor activadas.
- `requireTLS:true`, `ignoreTLS:false`, `opportunisticTLS:false`; no continuar sin cifrado si falla STARTTLS.
- Límite propio de **5 segundos** para crear socket, incluyendo DNS/handshake; parámetros de conexión/saludo/DNS de Nodemailer de 5 segundos e inactividad de socket de 10 segundos.
- **20 segundos máximos por intento** de envío: el adaptador conserva el socket para destruirlo al llegar al límite, incluso si hay tráfico lento. Hasta tres intentos y dos esperas pequeñas (250/500 ms); no es un trabajo de duración ilimitada.
- Logging/debug de Nodemailer desactivados; sin acceso a archivos o URLs adjuntas. No se imprime error.message, respuesta SMTP, email, token o contraseña.

El adaptador usa sockets net/tls como entrada de Nodemailer: en 465 indica que el socket ya está cifrado, evitando doble handshake; en otros puertos Nodemailer debe completar STARTTLS antes de autenticarse. La revisión de código de la dependencia instalada y las pruebas de sockets simulados comprueban opciones/control, **no una negociación TLS real**.

### Reintentos que evitan duplicados innecesarios

Los tres intentos reutilizan **el mismo token, enlace, texto y Message-ID**. Un éxito no se reenvía. Solo se reintenta si el propio adaptador sabe que falló antes de entregar el socket a SMTP, o recibe rechazo temporal explícito 4xx en MAIL FROM/RCPT TO/DATA. Autenticación inválida, fallos TLS, deadline y errores ambiguos posteriores no se reintentan automáticamente.

Se comprobó en el código instalado que Nodemailer también usa `command:'CONN'` para ciertos errores de socket después del envío; esa etiqueta por sí sola **no** autoriza reintento. Hay prueba de regresión para ese caso.

Un proveedor puede aceptar el mensaje y perderse la confirmación. SMTP genérico no ofrece una garantía universal “exactamente una vez”; Message-ID estable ayuda a rastrear, pero no obliga al proveedor a deduplicar. Se prioriza no reenviar ante ambigüedad y permitir una nueva solicitud limitada. No hay prueba de cuota diaria, reputación, SPF/DKIM/DMARC ni entrega de un proveedor gratuito específico. Los reintentos también consumen recursos del proveedor y deben entrar en su presupuesto operacional.

## 4. Protección contra abuso

| Control | Implementado | Alcance pendiente |
|---|---|---|
| Solicitud por IP | 10 por 15 minutos; HTTP 429 y espera comprensible. | Store de express-rate-limit por proceso. Requiere IP/proxy real confiable; no es límite global entre instancias. |
| Reset por IP | 20 por 15 minutos. | Igual dependencia del proxy/store. Tokens de 256 bits y límite de formato siguen aplicándose. |
| Deduplicación local | Una dirección normalizada por minuto, cola/mapa acotados, incluyendo cuentas inexistentes. | Estado efímero, se reinicia con el proceso. |
| Cuota por cuenta | Separación mínima 60 s y 3 solicitudes por ventana de una hora. | Persistida en usuario; revisar política de presupuesto antes de producción. |
| Concurrencia de cuota | Actualización CAS del slot leído, ligada a credentialVersion/estado/baja, con majority. Solo un contender gana. | Probado con operaciones concurrentes sobre standalone; no se desplegaron varias instancias reales. |

La cuota persistente usa un campo opcional `usuarios.recoveryRequest`: slot aleatorio, inicio de ventana, contador y próxima fecha permitida. No crea colección ni índice. No rota credentialVersion por solicitar correo y **no bloquea login, contraseña ni cuenta**. Las marcas se excluyen del JSON público del modelo.

Las cuotas son temporales y se reabren por tiempo; una petición denegada no extiende indefinidamente la ventana. Un tercero puede consumir la cuota de recuperación del titular durante esa ventana, por lo que sigue siendo necesario monitorear abuso. No se afirma ausencia total de denegación temporal de servicio. Los relojes de servidores deben estar sincronizados.

El CAS sobre la misma cuenta protege emisión simultánea aun si se ejecutaran workers distintos contra el mismo MongoDB; los límites **IP** todavía necesitan un almacén compartido al escalar. No se instaló Redis ni se asumió cantidad de instancias de Render. Login/registro mantienen su limitador anterior, separado del de recuperación.

## 5. Frontend y protección del enlace

Se mantuvieron clases, tipografía y estructura de la pantalla de autenticación de MIO, añadiendo confirmación de contraseña y estados claros de éxito/enlace inválido. No se modificaron páginas comerciales, roles o reservas.

Los enlaces nuevos tienen forma **`https://origen/recuperar#token=<secreto>`**. El fragmento no viaja en la petición HTTP inicial ni como Referer. Angular acepta también query `?token=` de enlaces anteriores. Al capturarlo, reemplaza inmediatamente la URL por `/recuperar`, lo conserva solo en memoria y lo limpia al terminar o destruir el componente. Rechaza valores malformados, repetidos o ambiguos entre query/fragmento.

No se guarda token de recuperación en localStorage/sessionStorage ni se navega con él. La petición de reset lo lleva en cuerpo JSON a una ruta sin query. Se agregó meta `referrer=no-referrer` antes de recursos externos en el HTML de la SPA, y las dos rutas API de recuperación devuelven `Cache-Control:no-store` y `Referrer-Policy:no-referrer`.

**Límite de enlaces antiguos:** el query ya pudo llegar al servidor estático/proxy antes de que Angular lo retire; no se pueden borrar retroactivamente logs desde el navegador. Debe configurarse la redacción de queries/cuerpos sensibles en proxy, APM y proveedor. Los fragmentos nuevos reducen esa exposición, pero extensiones del navegador, XSS o rastreadores de enlaces de correo siguen requiriendo controles propios.

Reset pide repetir la contraseña, aplica mínimo Unicode/bytes del Incremento 1 y muestra un mensaje común para enlace vencido/usado/inválido. Permite solicitar otro. Tras éxito retira el secreto y oculta el formulario de cambio. Al salir cancela la suscripción HTTP de la vista; no permite cambiar de modo mientras una solicitud está en curso. Al recargar, el token en memoria se pierde: hay que reabrir el enlace del correo o solicitar otro, sin persistirlo como atajo.

Se corrigieron los nombres de rutas públicas en el interceptor de sesión: forgot-password/reset-password no deben cerrar una sesión existente por un error público de recuperación. El almacenamiento de JWT normal sigue igual; migrarlo está fuera del incremento.

## 6. Pruebas ejecutadas

### Backend: 39 aprobadas, 0 fallidas, 0 omitidas

Se ejecutaron los archivos de test sin “mongo” en el nombre y únicamente las integraciones **credenciales-mongo.test.js** y **recuperacion-mongo.test.js**. No se ejecutó indiscriminadamente npm test ni las suites antiguas que pueden eliminar otras bases.

```powershell
# Desde backend; URI sintética exclusivamente de la instancia temporal preparada.
$files = Get-ChildItem test -Filter '*.test.js' |
  Where-Object { $_.Name -notlike '*mongo*' -or $_.Name -in @('credenciales-mongo.test.js', 'recuperacion-mongo.test.js') } |
  ForEach-Object { $_.FullName }
node --test @files
```

Las variables exclusivas de integración son `MIO_CREDENCIALES_TEST_URI` y `MIO_RECUPERACION_TEST_URI`. Ambas pruebas validan loopback **127.0.0.1:27191**, prefijo de base sintética y sufijo aleatorio de 32 hex antes de conectar; no cargan dotenv ni usan MONGO_URI. AutoIndex/autoCreate desactivados; sin dropDatabase. Sin URI, la integración se omite y no debe contarse como aprobación.

Se inició MongoDB 8.2 standalone con directorio nuevo exclusivo, sin datos copiados de aplicación. Se comprobó ausencia de replica set en la prueba heredada, y las colecciones de autenticación conservaban únicamente `_id_`. El contador 39 incluye contenedoras/subpruebas tal como las cuenta Node, no 39 pruebas independientes de infraestructura.

Al finalizar se apagó exclusivamente esa instancia local, se confirmó `mongod shutdown complete` en su log y se retiraron sus archivos y metadatos temporales después de verificar la ruta absoluta dentro de `tmp`. No quedó una base sintética ni un servidor temporal en ejecución como parte de la entrega.

Cobertura ejecutada:

- TTL predeterminado/configurable/inválido y coincidencia del texto con persistencia.
- Token válido, vencido, manipulado y reutilizado; sesiones heredadas y revocación del Incremento 1.
- Diez solicitudes concurrentes de una cuenta producen un solo envío/registro de token; cuota de 60 s y tres/hora con reapertura de ventana.
- Respuesta idéntica para cuenta existente, inexistente, suspendida, eliminada y fallo SMTP; logs solo con categoría genérica.
- Dos resets simultáneos con token igual y tokens distintos: un solo ganador.
- Cambio administrativo intercalado gana sobre reset viejo; expiración comprobada por el filtro de escritura.
- Fallo previo al CAS permite reintentar; fallo de limpieza después del éxito impide reutilización.
- HTTPS productivo y rechazo de credenciales/configuración inválida o inyección de cabeceras.
- Opciones de TLS certificado/SNI, puertos 465/587/2525, deadlines y cierre del socket mediante dobles de prueba, sin conexiones SMTP reales.
- Reintentos limitados con enlace/Message-ID estable; no reintentar errores ambiguos, incluyendo timeout CONN sin prueba de fase; rechazo temporal 451 sí permite reintento.
- HTTP local: primeras diez solicitudes de recuperación permitidas, undécima 429; no-store/no-referrer y sin email en respuestas.
- Cola local con capacidad/concurrencia acotada, cooldown que vence y respuesta sin esperar al worker.
- Regresiones de credenciales, propiedad de recursos, reservas y comprobantes mediante las pruebas existentes seleccionadas.

### Frontend: 62 aprobadas, 8 archivos

`npm test -- --watch=false` aprobó la suite Angular completa, incluyendo seis pruebas nuevas de recuperación y una de interceptor: fragmento/query heredado, retiro de URL, enlace ambiguo, confirmación, éxito, enlace vencido y 429 comprensible. No se atribuye a estas pruebas una inspección visual manual en navegador real.

También se ejecutaron `npx tsc --noEmit -p tsconfig.app.json` y `git diff --check`, ambos aprobados. No se ejecutó build:deploy ni se publicó un artefacto. Persistió un warning previo de validateSync de Mongoose en pruebas de productos; no hubo fallo asociado.

No se comprobó negociación SMTP contra un servidor/certificado real ni entrega a un buzón. Ninguna prueba de este incremento envió correos externos.

## 7. Archivos y justificación

| Archivo | Cambio |
|---|---|
| `backend/src/config/recuperacionConfig.js` (nuevo) | Expiración central y constantes de cuotas. |
| `backend/src/config/correoConfig.js` (nuevo) | Validación de SMTP/remitente/origen seguro. |
| `backend/src/services/recoveryQueue.js` (nuevo) | Cola local acotada y deduplicación sin direcciones en logs. |
| `backend/src/services/recuperacionService.js` (nuevo) | Admisión CAS por cuenta, emisión hash/versionada y envío fuera de respuesta HTTP. |
| `backend/src/services/correoService.js` | TLS, socket/deadlines, reintentos conservadores y enlaces con fragmento. |
| `backend/src/services/credentialService.js` | Condición de vencimiento en la escritura CAS. |
| `backend/src/controllers/authController.js` | Respuesta uniforme asíncrona y consumo lógico antes de limpieza. |
| `backend/src/models/users.js` | Estado opcional de cuota, excluido de JSON. Sin índices nuevos. |
| `backend/src/routes/authRoutes.js` | Límites separados y cabeceras de privacidad. |
| `backend/.env.example` | Documentación de TTL/TLS/origen; ninguna credencial real. |
| `backend/test/recuperacion-correo.test.js` (nuevo) | Configuración, sockets/envío simulados, reintentos y cola. |
| `backend/test/recuperacion-mongo.test.js` (nuevo) | Admisión, SMTP fallido, concurrencia, reset y límites HTTP sobre base desechable. |
| `backend/test/auth-permisos.test.js` | Adaptación del fixture de enlaces al consumo lógico; cobertura HTTP preservada. |
| `backend/test/credenciales-mongo.test.js` | Fixture de token independiente de cuotas para regresiones de credenciales; cuotas se prueban aparte. |
| `frontend/src/app/pages/login/recuperar.ts` | Confirmación/estados, secretos solo en memoria y limpieza de URL. |
| `frontend/src/app/pages/login/recuperar.spec.ts` (nuevo) | Comportamiento seguro del formulario/enlace. |
| `frontend/src/app/services/auth-session.interceptor.ts` y `.spec.ts` | Rutas de recuperación públicas correctas y regresión con sesión existente. |
| `frontend/src/index.html` | Referrer policy antes de recursos externos. |
| Este informe | Evidencias, límites y operación futura. |

No se cambió la política de roles, nombres de tiendas, lógica de reservas ni índices comerciales. Los informes anteriores permanecen como evidencia histórica; sus descripciones de SMTP/reset de aquella versión no describen este nuevo flujo.

## 8. Despliegue y reversión — pendientes, no ejecutados

Antes de producción:

1. Completar inventario de índices/topología, respaldo y restauración del Incremento 0; verificar que validadores reales admitan `recoveryRequest` y `$expr/$$NOW`. No hace falta backfill ni un índice nuevo para este diseño, pero no se certifica configuración real desconocida.
2. Validar variables mediante un entorno staging: remitente en formato de buzón simple autorizado, usuario/password de proveedor, puerto TLS/STARTTLS, APP_URL como origen HTTPS y TTL elegido. No fijar TLS inseguro para adaptar un proveedor incompatible.
3. Probar negociación/entrega únicamente a buzón sintético autorizado, revisar límites de proveedor, reputación y redacción de cuerpos/queries en logs/APM. Revisar tracking de enlaces del proveedor para que no archive ni filtre el fragmento secreto.
4. Desplegar frontend compatible con fragmentos **antes o junto con** backend que los emite. Un frontend del Incremento 1 no interpreta los enlaces nuevos. Mantener lectura de query durante transición de enlaces antiguos.
5. Confirmar trust proxy/IP efectiva y cantidad de instancias. Si hay varias, incorporar store compartido de límites IP y revisar admisión/observabilidad global; la cuota Mongo por cuenta no sustituye ese control.
6. Aceptar expresamente la cola best-effort o implementar outbox durable con claves/operación verificadas antes de prometer entrega recuperable. No configurar un worker durable supuesto que no existe.

Reversión: conservar siempre la validación de credentialVersion y la baja lógica del Incremento 1; no volver a código anterior que resucite sesiones. Para revertir el incremento de recuperación, mantener frontend capaz de leer fragmentos hasta expirar todos los enlaces emitidos o detener recuperación durante un corte coordinado y publicar un artefacto compatible. No borrar recoveryRequest ni restablecer versiones antiguas como mecanismo de rollback. Los documentos opcionales pueden permanecer y los expiresAt existentes no se recalculan.

Los errores de SMTP/configuración se hacen visibles al operador solo como categorías genéricas de fallo. No hay métricas/cola durable ni alarmas de proveedor implementadas: hacen falta monitoreo agregado y runbook antes de certificar operación. No se generaron commits ni cambios en Render/Atlas para resolver estas dependencias.

Referencias técnicas: [Nodemailer SMTP](https://nodemailer.com/smtp), [errores de Nodemailer](https://nodemailer.com/errors), [OWASP — Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html). Se contrastó también el código de Nodemailer instalado. Estas fuentes sustentan decisiones, no prueban infraestructura de MIO.
