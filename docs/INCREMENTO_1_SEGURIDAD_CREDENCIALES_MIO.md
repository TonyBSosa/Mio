# MIO — Incremento 1: seguridad de credenciales y ciclo de cuentas

Fecha: 18 de noviembre de 2026. Referencias: [auditoría](AUDITORIA_AUTENTICACION_SEGURIDAD_CUENTAS_2026-11-18.md) e [Incremento 0](INCREMENTO_0_DIAGNOSTICO_SEGURIDAD_MIO.md).

## Resultado y alcance

Se implementaron revocación lógica por versión de credenciales, política central de emisión de contraseñas, baja lógica y errores de autenticación/administración sanitizados. Se conservan Express, Mongoose, Angular, JWT, bcrypt, los IDs actuales y las relaciones de negocio. No se incorporaron OAuth, Argon2id, dependencias nuevas, migraciones ni índices comerciales.

**Verificado localmente:** 27 pruebas backend aprobadas, 55 frontend aprobadas, compilación de tipos Angular y revisión de diferencias sin errores de whitespace. La integración usó MongoDB 8.2 standalone desechable y datos sintéticos, sin transacciones. No se abrieron `.env`, conexiones de producción, paneles de Render ni SMTP real. No se desplegó.

La topología de producción y los pendientes operacionales del Incremento 0 siguen **sin verificar**. El funcionamiento en standalone local demuestra que el protocolo no necesita transacciones; no certifica replicación, failover, backups o índices de producción.

## 1. Estrategia de revocación

`usuarios.credentialVersion` es una generación aleatoria UUID, opcional para documentos heredados. Cada sesión y recuperación nueva guarda la generación leída; el JWT incluye `cv`. Los documentos/tokens antiguos sin generación se interpretan como `null`, exclusivamente mientras el usuario tampoco tenga generación. No hay backfill ni invalidación masiva de usuarios existentes por el simple despliegue.

Un cambio de contraseña actualiza **hash y generación en la misma escritura del usuario**. Las operaciones administrativas que incluyen contraseña, estado, rol o correo también rotan generación; esto es conservador y puede cerrar sesiones aunque se reenvíe el mismo estado/rol desde el formulario. Suspender y reactivar generan versiones diferentes. La baja establece, de forma atómica, estado inactivo, deletedAt y generación nueva.

El middleware comprueba firma HS256, usuario activo/no eliminado, versión del JWT igual a la del usuario y sesión coincidente en usuario/versión/fecha. Los documentos de sesión anteriores pueden existir hasta TTL, pero ya no conceden acceso. Los enlaces de recuperación anteriores tampoco sirven porque su versión no coincide. No se depende de un deleteMany posterior para completar revocación y no se borran accidentalmente sesiones nuevas emitidas por otro login.

Las escrituras críticas usan `writeConcern: {w:'majority', wtimeout:5000}`. En standalone se confirmó compatibilidad; en réplica, disponibilidad y configuración de durabilidad deben verificarse antes de desplegar. Ante error/timeout no se devuelve éxito; como en cualquier escritura con confirmación incierta, puede haberse aplicado y el usuario debe comprobar acceso o solicitar otro enlace, sin asumir rollback automático.

### Carreras resueltas

- **Login contra cambio/suspensión:** se verifica la contraseña del snapshot y se crea sesión para esa misma generación. Después se comprueba que usuario, hash y generación sigan vigentes. Nunca se asocia una clave vieja con una generación releída después del cambio. Si ocurre una mutación tras esa comprobación, el middleware posterior rechaza el token de generación anterior.
- **Dos resets de un mismo token:** consumo con `findOneAndDelete` y condición de vencimiento; solo uno consume.
- **Dos tokens diferentes del mismo usuario:** la escritura de cambio incluye la generación esperada en el filtro (compare-and-set). Solo uno cambia la generación y gana; el otro no sobrescribe la clave ganadora.
- **Reset contra suspensión/baja/cambio administrativo:** el filtro exige generación esperada, activo y deletedAt nulo. Si gana la otra operación, reset no cambia credenciales.
- **Solicitud de recuperación contra cambio:** un token emitido desde un snapshot viejo conserva versión vieja y no restablece la cuenta actual.

No se promete abortar una operación de negocio que ya superó autenticación antes de la revocación. La frontera de garantía son las comprobaciones de autorización; cancelar trabajo en curso requeriría integrar una precondición de seguridad en cada escritura de negocio, fuera del alcance de este incremento.

