# MIO: guía de aprendizaje y preparación de defensa en tres días

Preparado el 18 de noviembre de 2026 a partir del código del checkout actual. Tiempo propuesto: cinco horas netas por día, con descansos adicionales. Si dispones de menos tiempo, prioriza los bloques marcados como esenciales.

## Cómo utilizar esta fuente en NotebookLM

Este documento combina un calendario de estudio con un manual explicativo del proyecto. Está preparado para servir como fuente autónoma de resúmenes, guiones de video, preguntas de repaso y simulacros de terna. Las rutas de archivos indican de dónde sale una explicación: mencionar una ruta no significa que NotebookLM tenga acceso a ese archivo.

Orden de lectura: panorama del proyecto → calendario de tres días → lecciones explicativas → preguntas de defensa → instrucciones para generar material. Si generas un video de un día concreto, utiliza también las lecciones asociadas a ese día.

Perfil del estudiante: autor del proyecto, con conocimientos iniciales de su organización y necesidad de explicar y modificar el código ante una terna. Enseñar desde los fundamentos, introduciendo cada término antes de usarlo. Mantener los nombres reales de tecnologías, capas, archivos y funciones.

Regla de fidelidad: separar **hecho observado en código**, **interpretación del diseño**, **ejemplo didáctico**, **mejora propuesta** y **comportamiento verificado mediante ejecución**. Aquí se aportan hechos de una revisión estática, interpretaciones señaladas y ejemplos ficticios. No se aportan nuevas ejecuciones de pruebas ni comprobaciones del despliegue.

El calendario ocupa las primeras secciones; el contenido que permite enseñar los temas comienza en «Manual explicativo para estudiar y generar videos». Los ejercicios de cambios son propuestas de práctica y no describen cambios ya implementados.

## Objetivo

Al terminar debes poder explicar el problema, dibujar la arquitectura, seguir una petición completa, justificar decisiones con sus límites y hacer un cambio pequeño sin perderte entre archivos. No necesitas memorizar el repositorio: necesitas saber encontrar, explicar y comprobar el código que sostiene tu respuesta.

Este plan no certifica funcionamiento en producción. Se revisó código y documentación; no se ejecutaron pruebas ni se comprobó la configuración desplegada. Hay modificaciones locales previas en el frontend: conserva ese trabajo al practicar.

## Tu punto de partida, corregido

- Frontend: Angular 21, TypeScript, HTML y CSS; servicios HTTP y RxJS.
- Backend: Node.js y Express 5, escrito en JavaScript CommonJS (`require` y `module.exports`). Node.js ejecuta el programa; Express organiza la API HTTP.
- Persistencia: MongoDB, con Mongoose 9 para esquemas, modelos y consultas. La versión de Mongoose no indica la versión del servidor MongoDB.
- Organización: frontend y backend separados en el mismo repositorio. Esta separación no convierte al sistema en microservicios.
- Backend por capas: rutas y middlewares → controladores → servicios → repositorios → modelos/MongoDB. Es la estructura observable en productos; otros módulos pueden tener variaciones que debes identificar.
- Angular contiene la presentación. No describas todo el proyecto únicamente como «modelo, vista y controlador»: esa expresión deja fuera servicios, repositorios y la comunicación HTTP.
- También existe código para catálogo público, perfiles, solicitudes de apartado, reservas y comprobantes. Supabase Storage se utiliza en el código para archivos privados de comprobantes; MongoDB sigue siendo la base de datos de la aplicación. La configuración efectiva del almacenamiento debe verificarse antes de mostrarlo.
- Restricción importante del código actual: la confirmación de reservas está condicionada a pruebas aisladas, vendedor autorizado y soporte de transacciones. Las escrituras de comprobantes también exigen entorno de pruebas aislado. No presentar estos flujos como habilitados para pagos reales en producción. Las condiciones se detallan en la lección 6.

Mapa para dibujar de memoria:

```text
Persona
  ↓ interacción
Angular: componente + plantilla → servicio HttpClient
  ↓ HTTP/JSON, con Bearer token en operaciones protegidas
Express: ruta → autenticación/rol → controlador
  ↓
Servicio: validaciones y reglas del negocio
  ↓
Repositorio: consultas → modelo Mongoose → MongoDB
  ↑ respuesta, que vuelve hasta la pantalla
```

## Día 1 — Comprender qué construiste y cómo está organizado

Meta: presentar MIO en dos minutos y recorrer una operación de extremo a extremo.

### Bloque 1. Problema, usuarios y alcance — 45 minutos, esencial

Lee `README.md`, `docs/vision.md`, `docs/backlog.md` y `docs/permisos.md`. Contrasta los documentos con las rutas y pantallas actuales: algunos textos describen entregas anteriores.

Escribe con tus palabras:

1. ¿Quién tiene el problema y qué tarea hace hoy?
2. ¿Qué aporta MIO al organizar clientes, piezas únicas y pedidos?
3. ¿Qué pueden hacer cliente, vendedor y administrador?
4. ¿Qué está implementado, qué has probado y qué sigue siendo propuesta?

No presentes MIO como plataforma de transmisión de video ni como lector automático de comentarios. No confundas registrar/revisar un comprobante con procesar una transferencia bancaria. No afirmes validación comercial si aún no tienes sesiones reales documentadas.

### Bloque 2. Arquitectura y responsabilidades — 75 minutos, esencial

Abre en este orden:

1. `backend/server.js`: variables de entorno, conexión y arranque.
2. `backend/src/expressApp.js`: CORS, JSON y montaje de rutas.
3. `backend/src/routes/productoRoutes.js`: métodos, URLs y middlewares.
4. `backend/src/controllers/productoController.js`: entrada HTTP y respuesta.
5. `backend/src/services/productoService.js`: reglas y validaciones.
6. `backend/src/repositories/productoRepository.js`: consultas y filtros.
7. `backend/src/models/productos.js`: esquema e índices.

Para cada archivo responde: «¿Qué recibe? ¿Qué hace? ¿Qué devuelve? ¿Qué responsabilidad pertenece a otra capa?».

Ejemplo defendible: el controlador de creación toma `req.body` y el vendedor autenticado, llama al servicio y responde 201. El servicio valida nombre/precio y normaliza el código. El repositorio persiste mediante el modelo. El índice compuesto expresa unicidad del código por vendedor.

### Bloque 3. Angular y recorrido de creación de producto — 90 minutos, esencial

Lee `frontend/src/main.ts`, `frontend/src/app/app.config.ts`, `frontend/src/app/app.routes.ts`, `frontend/src/app/pages/productos/productos.ts`, su plantilla y `frontend/src/app/services/producto.service.ts`.

Explica componente, plantilla, estilos, inyección de dependencias, `ngOnInit`, enlace de formulario, eventos y `subscribe`. Localiza el método que guarda el formulario y sigue su llamada hasta `POST /api/productos` y MongoDB.

Con una base de desarrollo, observa en Network del navegador una creación: URL, método, cuerpo, cabecera Authorization, estado y respuesta. Después recarga y explica cómo comprobarías que el dato se persistió. No incluyas tokens ni credenciales en capturas.

### Bloque 4. Justificación del stack — 60 minutos

Prepara razones que puedas sostener; si una decisión fue por aprendizaje o familiaridad, dilo. Estas son justificaciones posibles, no evidencia de tus motivos originales:

