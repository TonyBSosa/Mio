# MIO por dentro: guion narrado para aprender y defender el proyecto

Fecha de referencia: 18 de noviembre de 2026. Fuente: revisión del código del checkout actual y de sus documentos. Este es un documento independiente del plan de estudio: contiene la explicación que se puede narrar, no solamente instrucciones de qué estudiar.

## Cómo seguir esta serie

La voz del guion es la de un estudiante que presenta su proyecto ante una terna y, al mismo tiempo, enseña a recorrerlo como en un tutorial. Los párrafos entre comillas son narración lista para leer o adaptar. Las indicaciones entre corchetes son acciones del presentador o pausas del estudiante, y no hace falta leerlas en voz alta.

Cuando digo «abre» o «busca», utilizo el explorador del editor y su búsqueda dentro del archivo. Todas las rutas parten de la carpeta raíz `MIO`. No dependemos de números de línea: pueden cambiar. En su lugar localizamos nombres de funciones y expresiones concretas.

Usaré un ejemplo ficticio: Ana es vendedora, registra una blusa `BL-01` de 250 lempiras, y dos compradores pueden interesarse por ella. No son datos reales ni resultados de una ejecución. Las respuestas esperadas se explican a partir del código. Esta preparación no ejecutó pruebas ni verificó el despliegue.

La primera persona es un recurso narrativo: antes de defender, adapta cualquier frase a lo que realmente hiciste, aprendiste y comprobaste. No afirmes que elegiste una tecnología por una razón que no fue la tuya. Los motivos sugeridos son argumentos posibles, no una historia personal demostrada.

La serie se divide en diez episodios. No conviene comprimir todo en diez minutos: perderíamos la relación entre archivos, reglas y comportamiento. Cada episodio puede convertirse en un video breve; la duración final depende del ritmo y del detalle añadido. Dedica aproximadamente 15–25 minutos de estudio por episodio contando navegación, pausas y ejercicios. Los textos no pretenden ocupar por sí solos diez minutos exactos de narración.

| Día de estudio | Episodios | Resultado buscado |
| --- | --- | --- |
| Día 1 | 1, 2, 3 y 4 | Entender estructura, arranque y recorrido completo de un producto |
| Día 2 | 5, 6, 7 y 8 | Explicar datos, sesiones, permisos, pedidos, reservas y comprobantes |
| Día 3 | 9 y 10, y repetición de los anteriores sin leer | Modificar una regla, comprobar y presentar una defensa completa |

Para NotebookLM: conserva el orden de cada episodio. No elimines los pasos de navegación ni las pausas. No conviertas la serie en una descripción genérica de Angular o MongoDB. Si falta el contenido de un archivo, no lo inventes. Distingue implementación, habilitación por configuración y evidencia de funcionamiento. Las capacidades restringidas a pruebas deben conservar esa aclaración en cualquier resumen o video.

## Episodio 1 — Presento el proyecto y aprendo a orientarme

### 1. Empiezo por el problema

[Abre la carpeta raíz `MIO`. Mantén el explorador visible. Abre `README.md`.]

«Voy a presentar MIO, una aplicación web para organizar clientes, piezas únicas y pedidos de tiendas que venden por redes sociales o transmisiones en vivo. El problema planteado es que la información de una venta puede quedar dispersa: quién pidió una pieza, a quién pertenece el pedido y si está pagado o entregado.

Mi sistema busca organizar ese trabajo. MIO no transmite el video de un live ni demuestra una lectura automática de comentarios. Registrar un comprobante tampoco equivale a conectarse con un banco. Delimitar el alcance me permite explicar exactamente qué hace el proyecto y qué no he implementado o verificado».

### 2. Reconozco las carpetas principales

[Regresa al explorador de la raíz. Identifica `backend`, `frontend`, `docs` y `scripts`.]

«La carpeta `backend` contiene la API y el acceso a la base de datos. La carpeta `frontend` contiene la aplicación Angular que utiliza la persona en el navegador. `docs` contiene documentación académica, funcional y técnica. La carpeta `scripts` de la raíz es distinta de `backend/src/scripts`: la ubicación importa; no voy a asumir que cualquier script arranca la aplicación.

Hay frontend y backend separados, pero dentro del mismo repositorio. No son automáticamente microservicios. Voy a describirlo como una aplicación con interfaz y API separadas y un backend organizado por capas».

[Abre `backend/package.json`. Después abre `frontend/package.json`.]

«Estos archivos describen dependencias y comandos. En el backend encuentro Express, Mongoose, bcrypt y JWT, además de herramientas para correo y archivos. En el frontend encuentro Angular y RxJS; TypeScript aparece como herramienta de desarrollo. Node.js es el entorno de ejecución del backend; Express es el framework HTTP. MongoDB es la base de datos; Mongoose es la biblioteca que uso desde Node para trabajar con esquemas y modelos.

Los manifiestos declaran Angular 21, Express 5 y Mongoose 9. Eso no significa que el servidor de MongoDB tenga versión 9. Si me preguntan la versión exacta desplegada, debo comprobar ese entorno».

### 3. Dibujo mi mapa mental

[Cierra los manifiestos. Explica el siguiente recorrido sin abrir todavía sus archivos.]

«Una persona interactúa con un componente Angular. La pantalla llama a un servicio HTTP. El navegador envía una petición a Express. Allí una ruta y sus middlewares seleccionan y autorizan la operación. Un controlador recibe la entrada y construye la respuesta; un servicio aplica reglas; un repositorio expresa consultas; un modelo Mongoose conecta esas operaciones con MongoDB.

Este mapa lo usaré para estudiar productos. No voy a afirmar que todos los módulos lo siguen exactamente: en autenticación y comprobantes hay acceso directo a modelos. El código tiene una organización por capas, con diferencias entre módulos».

### 4. Digo dónde buscaría un cambio

«Si cambia un texto o campo visible, empiezo por la pantalla de Angular. Si cambia una regla comercial, busco el servicio backend. Si cambia un filtro de consulta, reviso el repositorio. Si cambia la forma del documento o un índice, reviso el modelo. Un requisito puede afectar varias partes; la responsabilidad me dice por dónde comenzar».

[Pausa. Sin leer: explica la diferencia entre Node/Express, MongoDB/Mongoose y frontend/backend.]

**Comprobación:** puedes ubicar las dos aplicaciones y describir qué responsabilidad tiene cada una. Si solo recuerdas nombres de tecnologías, repite el recorrido de una acción.

