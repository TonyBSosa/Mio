# Incremento 2B — Revisión de solicitudes y reservas de prueba

Fecha: 15 de noviembre de 2026. Cambios locales; sin commit, push ni despliegue. Se conservaron los incrementos 1 y 2A sin publicar.

## Resultado y límite de activación

El vendedor propietario puede revisar y rechazar solicitudes pendientes. El rechazo conserva el documento y no cambia el inventario. El comprador ve los estados actualizados al abrir o actualizar Mis apartados.

Se implementó confirmación transaccional **solo para pruebas aisladas**. Permanece deshabilitada en producción y en la conexión actual del proyecto. No se habilita mediante un botón, un dato del navegador ni una opción de la tienda.

La base actual es MongoDB standalone: no soporta transacciones entre producto y solicitud. Para confirmar se necesita replica set o Atlas. Además, faltan vencimiento y liberación seguros para ofrecer reservas reales. Este incremento no cambia la configuración de esa base ni implementa expiración automática.

## Verificación previa de 2A

Lecturas realizadas sobre la conexión existente, con creación automática de índices y colecciones desactivada:

- Hay una solicitud persistida y el índice `solicitud_pendiente_unica` existe y es único.
- Sus referencias corresponden a una cuenta compradora y una vendedora.
- La consulta usada por Mis apartados devuelve esa solicitud al comprador; la consulta del vendedor también la devuelve al propietario.
- La consulta de otro comprador no la devuelve.
- No se encontraron grupos duplicados activos.

No se publicaron nombres, correos, credenciales ni el contenido de esa solicitud; no se modificaron los registros de aplicación durante esta comprobación. Las pruebas de interfaz y router de 2A siguen incluidas en la suite.

## Modelo y consistencia

MIO maneja **piezas individuales**, sin existencias por cantidad en productos. Un pedido vinculado a una pieza requiere cantidad 1. La confirmación no resta una cantidad: cambia la pieza de `activo` a `apartado`.

Se amplió `solicitudes_apartado` de forma compatible con documentos anteriores:

| Campo | Uso |
|---|---|
| `estado` | `pendiente`, `confirmada` o `rechazada` |
| `precioRegistrado` | Precio del producto tomado por el servidor al crear una solicitud nueva; no se inventa para documentos anteriores |
| `precioConfirmado` | Precio leído del producto dentro de la transacción al confirmar |
| `confirmadoEn` | Instante de confirmación |
| `rechazadoEn` | Instante de rechazo |
| `plazoReservaDias` | Copia del plazo de 3 o 7 días al confirmar |
| `venceEn` | Fecha prevista: confirmadoEn más el plazo en períodos de 24 horas; no ejecuta liberación |
| `esPrueba` | Identifica expresamente las confirmaciones de este incremento |

`perfiles_vendedores.plazoReservaDias` guarda la preferencia privada de cada vendedor, por defecto 3 días. Se aceptan únicamente 3 o 7; cambiarla no modifica reservas previas ni habilita confirmaciones.

`productos.reservaSolicitudId` identifica la solicitud que bloquea la pieza. En una única transacción con lectura snapshot y escritura majority:

1. Se vuelve a consultar la solicitud pendiente del vendedor autenticado.
2. Se comprueba que la pieza no esté vinculada a un pedido.
3. Una actualización condicional exige pieza del vendedor, estado activo y ausencia de otra reserva; cambia a apartado y guarda el identificador de solicitud.
4. Se cambia la solicitud de pendiente a confirmada y se guardan fechas, plazo, precio y marca de prueba.

Si cualquier operación falla, ambas escrituras se revierten. Los conflictos concurrentes se reintentan mediante el mecanismo de transacciones del driver; al perder disponibilidad se responde 409. No se usa compensación separada para este flujo.

Un índice adicional `solicitud_activa_unica` cubre pendiente y confirmada por comprador/producto. Se conserva el índice anterior y no se ejecuta un borrado de índices o migración destructiva.

Se añadieron condiciones en los repositorios de productos y pedidos para que sus operaciones existentes no editen, eliminen, reactiven o liberen una pieza con `reservaSolicitudId`. Las piezas sin esa referencia mantienen su recorrido anterior. No se crearon pedidos a partir de solicitudes ni se modificaron documentos de pedidos existentes.

## API y autorización

- `GET /api/solicitudes-apartado/configuracion`: vendedor autenticado; devuelve su plazo y disponibilidad de confirmación de prueba.
- `PATCH /api/solicitudes-apartado/configuracion`: vendedor autenticado, solo `plazoReservaDias` 3 o 7. La propiedad proviene de sesión.
- `PATCH /api/solicitudes-apartado/:id/rechazar`: vendedor propietario, transición condicional desde pendiente. Repetirla devuelve 409; una solicitud ajena devuelve 404.
- `PATCH /api/solicitudes-apartado/:id/confirmar`: vendedor propietario; vuelve a validar propiedad y estado, además de los requisitos del entorno. Comprador y administrador reciben 403.

Las confirmaciones exigen **todos** estos controles del servidor:

1. `NODE_ENV=test`.
2. `RESERVAS_PRUEBA_HABILITADAS=true`.
3. ID del vendedor incluido en `RESERVAS_PRUEBA_VENDEDORES`.
4. Nombre de base con prefijo `mio_pruebas_`.
5. Conexión activa a replica set o mongos.

