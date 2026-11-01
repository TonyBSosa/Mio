# Bitácora de semana 2

Fecha de preparación: 1 de noviembre de 2026, hora local de Honduras. Estado: **en preparación; no declarar entrega terminada**.

## Objetivo

Convertir la visión de MIO en mapa de historias, backlog verificable y plan de diez semanas; acreditar una primera historia del MVP funcionando en producción.

## Trabajo realizado

- Mapa del viaje del vendedor, administrador y comprador asistido, con corte MVP y segundo corte financiero.
- Backlog de 18 historias con rol, acción, beneficio y criterios Dado/Cuando/Entonces; HU-01 a HU-11 marcadas MVP.
- Plan relativo de diez semanas y cobertura de recorrido, roles, persistencia, seguridad, interfaz, operación y calidad.
- Definición de Hecho común, guía de estudio previa al reto y lista de cierre de la entrega.
- Script con vista previa para crear Issues en GitHub sin duplicar identificadores. No ejecutado en modo de publicación.

## Primera historia elegida

HU-01: identificar y buscar piezas por código. La implementación ya existe en el commit `313a363`; no se presenta como código nuevo escrito hoy. Se eligió porque es pequeña, aporta identificación clara durante una venta y tiene aceptación observable. Continúa abierta hasta verificar producción y teléfono.

Código revisado: `backend/src/services/productoService.js`, `backend/src/models/productos.js`, `frontend/src/app/pages/productos/productos.ts`. Evidencia pendiente: URL de issue, commit de aceptación, hash desplegado, dispositivo y resultados de la tabla manual de [ENTREGA_SEMANA_2.md](../ENTREGA_SEMANA_2.md).

## Verificaciones realizadas

- `npm test` desde backend: **5 pruebas aprobadas, 0 fallos**. Son pruebas con repositorios simulados; no certifican índice único real, transacciones ni concurrencia en MongoDB.
- `npm run build` desde frontend: **compilación aprobada**.
- GET HTTPS a `https://mio-web.onrender.com`: **200**.
- GET HTTPS a `https://mio-api-ahq2.onrender.com`: **200**, respuesta «API MIO funcionando».
- Historial local revisado: **17 commits**, incluidos `313a363` del 31 de octubre y `bd5ac89`, `3b72bf0` del 1 de noviembre. Cumple cantidad local en esta fecha; verificar remoto al cerrar.
- `gh auth status`: sin sesión; no se pudieron consultar ni crear Issues/releases con GitHub CLI.
- Vista previa del publicador con `pwsh -NoProfile -File scripts/publicar-backlog.ps1`: reconoce las 18 historias sin publicar cambios. Windows PowerShell bloquea scripts en su configuración actual; se utilizó PowerShell 7 sin cambiar políticas.

## Pendientes para cerrar

- Autenticar GitHub, publicar las historias y conservar URLs reales.
- Ejecutar y registrar aceptación de HU-01 en producción y teléfono; no hay todavía evidencia de estos pasos.
- Referenciar y cerrar la issue desde el commit de aceptación integrado en la rama predeterminada.
- Subir archivos, verificar despliegue y publicar release o etiqueta `semana-2` sobre el commit final.
- Comprobar requisitos remotos antes de iniciar el reloj de la evaluación.

No se migró a PostgreSQL, no se implementaron abonos ni se realizaron entrevistas en esta preparación. Se conservó la modificación previa del usuario en la bitácora de semana 1. Documentos y preparación realizados con asistencia de IA; el estudiante debe comprenderlos y resolver por sí mismo la fase evaluada del reto.

## Actualización: publicación del backlog

Tras iniciar sesión el responsable en GitHub, se ejecutó el publicador con `-Aplicar`: **18 Issues creadas**, #1 a #18, con criterios de aceptación; #1 a #11 etiquetadas `MVP`. URLs conservadas en [issues-semana-2.json](../evidencias/issues-semana-2.json). HU-01 corresponde a https://github.com/TonyBSosa/Mio/issues/1. Se mantienen abiertas hasta cumplir su Definición de Hecho. Esta actualización resuelve el pendiente de autenticación y publicación indicado en el registro inicial.
