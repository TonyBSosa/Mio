# MIO — Diagnóstico y corrección del fallo nativo de Angular Build

Fecha: 2026-11-19, America/Tegucigalpa.

## 1. Resultado y causa comprobada

**Resuelto en el entorno local:** `npm run build` termina en código 0 y genera distribución de producción, conservando optimización, presupuestos y dependencias. `npm run build:deploy` también termina en 0. No hubo despliegue.

La causa inmediata se aisló al acceso al entorno persistente LMDB de la caché de Angular que permanecía ocupado por un `ng build` anterior de MIO. Windows Restart Manager identificó el proceso Node PID 3156, iniciado a las 08:48:53, ejecutando el CLI de este frontend con argumento build; su padre era cmd.exe PID 6824 ejecutando ng build. Se detuvo exclusivamente ese proceso de compilación, tras verificar PID, ejecutable y ruta. Después se pudo abrir la misma base LMDB y compilar con la caché original, sin actualizar paquetes ni desactivar optimizaciones.

**Límite de la conclusión:** se comprobó el entorno/camino que provoca el cierre y la intervención que lo elimina. No hay dump nativo ni stack simbolizado que permita atribuir la instrucción exacta de acceso inválido a una función C++ concreta. No se afirma que toda compilación concurrente falle, que LMDB no admita concurrencia o que los bytes de su base estuvieran corruptos: las copias de datos y de bloqueo se abrieron correctamente. El origen preciso del estado anómalo del build anterior sigue sin determinarse.

El código negativo -1073741819 equivale al DWORD 3221225477, hexadecimal 0xC0000005. La captura con spawnSync identificó ese código en el proceso hijo **node.exe**, no en npm ni en esbuild.exe. Una reproducción mínima sin Angular también cerraba node.exe al abrir la caché LMDB original.

## 2. Versiones y compatibilidad

| Componente instalado | Versión / arquitectura |
|---|---|
| Node.js | 24.14.0, win32 x64; ABI de módulos 137, N-API 10 |
| npm | 11.9.0 |
| Angular CLI | 21.2.14 |
| @angular/build | 21.2.14 |
| Angular core/common/compiler/compiler-cli/forms/platform-browser/router | 21.2.16 |
| TypeScript | 5.9.3 |
| esbuild / @esbuild/win32-x64 | 0.27.3 |
| lmdb / @lmdb/lmdb-win32-x64 | 3.5.1 |
| msgpackr | 1.11.13 |
| msgpackr-extract / binario win32-x64 | 3.0.4 |
| sass | 1.97.3 |
| @parcel/watcher / binario win32-x64 | 2.5.6 |
| vite | 7.3.2 |
| rollup / binario win32-x64-msvc | 4.61.1 |

