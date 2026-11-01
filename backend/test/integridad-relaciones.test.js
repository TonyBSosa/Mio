const { test } = require("node:test");
const assert = require("node:assert/strict");

const pedidoRepository = require("../src/repositories/pedidoRepository");
const pedidoService = require("../src/services/pedidoService");
const productoRepository = require("../src/repositories/productoRepository");
const productoService = require("../src/services/productoService");
const clienteRepository = require("../src/repositories/clienteRepository");
const clienteService = require("../src/services/clienteService");
const liveRepository = require("../src/repositories/liveRepository");
const liveService = require("../src/services/liveService");
const resumenRepository = require("../src/repositories/resumenRepository");
const resumenService = require("../src/services/resumenService");
const userRepository = require("../src/repositories/userRepository");
const userService = require("../src/services/userService");
const explorarPublicoRepository = require("../src/repositories/explorarPublicoRepository");
const explorarPublicoService = require("../src/services/explorarPublicoService");
const catalogoPublicoRepository = require("../src/repositories/catalogoPublicoRepository");
const catalogoPublicoService = require("../src/services/catalogoPublicoService");

const VENDEDOR_ID = "507f1f77bcf86cd799439011";
const CLIENTE_ID = "507f1f77bcf86cd799439012";
const PRODUCTO_ID = "507f1f77bcf86cd799439013";
const PEDIDO_ID = "507f1f77bcf86cd799439014";
const LIVE_ID = "507f1f77bcf86cd799439015";
const ADMIN_ID = "507f1f77bcf86cd799439099";

test("reserva atomica de pieza, rollback ante fallo y liberacion al eliminar pedido", async (t) => {
  t.mock.method(pedidoRepository, "buscarClientePorIdYVendedor", async () => ({
    _id: CLIENTE_ID
  }));
  t.mock.method(pedidoRepository, "buscarProductoPorIdYVendedor", async () => ({
    _id: PRODUCTO_ID,
    nombre: "Vestido Floral",
    estado: "activo"
  }));

  let apartadoLlamado = 0;
  let liberadoLlamado = 0;

  t.mock.method(pedidoRepository, "apartarProductoPorIdYVendedor", async () => {
    apartadoLlamado += 1;
    return { _id: PRODUCTO_ID, estado: "apartado" };
  });
  t.mock.method(pedidoRepository, "liberarProductoPorIdYVendedor", async () => {
    liberadoLlamado += 1;
    return { _id: PRODUCTO_ID, estado: "activo" };
  });
  t.mock.method(pedidoRepository, "crearPedido", async (data) => ({
    _id: PEDIDO_ID,
    ...data
  }));

  const creado = await pedidoService.crearPedido(
    {
      clienteId: CLIENTE_ID,
      productoId: PRODUCTO_ID,
      precio: 350
    },
    VENDEDOR_ID
  );

  assert.equal(creado.producto, "Vestido Floral");
  assert.equal(apartadoLlamado, 1);
  assert.equal(liberadoLlamado, 0);

  // Si concurrencia gana la pieza justo antes del update atomico -> 409
  pedidoRepository.apartarProductoPorIdYVendedor = async () => null;
  await assert.rejects(
    pedidoService.crearPedido(
      { clienteId: CLIENTE_ID, productoId: PRODUCTO_ID, precio: 350 },
      VENDEDOR_ID
    ),
    { status: 409 }
  );

  // Si falla crearPedido despues de apartar -> libera la pieza automaticamente
  pedidoRepository.apartarProductoPorIdYVendedor = async () => ({
    _id: PRODUCTO_ID,
    estado: "apartado"
  });
  pedidoRepository.crearPedido = async () => {
    throw new Error("Fallo de escritura en pedidos");
  };

  await assert.rejects(
    pedidoService.crearPedido(
      { clienteId: CLIENTE_ID, productoId: PRODUCTO_ID, precio: 350 },
      VENDEDOR_ID
    ),
    /Fallo de escritura/
  );
  assert.equal(liberadoLlamado, 1);

  // Al eliminar un pedido vinculado a una pieza -> libera la pieza
  t.mock.method(pedidoRepository, "eliminarPorIdYVendedor", async () => ({
    _id: PEDIDO_ID,
    productoId: PRODUCTO_ID
  }));

  await pedidoService.eliminarPedido(PEDIDO_ID, VENDEDOR_ID);
  assert.equal(liberadoLlamado, 2);
});

