# Diagnóstico integral de MIO — Fase I

Fecha de auditoría: **4 de noviembre de 2026**, America/Tegucigalpa. Repositorio local: `D:\VANGUARDIA\MIO`. Versión examinada: `f18c013`, más el estado de trabajo descrito abajo. Auditoría sin implementación de recomendaciones.

## 1. Resumen ejecutivo

MIO tiene un prototipo coherente de captura manual de ventas: identificar piezas, registrar compradores, crear pedidos con o sin live, confirmar pago/entrega y consultar resúmenes. Hay código en ambas capas, seis colecciones y reglas comerciales reales. No es solamente un conjunto de CRUD, pero todavía no tiene garantías suficientes para tratarlo como sistema financiero o inventario plenamente consistente ante fallos.

La documentación de semanas 1–3 es considerable: visión, mapa por roles con dos cortes, 18 historias, 11 priorizadas para MVP, Definición de Hecho, plan de diez semanas y modelo completo en Mermaid. Existen evidencias históricas de HU-01 y del recorrido central en producción. Eso no equivale a verificar nuevamente el despliegue ni a aceptar todas las historias.

Las cinco pruebas backend ejecutadas en esta auditoría pasaron. Son pruebas de servicios con repositorios simulados; no prueban concurrencia real, índices instalados, recuperación ni autorización HTTP completa. No se compiló Angular porque los comandos de build generan archivos y el build de despliegue modifica configuración.

Riesgos principales: reserva y pedido sin transacción conjunta; borrado físico de pedidos y liberación posterior de inventario; comprobaciones de referencias separadas de las escrituras; dinero en Number; ausencia de migraciones/seed reproducibles y restauración demostrada. No se encontró una credencial expuesta en la búsqueda limitada realizada, pero no se certifica ausencia global de secretos.

**Recomendación de persistencia: Considerar PostgreSQL.** Es una evaluación previa al incremento financiero, no una orden de migrar. MongoDB puede soportar el flujo con controles adecuados. La referencia a más de veinte tablas corresponde al ejemplo del curso en la captura revisada; no demuestra un mínimo obligatorio para MIO. La equivalencia académica de referencias/validadores/transacciones MongoDB frente a FK y restricciones SQL necesita confirmación docente.

## 2. Alcance y limitaciones de la auditoría

- Se inventarió el árbol propio, archivos ocultos de configuración pertinentes, manifiestos, locks, modelos, capas backend, rutas, servicios y páginas frontend, pruebas, documentación e historial Git. Se excluyó revisar internamente dependencias, cachés y bundles como si fueran código propio. Hay 248 archivos versionados; también existen artefactos locales en `output/`, `tmp/`, `frontend/dist/` y `.angular/`.
- Estado inicial: `docs/bitacora/semana-1.md` modificado y `output/modulo3-reference/` sin seguimiento. Se preservan. No se encontró AGENTS.md en el árbol consultado. Los prompts históricos dentro de docs son documentación, no nuevas autorizaciones para implementar.
- Se revisaron visualmente las seis capturas locales `output/modulo3-reference/image1.png` a `image6.png`. No se inspeccionaron caras ocultas de tarjetas ni diapositivas no capturadas. No constituyen la rúbrica completa.
- Única escritura autorizada: este informe, que no existía al iniciar. No se leyó el contenido del `.env` real, no se inició el servidor, no se conectó a MongoDB y no se ejecutaron scripts administrativos, migraciones, publicaciones ni pruebas con datos persistentes.
- Consultas web públicas: la portada de GitHub fue accesible; la API GitHub no resolvió desde la consola y las páginas individuales de issues/releases fallaron en la herramienta web. Render frontend/API no fue accesible mediante la herramienta web. Estos fallos no demuestran que los servicios estén caídos.
- **IMPLEMENTADA** significa evidencia suficiente de código conectado; **PARCIAL**, capacidades o garantías incompletas; **NO IMPLEMENTADA**, ausencia de implementación en el árbol inspeccionado; **NO VERIFICADA**, evidencia insuficiente. Ninguna de estas etiquetas sustituye una aceptación operacional. Para requisitos se usa CUMPLE/PARCIAL/NO CUMPLE/NO VERIFICADO.
- Referencias `ruta:línea` son relativas a la raíz y corresponden al estado examinado; pueden cambiar posteriormente. Las recomendaciones no fueron ejecutadas.

## 3. Estado general del proyecto

| Aspecto | Evidencia y diagnóstico |
|---|---|
| Frontend | Angular declarado `^21.2.0`; lock resuelve `@angular/core` **21.2.16**. TypeScript declarado `~5.9.2`, lock **5.9.3**. Componentes standalone, FormsModule y HttpClient. `frontend/package.json:14`, `frontend/src/app/app.config.ts:7`. |
| Backend | Node.js, CommonJS, Express declarado `^5.2.1` y lock **5.2.1**; Mongoose declarado `^9.6.2` y lock **9.6.2**. Node local observado **v24.14.0**; versión de Render NO VERIFICADA. `backend/package.json:15`. |
| Persistencia | MongoDB mediante Mongoose. Atlas en producción según documentación; versión, topología, índices efectivos y permisos reales NO VERIFICADOS. Mongoose 9 no significa MongoDB 9. |
| Arquitectura | SPA → API REST → controladores → servicios → repositorios → modelos. Registro/login acceden directamente a User desde authController: excepción a las capas, no prueba de necesidad de reescritura. |
| Calidad | Cinco pruebas backend aprobadas; tres archivos spec frontend, con verificaciones básicas. No se encontró CI versionada. Build, pruebas frontend y E2E actuales NO VERIFICADOS. |
| Producto | Prototipo funcional por código y evidencia histórica; validación con vendedores, tiempos de captura y disposición a pagar pendientes. |
| Git | 21 commits alcanzables desde HEAD; 7 entre 25 oct. y 4 nov. inclusive, ventana de diez fechas locales. Etiquetas locales semana-1, semana-2 y semana-3. No hubo fetch ni alteración de referencias. |

