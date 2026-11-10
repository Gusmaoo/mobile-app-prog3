// Apaga o banco SQLite e recria com os dados de demonstração.
// ATENÇÃO: apaga TODOS os dados cadastrados. Exige --confirmar.
const fs = require('node:fs');
const path = require('node:path');

if (!process.argv.includes('--confirmar')) {
  console.log('Isto APAGA todos os dados do banco (alunos, notas, frequências, agendamentos).');
  console.log('Para confirmar, rode:  npm run db:reset -- --confirmar');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'portal.db');
const SESSIONS_FILE = process.env.SESSIONS_FILE || path.join(DATA_DIR, 'sessoes.db');

for (const base of [DB_FILE, SESSIONS_FILE]) {
  for (const file of [base, `${base}-wal`, `${base}-shm`, `${base}-journal`]) {
    fs.rmSync(file, { force: true });
  }
}

require('./db');
console.log('[db] Banco reiniciado.');
