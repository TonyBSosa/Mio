// Única fuente de tiempo del ciclo de reservas. Las pruebas sustituyen ahora().
module.exports = { ahora: () => new Date() };