La portada pública de [GitHub](https://github.com/TonyBSosa/Mio) muestra repositorio público, 21 commits y contador de 17 issues abiertas. Ese contador no identifica sus cuerpos, etiquetas ni un total histórico de 18: esos detalles siguen NO VERIFICADOS remotamente.

## 4. Inventario de funcionalidades

| Capacidad | Estado | Evidencia y límite operativo |
|---|---|---|
| Registro vendedor/cliente, login, perfil de sesión | IMPLEMENTADA | `backend/src/controllers/authController.js:12`, `:71`; formularios y AuthService. JWT de un día y bcrypt costo 10. Sin nueva prueba HTTP. |
| Roles y cuentas activas | IMPLEMENTADA | `middlewares/authMiddleware.js:5`, `roleMiddleware.js:1`; rutas vendedor y admin. Registro público rechaza admin. |
| Administración de usuarios | IMPLEMENTADA | userRoutes, userController, userService, userRepository y `pages/admin/usuarios/`. Protege autoeliminación e inactivación propia; sin auditoría de acciones. |
| Directorio de compradores | IMPLEMENTADA | clienteRoutes y capas homónimas, `pages/clientes/`; nombre obligatorio y propietario. Comprador del directorio no equivale a usuario con rol cliente. |
| Catálogo, código normalizado y búsqueda | IMPLEMENTADA | `productoService.js:21`, `:61`; `models/productos.js:57`; `pages/productos/productos.ts:234`. Índice compuesto declarado y evidencia histórica HU-01. |
| Imagen de producto | PARCIAL | `models/productos.js:34`: referencia textual/foto. No se encontró upload, almacenamiento gestionado ni política de archivos. |
| Gestión de eventos live | IMPLEMENTADA | `liveService.js:7`, rutas y páginas lives/live-activo. Estados y transiciones; no transmite video. Exclusividad de un live activo no garantizada por índice. |
| Alta rápida de comprador al vender en live | IMPLEMENTADA | `pages/live-activo/live-activo.ts:262`; si falla el pedido, el cliente puede quedar creado y la UI lo informa. |
| Pedido directo o asociado a live | IMPLEMENTADA | `pedidoService.js:55`, `:89`; `models/pedidos.js:11`; `pages/pedidos/` y live-activo. Live debe estar activo al crear; actualización usa otra regla. |
| Apartado consistente de pieza única | PARCIAL | `pedidoService.js:129`, `pedidoRepository.js:63`: actualización condicional, cantidad 1, compensación. Sin transacción multidocumento ni idempotencia. |
| Confirmar pago total/entrega | IMPLEMENTADA | `pedidoService.js:269`, `:291`; enums binarios. Confirmación manual, sin procesar dinero ni registrar movimientos. |
| Borrado/cancelación de pedido | PARCIAL | `pedidoService.js:313`: existe borrado físico y liberación posterior; no cancelación con motivo/historial. |
| Resúmenes por live, ventas directas y general | IMPLEMENTADA | `resumenService.js:64`; selectores `directa` y `todos` mediante `/api/resumen/live/:liveId`. Calcula importes con Number y carga pedidos completos. |
| Consolidación financiera por comprador | PARCIAL | Filtrado de pedidos en `pages/pedidos/pedidos.ts:497`; no pedido maestro ni saldo basado en abonos. |
| Perfil público, catálogo y exploración | IMPLEMENTADA | Capas perfilVendedor/catalogoPublico/explorarPublico y páginas públicas. Capacidad exploratoria, con brecha de filtro de visibilidad descrita en H09. |
| Abonos, saldo por movimientos, correcciones financieras | NO IMPLEMENTADA | No modelos ni rutas de abonos. HU-12 es propuesta. |
| Cancelación lógica y tratamiento del dinero | NO IMPLEMENTADA | No entidad ni flujo ejecutable; HU-13 propuesta. |
| Entrega con saldo, fecha y responsable específicos | NO IMPLEMENTADA | Solo enum de entrega; HU-15 propuesta. No se considera obligatorio bloquear por saldo en el corte 1. |
| Exportación CSV e historial administrativo | NO IMPLEMENTADA | HU-16/HU-18 propuestas, sin rutas/servicios correspondientes. |
| PWA instalable configurada | NO IMPLEMENTADA | Sin manifest, ngsw-config, paquete service-worker ni registro en app.config/angular.json. |
| Integración automática con redes, pasarela, streaming | NO IMPLEMENTADA | Enlaces sociales/WhatsApp, no SDK ni captura de comentarios. Fuera del alcance inicial documentado. |
| Disponibilidad actual y operación completa en Render | NO VERIFICADA | Hay evidencia del 1 nov.; no se pudo repetir acceso seguro actual. |

## 5. Evaluación del módulo 1

**Problema y fundamentos: PARCIAL.** `docs/vision.md:5` define problema, segmento hondureño de piezas únicas y propuesta de valor; `:29` contiene Lean Canvas, `:43` hipótesis y experimentos. Distingue apropiadamente contexto documental de evidencia primaria. Los ejemplos de proveedores y contexto del país no demuestran frecuencia de errores, ahorro de tiempo ni demanda de MIO. No consta entrevista realizada; `academico/PREGUNTAS_PARA_TIENDAS.md` es instrumento, no resultado.

Hipótesis más riesgosas: que la dispersión de información sea dolor suficiente; que capturar manualmente mientras se vende sea viable; que consultar estados mejore el trabajo; que la tienda repita el uso. El umbral de 15 segundos es meta propuesta, no medición. La disposición a pagar no está validada (`vision.md:49`).

**Decisiones tecnológicas: PARCIAL.** `vision.md:76` justifica Angular/Express/MongoDB por continuidad del prototipo y capacidad de una persona; no compara alternativas con mediciones. Es una justificación válida de continuidad, insuficiente como estudio económico u operativo completo. JWT y bcrypt existen, sin ADR que explique expiración, revocación y almacenamiento del token. Render y Atlas están documentados; no se verificaron límites, contratación ni costos actuales. Fotos son referencias URL, sin decisión de almacenamiento de archivos. No existe proveedor externo de autenticación: la identidad es local.

README, visión, bitácora semana 1 y `.env.example` existen. README `:14` aún afirma pendiente publicar semana-1 pese a existir etiqueta local: remoto NO VERIFICADO. El historial reutiliza un repositorio con commits de junio; `bitacora/semana-1.md` advierte confirmar la aceptación de reutilización si el curso exige repositorio nuevo.

## 6. Evaluación del módulo 2

### Recorrido por acciones y objetivos

El vendedor obtiene acceso a su tienda → identifica y prepara piezas con código/precio → registra al comprador → acuerda una pieza/precio por un canal externo → captura el pedido directo o durante un live activo → confirma manualmente el pago → registra entrega → revisa pendientes y totales. Puede editar datos y borrar pedidos, con las limitaciones de historial señaladas. La transmisión y el cobro real ocurren fuera de MIO.

El administrador obtiene una cuenta mediante procedimiento interno → consulta usuarios → habilita o inhabilita acceso → revisa el resultado. No hay rastro inmutable de sus decisiones. El visitante/comprador puede descubrir vendedores/eventos y consultar catálogo; no se encontró autoservicio de pedidos o pagos. El rol cliente no está vinculado como propietario a la ficha Cliente del vendedor.

### Historias e INVEST

`docs/mapa-historias.md:15` presenta viaje por vendedor, administrador y comprador, tareas/detalles, corte MVP y segundo corte. `backlog.md` tiene HU-01–HU-18 expresadas como rol/acción/beneficio y criterios Dado/Cuando/Entonces. `plan.md:13` establece diez semanas y aclara que el plan de ocho semanas es antecedente. `definicion-de-hecho.md:5` exige prueba, permisos, teléfono, despliegue y trazabilidad.

| Criterio INVEST | Evaluación concreta |
|---|---|
| Independiente | PARCIAL: HU-05 depende explícitamente de HU-04; HU-12 y HU-14 comparten datos financieros; HU-10 es transversal. Pueden aceptarse con fixtures, pero no son completamente independientes. |
| Negociable | CUMPLE documentalmente: reglas financieras provisionales, cortes y opción de dividir historias M. Confirmación real con usuario pendiente. |
| Valiosa | CUMPLE en formulación: beneficio explícito por rol. Valor observado comercialmente NO VERIFICADO. |
| Estimable | PARCIAL: S/M son tamaños relativos; HU-04/HU-10/HU-12 contienen riesgos técnicos no resueltos y no hay velocidad medida. |
| Pequeña | PARCIAL: HU-11 reúne revisar, activar/inactivar y protecciones; HU-10 reúne aislamiento y referencias; HU-12 combina dinero y concurrencia. Revisar división al planificar, sin inventar historias terminadas. |
| Comprobable | PARCIAL: ejemplos de importes, conflictos y permisos son verificables. HU-01 cubre éxito/entrada inválida/multitienda; HU-10 permisos; HU-12 límites/concurrencia. HU-03, HU-05 y HU-08 no cubren individualmente todos los rechazos/permisos; dependen de la DoD transversal. |

HU-01 tiene informe de aceptación del 1 nov., tres PNG presentes y commit `ea2ba3d` con `Closes #1`. Esto acredita evidencia histórica local, no consulta actual del estado de la Issue. El viewport 390×844 no acredita el teléfono físico exigido por la DoD.

### MVP provisional

Conservar como candidatos esenciales acceso aislado, catálogo con código, clientes, apartado/pedido directo, confirmación de pago/entrega y consulta de pendientes. Los eventos live son útiles si la tienda necesita agrupar sesiones; el flujo directo ya evita obligarlos. Administración mínima de acceso es soporte operativo, con alcance a validar. Catálogo público, exploración y cuenta de comprador son complementos posiblemente innecesarios para el primer piloto; no deben retirarse solo por esa hipótesis. Abonos, consolidado, cancelaciones y restricciones de entrega dependen de reglas reales de tiendas y de capacidad disponible. El mapa vigente es propuesta de alcance, no validación definitiva del MVP.

## 7. Evaluación del módulo 3

**Modelo y diccionario: CUMPLE documentalmente con límites.** `docs/modelo-datos.md` ya existe; no se creó ni modificó. Incluye Mermaid físico, cardinalidades, campos y diseño futuro. No es necesario generar otro archivo para comprobar su viabilidad. Las cuatro entidades propuestas —abonos, cancelaciones, entregas y auditoría de acceso— no existen como modelos implementados.

**Integridad: PARCIAL.** Hay identificadores, mínimos, estados, índices declarados, validación de pertenencia y restricciones de borrado en servicios. Faltan garantías conjuntas frente a concurrencia, validadores efectivos de colección comprobados y dinero exacto. `ref` en Mongoose no es FK del motor. Defaults no son equivalentes a NOT NULL; varios enums/cantidad siguen opcionales en el esquema. No se verificó el estado de documentos heredados.

**Migraciones/entornos: NO CUMPLE en reproducibilidad; separación real NO VERIFICADA.** No hay historial ejecutable de migraciones ni seed de negocio versionado. `src/scripts/createAdmin.js` inicializa una cuenta privilegiada, no un entorno completo; no se ejecutó. `modelo-datos.md:316` solo propone procedimiento. Ejemplo de env y guía distinguen desarrollo/producción, sin demostrar que cada despliegue use bases distintas. No hay respaldo/retención/restauración ejecutada documentada como evidencia reproducible. Tener Atlas no prueba respaldo habilitado.

**Flujo central: PARCIAL con evidencia histórica.** `bitacora/semana-3.md:19` registra cliente ficticio + pieza L300 → pedido directo → recarga → pago/entrega ficticios → resumen conciliado. Es un reporte histórico explícito; no se repitió. Por código: datos de entrada → validación en servicio → consulta de referencias/propietario → apartado condicional → creación → consultas por vendedor → cambios de estados → resúmenes. Hay errores 400/404/409 y conversión a 500 en controladores. La reserva de pieza, cantidad unitaria y transición de live añaden negocio al CRUD.

No hay paginación de listados operativos ni públicos; los filtros frontend cargan conjuntos completos. Resúmenes usan reduce en Node, no agregación acotada en MongoDB (`resumenService.js:25`). Sin mediciones no se afirma lentitud actual, solo crecimiento sin límites. No se encontraron índices declarados para todos los filtros/ordenamientos por vendedor, estado y fecha; el compuesto de código no sustituye cada patrón. No se ejecutó explain ni carga.

Fechas: campos Date y timestamps; `liveService.js:78` rechaza fechas inválidas. La UI convierte fechas localmente y muestra con es-HN; locale no fija por sí solo America/Tegucigalpa. No hay política uniforme de zona de negocio demostrada. Dinero: precio del pedido se copia como instantánea y no cambia automáticamente con el catálogo, pero el vendedor puede editarlo sin historial.

## 8. Arquitectura y modelo de datos

Estructura: `backend/server.js` carga entorno y espera conexión; `src/expressApp.js` monta API/CORS; `config/`, `middlewares/`, `routes/`, `controllers/`, `services/`, `repositories/`, `models/`, `scripts/`; `backend/test/`. Frontend: `src/app/pages/`, `services/`, rutas/configuración raíz, `environments/`, `public/` y script de configuración. `docs/` contiene entregas y evidencias; `scripts/publicar-backlog.ps1` publica Issues y no fue ejecutado; `output/` y `tmp/` incluyen investigación y renderizados, no módulos del negocio.

| Colección / modelo | Atributos principales y relaciones |
|---|---|
| usuarios / User | nombre, email normalizado, hash password, rol admin/vendedor/cliente, estado; email único declarado. `models/users.js:3`. |
| clientes / Cliente | nombre obligatorio, teléfono, dirección, vendedorId requerido; vendedor 1:N clientes. `models/clientes.js:3`. |
| productos / Producto | vendedorId, código opcional en esquema/generado por servicio, nombre, descripción, categoría, foto, precio≥0, estado; vendedor 1:N productos. Unique parcial `(vendedorId,codigo)`. `models/productos.js:3`, `:57`. |
| lives / Live | vendedorId, nombre, descripción, fecha opcional, estado; vendedor 1:N lives. `models/lives.js:3`. |
| pedidos / Pedido | vendedorId y clienteId requeridos; productoId y liveId opcionales; nombre histórico, cantidad, precio, pago, entrega, observaciones. Cliente 1:N pedidos; live 1:N pedidos con asociación opcional; producto puede ser referenciado por N pedidos según esquema. `models/pedidos.js:3`. |
| perfiles_vendedores / PerfilVendedor | vendedorId requerido/único, nombre público, descripción, enlaces sociales/WhatsApp/live, activo; vendedor 1:0..1 perfil. `models/perfilVendedor.js:3`. |

Todas usan `_id` y timestamps. Índices adicionales declarados: email y vendedorId del perfil, además del compuesto de producto; `_id` identifica documentos. Existencia efectiva en servidor NO VERIFICADA. El esquema no tiene UNIQUE pedido por pieza; la exclusión inicial depende del estado del producto. No hay N:M materializada ni detalle de pedido: cada pedido es una línea, no una cesta multirenglón. Una cuenta compradora no tiene enlace automático al Cliente del directorio.

Módulos y dependencias: auth/usuarios → identidad; clientes/productos/lives → pedidos; pedidos/lives → resumen; usuarios/perfiles/productos/lives → publicación. Rutas privadas: `/api/usuarios` solo admin; `/api/clientes`, `/api/productos`, `/api/lives`, `/api/pedidos`, `/api/resumen`, `/api/perfil-vendedor` solo vendedor; `/api/auth/me` autenticada; registro/login y `/api/public/catalogo`, `/api/public/explorar` públicas. Las nueve familias de dominio tienen capas homónimas; auth es la excepción indicada.

## 9. Seguridad e integridad

Controles presentes: bcrypt con costo 10, JWT firmado con secreto de entorno y caducidad de un día, usuario activo consultado en cada petición protegida, rol validado en backend y vendedor obtenido del usuario autenticado (`pedidoController.js:3`). Los repositorios privados filtran propietario, y los servicios seleccionan campos permitidos en lugar de aceptar vendedorId del cuerpo. Password usa select:false y se excluye del JSON. CORS se limita a orígenes configurados (`expressApp.js:17`), pero no sustituye autorización.

Brechas comprobables estáticamente:

- Reserva y creación separadas; compensación no cubre caída de proceso ni garantiza resultado tras error de red ambiguo. MongoDB garantiza atomicidad por documento, no convierte dos escrituras independientes en una transacción. [Documentación MongoDB](https://www.mongodb.com/docs/manual/core/transactions/).
- Eliminar pedido borra antes de liberar; puede perderse historial incluso si estaba pagado/entregado. No hay bitácora financiera, motivo o estado cancelado (`pedidoService.js:313`).
- Cliente/producto/live/vendedor: consultar dependencias y eliminar son operaciones separadas. Otra petición puede crear referencia en la ventana intermedia. La regla de un live activo usa buscar y luego actualizar, sin índice exclusivo (`liveService.js:53`).
- Algunos repositorios devuelven éxito simulado/ausencia de dependencias cuando `readyState !== 1`: `pedidoRepository.js:63`, `clienteRepository.js:40`, `userRepository.js:37`. Son fallbacks dentro de producción, no garantías de recuperación. Una reconexión puede permitir continuar con comprobaciones insuficientes; no se reprodujo.
- El GET de perfil puede crear un documento si no existe (`perfilVendedorService.js:17`): por eso no se consultó ese endpoint como lectura segura.
- Exploración devuelve visible si el mapa de vendedores activos está vacío (`explorarPublicoService.js:13`): con cero vendedores activos y perfiles/eventos remanentes puede publicar referencias de cuentas inactivas. No demuestra exposición de clientes/pedidos privados, pero sí filtro de visibilidad permisivo.
- Number admite redondeo binario; los servicios aceptan coerciones como `Number(true)` para importes y cantidades textuales sin exigir entero en pedidos sin pieza (`pedidoService.js:33`). Estado/cantidad tienen defaults sin required; no se certifica rechazo de todo null en esquema.
- JWT en localStorage (`auth.service.ts:38`) queda accesible a scripts del origen; no se encontró rate limiting en login/registro, política de fortaleza/formato email en backend ni revocación explícita por cierre de sesión/cambio de contraseña. No se confirmó una explotación XSS ni acceso indebido. Las rutas Angular no tienen canActivate (`app.routes.ts:18`); la API sigue siendo la barrera efectiva.
- Los controladores devuelven error.message en errores internos (`pedidoController.js:5`, `authController.js:63`). Puede divulgar detalles de validación/infraestructura; no se observaron secretos en respuestas reales.

Secretos: `.env` existe localmente y está ignorado; `git ls-files` no lo lista y el historial por esa ruta no mostró commits. `.env.example` tiene placeholders y nombres públicos. La búsqueda limitada de patrones de URI con credenciales, tokens comunes y claves privadas en fuentes/docs/README no devolvió coincidencias. No es análisis exhaustivo de todos los blobs históricos, artefactos, capturas, logs o paneles. El token académico solo se contabiliza como presente, sin reproducir su contenido. Se desconoce la política real de acceso Atlas y rotación de secretos.

## 10. Evaluación MongoDB frente a PostgreSQL

| Dimensión | Mantener MongoDB | Considerar PostgreSQL |
|---|---|---|
| Relaciones | Modelo existente encaja, pero referencias entre seis colecciones requieren controles de aplicación. | FK y claves compuestas pueden imponer existencia/pertenencia desde el motor. |
| Integridad | Índices únicos, validadores de colección y transacciones pueden mejorar garantías; no están todos demostrados. | NOT NULL, UNIQUE, CHECK y FK facilitan expresar reglas estructurales; saldos y reservas siguen necesitando diseño transaccional. |
| Transacciones | Soporta multidocumento en topologías compatibles; confirmar despliegue y manejo de sesiones/reintentos. | Facilita unidad transaccional SQL; no elimina carreras por sí solo. |
| Consultas/reportes | Agregaciones posibles; hoy se carga y reduce en aplicación. | JOIN y agregación relacional son apropiados para pedidos, pagos y trazabilidad. |
| Escala | No hay carga medida que exija distribución ni justifique elegir por escalabilidad teórica. | Tampoco hay evidencia que exceda una instancia relacional; indexación/paginación importan en ambos. |
| Dinero | Decimal128 o centavos con aritmética coherente; Number actual es brecha. | NUMERIC/DECIMAL permite exactitud decimal; cuidar transporte/API y evitar convertir otra vez a flotante. |
| Costos/hosting | Reutiliza Atlas y configuración documentada; límites, respaldos y costo real NO VERIFICADOS. | Exige seleccionar alojamiento y estimar cómputo, backups y operación; no se asumen tarifas ni gratuidad. |
| Operación | Menor cambio inmediato; sigue pendiente reproducibilidad, respaldo y observabilidad. | Nueva operación, migraciones y aprendizaje; herramientas relacionales no sustituyen restauración probada. |
| Migración | Evita conversión inmediata de documentos e identificadores heredados. | Revisar ObjectId, relaciones opcionales, códigos ausentes, null/defaults, referencias huérfanas, estados y montos; convertir con conciliación y plan de retorno. |
| Riesgo de datos | Persisten ventanas de inconsistencia si se mantiene código actual. | Riesgo de pérdida/duplicación al importar, mapear IDs o convertir dinero; no migrar antes de respaldo/restauración y pruebas de equivalencia. |
| Curso | Puede demostrar entidades, reglas y flujo, pero no implementa FK SQL por usar ref. | Alineación directa con terminología relacional; necesidad formal pendiente del docente. |

Fuentes técnicas: [transacciones MongoDB](https://www.mongodb.com/docs/manual/core/transactions/) y [restricciones PostgreSQL](https://www.postgresql.org/docs/current/ddl-constraints.html). La comparación es inferencia aplicada al modelo local, no benchmark ni cotización.

Clasificación: **Considerar PostgreSQL** antes de abonos. No hay fundamento suficiente para clasificar migración académicamente necesaria. `output/modulo3-reference/image2.png` dice que el modelo completo del ejemplo CitaFácil supera veinte tablas; pide modelar el producto completo, no fabricar veinte entidades para cualquier negocio. `image3.png` sí enfatiza integridad del motor y `image5.png` migraciones versionadas. Si el docente exige ejecutar SQL/FK/DDL, mantener solo MongoDB dejaría ese objetivo pendiente; confirmar por escrito si admite equivalencias. Si se mantiene MongoDB, seguirían pendientes transacciones/recuperación, validadores, pruebas reales, historial de cambios y la aceptación académica. No renombrar colecciones como tablas ni referencias como FK para simular cumplimiento.

## 11. Revisión de despliegue y PWA

`docs/PUBLICACION.md:16` describe Render Web Service backend, npm ci/npm start, health check `/`, sitio estático frontend, build:deploy, directorio `dist/mio/browser` y rewrite `/*`→`/index.html`. No hay render.yaml ni Dockerfile ni pipeline CI versionado encontrado. La configuración de panel real y el commit backend desplegado son NO VERIFICADOS. El health check confirma respuesta del proceso; por sí solo no demuestra que cada consulta de MongoDB siga funcionando.

Variables necesarias, sin valores: backend `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, `PORT`, `CORS_ORIGINS`; bootstrap administrativo `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`; build frontend `PUBLIC_API_URL`. El frontend no debe recibir secretos. `backend/server.js:8` falla si faltan URI/secreto. `configure-production.cjs:4` exige URL HTTPS pública sin credenciales y terminada en `/api`; escribe environment.production.ts, por eso no se ejecutó. El archivo versionado usa `/api` relativo: un build normal separado de la API depende de proxy o de usar el build de despliegue correcto.

HTTPS se declara en URLs y evidencia del 1 nov.; certificado actual, redirección HTTP, ausencia de contenido mixto, CORS real y rewrite NO VERIFICADOS. No se infiere caída del servicio a partir del fallo de la herramienta.

PWA: **viable técnicamente**, pendiente de validación de uso y alcance. La [guía oficial Angular](https://angular.dev/ecosystem/service-workers/getting-started) contempla paquete service-worker, registro, configuración de caché, manifest e iconos. Ninguno de esos elementos propios de PWA aparece configurado en este proyecto. Evaluar HTTPS, instalación por navegador/dispositivo, navegación interna, actualización y cierre de sesión. Instalar no implica poder registrar ventas offline: no hay cola, sincronización ni resolución de conflictos. Cachear respuestas privadas o permitir reservas desconectadas sin reglas puede perjudicar aislamiento e inventario; comenzar por definir alcance, no prometer operación offline. No se implementó nada.

Verificaciones manuales posteriores, bajo autorización independiente: (1) abrir frontend/API HTTPS y revisar certificado/contenido mixto; (2) recargar ruta interna y revisar URL de API/CORS; (3) comprobar commit desplegado en ambos servicios; (4) aceptar historia con cuentas/datos de prueba en entorno separado; (5) comprobar persistencia/reinicio y lectura cruzada de dos tiendas; (6) medir teléfono físico y latencia tras inactividad. Las pruebas que crean o cambian datos no se ejecutan en esta fase.

## 12. Documentación académica

Presentes: README, visión, bitácoras 1–3, mapa, backlog, plan de diez semanas, DoD, entrega de semana 2, notas de releases, registro local de Issues, modelo de datos y material de preparación 2/3. También requisitos, casos de uso, matriz de trazabilidad, revisión técnica, instrumento de entrevistas, plan anterior de ocho semanas, avance de ventas directas e investigación secundaria.

Calidad desigual: visión/modelo/backlog recientes reconocen límites correctamente; `academico/REQUISITOS.md` RF-11/RF-12 aún describen ausencia de productoId/live opcional, contradicha por `models/pedidos.js:11` y `:16`. RF-22 dice que borrar no libera pieza, contradicho por `pedidoService.js:322`. RF-28 aparece propuesto pese a existir resumen `todos` en backend; eso no acredita todo el dashboard de inventario pedido allí. `MATRIZ_DE_TRAZABILIDAD.md:33` conserva una descripción anterior de dos llamadas frontend; `live-activo.ts:285` ya envía productoId al backend. El método legado `apartarProductoSeleccionado` sigue definido en `:329`, pero no se vio invocado en ese recorrido: su presencia no demuestra doble llamada actual.

`PUBLICACION.md:3` y `:57` son texto de preparación que dice no publicado/no probado, mientras bitácoras posteriores documentan despliegue y pruebas. README semana-1 mantiene pendiente publicación. Conviene actualizar estados y fechas en la siguiente etapa; este informe no modifica documentos existentes. El plan de diez semanas sí aclara expresamente su precedencia sobre el antecedente de ocho semanas (`plan.md:3`).

## 13. Riesgos y deuda técnica

P0 propuestos por impacto potencial en datos: inconsistencia entre inventario/pedido y eliminación de historial comercial. Son riesgos sustentados en secuencia de código, no incidentes observados. No se encontró evidencia para afirmar pérdida real de datos, fuga de credenciales o explotación de permisos.

P1: referencias/estados vulnerables a carreras, dinero no exacto, falta de recuperación demostrada, pruebas reales de aislamiento/concurrencia pendientes y equivalencia académica sin confirmar. P2: reproducibilidad de despliegue, paginación, validación de tipos, coherencia documental, sesión y visibilidad pública. P3: limpieza de helpers legados, accesibilidad/idioma (`index.html:2` usa en con interfaz española), optimizaciones tras medir. No se recomienda reorganizar arquitectura ni instalar herramientas solo por preferencia.

La restricción de unas dos horas semanales en los documentos hace riesgoso comprometer simultáneamente piloto, abonos, migración y funciones públicas. Medir capacidad y priorizar con evidencia; no declarar terminado el corte 2 por tener un diagrama.

## 14. Matriz de cumplimiento académico

| Módulo / requisito | Estado | Evidencia o pendiente |
|---|---|---|
| M1 problema, segmento, propuesta e hipótesis | CUMPLE | `vision.md:5`, `:23`, `:43`; cumplimiento documental, no demanda validada. |
| M1 evidencia primaria de usuarios | NO CUMPLE | No entrevista/observación realizada documentada; guía y fuentes secundarias solamente. |
| M1 justificación de tecnología | PARCIAL | Continuidad documentada; faltan autenticación/archivos/costos operativos. |
| M1 README, visión y bitácora semana 1 | CUMPLE | Archivos presentes; bitácora tiene modificación local previa. |
| M1 .env.example | CUMPLE | `backend/.env.example`; ubicación correcta descrita en README. |
| M1 etiqueta semana-1 | CUMPLE local / NO VERIFICADO remoto | Tag local objeto abreviado `1dee0dc`; publicación no consultable. |
| M1 HTTPS y despliegue actuales | NO VERIFICADO | Evidencia histórica, acceso actual fallido desde herramienta. |
| M1 repositorio público | CUMPLE | Portada pública consultada; aceptación de repositorio reutilizado NO VERIFICADA. |
| M2 mapa por roles, tareas y dos cortes | CUMPLE | `mapa-historias.md:15`, `:25`, `:33`. |
| M2 ≥15 historias documentadas localmente | CUMPLE | HU-01–HU-18 en backlog, criterios y beneficios explícitos. |
| M2 ≥15 historias en GitHub Issues | NO VERIFICADO | 18 URLs locales; portada muestra 17 abiertas; cuerpos/total remoto no comprobados. |
| M2 aceptación verificable | PARCIAL | Criterios Dado/Cuando/Entonces; cobertura de negativos/permisos no uniforme. |
| M2 etiquetas MVP remotas | NO VERIFICADO | 11 declaradas localmente, sin inspección remota de etiquetas. |
| M2 priorización MVP, DoD y plan diez semanas | CUMPLE documental | backlog, definicion-de-hecho y `plan.md:13`; aceptación del usuario pendiente. |
| M2 una historia funcionando hoy en producción | NO VERIFICADO | HU-01 tiene evidencia del 1 nov.; no se repitió hoy. |
| M2 Issue cerrada y enlazada a commit | PARCIAL | Commit `ea2ba3d` contiene Closes #1; cierre remoto NO VERIFICADO. |
| M2 release semana-2 | NO VERIFICADO remoto | Etiqueta local `ea2ba3d`; notas de release locales no prueban publicación. |
| M2 bitácora semana-2 | CUMPLE | Archivo presente. |
| M2 ≥10 commits y ≥3 recientes | CUMPLE local | 21 totales, 7 recientes en diez fechas hasta 4 nov.; portada remota coincide en total, fechas remotas sin inspección individual. |
| M2 token académico en README | CUMPLE presencia | Detectado sin reproducir su contenido. |
| M3 modelo completo Mermaid y diccionario | CUMPLE documental | `modelo-datos.md`: actual y futuro diferenciados; no acredita implementación futura. |
| M3 >20 tablas obligatorias | NO VERIFICADO como requisito | Captura usa esa cantidad para el ejemplo; no imponer mínimo no demostrado. |
| M3 PK/uniqueness, valores y referencias | PARCIAL | Índices declarados y validación ODM/backend; FK de motor no implementadas. |
| M3 dinero exacto y zona coherente | NO CUMPLE dinero / PARCIAL fechas | Number y conversión local; sin política uniforme demostrada. |
| M3 migraciones y seed reproducibles | NO CUMPLE | No implementación encontrada; hay procedimiento propuesto. |
| M3 respaldo y restauración | NO VERIFICADO | No evidencia operacional ni panel inspeccionado. |
| M3 flujo central real actual | PARCIAL | Código y reporte del 1 nov.; nueva prueba de producción NO VERIFICADA. |
| M3 permisos/concurrencia reales | NO VERIFICADO | Filtros y mocks presentes; no prueba HTTP/DB real durante auditoría. |

## 15. Hallazgos priorizados

Cada registro distingue requisito/estado, evidencia, riesgo, impacto académico (A), impacto técnico/comercial (T), recomendación y prioridad. Las prioridades de este informe usan P0 crítico/P1 alto/P2 medio/P3 bajo; no equivalen automáticamente a las etiquetas P0 del backlog, donde significan esencial.

| ID / módulo / requisito / estado | Evidencia concreta | Riesgo e impactos | Recomendación / prioridad |
|---|---|---|---|
| H01 · M3 · unidad reserva/pedido · PARCIAL | `backend/src/services/pedidoService.js:141`, `:151`, `:164`; `repositories/pedidoRepository.js:68` | Caída o resultado ambiguo entre escrituras deja reserva huérfana o compensación incorrecta. A: no acredita integridad completa. T: inventario bloqueado/inconsistente. | Diseñar unidad transaccional o recuperación explícita con idempotencia y reconciliación, probar en base aislada. **P0**. |
| H02 · M3 · conservar historial comercial · NO CUMPLE | `pedidoService.js:313`, `pedidoRepository.js:35` | Borrado físico de pedido pagado/entregado elimina evidencia; liberar después puede fallar. A: trazabilidad incumplida. T: pérdida de historial/totales y disponibilidad incorrecta. | Acordar cancelación, conservación y corrección; impedir pérdida silenciosa antes de uso financiero. **P0**. |
| H03 · M3 · referencias y exclusividad live · PARCIAL | `clienteService.js:87`, `:99`; `liveService.js:53`; `userService.js:185` | Comprobar y escribir separado permite carreras. A: ref no equivale a FK. T: referencias huérfanas o dos lives activos. | Formalizar invariantes y restricciones/transacciones compatibles; probar carreras de alta/borrado y estados. **P1**. |
| H04 · M3 · fallar de forma segura sin conexión · NO CUMPLE | `pedidoRepository.js:63`, `:81`; `clienteRepository.js:40`; `userRepository.js:37` | Fallbacks simulan éxito o ausencia de relaciones. A: pruebas pueden ocultar garantías faltantes. T: reconexión puede continuar desde una comprobación falsa. | Separar mocks de repositorios productivos y definir fallo/reintento explícito; verificar sin tocar producción. **P1**. |
| H05 · M3 · exactitud monetaria · NO CUMPLE | `models/pedidos.js:39`; `resumenService.js:18` | Aritmética flotante y precio editable sin historial. A: brecha frente a captura de dinero exacto. T: discrepancias al sumar pagos futuros. | Elegir representación exacta, redondeo y trazabilidad antes de abonos; no convertir históricos automáticamente. **P1**. |
| H06 · M3 · reproducibilidad y recuperación · PARCIAL | `modelo-datos.md:316`; ausencia de migraciones/seed; createAdmin no es seed de negocio | Recuperación no demostrada y cambios de estructura no repetibles. A: faltan migraciones ejecutables. T: pérdida prolongada ante fallo. | Inventariar backups/retención y probar restauración aislada; diseñar migraciones/fixtures versionados. **P1**. |
| H07 · M1/M3 · validación del problema y reglas · NO CUMPLE evidencia primaria | `vision.md:21`, `:49`; instrumento de entrevistas sin respuestas | Se construye sobre reglas no contrastadas. A: fundamentos empíricos incompletos. T: baja adopción o cancelación/pago equivocados. | Observar flujo y entrevistar vendedores con ejemplos anonimizados; medir captura. **P1**. |
| H08 · M2/M3 · pruebas de aceptación e integridad · PARCIAL | `backend/test/integridad-relaciones.test.js:28`; cinco pruebas pasaron; `app.spec.ts:21` espera título ausente en app.html | Nombre de prueba dice reserva atómica pero solo usa mocks; frontend contiene expectativa aparentemente obsoleta y posibles providers faltantes en login/register spec. A: no certificar flujo global. T: regresiones inadvertidas. | Diseñar pruebas HTTP/multitienda/concurrencia/fallos en entorno aislado y revisar pruebas frontend. No se afirma ejecución/fallo actual de estas últimas. **P1**. |
| H09 · M1/M3 · visibilidad de vendedor · PARCIAL | `explorarPublicoService.js:13` | Mapa vacío permite todos los vendedores, incluso referencias remanentes de inactivos. A: regla de estado no completa. T: publicación indebida de perfil/eventos, sin demostrar fuga de pedidos. | Hacer explícita política ante cero activos y comprobar inactivación/cambio de rol/eliminación. **P2**. |
| H10 · M1/M3 · GET sin efectos persistentes · NO CUMPLE | `perfilVendedorRoutes.js:15`; `perfilVendedorService.js:17` | Consultar perfil puede crearlo, e incluso competir con otra consulta por índice único. A: semántica API. T: lecturas inesperadamente mutantes. | Separar lectura de inicialización y documentar contrato; no consultar como read-only mientras tanto. **P2**. |
| H11 · M1/M3 · sesión y endurecimiento auth · PARCIAL | `authController.js:19`, `:33`; `auth.service.ts:38`; `expressApp.js:17` | Sin límites de intentos encontrados, política débil de entrada y token accesible a JS. A: seguridad requiere más evidencia. T: abuso de autenticación/robo de sesión si existe XSS. | Definir amenazas y controles de sesión/entrada/abuso; conservar validación efectiva en API. **P2**. |
| H12 · M3 · tipos, cantidad y fechas · PARCIAL | `pedidoService.js:33`; `models/pedidos.js:33`; `liveService.js:78` | Coerciones inesperadas, cantidad no entera sin pieza y presentación dependiente de zona local. A: restricciones no equivalentes al motor. T: registros ambiguos. | Precisar tipos, null, cantidades y zona; probar límites backend además del formulario. **P2**. |
| H13 · M3 · consultas eficientes · PARCIAL | `pedidoRepository.js:11`; `resumenRepository.js:25`; `pages/pedidos/pedidos.ts:497` | Listados/filtrado sin límite; índices por consulta no completos. A: rendimiento sin demostrar. T: crecimiento de latencia/memoria. | Medir volumen real, diseñar paginación, proyecciones/agregación e índices desde consultas. **P2**. |
| H14 · M1/M2/M3 · trazabilidad documental · PARCIAL | REQUISITOS RF-11/12/22; `MATRIZ_DE_TRAZABILIDAD.md:33`; `README.md:14` | Descripciones anteriores contradicen implementación/evidencia reciente. A: defensa y evaluación confusas. T: planificar trabajo duplicado. | Actualizar estados/referencias conservando fecha y fuente de verdad; no declarar futuros como hechos. **P2**. |
| H15 · M1/M2 · publicaciones y HTTPS actuales · NO VERIFICADO | Tags locales, Closes #1, evidencias del 1 nov.; consultas remotas fallidas | Sin confirmar cierre, etiquetas, releases ni estado actual Render. A: posible requisito pendiente de comprobar. T: demo incierta. | Verificar recursos remotos específicos y commit desplegado con acceso de lectura. **P1** por entrega. |
| H16 · M1 · reproducibilidad de despliegue · PARCIAL | `PUBLICACION.md:16`; `configure-production.cjs:4`; sin blueprint encontrado | Configuración depende de panel; build normal puede apuntar a /api relativa en sitio separado. A: entrega difícil de reproducir. T: fallo de API por build equivocado. | Verificar parámetros efectivos y documentar versión Node/comandos sin secretos; decidir después si versionar despliegue. **P2**. |
| H17 · M3 · equivalencia académica de persistencia · NO VERIFICADO | Capturas image2/3/5 y `modelo-datos.md:324` | Confundir ejemplo de 20 tablas con obligación, o ignorar FK/migraciones exigidas. A: riesgo de incumplimiento importante. T: migración innecesaria o tardía. | Confirmar rúbrica con docente y documentar decisión comparativa antes de dinero. **P1**. |
| H18 · M1 · secretos y entorno reales · NO VERIFICADO global | .env ignorado; búsqueda limitada sin coincidencias; `server.js:8` | No se conoce fortaleza/rotación, permisos Atlas ni todo el historial. A: seguridad no certificable. T: exposición si existen artefactos no revisados. | Revisión autorizada de historial/paneles con salidas redactadas; no asumir filtración ni rotar sin evidencia/alcance. **P2**. |
| H19 · M1 · PWA · NO CUMPLE implementación | `angular.json:16`, `app.config.ts:7`, `index.html:3`; sin manifest/SW | No hay instalación configurada; offline mal diseñado agravaría reservas. A: viabilidad estudiada, implementación no requerida aquí. T: oportunidad móvil pendiente. | Validar necesidad y alcance online/instalable antes de implementar. **P3**. |

## 16. Preguntas pendientes para el responsable del proyecto o docente

1. ¿La evaluación exige SQL ejecutable con FK/NOT NULL/CHECK/migraciones, o acepta equivalencia MongoDB demostrada? ¿Hay cantidad mínima de entidades o solo el ejemplo de CitaFácil?
2. ¿Se permite reutilizar este repositorio y su historial anterior? ¿Cuáles son fechas y criterios exactos de evaluación de cada semana?
3. ¿Un viewport móvil satisface la entrega o debe acreditarse un teléfono físico, como indica la DoD?
4. ¿Qué proveedor/topología/versión, restricciones, permisos, backups y procedimiento de restauración usa realmente cada entorno? No aportar secretos al informe.
5. ¿Qué commits frontend/backend están desplegados y están publicados los tags y releases? ¿Issue #1 está cerrada y HU-01–HU-11 tienen MVP?
6. ¿La tienda necesita ventas solo de piezas únicas o admite cantidades de productos repetidos? ¿Cómo identifica compradores homónimos y quién opera el sistema?
7. ¿Qué significa cancelar con dinero recibido, entregar pendiente y corregir un pago? ¿Debe conservarse toda venta histórica y quién autoriza cambios?
8. ¿Se necesita cuenta de comprador/catálogo público, instalación PWA u operación offline para el primer piloto? ¿Qué resultado real y tiempo de uso justifican cada capacidad?
9. ¿Dos horas semanales siguen siendo la capacidad disponible? ¿Qué parte del segundo corte puede comprometerse después de cerrar riesgos del primero?

## 17. Recomendaciones para la siguiente etapa

Cinco acciones propuestas, no ejecutadas:

1. **Cerrar la incertidumbre académica y de evidencia:** confirmar rúbrica, equivalencia de MongoDB, repositorio reutilizado y móvil; consultar Issues, etiquetas, releases y commits desplegados con acceso de lectura. Resultado: matriz con evidencia verificable y pendientes precisos.
2. **Validar el trabajo real de una tienda:** observar preparación, apartado, pago y entrega; obtener ejemplos anonimizados y medir cinco capturas. Resultado: hipótesis contrastadas y reglas de dinero/cancelación/entrega acordadas, sin cerrar todavía el MVP por intuición.
3. **Preparar una verificación aislada y recuperable:** identificar bases/roles, comprobar backup/restauración y planear fixtures y migraciones reproducibles. Resultado: entorno donde se puedan probar fallos sin tocar datos reales.
4. **Decidir consistencia y persistencia con un caso concreto:** evaluar reserva simultánea, caída entre escrituras, borrado con referencias y precio histórico; comparar costo/operación/equivalencia de MongoDB y PostgreSQL. Resultado: decisión registrada antes de abonos, con prueba de aceptación y estrategia de recuperación/migración si procede.
5. **Aceptar el flujo principal y ordenar su documentación:** priorizar correcciones P0/P1, verificar API/multitienda/producción autorizada y teléfono físico, y reconciliar requisitos/backlog/modelo con el comportamiento real. Resultado: un recorrido defendible antes de sumar funciones complementarias.

Conviene conservar el catálogo con código por tienda, directorio, pedidos directos y por live, separación por vendedor y resúmenes básicos. Todavía no debe decidirse migración definitiva, ampliación a marketplace, eliminación del rol comprador, reglas de abonos/cancelación, operación offline ni cantidad artificial de entidades. No se implementó ninguna recomendación ni se modificaron archivos existentes.