### Fallos parciales que siguen siendo posibles

El consumo del token y la escritura del usuario siguen separados: si falla la segunda, el enlace puede quedar consumido sin cambiar la contraseña. El controlador devuelve error genérico y permite solicitar otro enlace. **No** queda un cambio de hash exitoso con revocación lógica pendiente: esos dos cambios sí son atómicos. No se afirma que todo el flujo de correo/reset sea transaccional.

Los documentos de sesión/recuperación obsoletos no se eliminan masivamente; se invalidan criptográficamente por generación y conservan su TTL existente. La vigencia de los TTL reales sigue pendiente. Logout sigue eliminando su sesión; el consumo de un enlace elimina ese documento de recuperación, como antes.

## 2. Política de contraseña y compatibilidad

`passwordPolicy.js` centraliza registro público, reset, altas/ediciones administrativas y creación inicial de administradores:

- Mínimo **15 puntos de código Unicode**, máximo **72 bytes UTF-8** mientras se conserva bcrypt. El máximo no se confunde con caracteres.
- Permite frases, Unicode y espacios; no recorta ni normaliza el secreto almacenado. Rechaza NUL, Unicode mal formado y cadenas solo de espacios.
- No exige mayúsculas, símbolos ni rotación periódica arbitraria.
- Bloquea una lista local inicial de contraseñas comunes/de ejemplo inseguro; para compararla usa NFKC y minúsculas. El secreto real sigue sin transformaciones.
- Nuevos hashes bcrypt de costo **12**, uniforme. No hay cambio masivo ni rehash automático al login.

**Limitación explícita:** `passwordBlocklist.json` es una lista pequeña inicial, no un corpus exhaustivo de filtraciones. Hace falta incorporar y mantener un corpus offline revisado de contraseñas comprometidas antes de certificar cobertura amplia. No se consultan servicios externos con contraseñas ni se descarga un corpus sin revisar origen/licencia/tamaño. La dependencia queda documentada y la política base funciona sin red.

Login conserva bcrypt heredado, incluso contraseñas cortas o de más de 72 bytes admitidas por versiones anteriores. No aplica retroactivamente la nueva política ni recorta el input; se mantiene la semántica histórica de bcrypt, incluido su truncamiento heredado. Las emisiones nuevas rechazan más de 72 bytes, por lo que no crean nuevos casos de truncamiento silencioso. Login limita entradas a 4096 bytes como protección de recursos; supera ampliamente el máximo anterior de 128 unidades JS.

No hay Argon2id ni formato nuevo de hash que complique reversión. El límite de bytes restringe la longitud máxima posible de frases Unicode; admitir secretos mucho más largos exige otro diseño/algoritmo en un incremento posterior, con lector compatible en todas las versiones desplegables.

Angular informa el mínimo y límite de bytes en registro/reset/administración. Reset también comprueba puntos de código y bytes antes de enviar. Backend sigue siendo autoridad, incluida la blocklist. El login no impone el mínimo nuevo.

## 3. Baja lógica e integridad

La ruta DELETE administrativa conserva su contrato de ruta y aplica una baja lógica: `estado:'inactivo'`, `deletedAt` y generación nueva. No ejecuta borrado físico de usuario, perfil, cliente, producto, live, reserva, pedido ni comprobante. El correo sigue ocupado por la cuenta histórica; no se reutiliza ni se crea otra identidad sobre las mismas relaciones.

Los listados administrativos activos omiten usuarios con deletedAt; la consulta por ID devuelve 404 para bajas. No existe ruta de restauración de una baja. Edición/reactivación filtran deletedAt nulo en la escritura; el cliente no puede borrar esa marca por mass assignment. Inactivación temporal conserva las opciones anteriores activo/inactivo y permite reactivar con una generación nueva. Continúan las restricciones de no quitarse el rol admin, no suspenderse y no darse de baja a sí mismo.

Se revisaron referencias de usuarios en perfiles, contactos, productos, lives, pedidos, solicitudes y comprobantes. En lugar de exigir ausencia de relaciones para eliminar, se conserva el grafo. La integración insertó un grafo sintético con IDs enlazados y comprobó que los seis documentos de negocio quedaran idénticos tras dar de baja vendedor y comprador; perfil e identidades también permanecen.

