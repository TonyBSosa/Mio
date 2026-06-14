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

const guardarMiPerfil = (vendedorId, data) => {
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
    nombrePublico,
    descripcion,
    facebook,
    instagram,
    tiktok,
    whatsapp,
    enlaceLive,
    activo: true
  });
};

module.exports = {
  obtenerMiPerfil,
  guardarMiPerfil
};
