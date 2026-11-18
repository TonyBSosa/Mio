# Graph Report - MIO  (2026-11-18)

## Corpus Check
- 205 files · ~123,895 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: .css 19, (none) 3, .log 2)
- WARNING: 26 files within the selected folders have no supported extractor; CSS and other unsupported formats are not represented.

## Summary
- 1521 nodes · 3226 edges · 93 communities (61 shown, 32 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 270 edges (avg confidence: 0.85)
- Token cost: unavailable. Semantic extraction used agents in this session; their actual token usage was not exposed. Zero placeholders are not a measurement of free or zero-token extraction.

## Community Hubs (Navigation)
- API y clientes
- Cabina de live
- Dashboard del vendedor
- Acceso en la interfaz
- Integridad de productos
- Gestión de pedidos
- Inventario del vendedor
- Reglas de pedidos
- Pantallas y pruebas Angular
- Navegación y dependencias Angular
- Reglas de eventos live
- Catálogo y solicitudes Angular
- Configuración de Angular
- Administración de usuarios
- Operación comercial documentada
- Gestión de lives
- Paquetes del frontend
- Directorio de clientes
- Servicios comerciales Angular
- Pruebas de sesión y permisos
- Persistencia de usuarios
- Revisión de comprobantes
- Planes y guías del proyecto
- Pruebas de reservas y comprobantes
- Resumen del vendedor
- Panel de administración
- Exploración pública de tiendas
- Reglas de solicitudes
- Integridad de piezas y pedidos
- Inicio del comprador
- Perfil público del vendedor
- Reservas y permisos documentados
- Sesión e infraestructura Angular
- Diálogos de la interfaz
- Configuración del backend
- Catálogo público de la API
- Solicitudes en la interfaz
- Autenticación de la API
- Comprobantes en la interfaz
- Paquetes del backend
- Flujo de apartados documentado
- Navegación principal
- Requisitos y propuestas históricas
- Notificaciones de la interfaz
- Expiración de reservas
- Paginación de listados
- Servicio Angular de comprobantes
- Hipótesis y validación pendiente
- Presentación de notificaciones
- Comandos del frontend
- Configuración para publicación
- Correo de recuperación
- Comandos del backend
- Almacenamiento privado de imágenes
- Planificación histórica del producto
- Formularios de acceso
- Datos de recuperación
- Perfil del comprador
- Integridad y evidencia documental
- Diagnóstico histórico de arquitectura
- Historias y venta social
- Fotografía del catálogo
- Fotografía de vitrina
- Navegación por rol
- Bienvenida y demostración
- Identidad pública de la tienda
- Metadatos del repositorio
- Evidencia de sesiones y roles
- Cancelación del comprador
- Criterios de entrega
- Captura de catálogo por tienda
- Aceptación histórica del catálogo
- Evidencia de entrega inicial
- Evidencia de venta directa
- Identidad del comprador
- Plan comercial de diez semanas
- Desarrollo del frontend
- Administración documentada
- Exploración comercial documentada
- Directorio comercial documentado
- Recuperación en la interfaz
- Límites de peticiones
- Rechazo de solicitudes
- Consistencia de venta directa
- Evidencia de publicación inicial
- Pruebas de usuarios pendientes
- Fotografía de venta social
- Componente de prueba Login
- Componente de prueba Inicio
- Entorno de producción Angular
- Montaje de Angular
- Captura de código duplicado
- Captura del formulario móvil

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 73 edges
2. `Dashboard` - 67 edges
3. `LiveActivo` - 59 edges
4. `Pedidos` - 53 edges
5. `@angular/core` - 49 edges
6. `Productos` - 46 edges
7. `mongoose` - 37 edges
8. `Lives` - 32 edges
9. `@angular/common` - 31 edges
10. `Clientes` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Solicitud explícita` --conceptually_related_to--> `Catálogo a Mis apartados`  [INFERRED]
  frontend/src/app/pages/catalogo-publico/catalogo-publico.html → docs/incremento-2a-solicitudes-apartado.md
- `obtenerCatalogo()` --calls--> `buscarVendedorPorId()`  [EXTRACTED]
  backend/src/services/catalogoPublicoService.js → backend/src/repositories/catalogoPublicoRepository.js
- `obtenerCatalogo()` --calls--> `buscarPerfilPorVendedor()`  [EXTRACTED]
  backend/src/services/catalogoPublicoService.js → backend/src/repositories/catalogoPublicoRepository.js
- `obtenerCatalogo()` --calls--> `listarProductosActivosPorVendedor()`  [EXTRACTED]
  backend/src/services/catalogoPublicoService.js → backend/src/repositories/catalogoPublicoRepository.js
- `obtenerCatalogo()` --calls--> `listarLivesPublicosPorVendedor()`  [EXTRACTED]
  backend/src/services/catalogoPublicoService.js → backend/src/repositories/catalogoPublicoRepository.js

## Import Cycles
- None detected.

## Communities (93 total, 32 thin omitted)

### Community 0 - "API y clientes"
Cohesion: 0.06
Nodes (53): connectDatabase(), mongoose, actualizarCliente(), crearCliente(), eliminarCliente(), obtenerClientePorId(), obtenerClientes(), obtenerVendedorId() (+45 more)

### Community 3 - "Acceso en la interfaz"
Cohesion: 0.05
Nodes (3): Bienvenida, Login, Register

### Community 4 - "Integridad de productos"
Cohesion: 0.09
Nodes (44): actualizarEstadoProducto(), actualizarProducto(), crearProducto(), eliminarProducto(), obtenerProductoPorId(), obtenerProductos(), obtenerVendedorId(), responderError() (+36 more)

### Community 7 - "Reglas de pedidos"
Cohesion: 0.12
Nodes (41): actualizarEntregaPedido(), actualizarPagoPedido(), actualizarPedido(), crearPedido(), eliminarPedido(), obtenerPedidoPorId(), obtenerPedidos(), obtenerVendedorId() (+33 more)

### Community 8 - "Pantallas y pruebas Angular"
Cohesion: 0.09
Nodes (19): DummyComponent, DIAS_PERIODO, ModoSerieLives, PeriodoBalance, PuntoSerieLive, VistaPendientes, FiltroLives, FiltroOperativoPedidos (+11 more)

### Community 9 - "Navegación y dependencias Angular"
Cohesion: 0.15
Nodes (13): accesoRol(), routes, DemoVista, AuthResponse, PerfilUsuario, PREFIJOS_RUTAS_PUBLICAS, Comprobante, HistorialComprobantes (+5 more)

### Community 10 - "Reglas de eventos live"
Cohesion: 0.13
Nodes (37): actualizarEstadoLive(), actualizarLive(), crearLive(), eliminarLive(), obtenerLiveActivoActual(), obtenerLivePorId(), obtenerLives(), obtenerVendedorId() (+29 more)

### Community 11 - "Catálogo y solicitudes Angular"
Cohesion: 0.07
Nodes (3): CatalogoPublico, CatalogoPublicoService, SolicitudApartadoService

### Community 12 - "Configuración de Angular"
Cohesion: 0.05
Nodes (38): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+30 more)

### Community 13 - "Administración de usuarios"
Cohesion: 0.13
Nodes (32): actualizarEstadoUsuario(), actualizarUsuario(), crearUsuario(), eliminarUsuario(), obtenerAdminId(), obtenerUsuarioPorId(), obtenerUsuarios(), responderError() (+24 more)

### Community 14 - "Operación comercial documentada"
Cohesion: 0.06
Nodes (33): Consulta de apartados, Perfil del comprador, Recuperación de contraseña, Balance y ventas por Live, Control del Live activo, Panel de operaciones, Pendientes de cobro y entrega, Cabina de Live (+25 more)

### Community 16 - "Paquetes del frontend"
Cohesion: 0.09
Nodes (30): dependencies, @angular/common@^21.2.0, @angular/compiler@^21.2.0, @angular/core@^21.2.0, @angular/forms@^21.2.0, @angular/platform-browser@^21.2.0, @angular/router@^21.2.0, tslib@^2.3.0 (+22 more)

### Community 18 - "Servicios comerciales Angular"
Cohesion: 0.13
Nodes (7): FiltroPedidosLive, AuthService, ClienteService, LiveService, PedidoService, ProductoService, ResumenService

### Community 19 - "Pruebas de sesión y permisos"
Cohesion: 0.09
Nodes (20): sharp@^0.35.5, expressApp, jwt, mongoose, schema, sharp, tipos, assert (+12 more)

### Community 20 - "Persistencia de usuarios"
Cohesion: 0.13
Nodes (17): mongoose, schema, Live, liveSchema, mongoose, mongoose, PerfilVendedor, perfilVendedorSchema (+9 more)

### Community 21 - "Revisión de comprobantes"
Cohesion: 0.20
Nodes (24): carga, manejar(), multer, { rateLimit }, respuestaError(), router, accesoTemporal(), admiteCarga() (+16 more)

### Community 22 - "Planes y guías del proyecto"
Cohesion: 0.08
Nodes (25): Arquitectura por capas, Defensa narrada del proyecto, Restricciones operativas, Sesiones y propiedad, Transacción y compensación, Datos y estados separados, Evidencia de ejecución, Plan de defensa en tres días (+17 more)

### Community 23 - "Pruebas de reservas y comprobantes"
Cohesion: 0.10
Nodes (17): Cliente, clienteSchema, mongoose, mongoose, solicitudSchema, assert, jwt, mongoose (+9 more)

### Community 26 - "Exploración pública de tiendas"
Cohesion: 0.19
Nodes (19): buscar(), listarEventos(), listarVendedores(), responderError(), buscarEventos(), buscarPerfiles(), escaparRegex(), listarEventosPublicos() (+11 more)

### Community 27 - "Reglas de solicitudes"
Cohesion: 0.23
Nodes (20): cancelar(), configuracion(), crear(), guardarConfiguracion(), listar(), obtener(), resolver(), responderError() (+12 more)

### Community 28 - "Integridad de piezas y pedidos"
Cohesion: 0.16
Nodes (14): mongoose, Pedido, pedidoSchema, mongoose, Producto, productoSchema, eliminarPorIdYVendedor(), mongoose (+6 more)

### Community 31 - "Reservas y permisos documentados"
Cohesion: 0.12
Nodes (17): Confirmación de prueba, Política de activación, Precio y plazo históricos, Producto y solicitud atómicos, Barrido externo, Liberación condicional, Reconciliación por petición, Vencimiento de reservas (+9 more)

### Community 32 - "Sesión e infraestructura Angular"
Cohesion: 0.15
Nodes (9): rxjs@~7.8.0, appConfig, RUTAS_VENDEDOR, TITULOS_RUTA, authSessionInterceptor(), RUTAS_AUTH_PUBLICAS, DummyDashboard, DummyLogin (+1 more)

### Community 34 - "Configuración del backend"
Cohesion: 0.13
Nodes (15): author, bugs, url, description, devDependencies, nodemon@^3.1.14, engines, node (+7 more)

### Community 35 - "Catálogo público de la API"
Cohesion: 0.22
Nodes (13): obtenerCatalogo(), responderError(), buscarPerfilPorVendedor(), buscarVendedorPorId(), listarLivesPublicosPorVendedor(), listarProductosActivosPorVendedor(), mongoose, crearError() (+5 more)

### Community 37 - "Autenticación de la API"
Cohesion: 0.20
Nodes (13): bcrypt, crypto, generarToken(), jwt, login(), logout(), obtenerPerfil(), registrar() (+5 more)

### Community 39 - "Paquetes del backend"
Cohesion: 0.14
Nodes (14): dependencies, bcryptjs@^3.0.3, cors@^2.8.6, dotenv@^17.4.2, express@^5.2.1, jsonwebtoken@^9.0.3, mongoose@^9.6.2, multer@^2.5.0 (+6 more)

### Community 40 - "Flujo de apartados documentado"
Cohesion: 0.15
Nodes (13): Catálogo a Mis apartados, Pendiente sin exclusividad, Propiedad e índice único, Solicitud de apartado, Ampliación financiera propuesta, Dinero exacto pendiente, Modelo documentado, Pedido como línea (+5 more)

### Community 42 - "Requisitos y propuestas históricas"
Cohesion: 0.17
Nodes (12): Casos de uso históricos, Consolidación y abonos propuestos, Reglas por validar, Cancelación con abonos, Entrega y adopción, Entrevistas piloto propuestas, Finanzas propuestas, Piezas y aislamiento (+4 more)

### Community 44 - "Expiración de reservas"
Cohesion: 0.35
Nodes (7): mongoose, expirarUna(), filtroVencidas(), mongoose, procesar(), esEntornoPruebasAislado(), mongoose

### Community 47 - "Hipótesis y validación pendiente"
Cohesion: 0.25
Nodes (8): Guion de usuarios pendiente, Medición de captura H2, Prioridad por observación, Recorrido comprador T6 exploratorio, Alcance del prototipo, Captura manual, Hipótesis por validar, Visión de MIO

### Community 49 - "Comandos del frontend"
Cohesion: 0.29
Nodes (7): scripts, build, build:deploy, ng, start, test, watch

### Community 50 - "Configuración para publicación"
Cohesion: 0.29
Nodes (4): apiUrl, { join }, parsed, { writeFileSync }

### Community 51 - "Correo de recuperación"
Cohesion: 0.33
Nodes (5): nodemailer@^10.3.1, solicitarRecuperacion(), enviarRecuperacion(), nodemailer, nodemailer

### Community 52 - "Comandos del backend"
Cohesion: 0.33
Nodes (6): scripts, create-admin, dev, reservas:expirar, start, test

### Community 53 - "Almacenamiento privado de imágenes"
Cohesion: 0.60
Nodes (5): conexion(), { createClient }, error(), privado(), validarClave()

### Community 54 - "Planificación histórica del producto"
Cohesion: 0.33
Nodes (6): Brechas históricas, Trazabilidad histórica de requisitos, Alcance comercial, Documentación académica de MIO, Integridad antes de extensión, Plan de ocho semanas

### Community 55 - "Formularios de acceso"
Cohesion: 0.33
Nodes (6): Credenciales de acceso, Inicio de sesión, Recuperación de acceso, Contraseña de 10 a 128 caracteres, Registro de cuentas, Roles vendedor y comprador

### Community 56 - "Datos de recuperación"
Cohesion: 0.40
Nodes (3): crypto, mongoose, schema

### Community 58 - "Integridad y evidencia documental"
Cohesion: 0.50
Nodes (4): Historia y dinero exacto, Integridad del modelo, Flujo comercial observado, Semana 3 datos reales

### Community 59 - "Diagnóstico histórico de arquitectura"
Cohesion: 0.50
Nodes (4): Arquitectura por capas, Diagnóstico histórico del 4 de noviembre, Integridad de inventario y pedidos, Validación del producto pendiente

### Community 60 - "Historias y venta social"
Cohesion: 0.50
Nodes (4): Corte financiero futuro, Mapa de historias, Recorrido del vendedor, Venta social externa

### Community 61 - "Fotografía del catálogo"
Cohesion: 0.50
Nodes (4): Cafetera verde, Fotografía de catálogo de hogar, Lámpara de cerámica, Textil doblado

### Community 62 - "Fotografía de vitrina"
Cohesion: 0.50
Nodes (4): Fotografía de vitrina de hogar, Lámpara verde, Paquetes de regalo, Tazas de cerámica

### Community 63 - "Navegación por rol"
Cohesion: 0.50
Nodes (4): Mensajes globales, Navegación del comprador, Navegación del vendedor, Shell por rol

### Community 64 - "Bienvenida y demostración"
Cohesion: 0.50
Nodes (4): Bienvenida de MIO, Controles accesibles, Demostración de tres escenas, Flujo comercial explicado

### Community 65 - "Identidad pública de la tienda"
Cohesion: 0.50
Nodes (4): Canales de contacto, Catálogo compartible, Identidad de la tienda, Perfil público del vendedor

### Community 66 - "Metadatos del repositorio"
Cohesion: 0.67
Nodes (3): repository, type, url

### Community 67 - "Evidencia de sesiones y roles"
Cohesion: 0.67
Nodes (3): Pendientes SMTP y admin, Semana 4 sesiones y roles, Verificación HTTPS de permisos

### Community 68 - "Cancelación del comprador"
Cohesion: 0.67
Nodes (3): Cancelación del comprador, Liberación transaccional, Protección de comprobantes

### Community 69 - "Criterios de entrega"
Cohesion: 0.67
Nodes (3): Aceptación publicada, Definición de Hecho, Trazabilidad de entrega

### Community 70 - "Captura de catálogo por tienda"
Cohesion: 0.67
Nodes (3): Búsqueda por código visible, Captura de catálogo Tienda B, Gestión de producto visible

### Community 71 - "Aceptación histórica del catálogo"
Cohesion: 0.67
Nodes (3): Aceptación histórica HU-01, Búsqueda y persistencia, Código único por tienda

### Community 72 - "Evidencia de entrega inicial"
Cohesion: 0.67
Nodes (3): Límites de evidencia, Primera historia viva, Release semana 2

### Community 73 - "Evidencia de venta directa"
Cohesion: 0.67
Nodes (3): Diseño futuro separado, Release semana 3, Venta directa conciliada

### Community 74 - "Identidad del comprador"
Cohesion: 0.67
Nodes (3): Identidad de servidor, Navegación de comprador, Perfil del comprador

### Community 75 - "Plan comercial de diez semanas"
Cohesion: 0.67
Nodes (3): Plan de diez semanas, Prioridad del MVP, Siguiente corte condicionado

### Community 76 - "Desarrollo del frontend"
Cohesion: 0.67
Nodes (3): Compilación y pruebas, Desarrollo Angular, Servidor de desarrollo

### Community 77 - "Administración documentada"
Cohesion: 0.67
Nodes (3): Acciones del listado, Formulario modal, Gestión de usuarios

### Community 78 - "Exploración comercial documentada"
Cohesion: 0.67
Nodes (3): Catálogo por vendedor, Eventos activos y próximos, Exploración de tiendas

### Community 79 - "Directorio comercial documentado"
Cohesion: 0.67
Nodes (3): Búsqueda y paginación, Datos de contacto y entrega, Directorio de clientes

## Knowledge Gaps
- **133 isolated node(s):** `Alcance comercial`, `Ventas directas`, `Límite histórico de consistencia`, `Acceso temporal`, `Validación real pendiente` (+128 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 526 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vendedor()` connect `Servicio Angular de comprobantes` to `Navegación y dependencias Angular`, `Pruebas de sesión y permisos`?**
  _High betweenness centrality (0.338) - this node is a cross-community bridge._
- **What connects `Alcance comercial`, `Ventas directas`, `Límite histórico de consistencia` to the rest of the system?**
  _133 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API y clientes` be split into smaller, more focused modules?**
  _Cohesion score 0.05706760316066725 - nodes in this community are weakly interconnected._
- **Why does `Dashboard` connect `Dashboard del vendedor` to `Cabina de live`, `Acceso en la interfaz`, `Pantallas y pruebas Angular`, `Navegación y dependencias Angular`, `Gestión de lives`, `Servicios comerciales Angular`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `Cabina de live` be split into smaller, more focused modules?**
  _Cohesion score 0.055944055944055944 - nodes in this community are weakly interconnected._
- **Why does `@angular/core` connect `Navegación y dependencias Angular` to `Paquetes del frontend`, `Pantallas y pruebas Angular`, `Sesión e infraestructura Angular`, `Servicios comerciales Angular`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `Dashboard del vendedor` be split into smaller, more focused modules?**
  _Cohesion score 0.05499735589635114 - nodes in this community are weakly interconnected._
## Scope and interpretation
- Only frontend/, backend/ and docs/ were analyzed.
- Start with index.html or GUIA_MIO.md for the readable six-area overview.
- Six supported code files produced no AST symbols; a file being detected does not mean all its behavior was modeled.
- Static analysis only; no production requests, payments, database operations or deployment verification performed.
- Graph health: no missing/dangling endpoints or self-loops. The undirected simple graph collapses 205 parallel relations between the same endpoints; exact multiplicity and some relation detail are lost.
- graphify-out/ was written in the working tree and may appear in git status unless ignored.
