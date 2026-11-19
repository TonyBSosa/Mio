const { randomUUID } = require('node:crypto');
const User = require('../models/users');
const version = usuario => usuario.credentialVersion ?? null;
const vigente = usuario => Boolean(usuario && usuario.estado === 'activo' && !usuario.deletedAt);
const nuevaVersion = () => randomUUID();
// null coincide con null y campo ausente: compatibilidad con documentos heredados.
const filtroVersion = usuario => ({ _id: usuario._id, credentialVersion: version(usuario),
  estado: 'activo', deletedAt: null });
const cambiarConVersion = (usuario, password, expiresAt) => User.findOneAndUpdate(
  { ...filtroVersion(usuario), ...(expiresAt ? { $expr: { $gt: [{ $literal: expiresAt }, '$$NOW'] } } : {}) },
  { $set: { password, credentialVersion: nuevaVersion() } },
  { returnDocument: 'after', runValidators: true, writeConcern: { w: 'majority', wtimeout: 5000 } });
module.exports = { version, vigente, nuevaVersion, filtroVersion, cambiarConVersion };