## Episodio 2 — Arranco el backend y entiendo cómo aparece una URL

### 1. Localizo el punto de entrada

[Desde la raíz, entra a `backend`. Abre `package.json`. Busca `scripts` y luego `start`. Abre `server.js`, en esa misma carpeta.]

«El comando `npm start`, ejecutado dentro del backend, utiliza `node server.js`. Para desarrollo, `npm run dev` utiliza nodemon, que facilita reiniciar ante cambios. No tengo que adivinar el archivo inicial: el manifiesto me lo indica.

En `server.js`, la primera parte carga variables de entorno con dotenv. Después importa la aplicación Express y la función de conexión a MongoDB. El puerto se toma de `PORT` o utiliza 3000. Antes de arrancar, el código exige `MONGO_URI` y `JWT_SECRET`.

Una variable de entorno permite configurar el programa sin incrustar sus valores en el código. La dirección de MongoDB y el secreto de firma son configuraciones del backend. No voy a poner sus valores en Angular ni mostrarlos durante la defensa».

### 2. Entiendo cuándo comienza a escuchar

[En `server.js`, busca `connectDatabase().then`. Entra a `src`, luego `config`, y abre `db.js`.]

«El servidor conecta primero la base y después llama a `listen`. En `db.js`, `mongoose.connect` recibe `process.env.MONGO_URI`. Si la conexión falla, se registra el error y el proceso termina. Eso explica por qué un problema de conexión puede impedir que la API llegue a escuchar.

Aquí cambiaría la implementación de conexión si necesitara ajustar ese comportamiento. Si solo necesito cambiar la base de desarrollo, revisaría la configuración del entorno, sin editar una credencial dentro del código».

### 3. Diferencio arranque de aplicación HTTP

[Regresa a `backend/src`. Abre `expressApp.js`.]

«Este archivo crea y configura la aplicación Express. El arranque está separado en `server.js`. Eso también permite que una prueba importe la aplicación HTTP sin ejecutar necesariamente el mismo procedimiento de arranque de producción.

Veo configuración de proxy, CORS y lectura de JSON. CORS controla qué orígenes del navegador se permiten según esta configuración; no reemplaza autenticación. `expressFramework.json()` permite interpretar cuerpos JSON para que los manejadores lean `req.body`.

La ruta `/` responde un mensaje de funcionamiento. Ver ese mensaje es una comprobación limitada: no prueba todos los permisos, pantallas ni operaciones comerciales».

### 4. Construyo una URL completa

[Busca `expressApp.use("/api/productos"`. Abre `backend/src/routes/productoRoutes.js`. Busca `router.post`.]

«En `expressApp.js`, las rutas de productos se montan en `/api/productos`. Dentro del router, `router.post("/", crearProducto)` añade el camino `/` y el método POST. La combinación atiende `POST /api/productos`.

Aquí también hay GET para listar o consultar un ID, PUT para actualizar, PATCH para cambiar estado y DELETE para eliminar. No basta conocer la URL: el método forma parte de la operación.

Si agrego una nueva operación del recurso productos, reviso este router. Si agrego un módulo nuevo con su propio router, también debo montarlo en `expressApp.js`. Cambiar una ruta puede exigir actualizar el servicio Angular que la utiliza».

[Pausa. Pregunta de terna: «¿En qué momento se conecta MongoDB y de dónde sale `/api/productos`?»]

**Respuesta que debes producir:** conexión en el arranque antes de `listen`; prefijo en `expressApp.js` y camino/método en el router.

## Episodio 3 — Recorro Angular desde el inicio hasta el botón Guardar

### 1. Arranco la interfaz

[Desde la raíz abre `frontend/src/main.ts`. Después abre `frontend/src/app/app.config.ts`.]

«En `main.ts`, Angular inicia la aplicación mediante `bootstrapApplication`, usando el componente `App` y `appConfig`. En la configuración encuentro el router, el cliente HTTP y el interceptor de sesión.

Esto me permite separar tres preguntas: qué componente inicia la aplicación, qué servicios generales se proporcionan y qué componente corresponde a cada dirección».

[Abre `frontend/src/app/app.routes.ts`. Busca `path: 'productos'`.]

«La ruta de productos apunta al componente `Productos`, utiliza el guard `accesoRol` y declara el rol vendedor. Esta es una ruta de navegación del navegador, distinta de la URL HTTP de la API. La pantalla puede estar en `/productos` mientras consulta `/api/productos` en el backend.

Si agregara una página navegable, revisaría este archivo además de crear el componente. Una función interna o un modal no siempre necesitan una ruta propia».

### 2. Distingo el marco general de cada página

[Abre `frontend/src/app/app.ts` y localiza `RouterOutlet`. Mira también `app.html` y `app.css`.]

«El componente raíz coordina el marco de la aplicación y su navegación. En el TypeScript aparecen señales y valores calculados para estado como la ruta actual y el tipo de espacio de trabajo. El `RouterOutlet`, utilizado desde la plantilla, es el lugar donde se renderiza la página seleccionada por el router.

Si quiero modificar el marco general, reviso estos archivos. Si solo cambio la tabla de productos, no necesito empezar reescribiendo el componente raíz. Los estilos globales están en `frontend/src/styles.css`; cada pantalla puede tener además sus estilos locales».

### 3. Abro la pantalla de productos

[Entra a `frontend/src/app/pages/productos`. Identifica `productos.ts`, `productos.html` y `productos.css`. Abre `productos.ts`.]

«Estos tres archivos trabajan juntos: TypeScript contiene estado y comportamiento, HTML define la estructura visible y CSS define presentación. En el decorador `@Component` veo cómo se enlazan plantilla y estilos y qué dependencias de plantilla se importan.

La clase guarda arreglos de productos, filtros, datos del formulario y banderas como `editando` y `cargando`. Angular inyecta servicios para que la pantalla pueda utilizarlos. La pantalla no necesita construir manualmente el cliente HTTP ni conocer la contraseña de MongoDB».

[Busca `ngOnInit`, `listarProductos` y `guardarProducto`.]

«Al inicializarse, esta pantalla carga productos y pedidos vinculados. `listarProductos` utiliza una suscripción con un camino de éxito y otro de error. Cuando hay éxito se actualiza el arreglo; después se recalculan categorías y filtros.

`guardarProducto` primero limpia mensajes y hace comprobaciones locales. Si está editando llama a `actualizarProducto`; si está creando llama a `crearProducto`. El éxito actualiza el estado de la pantalla y cierra el formulario. El error conserva un mensaje para explicar el fallo.

