# MIO — Recuperación: mezcla de entornos y pantalla en Procesando

Fecha: 2026-11-19. Base: eb61c3d.

## Evidencias comprobadas

1. La configuración local de backend tenía APP_URL apuntando a https://mio-web.onrender.com. El correo mostrado por el usuario también apunta a ese dominio. Un enlace generado con un token guardado en MongoDB local y abierto en producción no se valida contra la misma base. No se utilizó ni se copió el token adjunto en herramientas, pruebas o este informe.
2. La configuración local RECOVERY_TOKEN_TTL_MINUTES, o su valor predeterminado, resuelve a 30. El mismo valor se usa para expiresAt y para el texto del correo. MongoDB local tiene índices _id, tokenHash y TTL expiresAt con expireAfterSeconds=0. No se encontró un TTL de 15 minutos. No se revisó configuración ni datos productivos. No se modifica el texto a 15 sin evidencia de esa expiración.
3. Los 15 minutos también corresponden a la ventana del limitador por IP. No se demuestra que ese fuera el mensaje observado por el usuario; es un concepto distinto del vencimiento del enlace.
4. Una prueba nueva de DOM reprodujo el fallo de pantalla: tras enviar el formulario y recibir HTTP de éxito, el componente cambiaba sus propiedades pero el DOM seguía mostrando Procesando. No se notificaba a la detección de cambios de Angular. La prueba falló antes de la corrección y pasa después, sin un segundo clic ni detectChanges forzado tras la respuesta.
5. Se consultó únicamente la base local prevista, con autoIndex/autoCreate desactivados: cuenta activa, sin cooldown ni cuota horaria agotada en ese momento; no había documentos de recuperación vigentes ni persistidos para esa cuenta. No se puede reconstruir la causa de un fallo anterior de envío ni inferir la duración de un token que ya no está. No se modificaron cuentas, cuotas, contraseñas, índices ni sesiones.

## Corrección

- Solo en el archivo privado local backend/.env se cambió APP_URL a http://localhost:4200. No se imprimió el archivo ni se tocaron credenciales. El backend en ejecución debe reiniciarse para cargar el nuevo valor. El archivo sigue fuera de Git.
- Recuperar notifica la actualización de pantalla al finalizar la petición con ChangeDetectorRef.markForCheck y finalize. Se retira el estado de carga también si el observable termina sin respuesta. No se toca la lógica de revocación ni consumo de tokens.
- La petición tiene tiempo máximo de 75 segundos. Si el resultado de un cambio queda incierto por timeout/error de red, el mensaje pide comprobar el login antes de pedir otro enlace: cancelar la espera del navegador no garantiza cancelar la escritura del servidor.
- El mensaje HTTP429 identifica expresamente un límite de solicitudes y conserva su espera de 15 minutos. El correo mantiene la duración real configurable, actualmente 30 minutos en desarrollo.

## Validación ejecutada

- 73 pruebas Angular, 9 archivos, aprobadas. Incluyen éxito/error reflejados en el DOM sin otro clic, timeout a los 75 segundos, finalización sin respuesta y regresión existente.
- TypeScript: npx tsc --noEmit -p tsconfig.app.json, código 0.
- npm run build: código 0; distribución generada. Persisten advertencias de tamaño de bundle/CSS, no errores.
- git diff --check: sin errores; solo advertencias LF/CRLF.

Archivos versionables cambiados: frontend/src/app/pages/login/recuperar.ts, su spec y este informe. No cambió código backend ni el vencimiento. No se hizo una prueba real de correo, cambio real de contraseña, revisión de registros del servidor en ejecución, commit o despliegue.

## Comprobación manual pendiente

Reiniciar únicamente el backend de desarrollo mediante su terminal y npm run dev desde backend. Abrir http://localhost:4200/recuperar. Solicitar una sola vez un enlace para una cuenta local con buzón controlado, respetando las cuotas. El enlace nuevo debe comenzar por http://localhost:4200/recuperar; los correos anteriores no se reescriben y no sirven para validar la configuración nueva.

Confirmar el cambio en el frontend local y probar login local. Eso no cambia la contraseña de una cuenta en producción: la API/base son distintas. Si no llega el correo, revisar solo el registro estructurado del backend; no publicar .env ni enlaces. El fallo histórico de reenvío queda sin causa SMTP demostrada.

Para producción se conserva APP_URL HTTPS con el dominio desplegado. La corrección de la pantalla requiere publicación posterior autorizada. La entrega SMTP productiva y el acceso administrativo productivo siguen requiriendo su propia comprobación operacional.