| Decisión | Razón defendible en MIO | Costo o límite que debes reconocer |
| --- | --- | --- |
| Angular y TypeScript | Componentes, formularios, rutas y servicios para varias pantallas y roles; tipos para detectar errores durante desarrollo | Curva de aprendizaje y estructura; el uso actual de `any` reduce la protección de tipos |
| Node.js y Express | JavaScript para una API HTTP centrada en consultas y operaciones de negocio | Express deja muchas decisiones al proyecto; hay que organizar validación, permisos y errores |
| MongoDB y Mongoose | Documentos para entidades del dominio y esquemas definidos desde la aplicación | Las referencias no equivalen a claves foráneas SQL; integridad entre documentos y concurrencia requieren diseño explícito |
| Frontend y API separados | Responsabilidades y despliegues separados; contrato HTTP reutilizable | Configuración de URL, CORS y coordinación entre cambios de ambos lados |
| Capas y repositorios | Separar HTTP, reglas y persistencia; facilitar pruebas del servicio con repositorios simulados | Más archivos y navegación; la separación debe aportar claridad |

Practica «¿por qué no React, Django o PostgreSQL?». No necesitas desacreditarlos: explica por qué tu elección resulta adecuada para este alcance y en qué escenarios reconsiderarías la decisión. MongoDB no es obligatorio por usar Node o Angular.

### Bloque 5. Recuperación de memoria — 30 minutos

Cierra los archivos. Dibuja el mapa y explica durante cinco minutos cómo se crea un producto. Luego abre el código y corrige lo que omitiste.

Entregable del día: una hoja con problema, roles, stack, mapa de capas y recorrido de una petición. Debes poder ubicar cada archivo sin buscar al azar.

## Día 2 — Dominar reglas, datos, seguridad y código

Meta: explicar por qué el sistema permite o rechaza una operación y dónde se garantiza esa decisión.

### Bloque 1. Datos e integridad — 75 minutos, esencial

Usa `docs/modelo-datos.md` como apoyo y contrástalo con `backend/src/models/`. Estudia primero usuarios, clientes, productos y pedidos; después solicitudes de apartado, comprobantes y sesiones.

Explica:

- Documento, colección, esquema, modelo, `ObjectId` y referencia.
- Diferencia entre una cuenta de usuario y un registro de cliente: identifica sus usos reales antes de explicarla.
- Relaciones entre vendedor, producto, cliente, pedido y live; por qué un pedido puede no tener live.
- Por qué pedidos y solicitudes conservan ciertos nombres/precios históricos además de referencias.
- `required`, `enum`, `min`, `timestamps`, índices únicos y filtros parciales.
- Índice de producto `{ vendedorId, codigo }`: mismo código en tiendas distintas frente a duplicado dentro de una tienda.
- Diferencia entre estado del producto, estado de la solicitud, pago y entrega. No mezcles estos conceptos.

Ejercicio: dibuja dos vendedores y sus productos. Explica qué ocurre si uno intenta consultar o modificar el ID de un producto ajeno. Muestra el filtro por vendedor en el repositorio.

### Bloque 2. Autenticación, autorización y aislamiento — 75 minutos, esencial

Lee `backend/src/controllers/authController.js`, `backend/src/middlewares/authMiddleware.js`, `backend/src/middlewares/roleMiddleware.js`, los modelos de usuario/sesión y, en Angular, `services/auth.service.ts`, `acceso-rol.ts` y `services/auth-session.interceptor.ts`.

Sigue registro → login → almacenamiento del token → petición protegida → validación en servidor → cierre/expiración.

Debes explicar:

1. Contraseña con hash frente a cifrado reversible; localiza bcrypt en el código.
2. JWT firmado: su contenido no queda oculto por estar firmado.
3. El middleware comprueba token, sesión vigente, usuario y estado; el control no depende únicamente del JWT.
4. Autenticación identifica; autorización decide qué se permite; filtros de propiedad limitan qué datos puede tocar cada tienda.
5. El guard de Angular guía la navegación; el backend debe rechazar también las peticiones directas no autorizadas.
6. Diferencia entre 400, 401, 403, 404 y 409 usando ejemplos del código.
7. CORS regula acceso desde navegadores y no sustituye los permisos.
8. El token se guarda actualmente en `localStorage`: reconoce el riesgo ante XSS y la necesidad de evaluar almacenamiento/sesión si se fortalece el diseño.

### Bloque 3. Pedidos, apartados y comprobantes — 90 minutos, esencial

Lee los servicios y repositorios de pedidos y solicitudes; después `expiracionReservasService.js`, `comprobanteService.js` y `comprobanteStorage.js`. Apóyate en `docs/incremento-2b-confirmacion-reservas.md`, `docs/incremento-2c-ciclo-reservas.md` y `docs/incremento-2d-comprobantes.md`.

Traza dos casos distintos: venta directa y solicitud de apartado. Para el segundo, sigue solicitud → confirmación → vencimiento o comprobante → revisión y resultado. Anota los estados y condiciones reales de cada transición; no deduzcas transiciones solo porque el enum las admite.

Responde con código:

- ¿Qué evita que dos solicitudes confirmen la misma pieza?
- ¿Qué operaciones deben confirmarse juntas y dónde hay transacciones o actualizaciones condicionales?
- ¿Qué pasa si una operación falla a mitad del proceso? ¿Y si se reintenta?
- ¿Qué desencadena la expiración: petición, script o tarea programada? Distingue código disponible de programación realmente desplegada.
- ¿Quién puede ver el comprobante? ¿Por qué usar bucket privado y URL firmada temporal?
- ¿Subir una imagen cambia el pago automáticamente o requiere una decisión posterior?

Si no puedes señalar el mecanismo, registra la duda como pendiente. No prometas garantías de concurrencia solo porque el flujo funciona con una persona.

### Bloque 4. Lectura de código y autoexamen — 60 minutos

Sobre funciones reales explica `async/await`, promesas, `try/catch`, destructuración, `map/filter`, `?.`, `||`, `const`, importaciones y exportaciones. En Angular distingue Observable y suscripción de Promise y `await`.

Interpreta filtros de Mongoose como `findOne({ _id, vendedorId })`, opciones `new`/`runValidators` y operadores que encuentres en reservas. Explica el índice en el esquema y la diferencia entre declararlo y verificar que existe en la base.

Entregable del día: diagrama de datos, recorrido de login y tabla de transiciones de una reserva, cada uno con sus archivos de respaldo. Graba respuestas de 60–90 segundos a cinco preguntas difíciles.

## Día 3 — Cambiar código, comprobar y defender

Meta: demostrar comprensión con un cambio acotado y realizar una defensa completa sin depender de un guion leído.

### Bloque 1. Preparar ejecución y evidencia — 45 minutos, esencial

Consulta `README.md`, ambos `package.json`, `docs/PUBLICACION.md` y `docs/COMPROBANTES_STORAGE.md`. Identifica comandos de arranque, puerto, URL de API por entorno, conexión MongoDB y secretos exclusivamente del backend.

Usa desarrollo y datos ficticios. Revisa `git status` antes de practicar; no descartes cambios existentes. No expongas `.env` en la presentación.

Comprueba qué pruebas están disponibles y sus requisitos antes de ejecutarlas. Backend: `npm test`. Frontend: `npm run build`; consulta `npm test -- --help` o la configuración antes de elegir cómo ejecutar sus pruebas sin modo interactivo.

Hay pruebas con repositorios simulados y pruebas de integración MongoDB condicionadas por `MIO_MONGO_PRUEBAS_URI`. Estas últimas requieren su base aislada y pueden omitirse si no está configurada. Lee sus condiciones: algunos tests eliminan su base de pruebas al terminar. No apuntes estas pruebas a datos de la aplicación. Un resultado con casos omitidos no demuestra que esos casos pasaron.

### Bloque 2. Simular un cambio solicitado por la terna — 90 minutos, esencial

Practica en una copia o rama adecuada, preservando el trabajo previo. Elige primero A; añade B si tienes tiempo:

**A. Rechazar nombres de producto de más de 80 caracteres.** Antes de escribir, explica el impacto: formulario, servicio de negocio, esquema y mensajes. Aplica la regla al crear y editar; conserva las validaciones actuales. Comprueba nombre vacío, longitud límite y exceso. Demuestra que el backend rechaza el dato aunque se evite el formulario.

