# Incremento 2A — Solicitudes de apartado

Fecha: 15 de noviembre de 2026. Cambios locales sobre `main`; se conservaron los archivos sin commit del incremento 1. No se hizo commit, push ni despliegue.

## Decisión de modelo

Nueva colección `solicitudes_apartado`. No reutilizar `pedidos`: su `clienteId` referencia una ficha mantenida por el vendedor, no la cuenta `usuarios` del comprador. Además, los pedidos participan en reservas, pagos, entregas y resúmenes. Mezclar solicitudes pendientes alteraría el significado de ventas existentes.

Cada solicitud guarda comprador, producto, vendedor, fecha y estado `pendiente`. Los nombres de comprador, producto, tienda y código son copias históricas tomadas del servidor. No se guarda un precio recibido del navegador ni se vincula automáticamente una cuenta con una ficha de cliente. No se modifican los esquemas o documentos de pedidos, productos o usuarios.

## Flujo implementado

1. El catálogo ofrece **Solicitar apartado** en productos activos.
2. Un visitante va al login con una URL de regreso limitada al catálogo y producto. Tras entrar como comprador, vuelve al artículo seleccionado y debe confirmar explícitamente; no se crea una solicitud por visitar una URL.
3. El comprador confirma. Solo se envía `productoId`; comprador, vendedor, nombres y estado se determinan en servidor. La respuesta 201 muestra confirmación y acceso al perfil.
4. **Mis apartados** consulta solicitudes del comprador autenticado al abrirse. Muestra artículo, tienda, fecha y Pendiente de revisión. Tiene carga, vacío, error, reintento y actualización.
5. El vendedor abre **Solicitudes de apartado de compradores** dentro de Pedidos y apartados. Ve sus solicitudes recibidas y el nombre del comprador, sin acciones de aprobación ni cambios de stock.

Una solicitud pendiente no reserva una pieza ni confirma una compra o pago. Diferentes compradores pueden solicitar el mismo artículo. Si el producto deja de estar activo, se rechazan nuevas solicitudes; las anteriores permanecen como registro histórico pendiente, sin garantizar disponibilidad actual.

## API y seguridad

| Método / recurso | Acceso | Comportamiento |
|---|---|---|
| `POST /api/solicitudes-apartado` | Cliente activo con sesión válida | Valida ID, producto activo y vendedor activo; 201 o error 400/404/409 |
| `GET /api/solicitudes-apartado` | Cliente o vendedor | Filtra por comprador o vendedor de la sesión; ignora filtros de propietario del navegador |
| `GET /api/solicitudes-apartado/:id` | Cliente o vendedor propietario | Detalle propio; 404 si es ajeno |

Se reutilizan JWT, sesión vigente y validación de rol desde MongoDB. Administrador y vendedor no pueden crear solicitudes; el administrador tampoco recibe acceso a estos listados. No hay rutas de actualización o eliminación.

El índice parcial único `(compradorId, productoId)` para estado `pendiente` previene duplicados concurrentes en MongoDB. El repositorio espera la construcción de índices antes de escribir y transforma el error duplicado 11000 en 409. Un fallo al crear índices impide guardar, en lugar de aceptar solicitudes sin esa protección. No hay una comprobación previa de duplicados como única defensa.

La disponibilidad se consulta al crear la solicitud. No se bloquea inventario ni se declara una operación atómica con una venta simultánea: una solicitud pendiente puede coexistir con una venta posterior. La futura aprobación deberá volver a comprobar disponibilidad; está fuera de este incremento.

## Archivos del incremento 2A

- Backend nuevo: `src/models/solicitudApartado.js`, `src/repositories/solicitudApartadoRepository.js`, `src/services/solicitudApartadoService.js`, `src/controllers/solicitudApartadoController.js`, `src/routes/solicitudApartadoRoutes.js`, `test/solicitudes-apartado.test.js`.
- Backend modificado: `src/expressApp.js` para montar el recurso independiente.
- Frontend nuevo: `src/app/services/solicitud-apartado.service.ts`, `src/app/shared/solicitudes-apartado/` (TS/HTML/CSS) y `src/app/solicitudes-apartado.spec.ts`.
- Frontend modificado: catálogo público (TS/HTML/CSS), login (TS), perfil del comprador (TS/HTML), pedidos (TS/HTML/CSS) y `auth.service.ts` para conservar el regreso tras sesión vencida.
- Documentación: `docs/permisos.md` y este reporte. Los demás cambios locales corresponden al incremento 1 y se conservaron.

## Verificación y límites

- Backend: **8 pruebas aprobadas**, incluidas las seis existentes. Los casos HTTP verifican autenticación, roles, creación, campos manipulados ignorados, duplicado concurrente, listados aislados, detalle ajeno 404, comprador sin solicitudes y producto inexistente, apartado o inactivo. Se comprueba que el flujo nuevo no crea pedidos ni reserva productos. Las pruebas previas de pedidos, integridad y resúmenes siguen aprobadas.
- Los tests usan repositorios/modelos simulados. La prueba del índice verifica su definición y que se espere su construcción; la prueba concurrente simula el conflicto de MongoDB. No se ejecutó una carrera ni persistencia sobre una instancia MongoDB real y no se presentan como verificadas.
- Frontend: **29 pruebas aprobadas**, incluidas las del incremento 1. Cubren regreso desde login, rechazo de URL externa, confirmación explícita, cuerpo mínimo de solicitud, doble clic, producto no disponible, duplicado, consulta desde el perfil, vacío, error/reintento y consulta de vendedor.
- Compilador Angular `ngc -p tsconfig.app.json --noEmit`: aprobado tras el ajuste final de foco. `git diff --check`: aprobado.
- `npm run build`: los intentos terminaron con código 1 después de `Building…`, sin un diagnóstico adicional, tanto en el entorno restringido como con permisos ampliados. El incremento 1 ya tenía este bloqueo. No se considera una compilación de producción aprobada ni se cambió su configuración para ocultarlo.
- No se ejecutó una sesión de navegador ni se tomaron capturas en este incremento. Queda pendiente comprobar el recorrido contra API y MongoDB de desarrollo, recarga y diseño móvil/escritorio, y resolver el build antes de desplegar.

## Comprobación manual pendiente

En un entorno de desarrollo separado de producción: iniciar API y frontend; preparar vendedor activo, producto activo y dos compradores. Solicitar desde visitante, entrar y confirmar; comprobar el nuevo documento y Mis apartados tras recargar. Repetir el envío para obtener 409, probar comprador B y vendedor ajeno para verificar aislamiento, y probar un producto inactivo. Comprobar que la pieza sigue activa y que pedidos/resúmenes conservan sus registros y totales anteriores. Verificar en MongoDB el índice `solicitud_pendiente_unica` antes de ampliar el piloto.

No se añadieron comprobantes, vencimientos, pagos, notificaciones ni aprobación de reservas.