En este archivo también se llama a `detectChanges`. Explicaré su presencia como una petición explícita de detección de cambios en esta implementación; no afirmaré que todo componente Angular la necesita».

### 4. Conecto el formulario con su función

[Abre `productos.html`. Busca `guardarProducto`, `ngModel` y `alternarFormulario`.]

«Ahora verifico dónde la plantilla usa los datos y métodos de la clase. Un enlace de formulario conecta un campo con una propiedad. Un evento conecta la acción del usuario con un método. No son llamadas a MongoDB: siguen siendo interacción en el navegador.

Aquí cambiaría etiquetas y estructura del formulario. En `productos.ts` cambiaría cómo reaccionan los filtros o el guardado. En `productos.css` cambiaría la presentación de esta página. En `shared/ui` hay piezas reutilizables como modal, paginación y cabecera; si cambio una de ellas, reviso las otras pantallas que la utilizan».

[Pausa. Localiza el método de guardado sin buscar una línea concreta. Explica sus dos ramas.]

**Comprobación:** puedes señalar la diferencia entre ruta de pantalla, componente y servicio HTTP.

## Episodio 4 — Sigo una creación de producto hasta MongoDB y de regreso

### 1. Salgo del navegador hacia la API

[Desde `frontend/src/app/pages/productos/productos.ts`, localiza la llamada a `crearProducto`. Abre `frontend/src/app/services/producto.service.ts`.]

«Ana quiere crear la blusa `BL-01` de 250 lempiras. El componente llama a `ProductoService.crearProducto`. En este servicio encuentro `HttpClient.post`, la URL basada en `environment.apiUrl` y las cabeceras con el token.

El servicio Angular comunica la pantalla con la API. No lo confundo con `productoService.js` del backend, que aplica reglas comerciales. Comparten parte del nombre porque trabajan con productos, pero viven en lugares distintos y tienen responsabilidades diferentes.

`HttpClient` devuelve un Observable. En este caso la suscripción inicia la petición y atiende la respuesta. No digo que sea lo mismo que una Promise: son abstracciones distintas, aunque ambas pueden usarse para trabajo asíncrono».

### 2. Cruzo los controles de entrada

[Abre `backend/src/routes/productoRoutes.js`. Localiza los tres `router.use` anteriores a las operaciones.]

«Antes del controlador, el router exige autenticación y rol vendedor. También aplica el middleware de expiración de reservas. El orden importa: si un middleware responde con error, no se continúa normalmente hasta crear el producto.

Estos controles no están garantizados por esconder un botón en Angular. Una petición puede enviarse desde otra herramienta, así que el backend comprueba por sí mismo».

### 3. Identifico la adaptación HTTP

[Abre `backend/src/controllers/productoController.js`. Busca `crearProducto`, `obtenerVendedorId` y `responderError`.]

«El controlador recibe `req` y `res`. Entrega `req.body` al servicio junto al ID del vendedor obtenido de `req.usuario`. Si hay éxito, responde 201 con JSON. Si hay error, utiliza una función auxiliar para construir la respuesta.

Una decisión relevante está aquí y en el servicio: la propiedad del producto se establece desde la identidad autenticada, no desde una tienda arbitraria elegida en el cuerpo de la petición.

Si cambio cómo se traduce el resultado a HTTP, reviso el controlador. Si cambio qué nombre o precio es válido, voy al servicio».

### 4. Leo la regla del negocio

[Abre `backend/src/services/productoService.js`. Busca `crearProducto`, `precioEsValido`, `normalizarCodigo` y `guardarConCodigo`.]

«El servicio limpia el nombre y rechaza un nombre vacío. Comprueba que el precio pueda convertirse en un número finito mayor o igual a cero. Por tanto, cero se admite en la regla actual.

El código se limpia y se pasa a mayúsculas. Si falta, se genera un código con prefijo `P-`. Si la base devuelve un duplicado asociado al código, `guardarConCodigo` lo traduce a conflicto 409.

En la función de creación se arma un objeto con campos seleccionados. No se guarda sin revisión todo el cuerpo enviado por el navegador. Si la petición incluyera un `vendedorId` ajeno, esta función coloca el `vendedorId` recibido del controlador.

Las validaciones que veo son las que defenderé. No voy a afirmar validación estricta del tipo original del precio porque la función utiliza `Number`, que convierte algunos valores».

### 5. Llego a la persistencia y regreso a la pantalla

[Abre `backend/src/repositories/productoRepository.js`. Busca `crearProducto` y `buscarPorIdYVendedor`. Después abre `backend/src/models/productos.js`.]

«El repositorio llama a `Producto.create(data)`. Para buscar una pieza propia utiliza ID y vendedor en el filtro. Aquí cambiaría una consulta; en el modelo revisaría la definición de los campos y sus índices.

El modelo define nombre, precio, estado y otras propiedades. Declara marcas de tiempo y la colección `productos`. Declara también un índice compuesto para código por vendedor. La existencia efectiva de ese índice en una base concreta debe comprobarse.

Si la operación termina, el resultado vuelve por servicio y controlador a Angular. La suscripción inserta el producto recibido en el arreglo de la pantalla. Verlo ahí no basta para demostrar persistencia: para comprobarla puedo volver a consultar tras recargar, usando una base de desarrollo».

[Pausa. Recorre los siete archivos sin leer el guion. Repite el caso con precio negativo.]

**Comprobación:** puedes decir dónde falla ese precio y cómo llega el error al usuario.

## Episodio 5 — Explico el modelo de datos y por qué hay referencias y estados separados

### 1. Entro a los modelos

[Desde la raíz entra a `backend/src/models`. Identifica `users.js`, `clientes.js`, `productos.js`, `pedidos.js`, `lives.js`, `perfilVendedor.js`, `solicitudApartado.js`, `comprobante.js`, `sesion.js` y `recuperacion.js`.]

«Esta carpeta contiene modelos de persistencia. Un documento es un registro; una colección agrupa documentos; un esquema Mongoose describe campos y reglas desde la aplicación. MongoDB y Mongoose son piezas distintas.

Reconozco cuentas y perfiles, datos comerciales, solicitudes y archivos, y documentos que soportan sesión y recuperación. No voy a contar colecciones basándome en una documentación de una entrega anterior: el proyecto ha crecido».

### 2. Separo usuario de cliente comercial

