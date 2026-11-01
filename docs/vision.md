# Visión de MIO — semana 1

Autor: Tony Sosa. Documento preparado el 1 de noviembre de 2026.

## 1. Problema y segmento inicial

MIO busca ayudar a pequeñas tiendas hondureñas que venden piezas únicas mediante redes sociales y transmisiones en vivo. La hipótesis de problema es que distribuir información entre comentarios, mensajes y anotaciones dificulta identificar qué pieza pidió cada comprador, consultar lo pendiente de pago y dar seguimiento a la entrega.

Los posibles efectos son registros duplicados, búsquedas repetidas y confusión de estados. No se han medido su frecuencia ni su costo en una tienda local; se presentan como riesgos por validar, no como resultados de entrevistas.

El usuario inicial es el dueño u operador de una tienda que ya realiza ventas por redes y registra sus pedidos manualmente. El comprador es la persona asociada al pedido, aunque no necesita operar el panel del vendedor para que la tienda registre una venta.

## 2. Evidencia documental y sus límites

| Fuente | Evidencia pertinente | Qué no demuestra |
|---|---|---|
| [CommentSold: Train Your Shoppers to Comment Purchase](https://help.commentsold.com/hc/en-us/articles/4401982035860-Train-Your-Shoppers-to-Comment-Purchase), consultada el 1 de noviembre de 2026 | La documentación describe compras iniciadas mediante comentarios en publicaciones o lives, con identificación del producto y posterior finalización de compra. Respalda la existencia de ese flujo comercial. | No demuestra demanda por MIO, errores en tiendas hondureñas ni disposición a pagar. La automatización de CommentSold no está implementada en MIO. |
| [International Trade Administration: Honduras — eCommerce](https://www.trade.gov/knowledge-product/honduras-ecommerce), publicada el 25 de enero de 2024, consultada el 1 de noviembre de 2026 | Describe el uso de redes sociales para promover y vender productos y barreras de herramientas y conocimientos para pequeños comercios. Es contexto documental sobre Honduras. | No cuantifica el problema específico de apartados ni sustituye evidencia actual de una tienda. No se extrapolan sus cifras históricas a 2026. |
| Investigación previa del proyecto: [CommentSold y la viabilidad de MIO](../output/pdf/informe_commentsold_viabilidad_mio.md) | Organiza antecedentes, alternativas y preguntas de validación. | Es una síntesis de investigación, no una fuente independiente ni un estudio de campo. |

No se adjuntan observaciones propias de publicaciones concretas de vendedores locales ni entrevistas realizadas. Un familiar que vende en vivo es un contacto potencial mencionado por el autor; todavía no consta una entrevista registrada ni consentimiento para atribuirle respuestas.

## 3. Propuesta de valor

Organizar en una aplicación web los clientes, las piezas y los pedidos capturados por la tienda para consultar su estado sin reconstruir cada venta entre mensajes. La promesa de reducir tiempo o errores es una hipótesis medible, no un beneficio ya demostrado.

La transmisión permanece en la red social. El operador registra la venta en MIO. El enfoque inicial favorece un flujo pequeño que pueda explicarse y probarse antes de añadir automatización o funciones comerciales adicionales.

## 4. Lean Canvas provisional

| Bloque | Propuesta inicial |
|---|---|
| Problemas | Información dispersa de pedidos; dificultad de identificar piezas y compradores; seguimiento de pago y entrega. Pendientes de validación local. |
| Segmentos | Pequeñas tiendas hondureñas de ropa de segunda mano o piezas únicas que ya venden por redes. Primer contacto potencial: negocio familiar con ventas en vivo. |
| Propuesta única de valor | Clientes, piezas y pedidos organizados para dar seguimiento a ventas por redes desde una sola aplicación. |
| Solución | Catálogo con códigos, directorio de clientes, captura manual de pedidos con o sin live y resúmenes por estado. Abonos e historial de cancelaciones son incrementos futuros. |
| Canales | Contacto directo con tiendas, demostración al negocio familiar y posibles referidos; sin resultados de captación todavía. |
| Ingresos | Hipótesis de suscripción mensual por tienda tras un piloto; precio y voluntad de pago sin validar. No hay ingresos demostrados. |
| Costos | Hosting, base de datos, mantenimiento, soporte y tiempo de validación. Se inicia con planes gratuitos sujetos a límites; no se presupuestan como gratuitos para cualquier escala. |
| Métricas clave | Tiempo y exactitud de registro, porcentaje de pedidos completos, conciliación de estados y uso repetido por la tienda. |
| Ventaja difícil de copiar | Todavía no demostrada. El acceso cercano a un vendedor puede facilitar aprendizaje, pero no constituye por sí solo una ventaja sostenible. |

## 5. Hipótesis y experimentos propuestos

Los siguientes umbrales son metas para experimentar; no son mediciones obtenidas.

| Hipótesis | Experimento | Criterio previo de evaluación | Estado |
|---|---|---|---|
| H1. El seguimiento manual genera dificultades frecuentes para el segmento elegido. | Entrevistar a dos vendedores y pedir ejemplos recientes sin datos personales de compradores. | Ambos identifican al menos un caso concreto del último mes relacionado con pedidos, pagos o entregas. Si no ocurre, revisar el problema y el segmento. | Pendiente |
| H2. La captura en MIO puede ser suficientemente rápida durante una venta. | Medir cinco registros con catálogo y cliente preparados, después de una explicación breve. Comparar con el método habitual. | Mediana de registro de 15 segundos o menos y ausencia de errores de cliente/pieza en los cinco registros. Registrar también el tiempo de preparación. | Pendiente |
| H3. La vista de estados facilita consultar un pedido. | Solicitar al vendedor localizar estado de pago y entrega de cinco pedidos de prueba. | Localiza correctamente los cinco sin recurrir a chats o anotaciones externas. | Pendiente |
| H4. El prototipo tiene utilidad más allá de la primera demostración. | Piloto con un vendedor en dos sesiones distintas y entrevista posterior. | Registra y consulta pedidos en ambas sesiones y puede describir una mejora concreta; no equivale a intención de pago. | Pendiente |

La disposición a pagar se estudiará después del uso real. Si los resultados contradicen las hipótesis, se ajustará el alcance en lugar de interpretar toda respuesta como confirmación.

## 6. Alcance del incremento entregado

### Disponible en el código y publicado como prototipo

- Registro e inicio de sesión con JWT y roles.
- Gestión de clientes, productos con códigos y eventos live.
- Pedidos asociados a cliente y vendedor, con referencia opcional a producto y live opcional para ventas directas.
- Estados de pago pendiente/pagado y entrega pendiente/entregado.
- Resúmenes de pedidos y publicación mediante HTTPS en Render con persistencia en MongoDB Atlas.

La reserva condicional de una pieza y la creación de su pedido son escrituras separadas. Existe lógica de compensación ante ciertos errores; no se declara una transacción completa ni una garantía verificada frente a todos los fallos concurrentes.

### Pendiente de implementación o verificación

Abonos parciales, historial financiero, cancelación lógica con tratamiento del dinero, exportación CSV y validación operativa con una tienda. La compilación y las pruebas con repositorios simulados no sustituyen una prueba de integridad en MongoDB real.

### Fuera del alcance inicial

Transmisión de video, captura automática de comentarios, pasarela de pagos, facturación tributaria y marketplace completo. Existen vistas públicas exploratorias en el prototipo; no constituyen un marketplace completo ni amplían el compromiso del MVP.

## 7. Stack y primer despliegue

Angular 21 y TypeScript permiten continuar la interfaz y formularios existentes. Express 5 sobre Node.js mantiene el backend en JavaScript. MongoDB con Mongoose permite modelar clientes, productos y pedidos; sus referencias requieren validación en el servicio y no equivalen a claves foráneas automáticas.

Se conserva este stack por continuidad del código y alcance de una persona, no por afirmar que sea superior en todos los casos. Render aloja el sitio estático y la API; Atlas aloja la base de producción. Las configuraciones y bases se separan de desarrollo.

- Aplicación: https://mio-web.onrender.com
- API: https://mio-api-ahq2.onrender.com
- Repositorio: https://github.com/TonyBSosa/Mio
- Instrucciones: [PUBLICACION.md](PUBLICACION.md).

Las capturas compartidas muestran despliegues exitosos y conexión a MongoDB. El usuario indicó haber completado las pruebas propuestas; no se conserva evidencia detallada para certificar cada operación del flujo. El clúster comienza separado de la base local; no se afirma haber migrado datos.

## 8. Entrevistas y siguiente validación

No se presenta una entrevista ficticia como evidencia real. El instrumento preparado está en [PREGUNTAS_PARA_TIENDAS.md](academico/PREGUNTAS_PARA_TIENDAS.md). La siguiente actividad es una conversación real con el familiar vendedor para contrastar H1 y observar su método actual, registrando fecha, consentimiento, ejemplos anonimizados y conclusiones que pueden confirmar o refutar la propuesta.

La entrega actual documenta una visión sustentada parcialmente en fuentes públicas y un prototipo publicado; mantiene pendiente la validación primaria.