La cuenta inactiva bloquea el acceso del titular y la publicación que ya consulta vendedores activos. No se modificó la funcionalidad de tiendas/reservas ni se hizo cascade de estados sobre recursos. El estado activo del perfil puede conservarse en baja; la cuenta es la autoridad. La sincronización histórica usuario/perfil en suspensión/reactivación sigue siendo una operación posterior, no una transacción: si falla, la seguridad del usuario ya está aplicada, pero la visibilidad puede necesitar reconciliación. Obligaciones pendientes de un comprador dado de baja requerirán procedimiento administrativo; no se añadió acceso alternativo al historial del titular dado de baja.

## 4. Errores y autorización

Login responde **401 y el mismo mensaje** para cuenta inexistente, inactiva, dada de baja o contraseña errónea. Se realiza comparación bcrypt ficticia cuando no existe hash de usuario, sin devolver estado interno. La duración no es constante certificada: hashes legados pueden tener costo 10 frente a costo 12 y SMTP sigue siendo síncrono en recuperación.

Registro y administración traducen E11000 a **409** genérico sin texto del motor ni correo conflictivo. Registro conserva la diferencia entre éxito con token y conflicto; por ello queda enumeración residual de registrabilidad, no se afirma anonimato absoluto. Recuperación mantiene respuesta genérica.

Se retiraron error.message de respuestas de autenticación/usuarios. El creador de admin tampoco imprime errores del motor. Un middleware final responde JSON genérico ante errores de parser/rechazos no capturados; no intenta cambiar las respuestas de otros controladores de negocio ajenos al alcance. Otras exposiciones internas preexistentes de esos controladores siguen pendientes de revisión separada.

El rol continúa leyéndose de BD, sin confiar en localStorage, en el body o en un claim de rol. El registro público solo permite cliente/vendedor y genera su propia versión, ignorando estado, deletedAt y versión enviados por el cliente. Se conserva autorización por propietario de productos y reservas; las pruebas existentes comprueban rechazo de recursos ajenos.

## 5. Archivos modificados y motivo

Este inventario describe cambios de este incremento; había numerosas modificaciones locales anteriores que se conservaron. No atribuir todo `git diff HEAD` a este trabajo.

| Archivo bajo el repositorio | Motivo |
|---|---|
| `backend/src/services/passwordPolicy.js` (nuevo) | Validación/hash uniforme y verificación heredada separada. |
| `backend/src/config/passwordBlocklist.json` (nuevo) | Lista local inicial ampliable, sin acceso a red. |
| `backend/src/services/credentialService.js` (nuevo) | Generaciones, estado vigente y cambio de contraseña CAS. |
| `backend/src/models/users.js` | Campos opcionales credentialVersion/deletedAt; no exponer generación en JSON. |
| `backend/src/models/sesion.js`, `recuperacion.js` | Generación asociada, sin índices nuevos. |
| `backend/src/controllers/authController.js` | Emisión ligada al snapshot, reset CAS, errores uniformes y hashing central. |
| `backend/src/middlewares/authMiddleware.js` | HS256, usuario no eliminado y versiones coincidentes. |
| `backend/src/repositories/userRepository.js` | Baja lógica, edición con guardia de baja, rotación y mayoría; retira helper de borrado de perfil. |
| `backend/src/services/userService.js` | Política común, conservación de relaciones y no restauración de bajas. |
| `backend/src/controllers/userController.js` | E11000 y respuestas sanitizadas. |
| `backend/src/scripts/createAdmin.js` | Política común y correo normalizado; **no ejecutado**. |
| `backend/src/expressApp.js` | Error handler final para parser/async sin stack público. |
| `frontend/src/app/pages/register/register.html` | Instrucciones/límites actuales. |
| `frontend/src/app/pages/login/recuperar.ts` | Instrucciones y validación de mínimo Unicode/bytes. |
| `frontend/src/app/pages/admin/usuarios/usuarios.html`, `usuarios.ts` | Texto de baja e información de política al asignar clave. |
| `backend/test/password-policy.test.js` (nuevo) | Unicode, límites, blocklist, hashes y compatibilidad heredada. |
| `backend/test/credenciales-errores.test.js` (nuevo) | No filtrar datos, errores uniformes y privilegios/mass assignment. |
| `backend/test/credenciales-mongo.test.js` (nuevo) | Integración aislada sin transacciones ni creación de índices. |
| `backend/test/auth-permisos.test.js` | Adaptar mocks al protocolo nuevo, conservando aserciones de rol/propiedad/logout. |
| `backend/test/integridad-relaciones.test.js` | Sustituir expectativa de rechazo de borrado por baja con historial. |
| Este informe | Evidencia, límites y operación/reversión. |