La [matriz oficial de Angular](https://angular.dev/reference/versions) admite Node 24 y TypeScript >=5.9 <6 para Angular 21. Los engines de los paquetes instalados también aceptan Node 24.14.0/npm 11.9.0. npm ls no informó conflictos de versiones en las consultas realizadas. CLI/build y framework pertenecen a la misma línea minor; no fue necesario igualar parches. La [política de Angular](https://angular.dev/reference/releases) documenta compatibilidad ABI del compilador entre parches de una misma minor.

El host es Windows x64. No se completó la lectura de la versión exacta del SO mediante CIM por restricción de acceso del entorno; no es necesaria para afirmar que el binario instalado coincide con la arquitectura de Node.

## 3. Integridad de binarios

No se reinstaló node_modules, no se ejecutó npm update y no se modificó package-lock.json.

Se descargaron del registro npm los paquetes nativos de las versiones ya instaladas, usando npm pack con ignore-scripts. Se comprobó SHA-512 del tarball contra la integridad fijada en package-lock y SHA-256 del ejecutable/addon instalado contra el archivo del tarball oficial. Ambos coincidieron. Sus cabeceras PE indican máquina 0x8664 (x64).

| Archivo instalado | SHA-256 |
|---|---|
| @lmdb/lmdb-win32-x64/node.napi.node | 35a0b137cfee86bcef943929a6448b86e87f225d7b97f82a85fc28f109d70138 |
| @esbuild/win32-x64/esbuild.exe | f0dd2091eaf58d11b96c64e0c4516f8ecf94486a28d2a8e7a968bd6770db3ffe |

Una transformación TypeScript mínima con esbuild terminó en 0. Importar lmdb y crear/escribir/leer/cerrar una base sintética nueva también terminó en 0. No se identificó un binario de esbuild/LMDB descargado para otra plataforma ni alterado respecto de npm. Esto no es una auditoría de todos los archivos de node_modules.

## 4. Reproducción y aislamiento

Las pruebas aisladas usaron directorios de salida nuevos, sin borrar datos. Las modificaciones temporales de angular.json para seleccionar caché de prueba se restauraron byte a byte en finally.

| Comprobación | Resultado |
|---|---|
| Build desarrollo con caché original, antes del arreglo | Node 3221225477 / 0xC0000005, sin diagnóstico TS |
| Build producción con caché original, antes del arreglo | Mismo cierre nativo |
| Build desarrollo con caché persistente nueva | Código 0, distribución generada |
| Reutilización de esa caché nueva | Código 0 |
| Compilación sin paralelismo TS, caché original | Mismo cierre nativo; no lo resuelve reducir trabajadores |
| Instrumentación de LmdbCacheStore | Último marcador: get, before, threadId 0; sin marcador after |
| Apertura de LMDB original fuera de Angular | Node 3221225477 antes de completar open |
| Copia solo de datos LMDB en ruta nueva | Apertura/lectura/cierre en 0 |
| Copia de datos y archivo lock en ruta nueva | Apertura/lectura/cierre en 0 |
| Acceso ordinario de Node r/r+ a archivos originales | Permitido; atributos Archive, no ReadOnly |
| Intento de respaldar caché mediante Move-Item | Falló por archivo usado por otro proceso |
| Restart Manager sobre db y db-lock | Identificó únicamente Node PID 3156, ng build de MIO |
| Tras detener ese build: apertura de LMDB original | Código 0 |
| npm run build tras detenerlo | Código 0, producción optimizada |
| Restaurar .tsbuildinfo original y repetir npm run build | Código 0; no depende de eliminar metadatos incrementales |

La prueba temporal sin caché logró completar la compilación en memoria, pero terminó en 127 por EPERM al crear su directorio browser en el sandbox. No se cuenta como build aprobado y no se convirtió en una configuración permanente.

El intento de Move-Item no fue completamente atómico: desplazó .tsbuildinfo a una carpeta de respaldo y falló en archivos abiertos. Se preservó ese respaldo, se guardó copia del metadato regenerado y se volvió a probar tras restaurar el original. Los archivos LMDB originales se mantuvieron en su ubicación. No se borró la caché.

En el código instalado de Angular, LmdbCacheStore.get abre perezosamente el entorno mediante lmdb.open. La traza before/get, junto con la reproducción mínima de open fuera de Angular, localiza el fallo en esa ruta de caché, antes de que el build pueda entregar un error de compilación normal. El fallo no exige ejecutar esbuild, minificar, descargar fuentes ni compilar componentes de negocio.

## 5. Eventos y registros de Windows

Se intentó leer Application Error mediante Get-WinEvent: primero hubo denegación de acceso; una consulta con permisos ampliados falló al resolver recursos del proveedor. La consulta mediante la utilidad oficial wevtutil pudo ejecutarse. Al filtrar expresamente Application Error/EventID1000 por AppName node.exe/esbuild.exe no se obtuvieron registros coincidentes disponibles.

Por ello no se atribuye un módulo faulting ni un offset basándose en el Visor de eventos. La ausencia de registro no demuestra ausencia del cierre: el código nativo del proceso se observó directamente. No se habilitaron dumps globales, no se cambió Windows Error Reporting ni se inspeccionó memoria que pudiera contener secretos.

Restart Manager se utilizó en modo de consulta; no se llamó RmShutdown ni se cerraron aplicaciones de forma masiva. El único proceso detenido fue el build local identificado. No se detuvo el backend ni se manipuló MongoDB.

## 6. Corrección realizada

La intervención fue de entorno:

1. Identificar qué proceso mantenía los archivos de caché abiertos y comprobar su ruta, argumentos y antigüedad.
2. Detener exclusivamente ese ng build anterior.
3. Repetir build normal con la caché original; verificar apertura LMDB y salida 0.
4. Restaurar metadatos incrementales originales y repetir build para descartar que el éxito dependiera de retirarlos.
5. Conservar las pruebas aisladas y copias en frontend/tmp/diagnostico-build-2026-11-19, excluido de Git por la regla /tmp del frontend. No se eliminaron archivos para limpiar.

**Sin cambios funcionales ni de dependencias:** no se alteraron package.json, package-lock, angular.json, optimizaciones, budgets, scripts de build o componentes para eludir el fallo. El único archivo nuevo versionable de esta tarea es este informe. Los cambios existentes del Incremento 3 se conservaron.

No se añadió un script que mate procesos automáticamente ni una desactivación permanente de caché, fuentes u optimización. Si reaparece, identificar el dueño de los archivos antes de detener nada; no ejecutar taskkill contra todos los node.exe. Preferir Ctrl+C en la terminal del build anterior y esperar a que termine. Si no hay proceso residual identificado, recoger evidencia nueva en lugar de asumir la misma causa.

## 7. Validación final

| Comando ejecutado desde frontend | Resultado |
|---|---|
| npm run build | Código 0, repetido con caché original |
| npm run build:deploy | Código 0 |
| npm test -- --watch=false | 69 pruebas aprobadas, 9 archivos; código 0 |
| npx tsc --noEmit -p tsconfig.app.json | Código 0 |
| git diff de angular.json/package.json/package-lock/environment.production.ts | Sin cambios de contenido |

Se verificaron físicamente index.html, main y styles en dist/mio/browser. Build normal: main 869.83kB, styles 20.75kB, total inicial 890.58kB. Build deploy con URL pública: total inicial 890.61kB; index.html de 17833 bytes, main-NB5CN6UQ.js de 869863 bytes y styles-7Z4HS3WW.css de 20748 bytes durante esa validación.

Quedan advertencias, no errores, de presupuesto: bundle inicial superior al umbral de aviso de 500kB e inferior al límite de error de 1MB; estilos de bienvenida/live/resumen/catálogo/pedidos/productos/dashboard superiores a 8kB de aviso y dentro de su límite de error de 12kB. No se cambiaron esos umbrales ni los estilos en esta tarea.

La última repetición de npm run build genera el artefacto normal, cuyo environment.production.ts actual utiliza /api. No confundirlo con la distribución para frontend y API en dominios distintos. Render debe ejecutar build:deploy con PUBLIC_API_URL correcto, en vez de subir manualmente ese dist local.

Para comprobar build:deploy se suministró únicamente PUBLIC_API_URL=https://mio-api-ahq2.onrender.com/api, URL pública documentada del proyecto. Se guardó/restauró exactamente el archivo environment.production.ts y el valor previo de la variable de proceso. No se leyó ni cambió .env, JWT_SECRET, MONGO_URI ni credenciales SMTP. El script generó un artefacto local; no publica por sí solo.

## 8. Fuentes externas y Google Fonts

El fallo inicial ENOTFOUND al descargar Google Fonts era un error distinto, visible, de conectividad del sandbox. Con acceso de red autorizado, el build final integró las fuentes y terminó correctamente. No se deshabilitaron ni se atribuyó a Google Fonts el 0xC0000005.

Se consultaron reportes del repositorio de Angular sobre caché LMDB y cierres con Node24, pero no se tomaron como prueba del caso de MIO. En particular, el [reporte lmdb-js #359](https://github.com/kriszyp/lmdb-js/issues/359) describe macOS y semáforos de sandbox: no demuestra la causa de este Windows. La evidencia local tiene prioridad sobre similitudes entre incidencias.

## 9. Riesgos para Render y recomendaciones

Render utiliza un entorno Linux separado: npm ci instala los binarios de esa plataforma y no debe copiarse node_modules de Windows. Este fallo observado en el entorno LMDB local no demuestra un fallo de Render ni que su caché esté ocupada. No se abrió ni cambió el panel, caché o configuración de Render.

Para un despliegue futuro:

- Usar el lockfile actual y una versión de Node soportada por Angular21. No actualizar todas las dependencias como supuesto remedio.
- Usar npm ci y npm run build:deploy desde frontend, PUBLIC_API_URL HTTPS correcto y publicación de dist/mio/browser.
- No subir node_modules, .angular, frontend/tmp ni credenciales. Confirmar que no hay procesos de build anteriores compartiendo la misma caché en el mismo workspace.
- Asegurar conectividad de build a las fuentes externas. Un fallo DNS debe diagnosticarse como tal, sin ocultar optimizaciones.
- Tratar las advertencias de tamaño en una tarea de rendimiento separada, sin cambiar funcionalidad para solventar un cierre del entorno.
- Conservar la matriz operacional del Incremento 3: entrega de correo, soporte de pendientes, respaldo, revisión visual y activación histórica siguen pendientes. Resolver el build no certifica SMTP ni autoriza publicar automáticamente.

No hubo despliegues, migraciones, cambios productivos ni commits.
