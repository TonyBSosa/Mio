# Incremento 1 — Perfil del comprador

Fecha: 15 de noviembre de 2026. Implementación local, sin commit, push ni despliegue.

## Implementación

- Ruta `/cliente/perfil` protegida con el guard existente `accesoRol` y rol `cliente`.
- Identidad consultada en `GET /api/auth/me`: iniciales, nombre, correo y tipo Comprador. No se presenta la copia de localStorage como información actualizada.
- Carga, error de conexión con reintento, límite de espera de 15 segundos, rechazo 403 y descarte de sesión ante 401. También se rechaza mostrar la identidad si el servidor devuelve otro rol.
- Datos personales de solo lectura, recuperación de contraseña en `/recuperar` y cierre de sesión mediante el servicio existente.
- Navegación Explorar tiendas / Mi perfil integrada en la barra del workspace, sin añadir otro encabezado. Se retiró el botón de logout duplicado de InicioCliente.
- Estilos locales basados en los tokens de MIO, lista desplegable accesible con `details`/`summary`, avatar e información con ajuste de texto largo. En móvil la navegación ocupa una segunda fila dentro de la misma cabecera.

## Preparación visual

Mis apartados, Mis comprobantes y Quiero vender en MIO son secciones informativas sobre funciones futuras. No hay edición, subida de archivos, almacenamiento, activación de vendedor ni cambio de rol. No se modificaron backend, esquema MongoDB ni reglas de permisos.

## Archivos

- `frontend/src/app/pages/cliente/perfil-cliente/`: componente, HTML, CSS y pruebas nuevos.
- `frontend/src/app/services/auth.service.ts`: consulta del perfil tipada y descarte de sesión vencida.
- `frontend/src/app/app.routes.ts`: ruta protegida.
- `frontend/src/app/app.ts`: título de la sección.
- `frontend/src/app/app.html` y `app.css`: navegación del comprador en el shell existente.
- `frontend/src/app/app.spec.ts`: prueba de cabecera y navegación.
- `frontend/src/app/pages/cliente/inicio-cliente/inicio-cliente.html`: eliminación del logout repetido.

## Verificación

- `npm test -- --watch=false`: **21 pruebas aprobadas en cuatro archivos**, incluyendo las diez existentes. Las nuevas usan HTTP de prueba; no equivalen a sesiones reales contra MongoDB.
- Compilador Angular (`ngc -p tsconfig.app.json --noEmit`): aprobado, sin errores de tipos ni plantillas. `git diff --check`: aprobado.
- Casos cubiertos: identidad actual y cabecera Authorization; enlace de recuperación; ausencia de subida de archivos; reintento tras 503; sesión vencida; 403; discrepancia de rol del servidor; logout con confirmación del servidor; ruta directa de comprador; rechazo de visitante, vendedor y administrador; una sola cabecera con navegación activa.
- `npm run build`: **no aprobado en este entorno**. El primer intento falló al descargar Google Fonts (`ENOTFOUND fonts.googleapis.com`). Los reintentos finalizaron con código distinto de cero sin diagnóstico adicional, incluso en desarrollo; un intento devolvió `-1073741819`. No se atribuye el cierre a una causa no demostrada. La configuración temporal de diagnóstico se restauró; no queda un cambio en `angular.json`.
- El servidor de desarrollo llegó a compilar y anunciar su URL local. La herramienta de navegador agotó primero su aprobación automática y, al reintentar, devolvió `ERR_CONNECTION_TIMED_OUT` al abrir esa URL. No se obtuvieron capturas.
- Quedan por verificar manualmente en navegador: inicio de sesión real, recarga, navegación a recuperación, logout y aspecto a 390 × 844 y escritorio. Las pruebas de componentes y router no sustituyen esas verificaciones.

## Siguiente incremento recomendado

Antes de añadir reservas o imágenes, completar build y revisión visual en un entorno con navegador y API accesibles. Después, definir la relación entre la cuenta `usuarios` del comprador y las fichas `clientes` de cada tienda: no deben vincularse automáticamente por nombre. Una futura solicitud debe tener propietario comprador y tienda destinataria comprobados en servidor; los adjuntos requerirán almacenamiento privado y controles de acceso. Estas decisiones son propuestas y no se implementaron aquí.