[Abre `clientes.js`. Busca `vendedorId` y `usuarioId`. Después abre `users.js`.]

«Una cuenta de usuario permite entrar y tiene un rol. Un cliente comercial es un registro de una tienda. En `clientes.js`, `vendedorId` es obligatorio y `usuarioId` es opcional. Eso permite tener un cliente comercial sin una cuenta vinculada.

Cuando posteriormente revisemos aprobación de comprobantes, veremos que el sistema busca o crea un cliente comercial para la combinación de vendedor y comprador. Esa vinculación no convierte todas las cuentas en un único directorio comercial compartido por todas las tiendas».

### 3. Leo el pedido como una operación histórica

[Abre `pedidos.js`. Localiza `clienteId`, `liveId`, `productoId`, `producto`, `precio`, `estadoPago` y `estadoEntrega`.]

«Un pedido apunta a un cliente y pertenece a un vendedor. Puede tener referencia a live y a producto. En el esquema, `liveId` no es obligatorio, coherente con ventas directas. Hay además nombre del producto y precio guardados en el pedido.

La referencia identifica una entidad; los valores de la operación ayudan a conservar su información histórica. No quiero que cambiar hoy el nombre del catálogo reescriba automáticamente lo que se registró antes.

`estadoPago` puede ser pendiente o pagado. `estadoEntrega` puede ser pendiente o entregado. Son conceptos distintos: puedo tener un pedido pagado con entrega pendiente. Tampoco voy a llamar booleano a un enum de strings».

### 4. Explico índices y límites de integridad

[Regresa a `productos.js`. Busca `productoSchema.index`. Después busca `ref` en los modelos.]

«El índice de productos combina vendedor y código. El código `BL-01` puede repetirse en tiendas diferentes, pero se pretende impedir el duplicado dentro de la misma tienda. La unicidad es de la combinación. El filtro parcial incluye documentos cuyo código sea string.

Una comprobación previa de existencia no sustituye el índice cuando dos peticiones llegan simultáneamente. Además, escribir el índice en el modelo no es evidencia de que la base desplegada ya lo tenga.

Un `ObjectId` con `ref` expresa una relación para Mongoose, pero no es una clave foránea SQL que impida por sí sola cualquier borrado. Por eso tengo que revisar validaciones y restricciones de cada operación».

### 5. No prometo un historial que el código no conserva

[Abre `solicitudApartado.js`. Después abre `backend/src/repositories/solicitudApartadoRepository.js` y busca `rechazar`.]

«El enum de solicitud incluye estados, pero no demuestra por sí solo cómo se persiste cada transición. Actualmente rechazar una solicitud pendiente utiliza `findOneAndDelete`. El servicio devuelve una representación rechazada con `eliminada: true`, pero no deja por eso un documento rechazado guardado.

Si me preguntan por auditoría completa, tengo que reconocer este límite. `createdAt` y `updatedAt` tampoco conservan por sí solos todos los eventos ni sus responsables. Agregar un historial sería una mejora que requeriría diseñar sus reglas».

[Pausa. Explica por qué producto apartado, solicitud pagada y pedido entregado no son estados intercambiables.]

**Comprobación:** puedes dibujar usuario, cliente, producto, pedido, live y solicitud, y explicar qué referencias son opcionales.

## Episodio 6 — Defiendo login, sesión y aislamiento entre tiendas

### 1. Encuentro las rutas de autenticación

[Abre `backend/src/routes/authRoutes.js`. Busca `login`, `register`, `logout` y `limite`.]

«La autenticación tiene rutas propias. Veo un limitador de intentos aplicado a login, registro y recuperación. Esto es una medida concreta para esas rutas, no una garantía de seguridad total.

Para seguir el inicio de sesión, abro el controlador importado. Aquí hay una diferencia respecto a productos: la autenticación consulta modelos desde el controlador. No voy a inventar un servicio y repositorio de autenticación que no siguen ese recorrido».

### 2. Sigo el registro y la comprobación de contraseña

[Abre `backend/src/controllers/authController.js`. Busca `registrar`, `bcrypt.hash`, `login` y `bcrypt.compare`.]

«En el registro se limpian nombre y email, se valida la contraseña y se calcula un hash. El hash no es un cifrado que yo descifre después. En login, bcrypt compara la contraseña recibida con el hash almacenado.

El registro público permite vendedor o cliente y rechaza crear admin desde ese formulario. La administración tiene otro procedimiento; la carpeta `backend/src/scripts` contiene `createAdmin.js`. Si necesitara revisar cómo se crea una cuenta administrativa, empezaría allí, sin usar credenciales reales en la demostración».

### 3. Entiendo por qué uso JWT y sesión persistida

[En `authController.js`, busca `generarToken`. Después abre `backend/src/middlewares/authMiddleware.js`.]

«`generarToken` crea un documento de sesión con vencimiento a treinta minutos y firma un JWT con ID de usuario y de sesión. El token también tiene duración de treinta minutos. JWT firmado no significa que el contenido esté cifrado.

El middleware exige Bearer, verifica la firma y busca una sesión de ese usuario con fecha futura. Después consulta el usuario y comprueba que esté activo. Solo entonces deja continuar y coloca la identidad en `req.usuario`.

Mi diseño no es completamente sin estado: depende de una sesión persistida. Eso permite revocarla, pero añade consultas y dependencia de la base. Al cerrar sesión, `logout` elimina ese documento. Aunque el JWT todavía no haya vencido, la sesión ya no satisface la consulta».

### 4. Separo los tres controles

[Abre `backend/src/middlewares/roleMiddleware.js`. Después abre `backend/src/repositories/productoRepository.js`.]

«Primero autenticación: quién es la persona. Después autorización por rol: si puede realizar esa clase de operación. Después propiedad: sobre cuáles datos puede operar.

Un vendedor autenticado no debería editar cualquier producto por conocer su ID. En el repositorio veo el filtro por ID y vendedor. Si solo miro el middleware de rol, todavía no he explicado el aislamiento entre tiendas».

### 5. Comparo con el navegador

[Abre `frontend/src/app/services/auth.service.ts`. Busca `guardarSesion`. Abre `frontend/src/app/acceso-rol.ts`. Finalmente abre `services/auth-session.interceptor.ts`.]

«El servicio frontend guarda token y usuario en `localStorage`. Eso facilita recuperar la sesión en el navegador, pero expone el token si se ejecuta código malicioso en la página; no lo presentaré como almacenamiento sin riesgos.