En cualquier otro entorno se responde 503 sin modificar inventario ni solicitud. En particular `NODE_ENV=production` bloquea incluso si los otros flags estuvieran configurados. `.env.example` mantiene el flag desactivado y la lista vacía. No se alteró `.env`.

## Interfaz

La sección existente del vendedor muestra producto, comprador, fecha, precio registrado, estado y acciones. Las confirmaciones están deshabilitadas por defecto y explican el límite. Rechazar y confirmar de prueba requieren un segundo paso explícito. Se muestran errores de disponibilidad o resultado desconocido sin declarar éxito.

El comprador ve pendiente, rechazada o reserva confirmada, con fechas cuando corresponda. Las reservas de prueba se identifican como tales y advierten que no tienen liberación automática. No hay actualización en tiempo real: se consulta al abrir la sección o pulsar Actualizar solicitudes.

Una solicitud anterior sin precio conserva esa ausencia y muestra «Sin precio registrado»; no se reconstruye un precio histórico con el catálogo actual.

## Pruebas ejecutadas

- **9 pruebas del backend aprobadas**, incluidas las anteriores y una integración real con MongoDB 8.2.
- La integración usó un proceso MongoDB adicional en `127.0.0.1:27182`, replica set `mioPruebas` y base `mio_pruebas_incremento2b_20261115`, separada de la conexión del proyecto. El test valida explícitamente host, puerto y prefijo antes de conectar; no lee `MONGO_URI`. Elimina únicamente su base de prueba al terminar.
- Verificados en MongoDB real: persistencia por colección, duplicados concurrentes 201/409, aislamiento por comprador y vendedor, comprador/admin sin capacidad de confirmar, solicitud ajena 404, confirmación deshabilitada por defecto y en producción, producto inactivo/apartado 409, dos confirmaciones sobre una pieza con resultado 200/409 y una sola reserva.
- También se verificaron reversión de transacción ante fallo inyectado después de bloquear la pieza, plazos de 3 y 7 días, rechazo sin eliminar ni liberar inventario, nueva solicitud tras rechazo y protección contra reactivación, borrado o liberación por repositorios anteriores.
- Un pedido previo se comparó antes/después y permaneció idéntico. Las pruebas existentes de pedidos, integridad y resúmenes también pasan.
- **34 pruebas del frontend aprobadas**. Incluyen rechazo en dos pasos, confirmación deshabilitada, conflictos, estado visible al comprador, plazo y restauración de selección tras error, además de los recorridos anteriores.
- Compilador Angular `ngc -p tsconfig.app.json --noEmit`: aprobado.
- **Build completo de producción aprobado** con `$env:CI='true'; npm run build`. Angular desactiva la caché persistente en ese modo; no se desactiva la optimización de producción. Salida: `frontend/dist/mio`, total inicial 708,46 kB. Advertencias: bundle inicial supera el umbral de aviso de 500 kB, catálogo CSS supera 8 kB y bienvenida CSS supera 8 kB; ninguno excede el umbral de error.
- El build normal sigue terminando por violación de acceso nativa (`-1073741819`). Se comprobó que al omitir la caché persistente sí termina. No pudo renombrarse la caché existente por acceso denegado; no se detuvieron procesos del usuario ni se modificó `angular.json`. El uso de CI es el procedimiento verificado para compilar en este entorno.
- No se ejecutó revisión visual de navegador en este incremento; no se afirman capturas ni prueba visual móvil.

Para repetir la integración, se necesita el replica set de prueba y definir `MIO_MONGO_PRUEBAS_URI` con la URL local indicada antes de `npm test`. Sin esa variable, la prueba real se omite expresamente y el resto corre normalmente.

## Estrategia requerida antes de habilitar producción

Se requiere replica set/Atlas y un proceso de vencimiento idempotente, con reintentos y seguimiento de errores. La liberación futura debe comprobar en una transacción que la solicitud siga confirmada, que venceEn haya pasado y que la pieza aún pertenezca a esa misma `reservaSolicitudId`, sin pedido posterior. Debe guardar un estado histórico de vencimiento y limpiar la referencia solo de la pieza correspondiente. Un índice TTL que borre solicitudes no sirve para conservar historial ni garantiza una liberación consistente.

También se necesitan pruebas de caídas/reinicio del proceso, carreras entre aprobación y vencimiento, y una política para cancelaciones y conversión a pedido. Nada de esto se implementa ni se habilita en este incremento. Hasta entonces, solo se puede rechazar en el uso habitual; confirmar permanece restringido a datos de prueba desechables.

## Archivos del incremento 2B

- Backend: `src/models/solicitudApartado.js`, `src/models/productos.js`, `src/models/perfilVendedor.js`, `src/repositories/solicitudApartadoRepository.js`, `src/repositories/productoRepository.js`, `src/repositories/pedidoRepository.js`, `src/services/solicitudApartadoService.js`, `src/services/reservasPruebaPolicy.js`, `src/controllers/solicitudApartadoController.js`, `src/routes/solicitudApartadoRoutes.js`, `test/reservas-mongo.test.js`, `.env.example`.
- Frontend: `src/app/services/solicitud-apartado.service.ts`, `src/app/shared/solicitudes-apartado/` (TS/HTML/CSS), `src/app/solicitudes-apartado.spec.ts`.
- Documentación: `docs/permisos.md` y este reporte.
