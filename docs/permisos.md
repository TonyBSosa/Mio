# Permisos de MIO — semana 4

## Roles y entrada

- **Visitante**: consulta el escaparate público sin sesión.
- **Cliente**: registro público para explorar tiendas; todavía no tiene compra/autopedidos implementados. No confundir esta cuenta con la ficha `clientes` que mantiene cada vendedor.
- **Vendedor**: registro público para abrir su propia tienda; nunca obtiene acceso a otra tienda.
- **Administrador**: alta mediante `npm run create-admin` en un entorno autorizado o mediante otro administrador. El registro público rechaza `admin`.

El rol se guarda en `usuarios.rol`. En cada petición protegida el servidor verifica la firma del JWT, su vencimiento, la sesión vigente en MongoDB y el estado/rol actual del usuario en la base. Un campo `rol` o `vendedorId` enviado por el navegador no concede permisos.

## Matriz de acciones × roles

| Acción / recurso | Visitante | Cliente | Vendedor | Administrador | Regla de propiedad / servidor |
|---|---|---|---|---|---|
| Ver catálogo y explorar tiendas, productos y lives públicos | Sí | Sí | Sí | Sí | Solo datos del escaparate; sin fichas de compradores ni pedidos |
| Registrarse como vendedor o cliente | Sí | Sí | Sí | Sí | Registro público excluye admin; no acepta estado/ID del solicitante |
| Iniciar sesión / solicitar recuperación | Sí | Sí | Sí | Sí | Credenciales válidas, cuenta activa; recuperación por correo del titular |
| Ver `/auth/me` y cerrar sesión | No | Propio | Propio | Propio | Usuario y sesión extraídos del JWT firmado; nunca del body |
| Listar, crear, consultar, editar y eliminar fichas de clientes | No | No | Propios | No | `/api/clientes`; filtro por `vendedorId = req.usuario._id` |
| Listar, crear, consultar, editar, cambiar estado y eliminar productos | No | No | Propios | No | `/api/productos`; filtro por tienda, incluso si se cambia el ID en URL |
| Listar, crear, consultar, editar, cambiar estado y eliminar lives | No | No | Propios | No | `/api/lives`; filtro por tienda |
| Ver live activo | No | No | Propio | No | Mismo filtro de vendedor; sin acceso al panel de otras tiendas |
| Listar, crear, consultar, editar y eliminar pedidos | No | No | Propios | No | `/api/pedidos`; cliente, live y pieza deben pertenecer a la misma tienda |
| Cambiar pago / entrega del pedido | No | No | Propios | No | Actualización por ID y vendedor autenticado |
| Ver resumen general, directo o por live | No | No | Propio | No | `/api/resumen`; pedidos y live filtrados por tienda |
| Ver y editar perfil de tienda | No | No | Propio | No | `/api/perfil-vendedor`; propietario impuesto por servidor |
| Listar, crear, consultar, editar, cambiar rol/estado y eliminar usuarios | No | No | No | Sí | `/api/usuarios`; no puede eliminarse, inactivarse o quitarse su propio rol admin; vendedor con datos se inactiva en lugar de borrarse |
| Crear un pedido desde cuenta cliente | No | No | No | No | Función futura: no hay endpoint de compra de cliente |

El administrador gestiona cuentas; por menor privilegio no recibe acceso a operaciones privadas de tiendas. Los borrados conservan las reglas de integridad ya documentadas en el modelo de datos.

## Autenticación y sesiones

- Contraseñas con bcrypt, nunca texto plano en la base ni respuestas. El registro público y la recuperación exigen 10–128 caracteres. Las cuentas existentes conservan su contraseña hasta cambiarla.
- JWT de 30 minutos, sin refresh token. Cada login/registro crea una sesión en `sesiones`, con índice TTL. El middleware comprueba la fecha expresamente: no depende de la puntualidad del borrado TTL.
- `POST /api/auth/logout` elimina la sesión actual en MongoDB. Copiar el token antes del logout y reutilizarlo devuelve 401. Otras sesiones del usuario siguen vigentes hasta su propio cierre o vencimiento.
- Los JWT anteriores a esta entrega no contienen `sid`: se rechazan y es necesario iniciar sesión nuevamente.
- `POST /api/auth/forgot-password` devuelve el mismo mensaje exista o no la cuenta. Envía por SMTP un token aleatorio de 256 bits; la base guarda solo SHA-256 y su vencimiento de 15 minutos.
- `POST /api/auth/reset-password` consume atómicamente el enlace una vez, cambia el hash y elimina todas las sesiones y recuperaciones del titular. Enlace vencido o repetido: 400.
- Login, registro y recuperación comparten límite de 20 solicitudes por IP cada 15 minutos por proceso. Configurar `TRUST_PROXY_HOPS=1` en el servicio Render tras confirmar su proxy. Para varias instancias se necesita un almacén compartido del limitador.
- La interfaz guarda el token en localStorage y usa guards por rol. Esta decisión mantiene compatibilidad con el prototipo; requiere evitar XSS. La autoridad de permisos permanece en el servidor, aunque se manipule localStorage.

## Prueba por rol y cuentas de demostración

Usar datos ficticios y una cuenta cliente, una vendedora A, otra vendedora B y una administradora. Crear admin con el script existente; compartir credenciales con el docente por el canal privado del curso. **No guardar credenciales en el repo, README ni evidencias.**

1. Sin token: operaciones privadas → 401. Escaparate → permitido.
2. Cliente: `/auth/me` → 200; `/api/productos` y `/api/usuarios` → 403.
3. Vendedor A: crear/listar sus fichas, piezas, lives y pedidos → permitido. Abrir ID de un producto de B → 404; editar/borrar tampoco debe modificar B. Enviar `vendedorId` de B en el body no transfiere propiedad.
4. Vendedor A: `/api/usuarios` → 403. Modificar el rol en localStorage tampoco autoriza la API.
5. Admin: gestionar cuentas → permitido; `/api/productos` → 403.
6. Guardar token, cerrar sesión y reutilizarlo con `/auth/me` → 401. Esperar vencimiento también debe producir 401.
7. Solicitar correo, cambiar contraseña, repetir enlace → 400; contraseña anterior rechazada y todas las sesiones anteriores → 401.
8. Registrar resultados reales en `docs/bitacora/semana-4.md`. Las pruebas con modelos simulados no sustituyen este recorrido en producción.