El guard consulta autenticación y rol para permitir navegación. Alterar una copia del rol en el navegador no debe cambiar los permisos reales, porque el servidor consulta el usuario.

El interceptor observa errores HTTP. En los casos que reconoce como sesión vencida llama a `manejarSesionExpirada`. Este interceptor no es quien agrega automáticamente el token a todas las peticiones: en el servicio de productos ya vimos la construcción de cabeceras. Si revisara un fallo de recuperación, compararía las URLs reales con las excepciones que tiene el interceptor; no asumiría que coinciden solo por su nombre».

[Pausa. Responde: «¿Por qué no basta ocultar un botón? ¿Qué invalida el token después del logout?»]

**Comprobación:** puedes mostrar un archivo para cada control: autenticación, rol y propiedad.

## Episodio 7 — Comparo venta directa, solicitudes y confirmación de reservas

### 1. Abro el flujo de pedidos

[Entra a `backend/src/services`. Abre `pedidoService.js`. Busca `crearPedido` y `validarClienteYLive`.]

«Un pedido requiere cliente. El servicio valida que el cliente pertenezca al vendedor. Si se envía un live, comprueba también propiedad y, para crear en ese contexto, que esté activo. Si no se envía live, puede continuar como venta directa.

Si se referencia una pieza del catálogo, se comprueba el ID, la disponibilidad y que no tenga una reserva asociada. Para una pieza única se exige cantidad uno cuando se proporciona cantidad. El nombre se toma de la pieza; el precio de esta creación se valida desde la entrada de la operación. No debo decir que siempre se copia automáticamente el precio del catálogo en todos los caminos».

### 2. Identifico la compensación

[Abre `backend/src/repositories/pedidoRepository.js`. Busca `apartarProductoPorIdYVendedor`. Regresa al `try/catch` de creación en el servicio.]

«La pieza se aparta con una actualización condicional: debe pertenecer al vendedor, estar activa y no tener reserva de solicitud. Después se intenta crear el pedido. Si falla, el servicio intenta liberar la pieza.

Esto es una compensación. No es una transacción conjunta entre la actualización y la creación del pedido. Si el proceso se interrumpe entre escrituras o falla la liberación, esta secuencia por sí sola no garantiza atomicidad entre documentos. Mi explicación debe reconocerlo en vez de afirmar que todos los pedidos son transaccionales.

En este repositorio hay ramas según el estado de conexión que devuelven objetos sin realizar la actualización. Por eso leer o probar una función sin base real no demuestra que la pieza quedó bloqueada en MongoDB».

### 3. Distingo interés de bloqueo

[Abre `backend/src/services/solicitudApartadoService.js`. Busca `crear` y `resolver`.]

«La solicitud la crea un comprador con rol cliente. El servicio obtiene el producto del servidor y registra vendedor, nombre y precio desde datos consultados, sin confiar en esos valores arbitrarios del cliente.

Una solicitud pendiente expresa interés y no equivale a pieza confirmada. Compradores distintos pueden tener solicitudes pendientes para una misma pieza disponible. Al confirmar, el vendedor intenta reservar efectivamente esa pieza».

### 4. Leo la transacción de confirmación

[Abre `backend/src/repositories/solicitudApartadoRepository.js`. Busca `confirmar` y `mongoose.connection.transaction`.]

«Aquí el mecanismo cambia. Dentro de una transacción se comprueba la solicitud, se verifica que no haya pedido asociado, se intenta pasar el producto de activo a apartado con la referencia de solicitud y se actualiza la solicitud a confirmada.

La actualización del producto incluye condiciones. Si otra operación ya lo cambió, no encuentra la pieza disponible y se produce conflicto. La transacción agrupa las escrituras relacionadas de esta confirmación. La solicitud guarda precio confirmado y vencimiento según el plazo configurado de tres o siete días.

No voy a explicar concurrencia solo diciendo que Angular deshabilita un botón. La protección relevante debe sostenerse en operaciones del servidor y de la base».

### 5. Leo las condiciones de habilitación

[Abre `backend/src/services/reservasPruebaPolicy.js`. Lee el condicional inicial y la comprobación de topología.]

«Esta es una precisión decisiva de mi versión: confirmar está restringido a pruebas aisladas. El código exige modo test, flag de reservas, vendedor en una lista permitida, base con prefijo `mio_pruebas_`, conexión activa y una topología reconocida con soporte transaccional.

No presentaré esta confirmación como habilitada para pagos reales en producción. Tampoco cambiaré producción a modo test para que una demostración parezca funcionar. La existencia de servicio, pantalla y pruebas es distinta de habilitación operativa».

[Pausa. Dos compradores solicitan la blusa. Explica qué cambia cuando se confirma una solicitud y qué evita confirmar la otra.]

**Comprobación:** puedes contrastar compensación y transacción usando funciones reales del proyecto.

## Episodio 8 — Explico comprobantes, vencimientos y resúmenes

### 1. Sigo la recepción de una imagen

[Abre `backend/src/routes/comprobanteRoutes.js`. Después abre `backend/src/services/validarComprobante.js`.]

«La ruta de comprobantes utiliza autenticación y roles. Aquí hay una diferencia de organización: los manejadores del router llaman al servicio; no debo inventar un `comprobanteController.js` en el recorrido.

Multer recibe un solo archivo en memoria y aplica límites. El archivo se envía en el campo `archivo`. La validación no se queda únicamente con el nombre o el MIME declarado: revisa contenido, intenta decodificar con sharp y transforma a WebP. Hay límites de tamaño y se rechazan imágenes no admitidas o dañadas.

Si quisiera permitir otros formatos, tendría que revisar ruta, validación, modelo y almacenamiento de forma coherente. Cambiar solo una lista en la pantalla no modifica el contrato real del servidor».

### 2. Separo archivo y metadatos

[Abre `backend/src/services/comprobanteService.js`. Busca `permitirEscritura`, `subir` y `revisar`. Abre también `backend/src/models/comprobante.js`.]

«Las escrituras están restringidas a entorno de pruebas aislado. La carga comprueba propiedad, estado y plazo de la reserva. El modelo conserva metadatos y estados del comprobante; el contenido del archivo se gestiona por separado.

Durante la carga puede existir estado preparando; si se recibe correctamente pasa a revisión. Si el vendedor aprueba el comprobante actual, una transacción crea o vincula al cliente comercial, crea un pedido pagado con entrega pendiente y actualiza solicitud y comprobante.

