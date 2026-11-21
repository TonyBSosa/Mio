# Entrega del módulo 6 — MIO

Revisión del 20 de noviembre de 2026. Estado: documentación y flujo de entregas implementados localmente; verificación con MongoDB aislado completada; publicación pendiente.

## Datos para la plataforma

- Repositorio: https://github.com/TonyBSosa/Mio
- Aplicación: https://mio-web.onrender.com
- Token ya presente en README: `LEARN-CAP-D03DECFA`.

## Requisitos y evidencia

| Requisito de las capturas | Estado de esta revisión |
|---|---|
| `docs/arquitectura.md`: contexto, contenedores, capas y carpetas | Preparado en este cambio; expone también las diferencias con la arquitectura recomendada. |
| Dos decisiones con contexto, decisión, alternativas y consecuencias | Tres registradas en `docs/decisiones/`. |
| Segundo flujo completo en producción, elegido desde pruebas de usuarios | Entregas implementado localmente por petición de Tony; faltan evidencia real y despliegue. |
| Dos PR mezclados con descripción y enlaces a issues | Pendiente. #19 y #20 existen, pero sus descripciones están vacías. |
| Bitácora con uso de IA | Preparada en `docs/bitacora/semana-6.md`. |
| Release o etiqueta `semana-6` | Pendiente de publicar sobre la versión final. |
| 30 commits totales y 3 en últimos 10 días | El historial local consultado tiene 39 y 9 recientes, respectivamente; verificar la rama publicada al entregar. |
| App pública con HTTPS | HEAD respondió 200; falta el recorrido autenticado completo. |

## Cerrar el segundo flujo

1. Registrar los resultados reales del módulo 5 y enlazar el hallazgo que motiva la elección. No usar la simulación como evidencia.
2. Usar el flujo elegido de [entregas](flujo-entregas.md): vendedor abre un pedido, programa local o zona común con lugar y fecha, recarga, reprograma y confirma la recepción.
3. Integración completada con HTTP y MongoDB temporal: fechas y lugar persisten, se puede reprogramar y el pago no cambia. La prueba de navegador usa un servidor simulado en memoria.
4. Casos verificados en integración: sesión ausente, comprador/admin rechazados, vendedor ajeno sin acceso, fecha inexistente, pedido cancelado y bloqueo de programación tardía tras confirmar. Lugar vacío y documentos históricos cubiertos en unitarias. Repetir los controles pertinentes al desplegar.
5. Tras publicar, repetir el recorrido contra servicios reales con datos de prueba y registrar fecha, commit, resultado esperado/observado y evidencia sin información personal. Una prueba unitaria o respuesta HTTPS no acredita este paso.

## Trabajo mediante issues y PR

Separar al menos dos cambios coherentes: documentación de arquitectura/decisiones y segundo flujo con sus verificaciones. Cada uno necesita issue, rama, commits claros, PR revisado y mezcla. La historia #8 (registrar entrega) corresponde al flujo; revisar su alcance y no cerrar una historia más amplia que lo entregado.

Texto base para la descripción de cada PR, completando los campos con hechos reales:

```markdown
## Problema y resultado
[Situación concreta, cambio y alcance final.]

## Issue
Refs #[número real].

## Validación
[Comandos y resultados; recorrido manual y entorno; pruebas omitidas.]

## Uso de IA
[Qué se pidió, qué se aceptó, qué se cambió o descartó y qué se revisó.]

## Pendientes o límites
[Solo los que realmente existan.]
```

Los PR existentes [#19](https://github.com/TonyBSosa/Mio/pull/19) y [#20](https://github.com/TonyBSosa/Mio/pull/20) no deben describirse retrospectivamente como trabajo de semana 6 si no lo fueron. Completar una descripción histórica requiere revisar su diff y usar únicamente issues relacionados. No se modificaron sus descripciones en esta preparación.

## Verificación y publicación final

Backend: 40 pruebas, 33 aprobadas, 7 omitidas y 0 fallidas, con MongoDB aislado para entregas. Frontend: compilación de producción correcta con CI=true para evitar la caché LMDB local; avisos de tamaño, sin errores. Consultar la bitácora para límites de estas pruebas.

Una vez mezclados los cambios y verificado el segundo flujo, publicar `semana-6` sobre el commit final y comprobar que los archivos estén en la rama que lee la plataforma. Las notas del release deben enlazar PR e issues, describir el flujo efectivamente desplegado y declarar límites reales. No marcar «Ya la hice» antes de completar estos pendientes.
