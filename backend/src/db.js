const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const { hashPassword } = require('./auth');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'portal.db');

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new DatabaseSync(DB_FILE);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS usuarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo        TEXT NOT NULL CHECK (tipo IN ('aluno', 'professor')),
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
    senha_hash  TEXT NOT NULL,
    matricula   TEXT NOT NULL UNIQUE,
    curso       TEXT,
    turma       TEXT,
    telefone    TEXT,
    disciplina  TEXT,
    criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessoes (
    token       TEXT PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    professor_id  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    disciplina    TEXT NOT NULL,
    etapa         TEXT NOT NULL,
    nota          REAL NOT NULL CHECK (nota BETWEEN 0 AND 10),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (aluno_id, disciplina, etapa)
  );

  CREATE TABLE IF NOT EXISTS frequencias (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    professor_id  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    disciplina    TEXT NOT NULL,
    total_aulas   INTEGER NOT NULL CHECK (total_aulas >= 0),
    faltas        INTEGER NOT NULL CHECK (faltas >= 0),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (aluno_id, disciplina)
  );

  CREATE TABLE IF NOT EXISTS disponibilidades (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data          TEXT NOT NULL,
    hora_inicio   TEXT NOT NULL,
    hora_fim      TEXT NOT NULL,
    local         TEXT NOT NULL,
    criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agendamentos (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    disponibilidade_id  INTEGER NOT NULL REFERENCES disponibilidades(id) ON DELETE CASCADE,
    aluno_id            INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    assunto             TEXT NOT NULL,
    observacao          TEXT,
    status              TEXT NOT NULL DEFAULT 'agendado'
                        CHECK (status IN ('agendado', 'cancelado', 'concluido')),
    criado_em           TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function isoDate(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function seed() {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get();
  if (total > 0) return;

  const senha = hashPassword('123456');

  const insertUser = db.prepare(`
    INSERT INTO usuarios (tipo, nome, email, senha_hash, matricula, curso, turma, telefone, disciplina)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const prof = id => Number(id.lastInsertRowid);

  const profMat = prof(insertUser.run('professor', 'Carlos Henrique Lima', 'professor@escola.com', senha, 'P001', null, null, '(11) 90000-0001', 'Matemática'));
  const profPort = prof(insertUser.run('professor', 'Mariana Duarte Costa', 'professora@escola.com', senha, 'P002', null, null, '(11) 90000-0002', 'Português'));

  const aluno1 = prof(insertUser.run('aluno', 'Ana Beatriz Souza', 'aluno@escola.com', senha, 'A2024001', 'Ensino Médio', '2º A', null, null));
  const aluno2 = prof(insertUser.run('aluno', 'Pedro Alves Martins', 'pedro@escola.com', senha, 'A2024002', 'Ensino Médio', '2º A', null, null));
  const aluno3 = prof(insertUser.run('aluno', 'Julia Ferreira Rocha', 'julia@escola.com', senha, 'A2024003', 'Ensino Médio', '2º B', null, null));

  const insertNota = db.prepare(`
    INSERT INTO notas (aluno_id, professor_id, disciplina, etapa, nota) VALUES (?, ?, ?, ?, ?)
  `);

  [
    [aluno1, profMat, 'Matemática', '1º Bimestre', 5.5],
    [aluno1, profMat, 'Matemática', '2º Bimestre', 6.0],
    [aluno1, profPort, 'Português', '1º Bimestre', 8.5],
    [aluno1, profPort, 'Português', '2º Bimestre', 9.0],
    [aluno2, profMat, 'Matemática', '1º Bimestre', 7.0],
    [aluno2, profPort, 'Português', '1º Bimestre', 6.5],
    [aluno3, profMat, 'Matemática', '1º Bimestre', 9.5],
    [aluno3, profPort, 'Português', '1º Bimestre', 7.5]
  ].forEach(row => insertNota.run(...row));

  const insertFreq = db.prepare(`
    INSERT INTO frequencias (aluno_id, professor_id, disciplina, total_aulas, faltas) VALUES (?, ?, ?, ?, ?)
  `);

  [
    [aluno1, profMat, 'Matemática', 40, 11],
    [aluno1, profPort, 'Português', 36, 2],
    [aluno2, profMat, 'Matemática', 40, 4],
    [aluno2, profPort, 'Português', 36, 6],
    [aluno3, profMat, 'Matemática', 40, 0],
    [aluno3, profPort, 'Português', 36, 1]
  ].forEach(row => insertFreq.run(...row));

  const insertDisp = db.prepare(`
    INSERT INTO disponibilidades (professor_id, data, hora_inicio, hora_fim, local) VALUES (?, ?, ?, ?, ?)
  `);

  const d1 = prof(insertDisp.run(profMat, isoDate(2), '14:00', '15:00', 'Sala de Atendimento'));
  insertDisp.run(profMat, isoDate(4), '10:00', '11:00', 'Sala 12');
  insertDisp.run(profPort, isoDate(3), '15:00', '16:00', 'Biblioteca');
  insertDisp.run(profPort, isoDate(6), '09:00', '10:00', 'Sala de Atendimento');

  db.prepare(`
    INSERT INTO agendamentos (disponibilidade_id, aluno_id, assunto, observacao) VALUES (?, ?, ?, ?)
  `).run(d1, aluno1, 'Dúvidas de funções do 2º grau', 'Revisar exercícios da lista 3');

  console.log('[db] Banco criado com dados de demonstração.');
}

seed();

module.exports = { db, DB_FILE };