**B. Sustituir `any` por tipos explícitos en una parte de productos.** Define el contrato de lectura y el de creación según la respuesta y los datos reales; ajusta servicio y consumidores. Explica que TypeScript no valida por sí solo el JSON recibido en ejecución.

Método de trabajo: reformular requisito → localizar archivos → explicar enfoque → editar lo mínimo necesario → comprobar casos válidos e inválidos → revisar diff → explicar resultado. No conviertas el ensayo en una refactorización general.

### Bloque 3. Pruebas, fallos y límites — 45 minutos

Estudia `backend/test/producto-codigo.test.js`, `backend/test/auth-permisos.test.js`, `backend/test/pedido-venta-directa.test.js` y el inicio de `backend/test/reservas-mongo.test.js`.

Elige una prueba y explica preparación, acción y comprobación. Distingue prueba de unidad/servicio con dobles, integración con MongoDB, compilación y prueba manual del navegador. Explica qué demuestra cada una y qué deja pendiente.

Prepara tres limitaciones reales y una mejora concreta para cada una. Candidatas a investigar: tipos `any`, paginación/filtrado de productos en cliente, documentación que quedó atrás del código y cobertura no ejecutada de integración. Evita afirmar escalabilidad o seguridad completa sin evidencia.

### Bloque 4. Simulacro de defensa — 90 minutos, esencial

Haz una presentación de 12 minutos, ajustable al tiempo oficial de la terna:

| Tiempo | Contenido |
| --- | --- |
| 0–2 min | Problema, usuarios, valor y alcance |
| 2–4 min | Stack, arquitectura y razones de las decisiones |
| 4–7 min | Demostración de un flujo completo con datos ficticios |
| 7–10 min | Recorrido del código: pantalla, HTTP, capas y persistencia |
| 10–12 min | Seguridad, pruebas, límites y siguiente mejora |

Después dedica 30 minutos a preguntas y 48 a corregir las respuestas y repetir los puntos débiles. No memorices una explicación que contradiga el código.

Preguntas para practicar:

1. ¿Qué problema resuelve y qué evidencia tienes de que existe?
2. ¿Por qué Angular, Node/Express y MongoDB para este alcance?
3. ¿Por qué lo llamas arquitectura por capas? Muéstrame las responsabilidades.
4. Sigue este botón hasta la base de datos y de regreso.
5. ¿Dónde agregarías una regla nueva y por qué ahí?
6. ¿Por qué validas en frontend y backend?
7. ¿Cómo impides acceder a otra tienda cambiando un ID?
8. ¿Qué pasa si el token vence o se cierra sesión?
9. ¿Qué evita dos reservas de la misma pieza?
10. ¿Qué pasa si falla MongoDB o el almacenamiento de archivos?
11. ¿Cómo conservas el precio histórico si el catálogo cambia?
12. ¿Qué prueba respalda lo que acabas de afirmar?
13. ¿Qué diferencia hay entre lo implementado y lo verificado en producción?
14. ¿Qué cambiarías primero si aumenta el volumen de productos y pedidos?
15. Haz un cambio pequeño y demuestra que funciona.

Entregable del día: demo ensayada, cambio pequeño explicado y comprobado, resultados reales de verificación y lista breve de pendientes.

## Cómo responder sin improvisar afirmaciones

Usa esta secuencia: decisión → necesidad del proyecto → mecanismo concreto → evidencia → límite.

Ejemplo: «Separé las reglas de productos del controlador para que la validación no dependa de HTTP. El controlador llama al servicio y el servicio usa el repositorio. Puedo mostrar la validación del precio y su respuesta de error. Esa separación ayuda a probar reglas con repositorios simulados, pero esas pruebas no demuestran la integridad de una base real».

Si desconoces algo: «No lo he verificado todavía. Este archivo contiene el mecanismo; lo comprobaría con este caso». Ubicar y razonar es más defendible que inventar una garantía.

## Criterio de preparación

Puntúa cada habilidad con 0 (no puedo), 1 (con ayuda) o 2 (solo y mostrando código): explicar problema; dibujar arquitectura; seguir creación de producto; justificar stack; explicar datos; explicar permisos; seguir reserva; interpretar una prueba; modificar una regla; reconocer límites.

Meta orientativa: 16/20 y ningún cero en recorrido de petición, permisos o cambio de regla. Repite los temas débiles antes de añadir temas nuevos.

Antes de la defensa: confirma fecha, duración, rúbrica y alcance que evaluará la terna; prepara cuentas ficticias por rol; verifica el entorno que mostrarás; conserva una alternativa local o evidencia visual del flujo si falla la conexión; abre solo archivos y pestañas necesarios. En el plan gratuito descrito en el README, prepara la API antes de comenzar la demostración.

## Manual explicativo para estudiar y generar videos

### Lección 1 — Qué es MIO y cómo describir su arquitectura

**Asociada al día 1.** Pregunta central: ¿cómo se convierte una necesidad del usuario en una operación sobre datos?

MIO es una aplicación web para organizar clientes, piezas únicas y pedidos de tiendas que venden por redes sociales o transmisiones en vivo. La necesidad planteada es concentrar información comercial que puede quedar dispersa durante la venta. La descripción del problema no equivale a demostrar que ya se validó con negocios reales.

Una explicación inicial posible, para adaptar a tu experiencia: «MIO organiza el trabajo de una tienda alrededor de sus clientes, productos y pedidos. La interfaz permite operar esos datos; una API aplica las reglas y los permisos; MongoDB conserva la información. Además hay incrementos de catálogo público, solicitudes de apartado y comprobantes, con restricciones de pruebas que debo distinguir del flujo desplegado».

El frontend es la parte que se ejecuta en el navegador: muestra pantallas, recoge acciones y presenta resultados. El backend atiende solicitudes y decide si se pueden realizar. La base de datos conserva información entre peticiones y reinicios. Una API es la interfaz de comunicación: en este proyecto se expone mediante rutas HTTP y respuestas principalmente JSON.

Hay dos niveles de organización que puedes explicar juntos:

- **Distribución del sistema:** navegador con Angular, API con Node/Express y persistencia en MongoDB.
- **Organización del código backend:** rutas, middlewares, controladores, servicios, repositorios y modelos.

La separación frontend/backend no prueba que haya microservicios. Tampoco es necesario llamar MVC a todo el sistema. La descripción más precisa para esta defensa es «aplicación web con frontend y API separados, y backend organizado por capas».

| Parte | Responsabilidad observada en productos | Pregunta que resuelve |
| --- | --- | --- |
| Componente Angular | Mantiene el estado de la pantalla y atiende acciones | ¿Qué pasa cuando el usuario pulsa Guardar? |
| Plantilla HTML | Presenta datos y enlaza formulario/eventos | ¿Qué ve y utiliza la persona? |
| Servicio Angular | Envía peticiones HTTP a la API | ¿Cómo solicita el navegador crear un producto? |
| Ruta Express | Relaciona método/URL con middlewares y controlador | ¿Qué función atiende `POST /api/productos`? |
| Middleware | Verifica condiciones previas y continúa o responde | ¿Existe una sesión válida y un rol permitido? |
| Controlador | Adapta la petición al servicio y produce respuesta HTTP | ¿Qué entrada se entrega y con qué estado se responde? |
| Servicio backend | Aplica reglas del dominio | ¿Es válido el nombre, precio y código? |
| Repositorio | Expresa operaciones de persistencia | ¿Con qué filtro se consulta o actualiza? |
| Modelo Mongoose | Define esquema y acceso a una colección | ¿Qué campos, validaciones e índices se declaran? |
| MongoDB | Almacena documentos y ejecuta consultas | ¿Qué información persiste realmente? |