Subir una imagen no marca por sí solo el pago como aprobado. La decisión es manual; no hay aquí una prueba de integración bancaria que confirme dinero recibido».

[En `comprobanteService.js`, localiza la rama de `accion === 'rechazar'`.]

«El primer rechazo permite una corrección dentro de veinticuatro horas. Un segundo rechazo no agrega otro plazo de corrección y conduce al procesamiento de expiración. El historial y los límites se comprueban en el servicio. Estos detalles son reglas de este incremento, no políticas universales de todas las tiendas».

### 3. Entiendo el almacenamiento privado

[Abre `backend/src/services/comprobanteStorage.js`. Busca `privado` y `firmar`.]

«Este módulo utiliza Supabase Storage para archivos privados. MongoDB sigue siendo la base de datos de la aplicación. La clave de servicio corresponde al backend y no debe aparecer en el frontend.

El acceso temporal se solicita después de comprobar propiedad de la reserva; se verifica que el bucket sea privado y se genera una URL de sesenta segundos. El archivo remoto y las escrituras en MongoDB no forman una única transacción. Por eso existen estados de carga fallida y limpieza pendiente. Una transacción de MongoDB no borra mágicamente un archivo subido a otro servicio».

### 4. Localizo quién materializa un vencimiento

[Abre `backend/src/services/expiracionReservasService.js`. Busca `procesar` y `expirarUna`. Después abre `backend/src/scripts/expirarReservas.js`.]

«La fecha de vencimiento está en datos del servidor. El servicio busca reservas elegibles vencidas y verifica condiciones antes de liberar la pieza: que el bloqueo corresponda a esa solicitud y que no haya pedido asociado, entre otras comprobaciones.

Existe procesamiento desde operaciones y un script para barrer vencimientos y limpiar cargas fallidas en pruebas. La presencia del script no demuestra que haya un cron desplegado. Sin ejecución, el paso del tiempo no garantiza por sí mismo que un proceso haya escrito el nuevo estado. El contador del navegador tampoco es quien decide el inventario».

### 5. Comprendo qué calculan los resúmenes

[Abre `backend/src/services/resumenService.js`. Busca `construirResumen` y `obtenerResumenPorLive`. Abre `backend/src/repositories/resumenRepository.js`.]

«El resumen reúne pedidos del vendedor: puede ser general, de ventas directas o de un live. El repositorio decide qué documentos traer; el servicio recorre esos pedidos y acumula cantidad por precio, total pagado, pendiente y entregas.

`totalVendido` no significa necesariamente dinero cobrado: incluye el total de pedidos considerados, mientras `totalPagado` se acumula según estado de pago. Si cambio qué pedidos entran al cálculo, reviso repositorio; si cambio la fórmula o una métrica, reviso servicio. Después alinearía la pantalla y las pruebas».

[Pausa. Explica qué pasa desde que se adjunta una imagen hasta que existe un pedido pagado.]

**Comprobación:** distingues almacenamiento, revisión manual, expiración y cálculo comercial.

## Episodio 9 — Hago un cambio pequeño, lo compruebo y preparo el entorno

### 1. Aclaro el requisito antes de editar

[Este episodio es un ejercicio propuesto. No afirma que la regla de 80 caracteres ya exista. Conserva los cambios previos del checkout.]

«Supongamos que la terna pide limitar el nombre de producto a ochenta caracteres. Primero aclaro que la longitud se medirá después de quitar espacios exteriores, que afectará creación y edición, y que necesito decidir qué hacer con datos históricos más largos. Para este ejercicio usaré longitud de string de JavaScript, reconociendo que no siempre coincide con caracteres visuales de cualquier idioma».

### 2. Localizo cada responsabilidad

[Abre `frontend/src/app/pages/productos/productos.html`, luego `productos.ts`. Después abre `backend/src/services/productoService.js` y `backend/src/models/productos.js`.]

«En la interfaz agregaría ayuda y validación coherentes para que la persona conozca el límite. En el servicio backend agregaría la comprobación al crear y actualizar. En el modelo evaluaría `maxlength` como validación declarativa adicional.

No ubicaría toda la regla en el repositorio porque no es una condición de selección de documentos. Tampoco bastaría con añadir un atributo HTML: una petición directa puede evitarlo.

La edición merece atención: si no se envía el nombre, no debo tratarlo como vacío ni exigir cambiarlo. Si sí se envía, normalizo y valido según la regla. Mantengo la semántica de actualización que utiliza el servicio actual».

### 3. Compruebo límites y explico qué demuestra cada prueba

[Abre `backend/test/producto-codigo.test.js`. Busca `t.mock.method`, `assert.equal` y `assert.rejects`.]

«Este archivo me enseña un patrón de pruebas de servicio con repositorios simulados. Preparo respuestas controladas, ejecuto una función y compruebo resultados o rechazos. Una prueba de este tipo puede comprobar mi nueva regla sin crear productos reales.

Para la longitud probaría ochenta y ochenta y un caracteres, vacío y espacios, creación, edición con nombre y edición sin nombre. También probaría que el servidor rechaza el exceso aunque se envíe sin el formulario.

En la prueba de códigos se inspecciona la declaración del índice del esquema. Eso no equivale a probar que el índice está creado en una instancia MongoDB».

[Abre `backend/test/reservas-mongo.test.js`. Lee la variable `MIO_MONGO_PRUEBAS_URI`, el `skip` y la condición de la URI.]

«Aquí hay una prueba de integración condicionada a un entorno MongoDB aislado. Si no está configurado, se omite. Debo leer las condiciones porque la prueba limpia su propia base. No la apuntaré a la base comercial.

Si ejecuto pruebas, informaré cuáles pasaron, fallaron o se omitieron. No voy a decir que comprobé concurrencia real si ese caso quedó omitido».

### 4. Distingo ejecución local y publicación

[Abre ambos `package.json`. Después `frontend/src/environments/environment.ts`, `environment.production.ts` y `frontend/scripts/configure-production.cjs`.]

«Para desarrollo se arranca cada aplicación desde su carpeta. El frontend local utiliza la API `http://localhost:3000/api`. En producción, el script de despliegue genera configuración a partir de `PUBLIC_API_URL`; valida que sea una URL HTTPS que termine en `/api`.

La URL pública de la API puede estar en el frontend. `MONGO_URI`, `JWT_SECRET` y claves de almacenamiento no. Compilar Angular no migra datos ni cambia automáticamente los secretos del backend».

