# Bitácora — semana 1: primer despliegue

Responsable: Tony Sosa. Registro preparado el 1 de noviembre de 2026, zona America/Tegucigalpa.

Se usa «semana 1» como nombre de la entrega del curso. El proyecto tiene desarrollo previo desde junio; no se afirma que todo el código se haya construido durante esta semana. Esta bitácora es una reconstrucción basada en el repositorio y en la preparación de la publicación, no un diario contemporáneo de cada sesión.

## Trabajo y evidencia

| Momento | Trabajo realizado | Evidencia y limitación |
|---|---|---|
| Desarrollo previo, junio de 2026 | Base de interfaz y API para usuarios, clientes, productos, lives y pedidos. | Historial Git anterior a esta entrega. |
| 8 de octubre de 2026, fecha indicada en documentos previos | Plan de alcance, investigación documental y requisitos iniciales. | docs/PLAN_DE_TRABAJO.md y estudio de CommentSold. La fecha escrita en un documento no demuestra un commit ni una entrevista realizada ese día. |
| 31 de octubre de 2026 | Integración de cambios del prototipo y preparación de configuración para despliegue. | Commit 313a363, mensaje updates. Pruebas de servicio y compilaciones ejecutadas durante la preparación. |
| 31 de octubre de 2026 | Creación de proyecto y clúster Free de Atlas, API y sitio estático en Render. | Capturas aportadas durante la sesión muestran Deploy succeeded y MongoDB conectado correctamente. |
| 31 de octubre de 2026 | Resolución del fallo inicial de conexión autorizando los dos rangos de salida de Render en Atlas. | Se observó fallo de selección de servidor; el despliegue posterior conectó a MongoDB. |
| 31 de octubre de 2026 | Corrección del build del frontend después de faltar PUBLIC_API_URL; configuración de CORS en el backend y guía de Rewrite para Angular. | Logs mostraron la variable ausente. Se orientó al usuario a conservar PUBLIC_API_URL en mio-web y CORS_ORIGINS en mio-api. La configuración final completa requiere comprobación de navegador. |
| 1 de noviembre de 2026 | Preparación de README, visión, Lean Canvas, hipótesis medibles y esta bitácora según la captura de requisitos de entrega. | Archivos de esta entrega. Investigación secundaria diferenciada de entrevistas pendientes. |

## Decisiones

- Conservar Angular, Express y MongoDB por continuidad del prototipo.
- Separar desarrollo local y producción mediante bases y configuración propias.
- Capturar pedidos manualmente; mantener lives en redes externas.
- Priorizar evidencia verificable; no inventar entrevistas ni resultados comerciales.
- No afirmar garantías transaccionales o de concurrencia basadas solo en pruebas simuladas.

## Verificación registrada durante la preparación

- npm test en backend: cinco pruebas pasaron, con repositorios simulados.
- Compilaciones Angular de desarrollo y producción: completadas.
- Generador de configuración: rechazó URL ausente y HTTP; aceptó URL HTTPS terminada en /api.
- Un intento de prueba HTTP local de CORS fue bloqueado por el entorno con EACCES; no se contabiliza como validación exitosa.
- Capturas de Render: API y sitio estático publicados; API conectada a Atlas. Captura del navegador: API MIO funcionando.
- El usuario respondió «listo» tras las indicaciones de prueba; faltan capturas o resultados individualizados de registro, acceso, cliente, producto y pedido para considerarlos evidencia reproducible.

Estos resultados corresponden a la sesión de preparación, no a una nueva ejecución de todas las pruebas al redactar esta bitácora.

## Pendientes para el validador y la revisión

- Publicar estos documentos en el repositorio accesible al evaluador y confirmar su visibilidad pública. El curso pide repositorio nuevo; este tiene historial anterior, por lo que debe confirmarse si se admite reutilizarlo.
- Publicar etiqueta o release semana-1 apuntando al commit final de la entrega.
- Al revisar el historial local antes de agregar estos archivos había 15 commits, de los cuales solo 313a363 estaba dentro de los últimos 10 días. Falta alcanzar tres commits recientes mediante avances reales; no se modifican fechas ni se inventa actividad.
- Realizar entrevista con al menos un vendedor y registrar evidencia primaria; el objetivo de dos entrevistas sigue propuesto.
- Ejecutar y documentar el flujo completo en producción y la recarga de rutas internas.
- Revisar integridad de reservas y comportamiento ante fallos con MongoDB real antes de ampliar el piloto.

## Próximo incremento

Validar el problema con la tienda familiar, actualizar hipótesis según respuestas reales y formalizar historias priorizadas con criterios de aceptación. Mantener los abonos y la cancelación trazable como trabajo futuro, sin anunciarlos como terminados.