Analogía para el video: el formulario es una ventanilla, el controlador recibe la solicitud, el servicio aplica el reglamento y el repositorio gestiona el archivo. Después de la analogía, volver al recorrido real: las piezas son funciones y procesos de software, no empleados independientes.

**Límite de la descripción:** no todos los módulos cumplen idéntico recorrido. `authController.js` consulta modelos directamente; `comprobanteService.js` también contiene acceso directo a modelos. La organización por capas existe, pero su aplicación no es uniforme. No afirmar arquitectura limpia, hexagonal o cumplimiento completo de SOLID sin un análisis adicional.

**Pausa de aprendizaje:** si una nueva regla dice «el precio no puede ser negativo», ¿debería depender solo del formulario? Respuesta: no; el servidor debe comprobarla porque una petición puede enviarse sin usar la pantalla.

### Lección 2 — Crear un producto de extremo a extremo

**Asociada al día 1.** Este es el caso conductor de los videos. Todos los nombres y valores siguientes son ficticios.

Situación: Ana, vendedora autenticada, registra una blusa con código `BL-01` y precio 250. La sesión ya existe; no se enviará la contraseña al crear el producto.

Petición ilustrativa, no captura de una ejecución:

```http
POST /api/productos
Authorization: Bearer <token_de_ejemplo>
Content-Type: application/json
```

```json
{
  "codigo": "bl-01",
  "nombre": "  Blusa azul  ",
  "precio": 250,
  "estado": "activo"
}
```

Recorrido respaldado por los archivos indicados:

1. `Productos.guardarProducto()` en `frontend/src/app/pages/productos/productos.ts` atiende el guardado. Para una creación llama a `this.productoService.crearProducto(this.producto).subscribe(...)`.
2. `ProductoService.crearProducto()` en `frontend/src/app/services/producto.service.ts` usa `HttpClient.post`. Construye la URL desde `environment.apiUrl` y agrega `Authorization` con el token de `AuthService`.
3. `backend/src/expressApp.js` monta las rutas de productos en `/api/productos`. El middleware JSON permite leer el cuerpo como `req.body`.
4. `productoRoutes.js` aplica `protegerRuta`, `validarRol("vendedor")` y el middleware de expiración antes del controlador. Después `router.post("/", crearProducto)` selecciona el manejador.
5. `productoController.js` obtiene el ID de `req.usuario`, llama al servicio con cuerpo e identidad y, si termina bien, responde con estado 201 y el producto.
6. `productoService.js` comprueba nombre no vacío y precio finito mayor o igual a cero; valida estado si se proporcionó. Limpia espacios del nombre y normaliza el código a mayúsculas. Si falta código, genera uno con prefijo `P-` y bytes aleatorios.
7. El servicio arma los campos permitidos y coloca el `vendedorId` recibido del controlador. En esta operación, la identidad de la tienda no se toma de un `vendedorId` enviado en el cuerpo por el navegador.
8. `productoRepository.crearProducto()` llama a `Producto.create(data)`. El modelo define campos, validaciones y el índice de código por vendedor.
9. La respuesta vuelve al navegador. La suscripción tiene ramas de éxito y error; la pantalla actualiza su estado y muestra el resultado.

Resultado esperado del ejemplo: nombre `Blusa azul`, código `BL-01`, precio 250 y propietario obtenido de la sesión. El documento persistido tendrá además campos que genera la base/el modelo, como `_id` y marcas de tiempo. Esto describe lo esperado según el código; no es una evidencia nueva de persistencia.

Fragmento literal de `backend/src/repositories/productoRepository.js`:

```js
const buscarPorIdYVendedor = (id, vendedorId) => {
  return Producto.findOne({
    _id: id,
    vendedorId
  });
};
```

Lectura para narrar: «Busca un producto que cumpla ambas condiciones: tener este identificador y pertenecer al vendedor autenticado». Conocer un ID no basta para obtener un producto ajeno mediante esta consulta. En el servicio, si no se obtiene resultado, se responde como producto no encontrado.

| Variación del ejemplo | Comportamiento expresado en el código |
| --- | --- |
| Nombre vacío o solo espacios | El servicio rechaza con 400 |
| Precio negativo | El servicio rechaza con 400 |
| Precio cero | La regla actual lo admite; no inventar un mínimo mayor |
| Código `bl-01` | Se normaliza a `BL-01` |
| Duplicado de código en la misma tienda | Si MongoDB emite duplicado del índice de código, el servicio lo traduce a 409 |
| Mismo código en otra tienda | La clave compuesta permite diferenciar por vendedor |
| Sin token | El middleware de autenticación responde 401 |
| Cliente autenticado intenta usar esta ruta | El middleware de rol responde 403 |

**Pausa de aprendizaje:** explica por qué el servicio Angular y el servicio backend no son lo mismo. Respuesta: el primero comunica la interfaz con la API; el segundo aplica reglas de negocio en el servidor.

### Lección 3 — Entender cómo está escrito el código

**Asociada a los días 1 y 2.** No memorizar definiciones aisladas: relacionar cada concepto con una función del proyecto.

| Concepto | Explicación para este proyecto |
| --- | --- |
| TypeScript | Añade comprobaciones de tipos al código del frontend durante desarrollo/compilación; no valida por sí solo datos recibidos de la red |
| `any` | Permite omitir comprobaciones de tipos; aparece en productos y es un límite del tipado actual |
| Componente Angular | Clase que coordina una parte de interfaz, con plantilla y estilos asociados |
| Inyección de dependencias | Angular proporciona servicios al componente, por ejemplo `ProductoService`, sin que la pantalla tenga que construirlos manualmente |
| `ngOnInit` | Método del ciclo de vida usado en productos para iniciar cargas de información |
| Observable y `subscribe` | `HttpClient` devuelve un Observable; la suscripción de este caso inicia la petición y atiende resultado o error |
| `async/await` | Permite escribir secuencias asíncronas esperando resultados sin bloquear todo el proceso de Node mientras se espera E/S |
| `try/catch` | Captura errores de las operaciones esperadas dentro del bloque para responder o propagar el fallo |
| Destructuración | `const { nombre, precio } = data` extrae propiedades; no comprueba que sean válidas |
| `?.` | Acceso opcional: evita acceder a la propiedad si el valor anterior es `null` o `undefined` |
| `||` | Usa el valor alternativo si el primero es falsy; no significa solamente «si es null» |
| `map` y `filter` | Transforman elementos o seleccionan elementos de un arreglo; por sí mismos no consultan MongoDB |
| CommonJS | El backend carga/exporta módulos mediante `require` y `module.exports` |

Fragmento literal del servicio de productos:

```js
const precioEsValido = (precio) => {
  if (precio === undefined || precio === null || precio === "") {
    return false;
  }

  const precioNumerico = Number(precio);

  return Number.isFinite(precioNumerico) && precioNumerico >= 0;
};
```

Explicación: primero diferencia ausencia de valor de cero. Después convierte a número y comprueba que sea finito y no negativo. No lo describas como comprobación estricta de tipo numérico original: `Number` convierte algunos valores. Una revisión futura podría decidir qué tipos de entrada debe aceptar explícitamente; esa mejora no está implementada por este documento.

**Ejercicio de predicción:** antes de ejecutar, responde qué devolvería esta función para `0`, `-1`, `"250"`, `""`, `null` y `"hola"`. Respuestas: verdadero, falso, verdadero, falso, falso, falso. Luego explica por qué aceptar `"250"` no equivale a recibir un número JSON.

### Lección 4 — Datos, relaciones e historia comercial

**Asociada al día 2.** MongoDB almacena documentos en colecciones. Mongoose aporta modelos y esquemas en la aplicación. «NoSQL» no significa «sin estructura»: MIO declara campos y reglas.

Mapa simplificado de relaciones, sin afirmar cardinalidades obligatorias donde la referencia es opcional:

