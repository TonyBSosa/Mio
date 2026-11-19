# MIO — Diagnóstico SMTP con Gmail

## Resultado comprobado

La configuración local de `backend/.env` falla en `correoConfig.configuracion`: `MAIL_FROM` no cumple `validoEmail`. Se comprobó leyendo las variables únicamente en memoria, sin imprimir valores. Con la sustitución exclusiva de MAIL_FROM por una dirección sintética válida, el mismo objeto de configuración pasó la validación. SMTP_HOST coincide con el host previsto y SMTP_PORT con 465; usuario y contraseña están presentes; el TTL es válido. No se modificó `.env`.

Esto demuestra un bloqueo previo al transporte para esa configuración, suficiente para impedir el envío. No demuestra que sea el único problema operacional ni que el proceso ya iniciado tenga exactamente el mismo entorno. No se comprobó conexión, autenticación, cuota ni entrega real de Gmail. No atribuir el fallo a Gmail sin ejecutar posteriormente la verificación autorizada.

## Ruta responsable

`authController.solicitarRecuperacion` devuelve la respuesta pública genérica y encola. `recuperacionService.procesar` consulta usuario, reserva cuota, persiste token hash y revalida credenciales; después llama `correoService.enviarRecuperacion`. Esta función valida configuración antes de crear transporte. Antes del cambio, sus catch sustituían el error original y `recoveryQueue.crearCola` imprimía únicamente `recuperacion_trabajo_fallido`, ocultando también errores de persistencia.

No se identificó defecto demostrado en TLS465 ni en la construcción del enlace. El enlace usa APP_URL validado, HTTPS en producción y token en fragmento. La autenticación usa usuario y contraseña de aplicación configurados; no se ha verificado su validez externa.

## Corrección mínima de configuración pendiente del desarrollador

En el entorno local, cambiar MAIL_FROM a una dirección simple válida, por ejemplo `mio@example.invalid` (ejemplo sintético: sustituir por la cuenta dedicada real). No usar `MIO <direccion>` con el contrato actual del validador. Usar como remitente la cuenta dedicada autenticada, salvo que se haya configurado explícitamente un alias autorizado por el proveedor. No compartir ni pegar credenciales. Reiniciar el backend después de guardar la configuración.

Se conserva la validación estricta existente. No se cambió el archivo de configuración privada automáticamente.

## Cambios de código

- `backend/src/services/diagnosticoRecuperacion.js`: metadatos privados en WeakMap y registro estructurado de etapa, categoría, código técnico de lista cerrada e identificador aleatorio. Nunca serializa errores originales, mensajes, respuestas SMTP, direcciones, enlaces ni secretos.
- `backend/src/services/recuperacionService.js`: etapas diferenciadas para TTL, consulta de usuario, cuota, persistencia del token y revalidación; conserva todas las operaciones originales.
- `backend/src/services/recoveryQueue.js`: registra los metadatos seguros del fallo capturado.
- `backend/src/services/correoService.js`: conserva metadatos seguros al agotar reintentos; expone verificación manual reutilizando el mismo transporte y límites. La verificación llama verify(), nunca sendMail(), sin reintentos automáticos.
- `backend/src/scripts/verificarSMTP.js` y `backend/package.json`: comando manual aislado; no importa servidor ni modelos ni conecta MongoDB. Carga .env sin imprimirlo y termina con código 1 si falla.
- `backend/test/smtp-diagnostico.test.js`: pruebas sintéticas de verificación, clasificación, confidencialidad y fallo previo al transporte.

No se modificaron controlador, credentialVersion, sesiones, tokens de un uso, TTL predeterminado de 30 minutos, cuotas, índices ni respuestas HTTP. TLS implícito465, STARTTLS obligatorio en otros puertos, certificados validados, tiempos máximos y reintentos conservadores permanecen activos. No se reintenta una entrega ambigua.

## Pruebas ejecutadas

26 pruebas de backend aprobadas, 0 fallos, 0 omitidas: todos los archivos `backend/test/*.test.js` cuyo nombre no contiene `mongo`. Incluyen sockets/transporte simulados, verificación sin sendMail, clasificación autenticación/conexión/TLS/timeout, sanitización, MAIL_FROM inválido antes del transporte y regresiones HTTP de autenticación. Las pruebas HTTP usaron únicamente loopback; las de SMTP fueron simuladas. No se ejecutaron suites contra MongoDB real ni pruebas de entrega/certificado real.

La primera ejecución encontró restricciones del sandbox en HTTP local y un fallo en la clasificación de ETIMEDOUT; se corrigió esa clasificación y la ejecución final completa pasó. `git diff --check` sin errores de espacios; advertencias normales LF/CRLF. No hay cambios Angular.

## Comprobación manual posterior (no ejecutada)

Ejecutar explícitamente desde el repositorio, después de corregir MAIL_FROM:

```powershell
Set-Location D:\VANGUARDIA\MIO\backend
npm run smtp:verify
```

Este comando sí realiza una conexión SMTP real y autentica; ejecutarlo solo cuando el desarrollador decida autorizar esa conexión. No envía mensajes ni modifica cuentas/contraseñas/MongoDB. No se ejecuta al iniciar backend.

- `configuracion_correo / configuracion`: revisar MAIL_FROM, variables SMTP requeridas y APP_URL según el contrato. APP_URL debe ser origen sin ruta/query/fragmento/credenciales; HTTP solo local fuera de producción.
- `autenticacion / EAUTH`: revisar SMTP_USER y contraseña de aplicación vigente de la misma cuenta, y habilitación operacional en Google; nunca publicar el secreto.
- `conexion`: revisar salida de red/DNS/host/puerto.
- `tls`: revisar certificados, reloj local, inspección TLS y políticas de red; no desactivar validación.
- `timeout`: revisar conectividad y respuesta del servidor. El comando conserva límites de conexión5s, saludo5s, inactividad10s y total20s.
- `procesamiento / NO_CLASIFICADO`: no hay evidencia suficiente para clasificar; no imprimir el error crudo como alternativa.

Una verificación exitosa confirma conexión/autenticación, no la autorización de cada remitente ni la entrega en bandeja.

## Prueba real de entrega posterior

Una vez autorizada expresamente la prueba real y verificación exitosa, usar Angular contra el entorno de pruebas aislado y una cuenta sintética activa con buzón controlado. Solicitar un solo enlace, respetando 60s entre solicitudes y 3 por hora por cuenta; los intentos fallidos anteriores pueden haber consumido cuota. No borrar cuotas ni tokens para eludir límites. Revisar bandeja y spam; no copiar ni registrar el enlace/token. Si falla, recopilar únicamente el registro estructurado. El mensaje público debe seguir siendo genérico. No usar cuentas productivas para esta prueba.

## Límites y reversión

La causa local está demostrada; la entrega real queda pendiente. No se enviaron correos ni se realizaron conexiones SMTP, migraciones, despliegues, cambios productivos o commits. La configuración externa la corrige el desarrollador sin revelar secretos. Para revertir este diagnóstico, retirar solo los archivos nuevos y los cambios descritos; conservar Incrementos1/2 y no revertir cambios posteriores ajenos. El entorno privado no fue modificado.