test("proteccion de integridad referencial en productos, clientes, lives y usuarios", async (t) => {
  // Producto con pedidos no se puede eliminar ni reactivar
  t.mock.method(productoRepository, "tienePedidosAsociados", async () => true);
  await assert.rejects(
    productoService.eliminarProducto(PRODUCTO_ID, VENDEDOR_ID),
    { status: 409 }
  );
  await assert.rejects(
    productoService.actualizarEstadoProducto(PRODUCTO_ID, "activo", VENDEDOR_ID),
    { status: 409 }
  );

  // Cliente con pedidos no se puede eliminar
  t.mock.method(clienteRepository, "tienePedidosAsociados", async () => true);
  await assert.rejects(
    clienteService.eliminarCliente(CLIENTE_ID, VENDEDOR_ID),
    { status: 409 }
  );

  // Live activo o con pedidos no se puede eliminar
  t.mock.method(liveRepository, "buscarPorIdYVendedor", async () => ({
    _id: LIVE_ID,
    estado: "activo"
  }));
  await assert.rejects(liveService.eliminarLive(LIVE_ID, VENDEDOR_ID), {
    status: 409
  });

  liveRepository.buscarPorIdYVendedor = async () => ({
    _id: LIVE_ID,
    estado: "finalizado"
  });
  t.mock.method(liveRepository, "tienePedidosAsociados", async () => true);
  await assert.rejects(liveService.eliminarLive(LIVE_ID, VENDEDOR_ID), {
    status: 409
  });

  // Admin no puede eliminarse ni inactivarse a si mismo, ni eliminar vendedor con tienda activa
  await assert.rejects(userService.eliminarUsuario(ADMIN_ID, ADMIN_ID), {
    status: 400
  });
  await assert.rejects(
    userService.actualizarEstadoUsuario(ADMIN_ID, "inactivo", ADMIN_ID),
    { status: 400 }
  );
  t.mock.method(userRepository, "tieneDatosDeTienda", async () => true);
  await assert.rejects(userService.eliminarUsuario(VENDEDOR_ID, ADMIN_ID), {
    status: 409
  });
});

test("resumen soporta ventas directas, resumen general y escape seguro en busquedas publicas", async (t) => {
  t.mock.method(
    resumenRepository,
    "listarPedidosDirectosPorVendedor",
    async () => [
      { cantidad: 1, precio: 250, estadoPago: "pagado", estadoEntrega: "pendiente" },
      { cantidad: 2, precio: 100, estadoPago: "pendiente", estadoEntrega: "entregado" }
    ]
  );

  const resumenDirecto = await resumenService.obtenerResumenPorLive(
    "directa",
    VENDEDOR_ID
  );
  assert.equal(resumenDirecto.liveId, "directa");
  assert.equal(resumenDirecto.totalPedidos, 2);
  assert.equal(resumenDirecto.totalVendido, 450);
  assert.equal(resumenDirecto.totalPagado, 250);
  assert.equal(resumenDirecto.totalPendientePago, 200);

  // Escape de caracteres especiales de regex en busqueda publica
  const escapado = explorarPublicoRepository.escaparRegex("[BLUSA-01] (L.200)+?");
  assert.equal(escapado, "\\[BLUSA-01\\] \\(L\\.200\\)\\+\\?");

  // Catalogo publico incluye codigo de pieza y fallback de nombre del vendedor
  t.mock.method(catalogoPublicoRepository, "buscarVendedorPorId", async () => ({
    _id: VENDEDOR_ID,
    nombre: "Tienda Moda HN",
    rol: "vendedor",
    estado: "activo"
  }));
  t.mock.method(catalogoPublicoRepository, "buscarPerfilPorVendedor", async () => ({
    nombrePublico: ""
  }));
  t.mock.method(
    catalogoPublicoRepository,
    "listarProductosActivosPorVendedor",
    async () => [{ _id: PRODUCTO_ID, codigo: "BLUSA-01", nombre: "Blusa", precio: 150, estado: "activo" }]
  );
  t.mock.method(catalogoPublicoRepository, "listarLivesPublicosPorVendedor", async () => []);

  const catalogo = await catalogoPublicoService.obtenerCatalogo(VENDEDOR_ID);
  assert.equal(catalogo.perfil.nombrePublico, "Tienda Moda HN");
  assert.equal(catalogo.productos[0].codigo, "BLUSA-01");
});
