const os = require('node:os');
const express = require('express');
const cors = require('cors');

const { db, DB_FILE } = require('./db');
const { verifyPassword, hashPassword, newToken } = require('./auth');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const fail = (status, message) => {
  throw new HttpError(status, message);
};

function publicUser(u) {
  if (!u) return null;
  const { senha_hash, ...rest } = u;
  return rest;
}

function percentual(total, faltas) {
  if (!total) return 100;
  return Math.max(0, Math.round(((total - faltas) / total) * 100));
}

function withPercentual(rows) {
  return rows.map(r => ({ ...r, percentual: percentual(r.total_aulas, r.faltas) }));
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function auth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) fail(401, 'Sessão expirada. Entre novamente.');

  const user = db.prepare(`
    SELECT u.* FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ?
  `).get(token);

  if (!user) fail(401, 'Sessão expirada. Entre novamente.');

  req.user = user;
  req.token = token;
  next();
}

const only = tipo => (req, _res, next) => {
  if (req.user.tipo !== tipo) fail(403, `Acesso permitido apenas para ${tipo}.`);
  next();
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/login', (req, res) => {
  const email = text(req.body.email);
  const senha = String(req.body.senha || '');
  const tipo = req.body.tipo;

  if (!email || !senha) fail(400, 'Informe o e-mail e a senha.');

  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

  if (!user || !verifyPassword(senha, user.senha_hash)) {
    fail(401, 'E-mail ou senha inválidos.');
  }

  if (tipo && user.tipo !== tipo) {
    fail(403, `Este acesso é de ${user.tipo}. Selecione a aba correta.`);
  }

  const token = newToken();
  db.prepare('INSERT INTO sessoes (token, usuario_id) VALUES (?, ?)').run(token, user.id);

  res.json({ token, usuario: publicUser(user) });
});

app.post('/api/auth/logout', auth, (req, res) => {
  db.prepare('DELETE FROM sessoes WHERE token = ?').run(req.token);
  res.json({ ok: true });
});

