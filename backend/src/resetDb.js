// Apaga o banco SQLite e recria com os dados de demonstração.
const fs = require('node:fs');
const path = require('node:path');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'portal.db');

for (const file of [DB_FILE, `${DB_FILE}-wal`, `${DB_FILE}-shm`]) {
  fs.rmSync(file, { force: true });
}

require('./db');
console.log('[db] Banco reiniciado.');
