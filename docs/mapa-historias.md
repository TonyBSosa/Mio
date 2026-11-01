# Mapa de historias de MIO

Preparado el 1 de noviembre de 2026 para el módulo 2. Fuente: visión del producto, código existente y requisitos de la entrega compartidos por el estudiante. El mapa describe el viaje del usuario; las columnas son actividades, no pantallas ni tablas.

## Objetivo y roles

Ayudar a una tienda a identificar piezas únicas, registrar quién las apartó y seguir el pago y la entrega. El problema y las reglas comerciales siguen pendientes de validación con tiendas.

- **Vendedor / operador:** administra su tienda y registra manualmente ventas realizadas por redes sociales.
- **Administrador de MIO:** mantiene el acceso de los usuarios. No opera ventas en nombre de las tiendas.
- **Comprador:** solicita piezas por la red social y paga o coordina fuera de MIO en el primer corte. Un cliente registrado por el vendedor no equivale a una cuenta de comprador.

Los identificadores HU enlazan con [backlog.md](backlog.md). Cada celda contiene tareas y detalles. Los cortes son incrementos horizontales: cada uno permite recorrer el viaje que le corresponde a cada rol.

## Vendedor: preparar → identificar → apartar → cobrar → entregar → revisar

| Corte | Preparar la tienda | Identificar la pieza y comprador | Registrar el apartado | Dar seguimiento al pago | Entregar | Revisar la operación |
|---|---|---|---|---|---|---|
| **1 · MVP operativo** | HU-02: registrarse e iniciar sesión; acceder solo a su tienda | HU-01: crear y buscar pieza por código; HU-03: registrar cliente | HU-04: vincular pieza disponible a cliente, cantidad 1 y precio histórico; HU-05: venta directa sin live; HU-06: asociar opcionalmente a live activo | HU-07: marcar pendiente/pagado manualmente; no hay abonos | HU-08: marcar pendiente/entregado según confirmación manual | HU-09: consultar pedidos y totales; HU-10: conservar referencias y separación entre tiendas |
| **2 · Seguimiento financiero y trazabilidad** | Revisar reglas de abonos y cancelación con la tienda antes de desarrollar | HU-14: consolidar piezas y saldo por cliente | HU-13: cancelar con motivo, conservar historial y liberar pieza | HU-12: registrar abonos e historial, calcular saldo y rechazar exceso; definir tratamiento del dinero al cancelar | HU-15: aplicar regla de saldo y guardar fecha/responsable | HU-16: exportar CSV y conciliar totales con movimientos |
| **Posterior · Opcional** | Personalizar presencia pública | HU-17: publicar catálogo para compradores | Considerar solicitudes del comprador solo tras validar necesidad | Pasarela de pagos fuera del plan | Coordinación automatizada fuera del plan | Métricas comerciales avanzadas fuera del plan |

El primer corte permite completar una venta con pago total o pendiente; no promete contabilidad, abonos ni cancelación con dinero. El segundo añade esas capacidades sin sustituir las del primero.

## Administrador: acceder → revisar usuarios → actuar → comprobar

| Corte | Acceder | Revisar usuarios | Actuar sobre el acceso | Comprobar el resultado |
|---|---|---|---|---|
| **1 · MVP operativo** | HU-11: entrar con cuenta administrativa creada por procedimiento interno | HU-11: consultar usuarios y roles | HU-11: activar/inactivar vendedor; impedir autoinactivación | Verificar que el vendedor inactivo no pueda iniciar sesión; el vendedor común no administra usuarios |
| **2 · Trazabilidad** | Mantener acceso restringido | HU-18: consultar historial de cambios administrativos | HU-18: registrar responsable, motivo y fecha | HU-18: comprobar trazabilidad sin borrar registros previos |
| **Posterior** | Acceso adicional solo si se valida | Métricas agregadas sin exponer datos privados | Soporte con permisos acotados | Auditoría ampliada |

## Comprador: descubrir → elegir → solicitar → pagar → recibir

| Corte | Descubrir | Elegir | Solicitar | Pagar | Recibir |
|---|---|---|---|---|---|
| **1 · MVP asistido por vendedor** | Ver publicación o live en red social externa | Identificar código comunicado por la tienda | Pedir por comentario/mensaje; vendedor registra con HU-03/HU-04 | Acordar pago fuera de MIO; vendedor confirma con HU-07 | Coordinar fuera de MIO; vendedor registra con HU-08 |
| **2 · Seguimiento asistido** | Mantener canal actual | Confirmar piezas con la tienda | Vendedor consulta consolidado con HU-14 | Vendedor registra abonos con HU-12 y comunica saldo | Vendedor aplica HU-15 y comunica estado |
| **Posterior · Autoservicio opcional** | HU-17: abrir catálogo público sin cuenta | HU-17: consultar piezas publicadas | Solicitudes propias pendientes de validar | Pago en línea fuera del alcance | Portal de seguimiento pendiente de validar |

Las acciones externas no se presentan como funciones implementadas por MIO. Las vistas de exploración y el rol `cliente` existentes son exploratorios y no obligan a incluir un marketplace en el MVP.

## Estado real y límites

El código contiene buena parte del corte 1. Eso no significa que todas sus historias estén aceptadas: falta comprobar el flujo en producción, uso móvil, índice único real y concurrencia. HU-01 es la primera historia seleccionada para reunir evidencia de semana 2. Corte 2 es trabajo futuro. No se inventan entrevistas, resultados ni fechas de terminación.

Plan temporal: [plan.md](plan.md). Regla común de cierre: [definicion-de-hecho.md](definicion-de-hecho.md).
