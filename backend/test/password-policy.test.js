const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const policy = require('../src/services/passwordPolicy');

test('política: frases Unicode, límites en bytes, claves bloqueadas y caracteres inválidos', async () => {
  for (const p of [null, {}, 123, '', 'corta', '123456789012345', 'PASSWORDPASSWORD',
    'á'.repeat(37), 'a'.repeat(73), ' '.repeat(20), 'clave\0muy-larga-12345', '\ud800'.repeat(16)]) {
    assert.throws(() => policy.validarPassword(p), { status: 400 });
  }
  for (const p of ['Una frase única 🦋', 'á'.repeat(36), 'Una frase con espacios al final  ']) {
    assert.equal(policy.validarPassword(p), p);
    const hash = await policy.hashPassword(p);
    assert.equal(bcrypt.getRounds(hash), 12);
    assert.equal(await policy.verificarPassword(p, hash), true);
    assert.equal(await policy.verificarPassword(p + 'x', hash), Buffer.byteLength(p) === 72);
  }
});

test('login conserva claves bcrypt heredadas cortas y de más de 72 bytes, sin rehash', async () => {
  for (const p of ['corta', 'á'.repeat(50)]) {
    const hash = await bcrypt.hash(p, 10);
    assert.equal(await policy.verificarPassword(p, hash), true);
    assert.throws(() => policy.validarPassword(p), { status: 400 });
  }
});