Comandos de referencia para una terminal, ejecutados por separado y tras revisar el entorno:

```powershell
# Terminal ubicada en MIO/backend
npm run dev

# Otra terminal ubicada en MIO/frontend
npm start

# Verificación desde MIO/backend
npm test

# Verificación desde MIO/frontend
npm run build
```

«El build verifica compilación, no todos los comportamientos. Para la demo utilizaré datos ficticios y comprobaré un recorrido real de extremo a extremo. Si falla, miraré primero evento, petición en Network, estado HTTP, middleware, regla y persistencia. No haré cambios al azar en todas las capas».

[Pausa. Sin editar todavía, explica el cambio solicitado y los archivos afectados. Después practícalo en un entorno adecuado y revisa tu diff.]

**Comprobación:** puedes defender tanto el cambio como el alcance de su verificación.

## Episodio 10 — Ensayo mi defensa completa y respondo repreguntas

### 1. Apertura de la defensa

[Comienza con el explorador en la raíz. No abras todas las pestañas a la vez.]

«Presento MIO, una aplicación web para organizar clientes, productos y pedidos de tiendas que venden por redes sociales o lives. El alcance implementado incluye gestión comercial y módulos adicionales de catálogo y apartados. Distinguiré lo que existe en código de lo habilitado en cada entorno y de lo que puedo demostrar hoy».

### 2. Justificación técnica con ventajas y costos

[Abre los dos `package.json` solo si necesitas mostrar dependencias.]

«La interfaz utiliza Angular y TypeScript. Su estructura de componentes, rutas, formularios y servicios se adapta a las distintas pantallas y roles del sistema. El costo es su aprendizaje y mantener tipos útiles; todavía hay lugares con `any` que reducen la comprobación estática.

La API utiliza Node y Express. Node ejecuta JavaScript y Express organiza las operaciones HTTP. Eso facilita trabajar con un ecosistema cercano al frontend, pero Express no define mis reglas comerciales: las organizo en módulos y capas.

MongoDB conserva documentos y Mongoose describe esquemas y consultas desde la aplicación. Esta elección no elimina relaciones ni integridad: tengo que respaldar operaciones con filtros, validaciones e índices. PostgreSQL también sería una alternativa válida; no necesito desacreditarlo para justificar esta implementación».

### 3. Demostración guiada de una operación

[Si el entorno ya fue comprobado, crea un producto ficticio. Si solo estás ensayando lectura, preséntalo como recorrido esperado del código.]

«Voy a seguir la creación de un producto. Abro la pantalla, completo los datos y envío. En Angular, `guardarProducto` llama al servicio HTTP. En Express, `/api/productos` exige sesión y rol vendedor. El controlador obtiene la identidad autenticada. El servicio valida y normaliza. El repositorio llama al modelo para persistir. El resultado regresa y la pantalla se actualiza.

Si introduzco precio negativo, el backend lo rechaza aunque evite la validación visual. Si intento usar un producto ajeno, los filtros de propiedad son parte de la protección. Para afirmar que la persistencia funciona en este entorno, debo mostrar la consulta posterior, no solo un mensaje de éxito».

### 4. Seguridad y consistencia

[Abre `authMiddleware.js` y luego los filtros de un repositorio.]

«La seguridad tiene controles separados: token y sesión vigente, rol y propiedad del dato. El JWT no es lo único que se consulta; la sesión en servidor permite revocación.

Para piezas únicas hay que considerar dos operaciones simultáneas. La confirmación de solicitudes utiliza actualización condicional y transacción; la venta directa utiliza otro camino, con compensación. Reconozco esa diferencia y sus límites. Las confirmaciones y escrituras de comprobantes están restringidas por código a pruebas aisladas en la versión revisada».

### 5. Evidencia y mejora propuesta

«Tengo pruebas de servicio con repositorios simulados y pruebas de integración condicionadas a un entorno aislado. Presentaré los resultados que realmente haya ejecutado, incluyendo omisiones. La compilación del frontend es una comprobación distinta.

Como siguiente mejora podría fortalecer tipos del frontend, revisar consistencia de la venta directa o diseñar auditoría. Elegiría una según el riesgo y alcance acordado, definiría qué debe cambiar y comprobaría resultados. No voy a prometer que todo está resuelto solo porque el sistema tiene capas».

### 6. Repreguntas que puedo recibir

**Terna:** «¿Por qué no pusiste todo en un controlador?»

«Separar HTTP, reglas y consultas ayuda a encontrar responsabilidades y probar lógica. Puedo mostrarlo en productos. A cambio hay más archivos y debo reconocer módulos que todavía no mantienen la misma separación».

**Terna:** «¿En qué archivo cambiarías el tiempo de reserva?»

«Primero revisaría qué plazos permite `solicitudApartadoService.js` y cómo se guardan en la configuración. Después revisaría `solicitudApartadoRepository.confirmar`, donde se calcula el vencimiento, y la interfaz que ofrece opciones. No cambiaría únicamente un número sin revisar contrato, políticas y pruebas».

**Terna:** «¿Qué cambiarías si el código de producto debe admitir otro carácter?»

«Revisaría `normalizarCodigo` en `productoService.js`, los límites del modelo, la interfaz y las pruebas de códigos. También analizaría compatibilidad y normalización: permitir un carácter y decidir su comparación son decisiones relacionadas».

**Terna:** «¿La aprobación del comprobante garantiza que el banco recibió el pago?»

«No. Esta implementación registra revisión manual y sus efectos comerciales. No he demostrado integración bancaria automática».

**Terna:** «¿Ya comprobaste que dos usuarios no reservan la misma pieza?»

«Puedo mostrar el mecanismo de actualización condicional y transacción y la prueba diseñada para ese caso. Para afirmar ejecución, presentaría el resultado real de esa prueba en el entorno aislado. Si quedó omitida o no la ejecuté, lo diría».

**Terna:** «¿Puedes modificar el código ahora?»

«Sí. Primero concreto el comportamiento que piden, ubico la responsabilidad, explico qué archivos afecta y hago el cambio mínimo. Después compruebo caso válido, inválido y frontera, y reviso el diff para explicar lo modificado».

[Pausa final. Haz la defensa sin leer. Pide una repregunta después de cada afirmación importante.]

**Comprobación:** tu defensa debe sobrevivir a «muéstrame dónde» y «¿cómo lo comprobaste?».

## Mapa de navegación para estudiar módulos adicionales