## 6. Pruebas ejecutadas y resultados

### Backend: 27 aprobadas, 0 fallidas, 0 omitidas

Se seleccionaron todos los archivos `backend/test/*.test.js` cuyo nombre **no contiene mongo**, más únicamente `credenciales-mongo.test.js`. No se ejecutó `npm test` indiscriminadamente ni las suites antiguas que usan otras bases y dropDatabase. El test llamado “Mongo: índice parcial…” dentro de `solicitudes-apartado.test.js` usa mocks; su nombre no lo convierte en integración real.

```powershell
# Desde backend, con la URI sintética de la instancia temporal ya preparada.
# No usar MONGO_URI ni cargar dotenv.
$files = Get-ChildItem test -Filter '*.test.js' |
  Where-Object { $_.Name -notlike '*mongo*' -or $_.Name -eq 'credenciales-mongo.test.js' } |
  ForEach-Object { $_.FullName }
node --test @files
```

La variable exclusiva `MIO_CREDENCIALES_TEST_URI` debe tener forma `mongodb://127.0.0.1:27191/mio_pruebas_credenciales_<32 hex>`. El test valida la URI antes de conectar, desactiva autoIndex/autoCreate, no usa MONGO_URI y no llama dropDatabase. Sin esa variable, la integración queda omitida, lo cual no debe contarse como aprobación.

En esta ejecución se creó directorio nuevo exclusivo y servidor ligado a loopback, con nombre de base sintético aleatorio. Se comprobó con `hello` que no era replica set; los tres modelos de autenticación tenían solo `_id_` al finalizar, sin índices adicionales creados. Las relaciones de negocio sintéticas se insertan directamente como fixtures de referencias; no prueban todos los validadores de esos modelos. La instancia no es una copia de producción.

Al terminar se solicitó shutdown exclusivamente a esa instancia, se comprobó `mongod shutdown complete` en su log y se eliminaron el directorio nuevo y sus metadatos temporales, verificando que estuvieran dentro de `tmp`. No quedó un servidor de pruebas abierto ni se conservaron archivos de base sintéticos en la entrega.

Cobertura observada:

- Cambio administrativo de clave invalida todas las sesiones probadas, incluso legado sin versión, y enlaces anteriores.
- Login concurrente admite sesiones de una generación válida; cambio intercalado entre verificación y emisión impide emitir una sesión válida con clave anterior.
- Suspensión/reactivación invalida sesiones/enlaces previos y permite login nuevo.
- Reset simultáneo con token igual y con tokens diferentes produce exactamente un éxito.
- Token vencido/manipulado/reutilizado se rechaza. Fallo inyectado al escribir devuelve error sin filtrar detalle; la clave anterior sigue funcionando en el escenario de fallo previo a escritura.
- Baja de vendedor y comprador conserva documentos enlazados e identidades; niega login, sesión, reset y reactivación.
- Política de registro, reset y administración comparte validador; errores E11000 simulados producen 409 sin datos privados.
- JWT modificado, sid de otro usuario, versión falsa, roles indebidos y producto ajeno se rechazan.
- Pruebas heredadas de productos, pedidos, reservas y comprobantes con simulaciones siguen aprobadas.

`27` incluye la prueba contenedora de integración y sus ocho subpruebas, tal como las cuenta Node. No se atribuyen 27 escenarios independientes de infraestructura. No se ejecutó el script createAdmin contra una base.

### Frontend y verificaciones estáticas

- `npm test -- --watch=false`: **55 pruebas aprobadas, 7 archivos**. Compila el bundle de pruebas, incluidos formularios.
- `npx tsc --noEmit -p tsconfig.app.json`: **aprobado**.
- `git diff --check` sobre archivos intervenidos: **aprobado**. Git informa normalización LF/CRLF, no errores de whitespace.

No se ejecutó build:deploy porque genera configuración pública ni se hizo prueba manual en navegador o correo real. La suite frontend actual no prueba todos los límites nuevos por interacción de navegador; el backend cubre Unicode/bytes.

### Intentos iniciales y límites de evidencia

Un primer intento HTTP quedó bloqueado por EACCES de loopback del sandbox; se repitió con ejecución autorizada. El primer arranque temporal de MongoDB no quedó disponible al conectar y produjo ECONNREFUSED; se inició mediante sesión persistente y la repetición completa aprobó. Estos intentos no se contabilizan como pruebas aprobadas. La ejecución final fue 27/27. Hubo un warning preexistente de `validateSync` de Mongoose en pruebas de productos; no afectó resultados.

