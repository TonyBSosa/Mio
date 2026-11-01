# Semana 2 — Primera historia viva

MIO incorpora el mapa de historias por vendedor, administrador y comprador, con dos cortes horizontales; un backlog de 18 Issues con criterios Dado/Cuando/Entonces y 11 historias etiquetadas MVP; plan de diez semanas y Definición de Hecho.

Historia aceptada: [HU-01, identificar y buscar piezas por código](https://github.com/TonyBSosa/Mio/issues/1). Se comprobó en producción normalización, búsqueda, persistencia, rechazo de duplicados en la misma tienda, reutilización entre dos tiendas, rechazo de códigos inválidos y generación automática. Prueba responsive a 390 × 844; no equivale a teléfono físico.

- App: https://mio-web.onrender.com
- Evidencia y capturas: [HU-01-produccion.md](https://github.com/TonyBSosa/Mio/blob/semana-2/docs/evidencias/HU-01-produccion.md).
- Bitácora: [semana-2.md](https://github.com/TonyBSosa/Mio/blob/semana-2/docs/bitacora/semana-2.md).
- Implementación previa en `313a363`; esta versión registra su aceptación y cierra #1 desde un commit.

Verificación: cinco pruebas backend aprobadas (repositorios simulados), compilación frontend y build de despliegue aprobados; frontend y API responden por HTTPS. Los cambios de esta entrega son documentación y evidencia: no modifican el código de la aplicación.

Pendientes del producto: abonos, cancelaciones con historial y pruebas reales de concurrencia de HU-04. Esta entrega no certifica seguridad global ni integridad transaccional. No se migró la base de datos.