Este mapa ayuda a encontrar funciones fuera del recorrido central; no afirma haber explicado cada línea de cada archivo. El objetivo es dominar el patrón y después verificar las particularidades. La tabla indica archivos existentes y lugares donde comenzar, no que todos los cambios se resuelvan en un solo archivo.

| Necesidad | Comienza aquí | Después sigue hacia |
| --- | --- | --- |
| Cambiar clientes comerciales | `frontend/src/app/pages/clientes/` | `services/cliente.service.ts`; en backend `clienteRoutes.js`, `clienteController.js`, `clienteService.js`, `clienteRepository.js`, `models/clientes.js` |
| Cambiar eventos live | `frontend/src/app/pages/lives/` y `pages/live-activo/` | Servicio Angular de live; backend rutas, controlador, servicio, repositorio y modelo de live |
| Cambiar catálogo público | `frontend/src/app/pages/catalogo-publico/` | `services/catalogo-publico.service.ts`; backend archivos `catalogoPublico*` |
| Cambiar exploración del comprador | `frontend/src/app/pages/cliente/inicio-cliente/` | `services/explorar-publico.service.ts`; backend archivos `explorarPublico*` |
| Cambiar perfil público de tienda | `frontend/src/app/pages/perfil-vendedor/` | Servicio Angular de perfil; backend archivos `perfilVendedor*` y modelo `perfilVendedor.js` |
| Cambiar administración de usuarios | `frontend/src/app/pages/admin/usuarios/` | `services/usuario.service.ts`; backend archivos `user*`, modelos y permisos pertinentes |
| Cambiar solicitudes visibles | `frontend/src/app/shared/solicitudes-apartado/` | `services/solicitud-apartado.service.ts`; backend `solicitudApartado*` |
| Cambiar comprobantes visibles | `frontend/src/app/shared/comprobantes-reserva/` | `services/comprobante.service.ts`; backend rutas, servicios y modelo de comprobantes |
| Cambiar reportes visibles | `frontend/src/app/pages/resumen/` | `services/resumen.service.ts`; backend archivos `resumen*` |
| Cambiar correo de recuperación | `backend/src/controllers/authController.js` | `backend/src/services/correoService.js`, modelo `recuperacion.js` y configuración de correo |
| Cambiar un modal reutilizable | `frontend/src/app/shared/ui/modal/` | Pantallas consumidoras y estilos compartidos pertinentes |
| Cambiar avisos de interfaz | `frontend/src/app/services/toast.service.ts` | `frontend/src/app/shared/ui/toast-host/` y sus consumidores |

Para aplicar el mapa: abre la pantalla, encuentra la llamada al servicio, sigue método y URL, busca el montaje en `expressApp.js` y abre la ruta. A partir de ahí sigue las importaciones reales. No supongas que existe una capa intermedia solo porque aparece en otro módulo.

## Ejercicios de afianzamiento después de la serie

1. **Recorrido sin guion:** abre el guardado de producto y llega al modelo en menos de cinco minutos explicando cada salto.
2. **Diagnóstico:** ante un 401, localiza quién lo genera y distingue sesión, token y posibles fallos clasificados por el mismo catch. No concluyas automáticamente «contraseña incorrecta».
3. **Propiedad:** muestra un filtro que impide seleccionar un producto de otro vendedor y explica de dónde salió ese vendedor.
4. **Datos:** explica por qué un pedido guarda nombre/precio además de referencias y diferencia usuario de cliente comercial.
5. **Concurrencia:** contrasta venta directa y confirmación; menciona el fallo posible entre escrituras.
6. **Cambio:** practica la regla de ochenta caracteres y demuestra fronteras y edición sin nombre.
7. **Honestidad técnica:** selecciona una capacidad restringida y explica código, habilitación y evidencia por separado.

Puntúa cada ejercicio: 0 si no puedes explicarlo, 1 si dependes del guion, 2 si puedes hacerlo solo y señalar código. Repite cualquier cero antes de memorizar una exposición más larga.

## Prompts para convertir este guion en material de aprendizaje

### Un episodio narrado

> Usa únicamente el episodio [NÚMERO] de «MIO por dentro» y el contexto inicial necesario. Genera un video explicativo o un guion de narración en primera persona. Conserva los pasos exactos de navegación por carpetas, archivos y funciones. Explica cada salto y el motivo de abrir el archivo. No lo conviertas en un resumen de tecnologías. Las instrucciones entre corchetes son acciones o pausas. Mantén las diferencias entre implementación y verificación y las restricciones de pruebas cuando correspondan. No inventes fragmentos, pantallas, resultados de pruebas ni acceso al repositorio. Si necesitas acortar, divide el episodio antes de eliminar el recorrido técnico. Añade al final tres preguntas de recuperación con respuestas separadas.

### Acompañamiento mientras navego el código

> Actúa como tutor usando este guion. Comienza por el episodio 1 y dame un solo paso de navegación cada vez. Pídeme describir lo que encuentro y espera mi respuesta. Si no coincide con la fuente, pide el fragmento relevante antes de inventar una explicación. Pregúntame qué recibe la función, qué hace, qué devuelve y qué responsabilidad pertenece a otro archivo. Avanza cuando pueda explicarlo con mis palabras. Registra los conceptos que debo repetir y termina cada episodio con una pregunta de terna.

### Terna que exige mostrar el mecanismo

> Simula una defensa de MIO con preguntas sobre los diez episodios. Haz una pregunta por turno, espera mi respuesta y repregunta «¿en qué archivo y función se ve?» y «¿qué evidencia lo comprueba?». Corrige sin inventar resultados. Da especial atención a servicio Angular frente a backend, estado de sesión, propiedad por vendedor, venta directa frente a confirmación transaccional, almacenamiento externo y restricciones de pruebas. Termina con un cambio pequeño para que yo proponga los archivos afectados y los casos de comprobación antes de escribir código.

## Precisión de la fuente

Esta serie toma como base archivos del checkout, incluidos cambios locales previos. No modifica el código de la aplicación, no activa capacidades restringidas y no certifica producción. El código puede evolucionar: si un nombre o comportamiento ya cambió, actualiza el guion antes de regenerar videos.

Para ampliar definiciones, decisiones y autoevaluación, utiliza también `docs/academico/PLAN_ESTUDIO_DEFENSA_3_DIAS.md`. Para evidencia de una ejecución, aporta por separado su fecha, entorno, casos ejecutados y resultados. El guion no reemplaza esa evidencia.
