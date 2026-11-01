# Definición de Hecho de MIO

Aplica a todas las historias. Los criterios de aceptación específicos están en cada historia del backlog.

Una historia se cierra únicamente cuando:

- Cumple todos sus criterios Dado / Cuando / Entonces, incluyendo rechazo y errores pertinentes.
- Se revisó el cambio y se ejecutaron las pruebas apropiadas. Backend y frontend siguen funcionando; no se atribuye a los mocks una garantía de integridad en base real.
- El flujo puede completarse desde un teléfono, con mensajes comprensibles y sin errores que bloqueen la acción.
- La API verifica permisos y separación entre tiendas. No se publicaron secretos ni datos personales en código o evidencias.
- Se desplegó el commit correspondiente y se comprobó la historia en la URL pública HTTPS; una respuesta 200 de la portada no acredita la historia.
- La bitácora registra fecha, commit, pruebas realizadas, resultados y límites; la evidencia usa datos ficticios.
- La issue enlaza el commit y la evidencia, y el commit referencia la issue. Solo entonces se cierra.

Para el cierre de semana se agrega el release/etiqueta correspondiente y se comprueba que los archivos obligatorios existan en ese commit. Una historia con implementación local pero sin verificación publicada sigue abierta.