```text
User con rol vendedor ← vendedorId de Producto, Cliente, Pedido y Solicitud
User con rol cliente  ← compradorId de Solicitud
Cliente               ← clienteId de Pedido
Producto              ← productoId de Pedido y Solicitud
Live                  ← liveId opcional de Pedido
SolicitudApartado     ← reservaId de Comprobante
SolicitudApartado     → pedidoId cuando la aprobación genera el pedido
```

Una cuenta `User` representa acceso al sistema y un rol. Un documento `Cliente` es un registro comercial perteneciente a un vendedor; su `usuarioId` es opcional. Por tanto, un cliente comercial puede existir sin cuenta vinculada. Al aprobar un comprobante, el código busca o crea un cliente usando vendedor y usuario comprador.

En pedidos hay referencias como `productoId`, pero también `producto` como nombre y `precio`. Son datos separados: la referencia identifica la pieza y los valores guardados permiten conservar información de la operación. En solicitudes se registran `precioRegistrado` y posteriormente `precioConfirmado`; no asumir que ambos siempre coinciden. La aprobación usa el precio confirmado para crear el pedido.

Una referencia Mongoose con `ref` no es una clave foránea que impida automáticamente borrar el documento referenciado. MIO agrega comprobaciones en servicios y repositorios; para afirmar integridad de un flujo completo hay que revisar todas las escrituras y probar los fallos.

El índice de productos se declara así en el modelo:

```js
productoSchema.index(
  { vendedorId: 1, codigo: 1 },
  { unique: true, partialFilterExpression: { codigo: { $type: "string" } } }
);
```

La combinación vendedor/código debe ser única entre documentos incluidos por el filtro. El filtro parcial incluye códigos de tipo string. Declarar el índice en el archivo expresa la intención; la existencia y el funcionamiento efectivo en una base específica requieren comprobación. Una consulta previa de «¿ya existe?» no reemplaza un índice único ante dos creaciones simultáneas.

Separar estados evita confusiones:

| Entidad | Estados declarados relevantes | Qué describe |
| --- | --- | --- |
| Producto | `activo`, `inactivo`, `apartado` | Situación de la pieza en el catálogo/inventario |
| Pedido, pago | `pendiente`, `pagado` | Clasificación del pago del pedido |
| Pedido, entrega | `pendiente`, `entregado` | Clasificación de la entrega |
| Solicitud | `pendiente`, `confirmada`, `rechazada`, `expirada`, `comprobante_en_revision`, `comprobante_rechazado`, `pagada` | Etapa del apartado; el enum no demuestra qué estados quedan persistidos en cada operación |
| Comprobante | `preparando`, `en_revision`, `aprobado`, `rechazado`, `fallido` | Etapa de carga y revisión del archivo |

Importante: el rechazo de una solicitud pendiente usa actualmente `findOneAndDelete`. El servicio devuelve una representación con `estado: 'rechazada'` y `eliminada: true`; no significa que guardó un registro rechazado. La cancelación también elimina en los casos admitidos y devuelve `cancelada`, que no es un estado persistido del enum de solicitud. No describir estos flujos como auditoría completa. `timestamps` tampoco registra por sí solo todo el historial ni quién hizo cada cambio.

**Pausa de aprendizaje:** si una pieza está `apartado`, ¿significa que se entregó? No. La entrega pertenece al pedido; la disponibilidad de la pieza y el estado financiero son conceptos distintos.

### Lección 5 — Login, sesión, roles y propiedad del dato

**Asociada al día 2.** Tres preguntas distintas: ¿quién eres?, ¿qué operaciones te permite tu rol?, ¿sobre qué datos puedes actuar?

En el registro, `authController.js` normaliza nombre/email, valida campos, calcula un hash con bcrypt y crea la cuenta. Admite registro de vendedor o cliente y rechaza crear un administrador desde ese formulario. El hash sirve para comprobar una contraseña sin guardar su texto original; no se «descifra» al iniciar sesión.

En login se busca el usuario, se comprueba que esté activo y se usa `bcrypt.compare`. Si todo es correcto, `generarToken` crea una sesión persistida con vencimiento a 30 minutos y firma un JWT que contiene ID de usuario e ID de sesión (`sid`), con duración de 30 minutos.

En Angular, `AuthService.guardarSesion` almacena token y datos de usuario en `localStorage`. Ese almacenamiento persiste en el navegador; no sustituye la sesión persistida del servidor y presenta exposición ante código malicioso que lograra ejecutarse en la página.

Para una petición protegida, el middleware:

1. Exige `Authorization: Bearer ...`.
2. Verifica el JWT con `JWT_SECRET`.
3. Busca una sesión del usuario con ese `sid` y vencimiento futuro.
4. Consulta el usuario y comprueba que esté activo.
5. Coloca el usuario en `req.usuario` y permite continuar.

El middleware de rol verifica después que `req.usuario.rol` esté permitido. El repositorio limita datos mediante filtros como `_id` y `vendedorId`. Al cerrar sesión, el backend elimina la sesión correspondiente; un JWT firmado que todavía no alcanzó su expiración deja de bastar porque su sesión ya no existe.

Este diseño combina JWT con estado en servidor: no es una autenticación completamente sin estado. Beneficio defendible: permite revocación y consulta del estado actual del usuario. Costo: añade consultas y dependencia de la disponibilidad de la base en cada petición protegida.

| Código HTTP | Ejemplo concreto para estudiar |
| --- | --- |
| 200 | Consulta completada o login correcto |
| 201 | Creación de producto completada |
| 400 | Entrada que incumple una validación, como precio negativo |
| 401 | Falta token o sesión vencida/revocada |
| 403 | Usuario identificado pero rol no permitido, o usuario inactivo según el caso |
| 404 | Producto no encontrado dentro de la consulta del vendedor |
| 409 | Conflicto de código duplicado o pieza no disponible |
| 503 | Operación restringida por política o dependencia necesaria no disponible |
| 500 | Error inesperado tratado como error interno por el controlador |

Precisión útil ante preguntas difíciles: el `catch` general de `authMiddleware.js` convierte sus errores en 401. Por eso un 401 observado en esta implementación no demuestra por sí solo que la persona escribió mal sus credenciales; hay que revisar la causa. Mejorar la clasificación de fallos sería una propuesta, no un comportamiento ya corregido.

**Pausa de aprendizaje:** cambiar el rol guardado en el navegador no debería otorgar permisos backend, porque el servidor consulta el usuario y valida su rol real. Los guards de Angular ayudan a la navegación; no son la autoridad final.

### Lección 6 — Reservas, concurrencia y comprobantes: explicar sin exagerar

**Asociada al día 2.** Dos personas pueden intentar actuar sobre la misma pieza al mismo tiempo. La concurrencia es esa posibilidad de operaciones que se solapan; no se resuelve solo deshabilitando un botón.

Primera distinción: una **solicitud pendiente** expresa interés; una **confirmación** intenta bloquear la pieza. El servicio permite que compradores distintos creen solicitudes pendientes para una misma pieza disponible. La confirmación exige que el producto siga `activo` y no tenga `reservaSolicitudId`.

En `solicitudApartadoRepository.confirmar`, la operación se realiza dentro de `mongoose.connection.transaction`: comprueba solicitud pendiente y ausencia de pedido asociado, actualiza condicionalmente la pieza a `apartado` con su referencia de solicitud y actualiza la solicitud a `confirmada`, con vencimiento y precio confirmado. La transacción agrupa estas escrituras de MongoDB; la condición de actualización evita confirmar una pieza que ya no cumple los requisitos.

**Restricción exacta de confirmación:** `reservasPruebaPolicy.js` exige `NODE_ENV === 'test'`, `RESERVAS_PRUEBA_HABILITADAS === 'true'`, vendedor incluido en `RESERVAS_PRUEBA_VENDEDORES`, conexión a una base cuyo nombre comience con `mio_pruebas_` y topología que el código reconozca con soporte de transacciones. Si no se cumple, la confirmación no se habilita. Estas condiciones describen código; no son instrucciones para cambiar producción a modo test.

