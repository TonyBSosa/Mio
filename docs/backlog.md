# Backlog de historias de MIO

Preparado para semana 2. Hay 18 historias: 11 del MVP, 6 del segundo corte y 1 opcional. Prioridad: P0 esencial, P1 siguiente incremento, P2 diferida. Tamaño relativo: S pequeña, M mediana; dividir las M si no caben en una semana. El estado «código existente» requiere verificación: no equivale a Hecho.

Cada sección es el cuerpo listo para una GitHub Issue. El script [publicar-backlog.ps1](../scripts/publicar-backlog.ps1) crea las issues sin duplicar las que ya llevan el mismo identificador. El registro de URLs se escribe al publicarlas en `docs/evidencias/issues-semana-2.json`.

## HU-01 · Identificar y buscar piezas por código

Como vendedor quiero asignar y buscar un código de pieza para identificar sin confusión lo que solicita un comprador.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: S. Estado: aceptada tras verificación en producción y viewport móvil. [Issue #1](https://github.com/TonyBSosa/Mio/issues/1); [evidencia](evidencias/HU-01-produccion.md). Primera historia de la entrega semana 2.

- Dado un vendedor autenticado, cuando crea una pieza llamada Blusa por L200 con código ` blusa-01 `, entonces se guarda y muestra como `BLUSA-01` y permanece al recargar.
- Dado ese catálogo, cuando busca `blusa-01`, entonces encuentra la pieza por su código.
- Dado `BLUSA-01` ocupado en la tienda, cuando intenta crear otra pieza con el mismo código, entonces ve un mensaje de conflicto y no se crea un duplicado.
- Dado otro vendedor, cuando crea `BLUSA-01` en su propia tienda, entonces puede guardarlo sin acceder a la pieza anterior.
- Dado un alta sin código, cuando la guarda, entonces recibe un código generado; un código con espacios internos o más de 30 caracteres se rechaza con mensaje.

Evidencia de código: `backend/src/services/productoService.js`, `backend/src/models/productos.js`, `frontend/src/app/pages/productos/productos.ts`. Prueba: `backend/test/producto-codigo.test.js` usa repositorios simulados; comprobar índice y flujo real. Cierre sujeto a [Definición de Hecho](definicion-de-hecho.md).

## HU-02 · Entrar a mi tienda

Como vendedor quiero registrarme e iniciar sesión para trabajar con los datos de mi tienda.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: S. Estado: código existente; aceptación pendiente.

- Dado un correo nuevo y datos válidos, cuando completo el registro de vendedor e inicio sesión, entonces accedo al panel de mi tienda.
- Dado un correo ya registrado o credenciales incorrectas, cuando intento registrarme o entrar, entonces recibo un mensaje y no obtengo acceso indebido.
- Dada una sesión cerrada, cuando intento consultar datos privados por API sin credenciales, entonces se rechaza la consulta.

## HU-03 · Registrar un comprador

Como vendedor quiero registrar un cliente para asociar sus apartados a la persona correcta.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: S. Estado: código existente; aceptación pendiente.

- Dada mi sesión, cuando guardo un cliente con nombre y los datos requeridos por el formulario, entonces aparece en mi directorio y sigue ahí al recargar.
- Dado el nombre obligatorio vacío, cuando intento guardar, entonces se muestra un error y no se crea el cliente.

## HU-04 · Apartar una pieza disponible

Como vendedor quiero asociar una pieza disponible a un cliente para evitar vender la misma pieza dos veces.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: M. Estado: código parcial; falta garantía transaccional y prueba real. Requiere cliente y pieza; no requiere live.

- Dada una pieza activa y un cliente de mi tienda, cuando registro su pedido, entonces queda vinculado a ambos, con cantidad 1, precio acordado y pieza apartada.
- Dados dos intentos simultáneos de apartar la misma pieza, cuando se procesan, entonces solo uno crea un pedido y el otro recibe conflicto.
- Dado un fallo al completar el pedido, cuando termina la operación, entonces no queda una pieza apartada sin su pedido ni un pedido sin su reserva.
- Dado un pedido guardado, cuando cambia después el precio del catálogo, entonces el precio del pedido conserva el importe acordado.

## HU-05 · Registrar venta directa

Como vendedor quiero registrar un pedido sin live para controlar ventas recibidas por mensajes o en persona.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: S. Estado: código existente; aceptación pendiente. Usa las reglas de reserva de HU-04.

- Dado un cliente y una pieza disponibles, cuando guardo un pedido sin live, entonces se crea y aparece como venta directa.
- Dado ese pedido, cuando consulto el resumen de ventas directas, entonces su importe se incluye una vez y no se exige crear un live ficticio.

## HU-06 · Asociar una venta a un live

Como vendedor quiero vincular un pedido a un live activo para revisar las ventas de esa sesión.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: S. Estado: código existente; aceptación pendiente.

- Dado un live activo de mi tienda, cuando registro un pedido asociado, entonces aparece en los pedidos y el resumen de ese live.
- Dado un live finalizado o ajeno, cuando intento crear un pedido nuevo asociado, entonces se rechaza y no se guarda el pedido.

## HU-07 · Confirmar pago total

Como vendedor quiero marcar un pedido como pagado para distinguir lo cobrado de lo pendiente.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: S. Estado: código existente; aceptación pendiente. Confirmación manual, sin procesar dinero.

- Dado un pedido pendiente de L200, cuando confirmo que fue pagado, entonces figura pagado al recargar y su importe pasa del total pendiente al pagado.
- Dado un estado de pago no admitido, cuando intento guardarlo, entonces se rechaza y permanece el estado anterior.

## HU-08 · Registrar entrega

Como vendedor quiero marcar una entrega confirmada para saber qué pedidos faltan por entregar.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: S. Estado: código existente; aceptación pendiente. En este corte la confirmación es manual y no bloquea por saldo.

- Dado un pedido con entrega pendiente, cuando confirmo su entrega, entonces aparece entregado y conserva ese estado al recargar.
- Dado el listado de pedidos, cuando un pedido se marca entregado, entonces su estado visible cambia sin alterar cliente, pieza ni importe.

## HU-09 · Consultar pendientes y totales

Como vendedor quiero consultar pedidos y totales para organizar el cobro y la entrega del día.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: S. Estado: código existente; aceptación pendiente.

- Dados un pedido pagado de L200 y otro pendiente de L300, cuando consulto el resumen general, entonces veo L500 vendido, L200 pagado y L300 pendiente.
- Dada una tienda sin pedidos, cuando consulto el resumen, entonces veo totales en cero sin error ni datos de otra tienda.

## HU-10 · Proteger datos y referencias de mi tienda

Como vendedor quiero que mis datos queden separados y sus vínculos se conserven para evitar pérdida o exposición de pedidos.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: M. Estado: validaciones existentes; concurrencia y API real pendientes.

- Dadas tiendas A y B, cuando A consulta o modifica por API un pedido de B, entonces se rechaza sin mostrar ni cambiar sus datos.
- Dado un cliente o producto con pedido asociado, cuando intento eliminarlo, entonces recibo un conflicto y se mantienen el registro y el pedido.
- Dado un intento de asociar cliente o pieza ajenos a un pedido propio, cuando lo guardo, entonces se rechaza sin crear vínculos cruzados.

## HU-11 · Administrar acceso de vendedores

Como administrador quiero revisar y activar o inactivar usuarios para controlar el acceso a MIO.

Etiquetas: `historia`, `MVP`, `P0`. Tamaño: M. Estado: código existente; aceptación pendiente.

- Dada una cuenta administrativa, cuando inactivo un vendedor, entonces aparece inactivo y su siguiente inicio de sesión se rechaza.
- Dada mi cuenta administrativa, cuando intento inactivarme a mí mismo, entonces se rechaza y conservo el acceso.
- Dado un vendedor común, cuando intenta consultar o modificar usuarios mediante la API administrativa, entonces se rechaza por permisos.

## HU-12 · Registrar abonos y saldo

Como vendedor quiero registrar abonos de un pedido para conocer lo recibido y el saldo pendiente.

Etiquetas: `historia`, `corte-2`, `P1`. Tamaño: M. Estado: propuesto. Depende de decidir persistencia y validar reglas financieras; dividir captura y correcciones si excede una semana.

- Dado un pedido de L500 sin pagos, cuando registro L200 con fecha, método y referencia, entonces su historial muestra el movimiento y el saldo es L300.
- Dado un saldo de L300, cuando intento abonar L400, cero o un importe negativo, entonces se rechaza sin alterar historial ni saldo.
- Dados dos abonos simultáneos que juntos exceden el saldo, cuando se procesan, entonces no se acepta un total mayor al pedido.

## HU-13 · Cancelar sin perder historial

Como vendedor quiero cancelar un apartado con un motivo para liberar la pieza y conservar lo ocurrido.

Etiquetas: `historia`, `corte-2`, `P1`. Tamaño: M. Estado: propuesto; requiere acordar tratamiento de abonos.

- Dado un pedido sin abonos y pieza apartada, cuando lo cancelo con motivo, entonces conserva su historial, queda cancelado y la pieza vuelve a estar disponible.
- Dado un pedido con abonos, cuando intento cancelarlo sin resolver el tratamiento del dinero, entonces se bloquea y no se borra ningún movimiento.

## HU-14 · Consultar consolidado de un cliente

Como vendedor quiero ver las piezas y saldos de un cliente para preparar su paquete y comunicarle cuánto debe.

Etiquetas: `historia`, `corte-2`, `P1`. Tamaño: S. Estado: propuesto.

- Dado un cliente con pedidos activos de L200 y L300 y L100 abonados, cuando consulto su consolidado, entonces veo ambas piezas, L500 de importe, L100 recibido y L400 de saldo.
- Dado un cliente sin pedidos, cuando abro su consolidado, entonces veo un estado vacío y totales cero.

## HU-15 · Entregar con control de saldo

Como vendedor quiero comprobar el saldo antes de entregar para evitar entregas contrarias a la política acordada con la tienda.

Etiquetas: `historia`, `corte-2`, `P1`. Tamaño: S. Estado: propuesto. Regla provisional: saldo cero; validar antes de implementar.

- Dado un pedido con saldo cero, cuando confirmo entrega, entonces se guarda estado entregado, fecha y responsable.
- Dado un pedido con saldo positivo, cuando intento entregarlo bajo la regla provisional, entonces se bloquea con explicación y conserva estado pendiente.

## HU-16 · Exportar pedidos para revisión

Como vendedor quiero exportar mis pedidos a CSV para revisarlos y conservar una copia operativa.

Etiquetas: `historia`, `corte-2`, `P1`. Tamaño: S. Estado: propuesto.

- Dados pedidos de mi tienda y filtros aplicados, cuando exporto, entonces descargo un CSV con los pedidos filtrados y sus importes coinciden con la consulta.
- Dado texto que comienza con un carácter de fórmula de hoja de cálculo, cuando exporto, entonces el CSV lo trata como texto y no como fórmula ejecutable.
- Dada otra tienda, cuando exporto con mi sesión, entonces sus pedidos no aparecen en el archivo.

## HU-17 · Consultar catálogo público

Como comprador quiero consultar las piezas publicadas por una tienda para elegir cuáles solicitar por su canal habitual.

Etiquetas: `historia`, `futuro`, `P2`. Tamaño: S. Estado: código exploratorio; fuera del MVP y del compromiso de diez semanas.

- Dada una tienda pública con piezas disponibles, cuando abro su enlace sin sesión, entonces veo nombre, código y precio de las piezas publicadas.
- Dado el catálogo público, cuando lo consulto, entonces no se exponen clientes, pedidos, credenciales ni saldos privados.

## HU-18 · Consultar historial administrativo

Como administrador quiero consultar quién cambió el acceso de una cuenta para investigar incidencias sin perder trazabilidad.

Etiquetas: `historia`, `corte-2`, `P1`. Tamaño: S. Estado: propuesto; aplazable si compite con el MVP.

- Dado un cambio de estado de usuario, cuando se confirma con motivo, entonces se registra cuenta afectada, responsable, fecha, estado anterior y nuevo.
- Dado ese historial, cuando un vendedor intenta consultarlo o alterarlo por API, entonces se rechaza y el registro permanece intacto.

## Regla de cierre y dependencias

Todas requieren la [Definición de Hecho](definicion-de-hecho.md). Las dependencias describen datos o capacidades necesarios, no obligan a agrupar todo en una sola historia: usar datos de prueba preparados para verificarlas individualmente. HU-04 y HU-10 se dividen antes de implementarlas si no resultan estimables. Revisión INVEST: beneficio explícito, criterios observables, alcance negociable y tamaño acotado; la prueba real debe confirmar que cada historia cabe en el incremento previsto.
