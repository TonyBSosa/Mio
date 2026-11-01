const perfilVendedorRepository = require("../repositories/perfilVendedorRepository");

const crearPerfilVacio = (vendedorId) => {
  return perfilVendedorRepository.crearPerfil({
    vendedorId,
    nombrePublico: "",
    descripcion: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    whatsapp: "",
    enlaceLive: "",
    activo: true
  });
};

const obtenerMiPerfil = async (vendedorId) => {
  const perfil = await perfilVendedorRepository.buscarPorVendedor(vendedorId);

  if (perfil) {
    return perfil;
  }

  return crearPerfilVacio(vendedorId);
};

const limpiarTexto = (valor) => {
  return typeof valor === "string" ? valor.trim() : "";
};

const guardarMiPerfil = (vendedorId, data = {}) => {
  const {
    nombrePublico,
    descripcion,
    facebook,
    instagram,
    tiktok,
    whatsapp,
    enlaceLive
  } = data;

  return perfilVendedorRepository.actualizarPorVendedor(vendedorId, {
    vendedorId,
    nombrePublico: limpiarTexto(nombrePublico),
    descripcion: limpiarTexto(descripcion),
    facebook: limpiarTexto(facebook),
    instagram: limpiarTexto(instagram),
    tiktok: limpiarTexto(tiktok),
    whatsapp: limpiarTexto(whatsapp),
    enlaceLive: limpiarTexto(enlaceLive),
    activo: true
  });
};

module.exports = {
  obtenerMiPerfil,
  guardarMiPerfil
};
