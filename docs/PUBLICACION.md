# Publicar MIO: desarrollo local y produccion

Preparacion local realizada; no se han creado servicios, publicado codigo ni migrado datos.

## 1. Cuentas y repositorio

Crear cuentas en https://render.com y https://www.mongodb.com/cloud/atlas usando GitHub si se desea.
Revisar los cambios locales antes de subirlos a GitHub: hay cambios previos a esta preparacion. No subir .env, credenciales, datos personales ni volcados de la base. Confirmar que el codigo que se desea publicar esta en main.

## 2. Base de produccion en Atlas

Crear un cluster Free, un usuario de base de datos exclusivo para MIO y una conexion para la base mio_prod. Mantener mio_dev o la base local actual para desarrollo; no cambiar el .env local a produccion.

Copiar la cadena desde Connect > Drivers y especificar /mio_prod antes de los parametros de consulta. Guardarla solo en las variables del backend en Render. En Network Access permitir las IP de salida del servicio Render (se muestran en su panel); elegir regiones cercanas entre ambos proveedores.

## 3. API en Render

Crear New > Web Service, conectar el repositorio y seleccionar:

| Campo | Valor |
|---|---|
| Branch | main |
| Root Directory | backend |
| Build Command | npm ci |
| Start Command | npm start |
| Instance Type | Free |
| Health Check Path | / |

Variables:

- NODE_ENV: production
- MONGO_URI: cadena de Atlas para mio_prod
- JWT_SECRET: secreto aleatorio exclusivo de produccion (usar Generate de Render si esta disponible)
- CORS_ORIGINS: URL HTTPS del frontend, sin barra final; completar cuando este creado

Render proporciona PORT. Copiar la URL asignada a la API. Abrirla y confirmar API MIO funcionando. El servidor espera la conexion a MongoDB antes de escuchar.

## 4. Angular en Render

Crear New > Static Site con el mismo repositorio:

| Campo | Valor |
|---|---|
| Branch | main |
| Root Directory | frontend |
| Build Command | npm ci && npm run build:deploy |
| Publish Directory | dist/mio/browser |

Agregar PUBLIC_API_URL con https://URL-REAL-DE-LA-API/api. Es una URL publica, nunca una credencial. El build:deploy exige HTTPS y genera la configuracion de Angular. npm run build sigue disponible para otros despliegues que sirvan /api en el mismo dominio.

En Redirects/Rewrites agregar Source /*, Destination /index.html, Action Rewrite para las rutas Angular.

Copiar la URL del sitio a CORS_ORIGINS en el backend y aplicar el cambio. Si se usan varios origenes, separarlos con comas. No usar asterisco. CORS controla el acceso del navegador; no sustituye autenticacion ni permisos.

## 5. Verificar antes de presentar

Usar datos ficticios. Registrar vendedor, iniciar sesion, crear cliente y producto, registrar pedido y comprobar resumen. Recargar /login y una ruta interna; probar desde el telefono. Verificar que las solicitudes usan la API HTTPS publicada y que reiniciar la API conserva los datos en Atlas. Esta lista requiere ejecucion manual; no se ha completado todavia.

Render Free suspende la API tras inactividad; abrirla antes de la demostracion. No guardar archivos subidos en el disco temporal del backend.

## Desarrollo habitual

- Backend: conservar .env local (ver backend/.env.example), usar npm run dev desde backend.
- Frontend: npm start desde frontend utiliza localhost:3000/api.
- Trabajar en ramas y probar antes de integrar a main. Si Render tiene despliegue automatico, cada cambio en main se publica: revisar antes de subir.
- Mantener bases y secretos distintos por ambiente. Cambiar la configuracion no migra datos automaticamente.

Documentacion oficial consultada: https://render.com/docs/your-first-deploy y https://render.com/docs/redirects-rewrites.

## Configuración adicional de semana 4

En el backend de Render configurar:

- `APP_URL=https://mio-web.onrender.com` (origen utilizado en enlaces de recuperación).
- `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS o 465 TLS), `SMTP_USER`, `SMTP_PASSWORD` y `MAIL_FROM` con un proveedor de correo autorizado. No guardar estos valores en GitHub.
- `TRUST_PROXY_HOPS=1` para un único proxy de confianza; confirmar la topología de Render antes de ajustarlo. En local se conserva 0. Evitar `true` indiscriminado porque el limitador depende de la IP.

La nueva versión añade `sesiones` y `recuperaciones` en MongoDB, con índices TTL. Confirmar que el usuario de base tiene permisos para crear sus índices. La comprobación de expiración se hace también en las consultas, aunque el limpiador TTL aún no haya borrado el registro. No necesita migrar usuarios; los tokens anteriores se rechazan y hay que iniciar sesión nuevamente.

Después del despliegue seguir el recorrido de `docs/permisos.md`, incluyendo correo recibido, enlace vencido/repetido, cuenta por rol, ID ajeno y reutilización del token tras logout. No incluir contraseñas ni enlaces de recuperación en capturas o bitácoras públicas.
