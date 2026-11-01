# Entrega de semana 2: primera historia viva

Estado de aceptación al 1 de noviembre de 2026: **HU-01 verificada en producción y lista para su cierre desde el commit de entrega**. El release y la Issue enlazados abajo permiten comprobar su publicación final.

## Requisitos y comprobación

| Requisito de las capturas | Evidencia / estado |
|---|---|
| Mapa por rol, actividades, tareas, detalles y dos cortes | Preparado en [mapa-historias.md](mapa-historias.md) |
| ≥15 historias en GitHub Issues, criterios Dado/Cuando/Entonces y MVP etiquetado | 18 publicadas: Issues #1–#18; HU-01 a HU-11 con etiqueta MVP; URLs en [registro](evidencias/issues-semana-2.json) |
| Plan de diez semanas y piso de app completa | Preparado en [plan.md](plan.md) |
| Primera historia del MVP funcionando en producción | HU-01 comprobada en dos tiendas y viewport móvil. [Evidencia](evidencias/HU-01-produccion.md) |
| Issue cerrada desde un commit | [Issue #1](https://github.com/TonyBSosa/Mio/issues/1), referenciada por `Closes #1` en el commit de aceptación |
| Bitácora semana 2 | [bitacora/semana-2.md](bitacora/semana-2.md), con límites y pendientes explícitos |
| Release o etiqueta semana-2 | [Versión de entrega semana-2](https://github.com/TonyBSosa/Mio/releases/tag/semana-2), sobre el commit de aceptación |
| ≥10 commits, ≥3 últimos 10 días | Antes del commit de aceptación: 19 totales, 5 recientes; el cierre añade uno más |
| Token en README | Conservado: `LEARN-CAP-D03DECFA` |
| Aplicación pública HTTPS | Frontend y API respondieron 200 el 1 nov.; esto no sustituye aceptación de HU-01 |

## Orden de cierre

1. Revisar mapa, backlog, plan y alcance. Mantener el stack actual para esta entrega; la migración no se ejecutó.
2. Iniciar GitHub: `gh auth login`. Desde la raíz ejecutar `pwsh -NoProfile -File scripts/publicar-backlog.ps1` para previsualizar y añadir `-Aplicar` para publicar. Se verificó con PowerShell 7; Windows PowerShell bloqueó la ejecución por su política actual. No es necesario cambiar esa política. El script no cierra historias ni crea un release por adelantado.
3. Registrar URL/número de HU-01 desde `docs/evidencias/issues-semana-2.json`. Confirmar ≥15 issues y etiqueta MVP en HU-01 a HU-11. Si se reutilizan issues existentes, revisar que sus criterios y etiquetas coincidan.
4. Verificar HU-01 con el procedimiento siguiente y guardar resultados reales en la bitácora; corregir cualquier fallo y desplegar antes de repetir.
5. Crear un commit revisado con los archivos de esta entrega y mensaje que incluya `Closes #NUMERO_REAL_HU01`. No incluir cambios ajenos; existe una modificación previa en `docs/bitacora/semana-1.md`. Registrar el hash y subir a la rama predeterminada. GitHub cierra la issue al integrar el commit allí. No inventar una nueva implementación: HU-01 ya tiene código en `313a363`; este commit acredita su aceptación y entrega.
6. Confirmar despliegue y que los archivos obligatorios estén visibles en GitHub. Revisar el cierre de la issue y el commit enlazado. Crear el release `semana-2` sobre ese hash; las notas deben mencionar HU-01, evidencia y límites. No afirmar que abonos o concurrencia global ya están certificados.
7. Verificar los requisitos en el remoto y abrir la app antes de iniciar el reto; Render puede tardar en despertar. En fase 0 pegar repositorio y app, no la URL de la API.

## Aceptación manual de HU-01

Usar cuentas y nombres ficticios, sin datos de clientes reales. Fecha, dispositivo, commit desplegado y capturas deben quedar registrados. No guardar contraseñas ni tokens en la bitácora.

| Paso | Acción | Resultado esperado | Resultado observado |
|---|---|---|---|
| 1 | Vendedor A: crear pieza L200 con ` demo-s2-001 ` | Se normaliza a mayúsculas | Aprobado: `DEMO-S2-001` |
| 2 | Recargar Productos y buscar `demo-s2-001` | Persiste y se encuentra por código | Aprobado: una coincidencia por L200 |
| 3 | Crear otra pieza con `DEMO-S2-001` en A | Conflicto; no hay duplicado | Aprobado: mensaje de código existente |
| 4 | Vendedor B: crear `DEMO-S2-001` | Se permite como pieza propia | Aprobado: pieza de B por L250; catálogo no muestra las piezas de A |
| 5 | Crear pieza sin código | Se genera código `P-...` | Aprobado: `P-F0DD67F62DC0` |
| 6 | Intentar `BLUSA 01` y código de 31 caracteres | Se rechazan con mensaje | Aprobado: ambos rechazos observados |
| 7 | Crear/buscar en viewport 390 × 844 y recargar `/productos` | Flujo utilizable; ruta carga | Aprobado: `DEMO-S2-MOVIL`, L150; teléfono físico no probado |

El duplicado real verifica el comportamiento del índice en el entorno usado. Las pruebas con repositorios simulados no lo verifican. No alterar el índice de producción sin revisar primero datos y respaldo si se detecta un fallo.

## Notas preparadas para el release

Título: `Semana 2 — Primera historia viva`.

Contenido a completar tras las pruebas: mapa por tres roles y dos cortes, 18 historias con criterios y MVP marcado, plan de diez semanas, Definición de Hecho y aceptación de HU-01. Enlazar la issue, el commit desplegado y la bitácora. Declarar como pendientes el corte financiero y las pruebas de concurrencia de HU-04. Estas notas son un borrador, no prueba de publicación.