function cadastrar(tipo, body) {
  const nome = text(body.nome);
  const matricula = text(body.matricula);
  const email = text(body.email).toLowerCase();
  const senha = String(body.senha || '');

  if (!nome || !matricula || !email || !senha) {
    fail(400, 'Preencha nome, matrícula, e-mail e senha.');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'Informe um e-mail válido.');
  if (senha.length < 6) fail(400, 'A senha deve ter pelo menos 6 caracteres.');
  if (senha !== String(body.confirmarSenha || '')) fail(400, 'As senhas não conferem.');

  const disciplina = tipo === 'professor' ? text(body.disciplina) : null;
  if (tipo === 'professor' && !disciplina) fail(400, 'Informe a disciplina.');

  const existe = db.prepare('SELECT email, matricula FROM usuarios WHERE email = ? OR matricula = ?').get(email, matricula);
  if (existe) {
    fail(409, existe.email === email ? 'E-mail já cadastrado.' : 'Matrícula já cadastrada.');
  }

  const info = db.prepare(`
    INSERT INTO usuarios (tipo, nome, email, senha_hash, matricula, curso, turma, telefone, disciplina)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tipo,
    nome,
    email,
    hashPassword(senha),
    matricula,
    tipo === 'aluno' ? text(body.curso) || null : null,
    tipo === 'aluno' ? text(body.turma) || null : null,
    tipo === 'professor' ? text(body.telefone) || null : null,
    disciplina
  );

  return publicUser(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid));
}

app.post('/api/auth/cadastro-aluno', (req, res) => {
  res.status(201).json({ usuario: cadastrar('aluno', req.body) });
});

app.post('/api/auth/cadastro-professor', (req, res) => {
  res.status(201).json({ usuario: cadastrar('professor', req.body) });
});

// ---------------------------------------------------------------------------
// Dashboard (aluno e professor)
// ---------------------------------------------------------------------------

app.get('/api/dashboard', auth, (req, res) => {
  const u = req.user;

  if (u.tipo === 'aluno') {
    const { media } = db.prepare('SELECT AVG(nota) AS media FROM notas WHERE aluno_id = ?').get(u.id);
    const freq = db.prepare(`
      SELECT COALESCE(SUM(total_aulas), 0) AS total, COALESCE(SUM(faltas), 0) AS faltas
      FROM frequencias WHERE aluno_id = ?
    `).get(u.id);
    const { agendamentos } = db.prepare(`
      SELECT COUNT(*) AS agendamentos FROM agendamentos WHERE aluno_id = ? AND status = 'agendado'
    `).get(u.id);

    return res.json({
      media: media == null ? '-' : Number(media).toFixed(1),
      frequencia: percentual(freq.total, freq.faltas),
      faltas: freq.faltas,
      agendamentos
    });
  }

  const { alunos } = db.prepare("SELECT COUNT(*) AS alunos FROM usuarios WHERE tipo = 'aluno'").get();
  const { atendimentos } = db.prepare(`
    SELECT COUNT(*) AS atendimentos FROM agendamentos a
    JOIN disponibilidades d ON d.id = a.disponibilidade_id
    WHERE d.professor_id = ? AND a.status = 'agendado'
  `).get(u.id);
  const { horarios } = db.prepare('SELECT COUNT(*) AS horarios FROM disponibilidades WHERE professor_id = ?').get(u.id);

  res.json({ alunos, atendimentos, horarios });
});

// ---------------------------------------------------------------------------
// Aluno
// ---------------------------------------------------------------------------

app.get('/api/notas', auth, only('aluno'), (req, res) => {
  res.json(db.prepare(`
    SELECT id, disciplina, etapa, nota FROM notas WHERE aluno_id = ? ORDER BY disciplina, etapa
  `).all(req.user.id));
});

app.get('/api/faltas', auth, only('aluno'), (req, res) => {
  res.json(withPercentual(db.prepare(`
    SELECT id, disciplina, total_aulas, faltas FROM frequencias WHERE aluno_id = ? ORDER BY disciplina
  `).all(req.user.id)));
});

app.get('/api/agendamento/disponibilidades', auth, only('aluno'), (_req, res) => {
  res.json(db.prepare(`
    SELECT d.id, d.data, d.hora_inicio, d.hora_fim, d.local,
           p.nome AS professor, p.disciplina
    FROM disponibilidades d
    JOIN usuarios p ON p.id = d.professor_id
    WHERE d.data >= date('now', 'localtime')
      AND NOT EXISTS (
        SELECT 1 FROM agendamentos a WHERE a.disponibilidade_id = d.id AND a.status = 'agendado'
      )
    ORDER BY d.data, d.hora_inicio
  `).all());
});

app.get('/api/agendamento/meus', auth, only('aluno'), (req, res) => {
  res.json(db.prepare(`
    SELECT a.id, a.assunto, a.observacao, a.status,
           d.data, d.hora_inicio, d.hora_fim, d.local,
           p.nome AS professor, p.disciplina
    FROM agendamentos a
    JOIN disponibilidades d ON d.id = a.disponibilidade_id
    JOIN usuarios p ON p.id = d.professor_id
    WHERE a.aluno_id = ?
    ORDER BY d.data DESC, d.hora_inicio DESC
  `).all(req.user.id));
});

app.post('/api/agendamento', auth, only('aluno'), (req, res) => {
  const disponibilidadeId = Number(req.body.disponibilidade_id);
  const assunto = text(req.body.assunto);
  const observacao = text(req.body.observacao) || null;

  if (!disponibilidadeId || !assunto) fail(400, 'Escolha um horário e informe o assunto.');

  const slot = db.prepare('SELECT * FROM disponibilidades WHERE id = ?').get(disponibilidadeId);
  if (!slot) fail(404, 'Horário não encontrado.');

  const ocupado = db.prepare(`
    SELECT 1 FROM agendamentos WHERE disponibilidade_id = ? AND status = 'agendado'
  `).get(disponibilidadeId);
  if (ocupado) fail(409, 'Este horário já foi reservado.');

  const info = db.prepare(`
    INSERT INTO agendamentos (disponibilidade_id, aluno_id, assunto, observacao) VALUES (?, ?, ?, ?)
  `).run(disponibilidadeId, req.user.id, assunto, observacao);

  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.delete('/api/agendamento/:id', auth, only('aluno'), (req, res) => {
  const info = db.prepare(`
    UPDATE agendamentos SET status = 'cancelado'
    WHERE id = ? AND aluno_id = ? AND status = 'agendado'
  `).run(Number(req.params.id), req.user.id);

  if (!info.changes) fail(404, 'Agendamento não encontrado.');
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Professor
// ---------------------------------------------------------------------------

app.get('/api/professor/alunos', auth, only('professor'), (_req, res) => {
  res.json(db.prepare(`
    SELECT id, nome, matricula, email, curso, turma FROM usuarios WHERE tipo = 'aluno' ORDER BY nome
  `).all());
});

app.get('/api/professor/alunos/:id/resumo', auth, only('professor'), (req, res) => {
  const id = Number(req.params.id);
  const aluno = db.prepare(`
    SELECT id, nome, matricula, email, curso, turma FROM usuarios WHERE id = ? AND tipo = 'aluno'
  `).get(id);
  if (!aluno) fail(404, 'Aluno não encontrado.');

  const notas = db.prepare(`
    SELECT id, disciplina, etapa, nota FROM notas WHERE aluno_id = ? ORDER BY disciplina, etapa
  `).all(id);
  const faltas = withPercentual(db.prepare(`
    SELECT id, disciplina, total_aulas, faltas FROM frequencias WHERE aluno_id = ? ORDER BY disciplina
  `).all(id));

  res.json({ aluno, notas, faltas });
});

function alunoExiste(id) {
  const aluno = db.prepare("SELECT id FROM usuarios WHERE id = ? AND tipo = 'aluno'").get(id);
  if (!aluno) fail(404, 'Aluno não encontrado.');
}

app.post('/api/professor/notas', auth, only('professor'), (req, res) => {
  const alunoId = Number(req.body.aluno_id);
  const disciplina = req.user.disciplina || text(req.body.disciplina);
  const etapa = text(req.body.etapa);
  const nota = Number(req.body.nota);

  if (!alunoId || !disciplina || !etapa) fail(400, 'Informe aluno, disciplina e etapa.');
  if (req.body.nota === '' || !Number.isFinite(nota) || nota < 0 || nota > 10) {
    fail(400, 'A nota deve estar entre 0 e 10.');
  }
  alunoExiste(alunoId);

  db.prepare(`
    INSERT INTO notas (aluno_id, professor_id, disciplina, etapa, nota) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (aluno_id, disciplina, etapa)
    DO UPDATE SET nota = excluded.nota, professor_id = excluded.professor_id, atualizado_em = datetime('now')
  `).run(alunoId, req.user.id, disciplina, etapa, nota);

  res.json({ ok: true });
});

app.post('/api/professor/frequencia', auth, only('professor'), (req, res) => {
  const alunoId = Number(req.body.aluno_id);
  const disciplina = req.user.disciplina || text(req.body.disciplina);
  const total = Number(req.body.total_aulas);
  const faltas = Number(req.body.faltas);

  if (!alunoId || !disciplina) fail(400, 'Informe aluno e disciplina.');
  if (!Number.isInteger(total) || total <= 0) fail(400, 'Informe o total de aulas.');
  if (!Number.isInteger(faltas) || faltas < 0) fail(400, 'Informe a quantidade de faltas.');
  if (faltas > total) fail(400, 'As faltas não podem ser maiores que o total de aulas.');
  alunoExiste(alunoId);

  db.prepare(`
    INSERT INTO frequencias (aluno_id, professor_id, disciplina, total_aulas, faltas) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (aluno_id, disciplina)
    DO UPDATE SET total_aulas = excluded.total_aulas, faltas = excluded.faltas,
                  professor_id = excluded.professor_id, atualizado_em = datetime('now')
  `).run(alunoId, req.user.id, disciplina, total, faltas);

  res.json({ ok: true });
});

app.get('/api/professor/meus-horarios', auth, only('professor'), (req, res) => {
  const rows = db.prepare(`
    SELECT d.id, d.data, d.hora_inicio, d.hora_fim, d.local, u.nome AS aluno
    FROM disponibilidades d
    LEFT JOIN agendamentos a ON a.disponibilidade_id = d.id AND a.status = 'agendado'
    LEFT JOIN usuarios u ON u.id = a.aluno_id
    WHERE d.professor_id = ?
    ORDER BY d.data DESC, d.hora_inicio DESC
  `).all(req.user.id);

  res.json(rows.map(({ aluno, ...h }) => ({
    ...h,
    situacao: aluno ? `Reservado por ${aluno}` : 'Disponível'
  })));
});

app.post('/api/professor/disponibilidades', auth, only('professor'), (req, res) => {
  const data = text(req.body.data);
  const inicio = text(req.body.hora_inicio);
  const fim = text(req.body.hora_fim);
  const local = text(req.body.local) || 'Sala de Atendimento';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) {
    fail(400, 'Informe a data no formato AAAA-MM-DD.');
  }
  if (!/^\d{2}:\d{2}$/.test(inicio) || !/^\d{2}:\d{2}$/.test(fim)) {
    fail(400, 'Informe os horários no formato HH:MM.');
  }
  if (fim <= inicio) fail(400, 'O horário de término deve ser depois do início.');

  const info = db.prepare(`
    INSERT INTO disponibilidades (professor_id, data, hora_inicio, hora_fim, local) VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, data, inicio, fim, local);

  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.get('/api/professor/agendamentos', auth, only('professor'), (req, res) => {
  res.json(db.prepare(`
    SELECT a.id, a.assunto, a.observacao, a.status,
           d.data, d.hora_inicio, d.hora_fim, d.local,
           u.nome AS aluno, u.matricula
    FROM agendamentos a
    JOIN disponibilidades d ON d.id = a.disponibilidade_id
    JOIN usuarios u ON u.id = a.aluno_id
    WHERE d.professor_id = ?
    ORDER BY d.data, d.hora_inicio
  `).all(req.user.id));
});

// ---------------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------------

app.use('/api', (_req, _res) => fail(404, 'Rota não encontrada.'));

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ erro: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido.' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal)
    .map(i => i.address);
}

app.listen(PORT, HOST, () => {
  console.log(`\nAPI do Portal Escolar rodando na porta ${PORT}`);
  console.log(`Banco de dados: ${DB_FILE}`);
  console.log(`  Local:  http://localhost:${PORT}/api`);
  lanAddresses().forEach(ip => console.log(`  Rede:   http://${ip}:${PORT}/api`));
  console.log('');
});