Para expiración y escrituras de comprobantes, la comprobación de entorno aislado exige modo test, base con ese prefijo y conexión activa. No confundir esta comprobación con todos los controles adicionales de la confirmación. En una defensa debe quedar claro que estas capacidades están condicionadas, aunque sus pantallas o rutas existan.

Tabla del flujo de solicitudes, resumida desde servicios y repositorios. Las operaciones están sujetas a propiedad, permisos y políticas adicionales:

| Origen | Acción o condición | Resultado relevante |
| --- | --- | --- |
| Sin solicitud | Cliente solicita una pieza disponible | Se crea `pendiente`, tomando vendedor/precio del servidor |
| `pendiente` | Vendedor confirma en entorno autorizado | Solicitud `confirmada`; producto bloqueado; plazo configurado de 3 o 7 días |
| `pendiente` | Vendedor rechaza | Se elimina la solicitud; respuesta la representa como rechazada |
| `pendiente` | Comprador cancela | Se elimina la solicitud |
| `confirmada` sin comprobantes/pago | Comprador cancela en entorno aislado y cumple comprobaciones | Se libera su bloqueo y se elimina la solicitud dentro de transacción |
| `confirmada` | Vence el plazo sin comprobante recibido | El procesamiento de expiración puede marcar `expirada` y liberar la pieza si corresponde |
| `confirmada` o `comprobante_rechazado` | Comprador carga dentro del plazo permitido y se confirma la recepción | Solicitud `comprobante_en_revision`; comprobante `en_revision` |
| `comprobante_en_revision` | Vendedor aprueba comprobante actual | Solicitud `pagada`, comprobante `aprobado`, pedido pagado con entrega pendiente |
| `comprobante_en_revision` | Primer rechazo | Solicitud `comprobante_rechazado`, con un plazo de corrección de 24 horas |
| `comprobante_rechazado` | Reenvío permitido dentro del plazo | Regresa a revisión tras confirmar la carga |
| Segunda revisión rechazada | Se fija plazo de corrección sin tiempo adicional | Después se procesa expiración; no afirmar que todo se resuelve con un simple cambio del enum |

La aprobación crea o vincula un cliente comercial, genera un pedido con el precio confirmado y cambia solicitud/comprobante dentro de una transacción. Repetir una aprobación ya completada tiene una rama que devuelve el comprobante aprobado si la solicitud ya está pagada. Esto es un mecanismo concreto para ese reintento; no demuestra idempotencia universal de toda la API. La idempotencia busca evitar efectos adicionales no deseados al repetir una operación.

La venta directa de `pedidoService.crearPedido` usa otro mecanismo: si hay pieza, intenta apartarla mediante actualización condicional y luego crea el pedido; ante error de creación intenta liberarla. Es una compensación, no la misma transacción de confirmación de solicitudes. Si el proceso se interrumpe entre escrituras, o falla la compensación, esta secuencia por sí sola no garantiza atomicidad entre documentos. Diferenciar estos caminos es una respuesta técnica valiosa.

**Archivos y base no comparten una sola transacción:** el comprobante se almacena en Supabase Storage y sus metadatos/estados en MongoDB. `comprobanteService.js` utiliza estados como `preparando` y `fallido`, y marca limpieza pendiente para gestionar fallos. Una transacción MongoDB no revierte automáticamente una carga remota. El código incluso evita borrar precipitadamente un archivo cuando el resultado de confirmación puede ser incierto.

El acceso a la imagen se comprueba por propiedad de la reserva antes de firmar la URL. `comprobanteStorage.js` verifica bucket privado y genera una URL con duración de 60 segundos. La clave de servicio de Supabase corresponde al backend. Revisar un comprobante es una decisión manual del vendedor; no equivale a una confirmación bancaria automática ni a mover dinero.

La expiración existe como servicio, se invoca desde operaciones de la aplicación y hay un script en el proyecto. La existencia de un script no demuestra que haya un programador de tareas ejecutándolo en producción. El servicio comprueba fechas en servidor; un contador visual del navegador no es la autoridad que libera inventario.

**Visual sugerido para el video:** dos compradores, una pieza y dos intentos de confirmación. Mostrar el filtro «activo y sin reserva» y después el grupo de escrituras transaccionales. Terminar con una tarjeta «restringido a pruebas aisladas en el código revisado».

### Lección 7 — Cómo defender las elecciones tecnológicas

**Asociada a los días 1 y 3.** Las siguientes son respuestas modelo para adaptar. No atribuyen al autor motivos que no haya confirmado.

**¿Por qué Angular?** «MIO tiene varias pantallas, formularios y accesos por rol. Angular me da componentes, rutas, servicios e inyección de dependencias dentro de un mismo marco de trabajo. TypeScript ayuda a definir contratos. El costo es aprender su estructura y mantener tipos útiles; actualmente tengo usos de `any` que puedo mejorar».

**¿Por qué Node.js y Express?** «La API recibe peticiones, aplica reglas y consulta datos. Node permite implementar esa parte en JavaScript y Express organiza las rutas HTTP. Eso facilita trabajar en un ecosistema cercano al frontend, pero no organiza el negocio por mí: por eso hay servicios y repositorios. El trabajo intensivo de CPU requeriría evaluar medidas adicionales; usar Node no hace rápido cualquier algoritmo».

**¿Por qué MongoDB?** «El dominio se representa con documentos de usuarios, productos, clientes y pedidos, y Mongoose permite declarar sus esquemas. La elección es compatible con el alcance, pero no elimina relaciones ni reglas de integridad. Para escrituras relacionadas tengo que revisar transacciones, condiciones e índices. Una base relacional como PostgreSQL también sería una alternativa razonable».

**¿Por qué separar frontend y backend?** «La interfaz atiende interacción y presentación; la API centraliza reglas y acceso a datos. El contrato HTTP permite evolucionar esas partes con cierta independencia. Eso exige coordinar formatos, errores, autenticación, CORS y configuración de entornos».

**¿Por qué capas?** «Separar recepción HTTP, reglas y consultas facilita encontrar un cambio y probar lógica. El costo son más archivos, y debo reconocer módulos donde la separación no se aplica igual. Si piden una regla de producto, puedo mostrar exactamente en qué servicio va y cómo llega hasta él».

No usar como argumentos: «MongoDB porque Angular lo exige», «NoSQL no tiene esquema», «Node siempre es más rápido», «JWT cifra todo», «capas garantiza seguridad» o «es escalable porque está separado». Ninguna de esas afirmaciones está sustentada por este proyecto.

### Lección 8 — Cambiar y depurar con método

**Asociada al día 3.** Caso de práctica propuesto, todavía no implementado por este documento: limitar el nombre del producto a 80 caracteres después de quitar espacios al inicio y final.

Antes de editar, aclara qué significa longitud, si la regla cubre creación y edición y cómo tratar nombres existentes que superen el límite. Para este ejercicio básico, usar longitud de string de JavaScript y reconocer que no equivale siempre al número de caracteres visuales de cualquier idioma.

| Lugar | Cambio que evaluar | Motivo |
| --- | --- | --- |
| Formulario de productos | Ayuda y validación visible coherentes | Evitar que el usuario descubra la regla solo tras enviar |
| `productoService.js` | Validación al crear y actualizar sobre nombre normalizado | Defender la regla aunque se envíe una petición directa |
| Modelo de productos | `maxlength` coherente con el límite | Mantener una validación declarativa adicional en Mongoose |
| Pruebas | Casos de frontera y edición | Comprobar la regla, no solo el camino correcto |
| Contrato HTTP | Error 400 comprensible | Permitir que la pantalla explique qué corregir |

