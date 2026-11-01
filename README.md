# MIO

Aplicación web para organizar clientes, piezas únicas y pedidos de tiendas que venden por redes sociales o transmisiones en vivo.

Token de propiedad del curso: `LEARN-CAP-D03DECFA`

## Entrega de la semana 1

- Aplicación: https://mio-web.onrender.com
- Repositorio: https://github.com/TonyBSosa/Mio
- API: https://mio-api-ahq2.onrender.com
- [Visión, problema, evidencia, Lean Canvas, hipótesis y alcance](docs/vision.md).
- [Bitácora de la semana 1](docs/bitacora/semana-1.md).
- Versión requerida por el curso: etiqueta o release `semana-1` (pendiente de publicar).

## Preparación de la semana 2

- [Mapa de historias por rol y cortes](docs/mapa-historias.md).
- [Backlog: 18 historias y criterios de aceptación](docs/backlog.md).
- [MVP y plan de diez semanas](docs/plan.md).
- [Definición de Hecho](docs/definicion-de-hecho.md).
- [Lista de entrega y aceptación de la primera historia](docs/ENTREGA_SEMANA_2.md).
- [Bitácora de semana 2](docs/bitacora/semana-2.md).
- [Estudio previo al reto del módulo 2](docs/academico/PREPARACION_RETO_MODULO_2.md).

El [backlog está publicado en GitHub Issues](https://github.com/TonyBSosa/Mio/issues): 18 historias, 11 del MVP. HU-01 fue [verificada en producción](docs/evidencias/HU-01-produccion.md), incluyendo códigos por tienda y vista móvil. Versión de entrega: [semana-2](https://github.com/TonyBSosa/Mio/releases/tag/semana-2).

## Entrega de la semana 3

- [Modelo de datos completo en Mermaid y diccionario](docs/modelo-datos.md).
- [Bitácora y flujo central con persistencia real](docs/bitacora/semana-3.md).
- [Repaso del módulo 3 con ejemplos de MIO](docs/academico/PREPARACION_RETO_MODULO_3.md).
- Versión de entrega: [semana-3](https://github.com/TonyBSosa/Mio/releases/tag/semana-3).

El modelo distingue las seis colecciones implementadas del diseño futuro. Continúa MongoDB; no se ejecutó una migración ni se implementaron abonos como parte de esta entrega.

## Estado del prototipo

Prototipo publicado con registro/inicio de sesión, clientes, catálogo de productos, eventos live, pedidos con o sin live y resúmenes. Los pedidos se capturan manualmente; MIO no transmite video ni lee comentarios de redes sociales automáticamente. Los pagos actuales se clasifican como pendientes o pagados; no hay registro de abonos parciales.

El despliegue y la conexión con MongoDB se observaron en los registros de Render compartidos durante la preparación. Las pruebas de servicio usan repositorios simulados; no certifican concurrencia ni integridad de la base real. La validación con tiendas sigue pendiente.

## Tecnologías y ejecución local

Angular 21 y TypeScript para la interfaz; Node.js, Express 5, Mongoose 9 y MongoDB para la API y persistencia. Se requiere una versión de Node compatible con las dependencias de ambos package.json y npm.

1. Desde `backend`, ejecutar `npm ci`.
2. Copiar `backend/.env.example` a `backend/.env`; configurar `MONGO_URI` para una base de desarrollo y un `JWT_SECRET` propio. No versionar el archivo `.env`.
3. Desde `backend`, ejecutar `npm run dev` (API local en el puerto 3000, salvo configuración distinta).
4. Desde `frontend`, ejecutar `npm ci` y `npm start` (interfaz en http://localhost:4200).

La configuración local de Angular utiliza http://localhost:3000/api. En Render, `npm run build:deploy` genera la configuración pública a partir de `PUBLIC_API_URL`. Credenciales y conexión MongoDB permanecen exclusivamente en el backend. Desarrollo y producción deben usar bases y secretos distintos.

## Verificación

- Backend: ejecutar `npm test` desde `backend`.
- Frontend: ejecutar `npm run build` desde `frontend`.
- Despliegue: consultar [PUBLICACION.md](docs/PUBLICACION.md).
- Prueba manual de entrega: registrar un vendedor de prueba, iniciar sesión, crear cliente y producto, registrar pedido y recargar una ruta interna. Documentar el resultado antes de afirmar que todo el flujo está verificado.

En el plan gratuito la API puede suspenderse por inactividad; abrirla antes de una demostración.
