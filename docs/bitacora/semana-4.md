# Bitácora de semana 4 — Login y roles

Fecha: 6 de noviembre de 2026, Honduras.

## Material y objetivo

Se analizaron las quince capturas del módulo 4 aportadas por el responsable. La entrega exige autenticación, autorización efectiva, matriz de permisos y reglas de propiedad, pruebas por rol, bitácora, etiqueta `semana-4`, token de propiedad, al menos veinte commits totales y tres recientes, y aplicación HTTPS pública.

## Cambios implementados

- Se conserva Express/JWT/bcrypt y MongoDB, con roles `admin`, `vendedor` y `cliente` ya existentes. No se construye un algoritmo de contraseñas propio.
- Sesiones persistidas con TTL, vencimiento explícito de 30 minutos y logout que revoca en servidor. Los tokens antiguos requieren nuevo login.
- Recuperación por correo SMTP, token aleatorio de un solo uso, hash SHA-256 en base y expiración de 15 minutos. Cambiar contraseña revoca todas las sesiones del titular.
- Límite de intentos en endpoints de autenticación. Registro y cambio de contraseña: 10–128 caracteres.
- Formulario Angular de recuperación, enlace desde login y guards por rol en rutas privadas.
- `docs/permisos.md`: matriz completa de acciones por rol, propiedad, mecanismos y recorrido de prueba.
- Actualización compatible de dependencias del backend para corregir los avisos de producción detectados durante la instalación.

## Verificaciones locales

- Backend: seis pruebas aprobadas, incluyendo una prueba HTTP con varios escenarios de autenticación, roles, tienda y recuperación. Los modelos MongoDB y el envío de correo se simulan: no acredita entrega SMTP ni índices reales.
- Casos comprobados: 401 sin token; vendedor accede a sus productos; producto ajeno devuelve 404; cliente y admin no acceden a operación privada de vendedor; un rol `admin` incluido en el token no sustituye el rol de base; logout invalida el token; vencimiento y JWT antiguo se rechazan; token de recuperación no aparece en respuesta; contraseña guardada como hash; enlace repetido falla; reset revoca sesiones; login válido emite JWT de 30 minutos y contraseña incorrecta falla.
- Frontend: `npm run build` aprobado.
- Auditoría de dependencias: `npm audit --omit=dev`: cero vulnerabilidades. Quedan dos avisos moderados en herramientas de desarrollo (nodemon/minimatch), fuera del runtime de producción.
- El historial ya tenía 21 commits y siete de los últimos diez días antes de esta entrega; no se fabrican commits ni fechas para cumplir el mínimo.
- Token en README: `LEARN-CAP-D03DECFA`.

## Producción y requisitos pendientes

La publicación del código no configura por sí sola el correo. En Render se deben establecer `APP_URL=https://mio-web.onrender.com`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` y `TRUST_PROXY_HOPS` según el proxy. Los valores secretos se guardan únicamente en Render.

No se dispone de una verificación de entrega real del correo ni de una cuenta administradora durante esta preparación. No se presentan esos puntos como aprobados. Se crearon dos cuentas vendedoras y una cliente con autorización explícita del responsable. Queda pendiente confirmar una cuenta administradora. Las credenciales se guardaron en un archivo privado temporal fuera del repo y deben compartirse solo con el docente. Ejecutar el recorrido completo de `docs/permisos.md` con base y SMTP reales antes de dar por terminada la entrega funcional.

## Lecciones aplicadas del caso HealthCare.gov

1. Probar recorrido completo temprano: login → datos propios → salida → intento de acceso posterior. Las pruebas aisladas no acreditan producción.
2. Tratar autenticación como camino crítico y probar varios roles, incluyendo lo prohibido.
3. Cambios de requisitos pasan por mapa/backlog y priorización antes de incorporarse; el registro no debe ser una barrera para el catálogo público.
4. Lanzar primero con un grupo pequeño de tiendas en semana 5; registrar fallos y ajustar antes de ampliar usuarios.

## Preparación del reto

Repositorio: https://github.com/TonyBSosa/Mio

Aplicación: https://mio-web.onrender.com

API: https://mio-api-ahq2.onrender.com

Versión de esta entrega: `semana-4`. Comprobar que GitHub muestra la etiqueta y que el despliegue termina antes de introducir las URLs en fase 0. El control automático de fase 0 no sustituye las pruebas funcionales de cuentas, permisos y recuperación.


## Verificación posterior al despliegue

Fecha: 6 de noviembre de 2026, Honduras. Se ejecutaron peticiones HTTPS contra la API pública con autorización explícita para crear tres cuentas ficticias y una pieza temporal. Diecinueve comprobaciones aprobadas:

| Comprobación real | Resultado |
|---|---|
| Registro de vendedores A y B y cuenta cliente | 201 para las tres cuentas |
| Consultar productos sin sesión | 401 |
| Cliente consulta su propio perfil | 200 |
| Cliente intenta consultar productos privados | 403 |
| Vendedor intenta administrar usuarios | 403 |
| Vendedor A crea pieza enviando el ID de B en el body | 201; el servidor conserva a A como propietario |
| Vendedor A consulta su pieza | 200 |
| Vendedor B intenta leer, editar y borrar la pieza de A | 404 en las tres operaciones |
| Eliminación de la pieza temporal por A | 200; no se modificaron datos preexistentes |
| Cierre de sesión de A y reutilización de su token | 200 al salir; 401 al reutilizar el token |
| Nuevo login de A con contraseña correcta y cierre posterior | 200 en ambas operaciones |
| Cierre de sesiones de B y cliente | 200 en ambas operaciones |

El frontend público y la ruta de recuperación respondieron HTTPS 200. El nuevo endpoint de reset rechazó una petición sin token ni contraseña con 400. Esto confirma disponibilidad y validación inicial; no demuestra recepción del correo.

Las tres cuentas quedan para demostración con emails ficticios del dominio reservado example.invalid; no reciben correo. Sus contraseñas aleatorias no se incluyeron en commits, evidencias ni release. Para probar recuperación real se necesita una cuenta con buzón accesible y SMTP configurado.

No se probó una cuenta administradora en producción ni entrega/consumo real del enlace por correo. La prueba HTTP local sí cubre consumo único y revocación tras reset con modelos simulados. El release semana-4 conserva el commit original; esta evidencia se añade después sin mover la etiqueta publicada.