Comprueba longitud 80 y 81, nombre vacío, espacios, edición sin enviar nombre y edición enviando un nombre inválido. La actualización parcial no debería exigir un nombre nuevo si el campo no se está cambiando. No afirmar que la regla cubre cualquier escritura posible sin revisar opciones de validación y vías de persistencia.

Guion para narrar mientras programas: «Primero ubico la acción y el servicio. Defino la regla una sola vez de forma comprensible y la aplico en los caminos de creación y edición. Mantengo la interfaz alineada, compruebo fronteras y reviso el diff para asegurar que no cambié funciones ajenas al requisito».

Si falla una operación, depura por recorrido:

1. ¿Se disparó el evento del formulario?
2. ¿Salió una petición en Network y con qué método/URL?
3. ¿El servidor respondió 400, 401, 403, 409, 503 o hubo fallo de conexión?
4. ¿La petición alcanzó el controlador o la detuvo un middleware?
5. ¿La regla rechazó datos o falló la persistencia/dependencia externa?
6. ¿La interfaz interpretó correctamente el resultado?

Compilar Angular demuestra que la compilación termina; no demuestra por sí solo login, permisos o persistencia. Una prueba con repositorio simulado verifica lógica bajo respuestas controladas; no demuestra que el índice existe en MongoDB. Una prueba de integración requiere su entorno y debe reportar los casos omitidos. La defensa mejora cuando explicas el alcance de la evidencia.

## Banco de defensa con respuestas modelo y repreguntas

Practicar respuestas de 45–90 segundos, seguidas de una demostración breve en código. Adaptar primera persona a lo que realmente hiciste y comprobaste.

| Pregunta de la terna | Núcleo de una buena respuesta | Repregunta para entrenar |
| --- | --- | --- |
| ¿Dónde está la lógica de negocio? | En productos, el servicio valida y aplica reglas; el controlador adapta HTTP y el repositorio consulta. Hay módulos con separación menos uniforme | Muéstrame una regla y una excepción a esa separación |
| ¿Cómo llega el botón a MongoDB? | `guardarProducto` → servicio HTTP → ruta/middlewares → controlador → servicio → repositorio/modelo → respuesta | ¿Dónde se convierte un error en 400 o 409? |
| ¿Por qué validar dos veces? | La interfaz orienta al usuario; el backend protege la operación frente a entradas directas. El esquema/índice aporta controles adicionales | ¿Qué ocurre si desactivo JavaScript o uso otro cliente HTTP? |
| ¿Cómo proteges los datos de cada tienda? | Identidad desde sesión, control de rol y filtros por vendedor; cada mecanismo cubre una pregunta distinta | ¿Basta un token válido para editar cualquier ID? |
| ¿Qué pasa al cerrar sesión? | El backend elimina la sesión; el middleware exige que siga existiendo aun si el JWT aún no venció | ¿Tu diseño es completamente sin estado? |
| ¿Cómo evitas códigos repetidos? | Índice único compuesto vendedor/código y traducción del duplicado a conflicto en el servicio | ¿Lo probaste en la base que vas a mostrar? |
| ¿MongoDB garantiza relaciones? | Las referencias no son claves foráneas automáticas. Reviso reglas, filtros y escrituras relacionadas | ¿Puedes borrar una pieza con pedidos? ¿Dónde se impide? |
| ¿Dos compradores pueden solicitar lo mismo? | Pueden existir solicitudes pendientes de compradores distintos; confirmar exige bloquear la pieza disponible | ¿Solicitud y reserva confirmada son lo mismo? |
| ¿Todo pedido se crea en transacción? | No. Confirmación y aprobación usan transacciones; venta directa usa actualización condicional y compensación | ¿Qué pasa si el proceso cae entre escrituras? |
| ¿Los comprobantes funcionan en producción? | El código revisado restringe sus escrituras a pruebas aisladas; presencia de código no demuestra habilitación real | ¿Qué condiciones faltan por verificar? |
| ¿El sistema sabe que el banco recibió dinero? | No se demuestra integración bancaria; el vendedor revisa un comprobante y aprueba manualmente | ¿Qué evita confundir imagen recibida con pago aprobado? |
| ¿El historial es completo? | No asumirlo: rechazo/cancelación de ciertas solicitudes eliminan documentos y timestamps no guardan todos los eventos | ¿Cómo diseñarías una auditoría futura? |
| ¿Qué mejorarías primero? | Elegir un límite observado, explicar su impacto y proponer un cambio verificable | ¿Cómo sabrás que la mejora resolvió el problema? |

Cuando falte evidencia, responder: «Puedo mostrar el mecanismo en el código, pero no tengo aquí una ejecución que confirme ese caso en producción. Lo verificaría con estos datos y esta comprobación». Esta respuesta distingue comprensión de afirmaciones no demostradas.

## Guiones didácticos sugeridos para tres videos

Son propuestas editoriales de contenido y duración; no afirman opciones ni límites de ninguna plataforma. Si la herramienta permite instrucciones de personalización, utilizarlas allí; de lo contrario, pedir primero un guion con estos criterios.

### Video del día 1 — De la pantalla a la base de datos

Duración editorial orientativa: 10–12 minutos. Basarse en panorama, día 1 y lecciones 1, 2, 3 y 7.

1. Abrir con Ana registrando la blusa y preguntar: «¿Qué sucede después de pulsar Guardar?».
2. Explicar problema, usuarios y alcance en lenguaje sencillo.
3. Dibujar Angular → API → MongoDB; después ampliar las capas de la API.
4. Seguir el ejemplo `BL-01`, destacando función y responsabilidad en cada paso.
5. Mostrar tres cambios de resultado: sin token, precio negativo y creación correcta esperada.
6. Justificar stack con beneficio y costo por tecnología.
7. Cerrar con tres preguntas de recuperación y sus respuestas tras una pausa sugerida.

Visuales: cajas con flechas que se iluminan siguiendo la petición; tabla pequeña de responsabilidades; cuerpo JSON junto a valores normalizados. Mostrar pocos renglones de código por escena y explicar lo que significan. No inventar capturas de la interfaz ni presentar una animación como ejecución real.

### Video del día 2 — Quién puede hacer qué y cómo se protege una pieza

Duración editorial orientativa: 12–15 minutos. Basarse en día 2 y lecciones 4, 5 y 6.

1. Retomar la pieza y presentar a dos compradores.
2. Explicar cuenta de usuario frente a cliente comercial y las relaciones principales.
3. Recorrer login y mostrar tres controles separados: sesión, rol y propiedad.
4. Explicar solicitud frente a confirmación, condiciones y transacción.
5. Recorrer comprobante recibido, revisión y aprobación; separar archivo, metadatos y decisión manual.
6. Contrastar transacción de reservas con compensación de venta directa.
7. Señalar las restricciones de pruebas y cerrar con preguntas sobre permisos y concurrencia.

Visuales: mapa de entidades, línea temporal del token/sesión, dos intentos sobre una pieza, estados de solicitud y tarjeta permanente cuando se explique una capacidad restringida. No mostrar todas las entidades a la vez ni enseñar reservas como pagos reales habilitados.

### Video del día 3 — Explicar, modificar y comprobar ante la terna

Duración editorial orientativa: 10–12 minutos. Basarse en día 3, lección 8 y banco de defensa.

1. Abrir con una petición ficticia de la terna: «Limita el nombre a 80 caracteres».
2. Localizar archivos y razonar el cambio antes de editar.
3. Mostrar las fronteras de validación y creación/edición.
4. Explicar cómo depurar una petición fallida y qué evidencia aporta cada prueba.
5. Representar una pregunta difícil, una respuesta vaga y una respuesta sustentada en código.
6. Practicar una exposición breve y terminar con una autoevaluación.

Visuales: mapa de archivos afectados, tabla 80/81 caracteres, recorrido de depuración y comparación entre afirmación/evidencia. Todo código nuevo de esta lección debe rotularse como propuesta didáctica.