## 7. Dependencias y riesgos pendientes

1. **Despliegue homogéneo:** instancias anteriores ignoran credentialVersion/deletedAt. Un rolling deploy mixto puede validar sesiones revocadas o permitir reactivar una baja. Se requiere corte coordinado o versión puente que ya imponga estas mismas comprobaciones en lectores y escritores.
2. **Reversión:** no volver a una versión que ignore generaciones o haga borrado físico. Retener lectores/escritores compatibles en cualquier versión de rollback. Mantener bcrypt evita incompatibilidad de hashes, pero no resuelve por sí solo la del protocolo.
3. **Operación MongoDB:** índices reales, duplicados, topología, durabilidad y respaldo restaurable del Incremento 0 siguen pendientes. No se crearon índices para compensar esa falta. E11000 es manejado cuando MongoDB lo emite; sin índice efectivo no se garantiza unicidad de correo bajo concurrencia.
4. **Correo/reset:** expiración sigue en 15 minutos, SMTP síncrono y sin prueba real/cola. Fallo tras consumo puede exigir enlace nuevo. Verificación de correo corresponde a otro incremento.
5. **Blocklist:** cobertura limitada inicial; requiere corpus mantenido. No se declara comprobación contra toda filtración conocida.
6. **Frontend:** JWT sigue en localStorage; no se introdujeron cookies/refresh/CSRF nuevos. Riesgo XSS pendiente de su incremento.
7. **Solicitudes en vuelo y escrituras externas:** no se cancelan operaciones ya autorizadas. Un script externo que cambie password/estado sin rotar versión incumple el protocolo; revisar escritores antes del despliegue. Solo deben usarse los servicios seguros para cambios de credenciales.
8. **Cuentas dadas de baja:** se conserva correo/historial y se excluye del listado habitual; recuperación administrativa de bajas, retención/anonimización y gestión de obligaciones no están implementadas. No se deben borrar manualmente tombstones para reutilizar correos.
9. **Consistencia perfil/estado:** sincronización secundaria puede fallar después de aplicar suspensión; requiere reconciliación operativa, sin deshacer revocación. Las tiendas no recibieron índices ni lógica comercial nueva.

## 8. Requisitos de despliegue y reversión — no ejecutados

Antes de autorizar un despliegue posterior:

1. Revisar cambios locales existentes y fijar artefacto exacto; separar este incremento de modificaciones anteriores. Confirmar Node >=22 y dependencias instaladas según lockfile existente.
2. Completar evidencias de respaldo/restauración y límites de solo lectura del Incremento 0. Ensayar el protocolo y fallos sobre copia anonimizada aislada con versión/topología objetivo; la prueba standalone no sustituye ese ensayo.
3. Revisar validadores de colecciones que pudieran rechazar los campos opcionales nuevos. No se necesita backfill ni un índice nuevo por este diseño, pero no se asume que la configuración real admita campos no inventariados.
4. Preparar actualización coordinada de todas las instancias y tareas que leen/escriben usuarios. Evitar tráfico servido por la versión anterior durante activación de generaciones/bajas. No rebajar writeConcern ante un timeout sin diagnóstico.
5. Publicar información de política (15 puntos de código/72 bytes y lista local) y conservar login heredado. Probar registro, login, cambio, suspensión, reactivación, reset y baja con cuentas sintéticas en staging, sin correo real a usuarios.
6. Revertir solo a artefacto que conserve protocolo de versiones, guardia deletedAt y bajas lógicas. No borrar campos ni restaurar sesiones viejas para hacer funcionar una reversión. Si no hay artefacto compatible, mantener servicio en mantenimiento hasta corregir; volver al código anterior no es una reversión segura.

La generación es un marcador de revocación, no un secreto reutilizable. Puede permanecer en documentos obsoletos hasta TTL. Restaurar un backup antiguo puede restaurar versiones y sesiones de aquel momento: el procedimiento de desastre debe revocar/rotar de manera controlada antes de abrir tráfico. Ese procedimiento requiere autorización posterior y no se ejecutó aquí.

Referencias de diseño: [MongoDB — atomicidad de un documento y filtro esperado](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/), [bcrypt.js — límite de 72 bytes](https://github.com/dcodeIO/bcrypt.js), [OWASP — autenticación y contraseñas](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). Sustentan el diseño; no prueban el despliegue de MIO.
