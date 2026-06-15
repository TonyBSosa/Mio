const mongoose = require("mongoose");

const catalogoPublicoRepository = require("../repositories/catalogoPublicoRepository");

const crearError = (status, mensaje) => {
  const error = new Error(mensaje);
  error.status = status;
  error.mensaje = mensaje;
  return error;
};

const validarVendedorId = (vendedorId) => {
  if (!mongoose.Types.ObjectId.isValid(vendedorId)) {
    throw crearError(400, "ID de vendedor invalido");
  }
};

const formatearPerfil = (perfil) => {
  return {
    nombrePublico: perfil?.nombrePublico || "",
    descripcion: perfil?.descripcion || "",
    facebook: perfil?.facebook || "",
    instagram: perfil?.instagram || "",
    tiktok: perfil?.tiktok || "",
    whatsapp: perfil?.whatsapp || "",
    enlaceLive: perfil?.enlaceLive || ""
  };
};

const formatearProducto = (producto) => {
  const productoPlano = producto?.toObject ? producto.toObject() : producto;

  return {
    _id: productoPlano._id,
    nombre: productoPlano.nombre || "",
    descripcion: productoPlano.descripcion || "",
    categoria: productoPlano.categoria || "",
    precio: productoPlano.precio || 0,
    estado: productoPlano.estado || "",
    foto:
      productoPlano.foto ||
      productoPlano.imagen ||
      productoPlano.imagenUrl ||
      productoPlano.urlFoto ||
      ""
  };
};

const obtenerCatalogo = async (vendedorId) => {
  validarVendedorId(vendedorId);

  const perfil = await catalogoPublicoRepository.buscarPerfilPorVendedor(
    vendedorId
  );
  const productos =
    await catalogoPublicoRepository.listarProductosActivosPorVendedor(vendedorId);
  const lives =
    await catalogoPublicoRepository.listarLivesPublicosPorVendedor(vendedorId);

  return {
    perfil: formatearPerfil(perfil),
    productos: productos.map((producto) => formatearProducto(producto)),
    lives
  };
};

module.exports = {
  obtenerCatalogo
};