## Prompts listos para pedir material de aprendizaje

Estas son instrucciones de contenido; el resultado depende de las capacidades disponibles en la herramienta. No suponer que cargar este documento concede acceso al repositorio o ejecuta código.

### Prompt 1 — Tutor que primero comprueba mi comprensión

> Actúa como tutor técnico para preparar mi defensa de MIO. Usa esta guía como fuente principal. Comienza con cinco preguntas diagnósticas, una por una, sobre arquitectura, recorrido HTTP, datos, seguridad y cambios. Espera mi respuesta antes de mostrar la solución. Explica mis errores con ejemplos del proyecto e indica lección y archivo de respaldo cuando estén documentados. Introduce los términos desde cero y aumenta la dificultad según mis respuestas. Distingue hechos de código, resultados esperados, propuestas y ejecución verificada. Si algo no está en las fuentes, dilo. No atribuyas motivos personales al autor ni inventes resultados de pruebas.

### Prompt 2 — Resumen para estudiar y recordar

> Crea un resumen de estudio de MIO organizado por los tres días de esta guía. Para cada día incluye objetivo, cinco ideas clave explicadas, un ejemplo concreto, archivos que debo reconocer, tres confusiones frecuentes y cinco preguntas de recuperación con respuestas al final. Conserva las diferencias entre servicio Angular y servicio backend, autenticación/rol/propiedad, solicitud/reserva/pago/entrega, transacción/compensación y código presente/función habilitada/función verificada. Incluye las restricciones de reservas y comprobantes. No reduzcas el contenido a una lista de tecnologías.

### Prompt 3 — Video de aprendizaje de un día

> Prepara un video o, si no puedes generarlo, un guion narrado del DÍA [1, 2 o 3] siguiendo el guion didáctico de esta fuente. Público: estudiante autor del proyecto que necesita comprender y defender su código. Usa español claro, progresión de conceptos y el ejemplo ficticio de la blusa BL-01. Explica cada término al introducirlo. Alterna problema, explicación, recorrido concreto y pregunta de recuperación. Para cada escena propone una visual simple y texto breve. Los fragmentos literales deben conservarse fieles; el código simplificado debe rotularse como pseudocódigo. No inventes pantallas, pruebas aprobadas, decisiones personales ni habilitación de funciones. Cierra con cinco preguntas que yo deba poder responder sin mirar.

### Prompt 4 — Simulacro de terna con repreguntas

> Actúa como una terna exigente de tres perfiles: arquitectura, programación y datos/seguridad. Pregunta una cosa a la vez sobre MIO y espera mi respuesta. Exige que explique el mecanismo y nombre el archivo o función que lo respalda. Repregunta cuando use palabras vagas como seguro, escalable, automático o por capas. Incluye un caso de acceso a otra tienda, dos confirmaciones simultáneas, fallo entre escrituras y cambio de validación. Evalúa cada respuesta de 0 a 2 en precisión, comprensión, evidencia y reconocimiento de límites; explica cómo mejorarla. No me des de inmediato una respuesta memorizable: primero ayúdame a razonar.

### Prompt 5 — Tarjetas y examen con soluciones separadas

> Genera 24 tarjetas de recuperación y un examen de 12 preguntas a partir de esta guía. Reparte arquitectura/stack, Angular/HTTP, lectura de código, datos, seguridad, reservas y pruebas. Usa preguntas de explicación y predicción, no solo definiciones. Incluye errores de interpretación frecuentes. Separa claramente preguntas de respuestas y proporciona en cada solución su lección de respaldo. Al menos cuatro preguntas deben distinguir lo esperado según código de lo ejecutado o desplegado. No uses como hecho una mejora propuesta.

### Prompt 6 — Entrenamiento de cambio de código

> Simula que la terna me pide limitar el nombre de producto a 80 caracteres. No escribas toda la solución al inicio. Pídeme identificar archivos, explicar creación frente a edición y definir casos de frontera. Después revisa mi propuesta, señala rutas olvidadas y pide cómo verificarla. Trata el cambio como ejercicio pendiente, no como implementación existente. Si necesitas un fragmento no incluido en la fuente, pídeme el fragmento relevante y no inventes el contenido del repositorio.

## Control de calidad del material generado

Antes de estudiar con un resumen o video, contrástalo con esta lista:

- ¿Explica capas mediante un recorrido y responsabilidades, en lugar de solo nombrarlas?
- ¿Distingue JavaScript del backend de TypeScript del frontend, y MongoDB de Mongoose?
- ¿Mantiene los estados reales del producto sin inventar `vendido` como estado implementado?
- ¿Explica que JWT firmado no significa contenido cifrado y que aquí hay sesión en servidor?
- ¿Distingue la cuenta de usuario del cliente comercial?
- ¿Diferencia venta directa con compensación de confirmación/aprobación con transacciones?
- ¿Reconoce que algunas solicitudes se eliminan y no inventa historial completo?
- ¿Menciona las restricciones de pruebas aisladas para reservas/comprobantes?
- ¿Separa revisión manual de comprobantes de integración bancaria?
- ¿Presenta el límite de 80 caracteres como ejercicio, no como regla existente?
- ¿Evita afirmar que pruebas pasaron o producción funciona sin evidencia suministrada?
- ¿Incluye preguntas que obligan a explicar y localizar código?

Si una respuesta contradice estos puntos, volver a la fuente y solicitar la corrección antes de memorizarla.

## Referencias del repositorio y alcance de esta guía

Las referencias siguientes se inspeccionaron para construir o ampliar esta guía. Sus rutas son relativas a la raíz de MIO. Si se necesita un análisis adicional en NotebookLM, aportar el contenido relevante como fuente; no basta con mencionar su ubicación. No cargar secretos, tokens, credenciales ni datos personales reales.

| Tema | Fuentes de código/documentación |
| --- | --- |
| Problema, versiones declaradas y ejecución | `README.md`, `backend/package.json`, `frontend/package.json` |
| Arranque y API | `backend/server.js`, `backend/src/expressApp.js`, `backend/src/routes/productoRoutes.js` |
| Caso de productos | `backend/src/controllers/productoController.js`, `backend/src/services/productoService.js`, `backend/src/repositories/productoRepository.js`, `backend/src/models/productos.js` |
| Pantalla y comunicación | `frontend/src/app/pages/productos/productos.ts`, `frontend/src/app/services/producto.service.ts`, `frontend/src/app/app.routes.ts` |
| Autenticación y roles | `backend/src/controllers/authController.js`, `backend/src/middlewares/authMiddleware.js`, `backend/src/middlewares/roleMiddleware.js`, `frontend/src/app/services/auth.service.ts` |
| Datos comerciales | `backend/src/models/clientes.js`, `backend/src/models/pedidos.js`, `backend/src/models/solicitudApartado.js`, `backend/src/models/comprobante.js` |
| Venta directa | `backend/src/services/pedidoService.js`, `backend/src/repositories/pedidoRepository.js` |
| Solicitudes y restricciones | `backend/src/services/solicitudApartadoService.js`, `backend/src/repositories/solicitudApartadoRepository.js`, `backend/src/services/reservasPruebaPolicy.js` |
| Expiración y comprobantes | `backend/src/services/expiracionReservasService.js`, `backend/src/services/comprobanteService.js`, `backend/src/services/comprobanteStorage.js` |
| Ejemplo de integración condicionada | `backend/test/reservas-mongo.test.js` |

La guía refleja una revisión estática al 18 de noviembre de 2026. Las versiones citadas proceden de los manifiestos; no son una comprobación del runtime desplegado. Ante cambios posteriores del proyecto, actualizar los recorridos y restricciones antes de regenerar material. Si un documento histórico contradice el código revisado, señalar la diferencia y verificar la versión evaluada por la terna.
