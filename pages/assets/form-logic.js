/**
 * BJJ Performance Pro — form-logic.js
 *
 * Motor de renderização do formulário de anamnese.
 * - Lê token da URL (?t=...&dev=1&nome=...)
 * - Busca dados do aluno via API (ou modo dev sem token)
 * - Renderiza os 17 blocos de blocks-config.js sequencialmente
 * - Processa showIf com operadores: equals, in, notEquals
 * - Valida campos obrigatórios
 * - Submete via POST /api/anamnese/responder/:token
 *
 * Versão: 1.0.0
 */

import { BLOCKS } from './blocks-config.js';

// ─── Configuração ───────────────────────────────
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8787'
  : 'https://bjj-anamnese-api.fontesjuniorbs.workers.dev';

// ─── Estado global ──────────────────────────────
const state = {
  token: null,
  nomeAluno: null,
  isDev: false,
  currentBlock: 0,
  respostas: {},
  startedAt: Date.now(),
};

// ─── Inicialização ──────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const params = new URLSearchParams(location.search);
  state.token = params.get('t');
  state.isDev = params.get('dev') === '1';
  const nomeFromUrl = params.get('nome');

  if (!state.token) {
    showError('Token ausente. Use o link enviado pelo professor.');
    return;
  }

  if (state.isDev) {
    state.nomeAluno = nomeFromUrl || 'Atleta de teste';
    renderForm();
    return;
  }

  try {
    const r = await fetch(API_BASE + '/api/anamnese/buscar/' + state.token);
    if (r.status === 409) {
      const data = await r.json();
      showAlreadyAnswered(data.respondidoEm);
      return;
    }
    if (!r.ok) throw new Error('Falha ao buscar token (' + r.status + ')');
    const data = await r.json();
    state.nomeAluno = data.nomeAluno;
    renderForm();
  } catch (e) {
    showError('Erro ao carregar a anamnese: ' + e.message);
  }
}

// ─── Renderização ───────────────────────────────
function renderForm() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = '';

  // Header
  const header = document.createElement('header');
  header.className = 'fp-header';
  header.innerHTML = '<div class="fp-brand">BJJ Performance</div>' +
    '<h1>Anamnese — ' + escapeHtml(state.nomeAluno || 'Atleta') + '</h1>' +
    '<p class="fp-sub">17 blocos · ~10 a 15 minutos · suas respostas são confidenciais</p>';
  root.appendChild(header);

  // Barra de progresso
  const progress = document.createElement('div');
  progress.className = 'fp-progress';
  progress.innerHTML = '<div class="fp-progress-bar" id="progressBar"></div>' +
    '<div class="fp-progress-text" id="progressText">Bloco 1 de ' + BLOCKS.length + '</div>';
  root.appendChild(progress);

  // Container dos blocos
  const main = document.createElement('main');
  main.id = 'fp-blocks';
  main.className = 'fp-main';
  root.appendChild(main);

  showBlock(0);
}
function showBlock(idx) {
  state.currentBlock = idx;
  const block = BLOCKS[idx];
  if (!block) return;

  const main = document.getElementById('fp-blocks');
  main.innerHTML = '';

  // Atualizar progresso
  const pct = ((idx + 1) / BLOCKS.length) * 100;
  document.getElementById('progressBar').style.width = pct.toFixed(1) + '%';
  document.getElementById('progressText').textContent = 'Bloco ' + (idx + 1) + ' de ' + BLOCKS.length;

  const card = document.createElement('section');
  card.className = 'fp-card';

  // Cabeçalho do bloco
  let html = '<div class="fp-block-header">';
  html += '<span class="fp-block-num">' + block.numero + '</span>';
  html += '<div><h2>' + escapeHtml(block.titulo) + '</h2>';
  if (block.subtitulo) html += '<p class="fp-block-sub">' + escapeHtml(block.subtitulo) + '</p>';
  html += '</div></div>';

  if (block.intro) html += '<p class="fp-intro">' + escapeHtml(block.intro) + '</p>';

  card.innerHTML = html;

  // Renderizar campos
  const fieldsContainer = document.createElement('div');
  fieldsContainer.className = 'fp-fields';
  card.appendChild(fieldsContainer);

  block.fields.forEach(field => {
    const fieldEl = renderField(block.id, field);
    fieldsContainer.appendChild(fieldEl);
  });

  // Aplicar showIf inicial
  applyShowIfRules(block, fieldsContainer);

  // Botões de navegação
  const nav = document.createElement('div');
  nav.className = 'fp-nav';
  if (idx > 0) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'fp-btn fp-btn-secondary';
    back.textContent = '← Voltar';
    back.addEventListener('click', () => showBlock(idx - 1));
    nav.appendChild(back);
  }
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'fp-btn fp-btn-primary';
  next.textContent = idx === BLOCKS.length - 1 ? 'Enviar anamnese' : 'Avançar →';
  next.addEventListener('click', () => onAdvance(block, fieldsContainer));
  nav.appendChild(next);
  card.appendChild(nav);

  main.appendChild(card);
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function onAdvance(block, container) {
  const errors = collectAndValidate(block, container);
  if (errors.length > 0) {
    alert('Por favor, corrija:\n\n' + errors.join('\n'));
    return;
  }
  if (state.currentBlock === BLOCKS.length - 1) {
    submitAll();
  } else {
    showBlock(state.currentBlock + 1);
  }
}
// ─── Renderização de campos ─────────────────────
function renderField(blockId, field) {
  const wrap = document.createElement('div');
  wrap.className = 'fp-field';
  wrap.dataset.fieldId = field.id;
  wrap.dataset.tipo = field.tipo;

  const labelEl = document.createElement('label');
  labelEl.className = 'fp-label';
  labelEl.textContent = field.label + (field.obrigatorio ? ' *' : '');
  wrap.appendChild(labelEl);

  if (field.ajuda) {
    const help = document.createElement('p');
    help.className = 'fp-help';
    help.textContent = field.ajuda;
    wrap.appendChild(help);
  }

  const t = field.tipo;
  const stored = (state.respostas[blockId] || {})[field.id];

  if (t === 'text' || t === 'email' || t === 'tel' || t === 'date' || t === 'time') {
    const inp = document.createElement('input');
    inp.type = t;
    inp.className = 'fp-input';
    inp.name = field.id;
    if (field.maxLength) inp.maxLength = field.maxLength;
    if (field.placeholder) inp.placeholder = field.placeholder;
    if (stored != null) inp.value = stored;
    inp.addEventListener('input', () => onFieldChange(blockId, field.id, inp.value));
    wrap.appendChild(inp);
  } else if (t === 'number') {
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.className = 'fp-input';
    inp.name = field.id;
    if (field.min != null) inp.min = field.min;
    if (field.max != null) inp.max = field.max;
    if (field.step != null) inp.step = field.step;
    if (field.placeholder) inp.placeholder = field.placeholder;
    if (stored != null) inp.value = stored;
    inp.addEventListener('input', () => {
      const v = inp.value === '' ? null : parseFloat(inp.value);
      onFieldChange(blockId, field.id, v);
    });
    wrap.appendChild(inp);
  } else if (t === 'textarea') {
    const ta = document.createElement('textarea');
    ta.className = 'fp-textarea';
    ta.name = field.id;
    ta.rows = 4;
    if (field.maxLength) ta.maxLength = field.maxLength;
    if (field.placeholder) ta.placeholder = field.placeholder;
    if (stored != null) ta.value = stored;
    ta.addEventListener('input', () => onFieldChange(blockId, field.id, ta.value));
    wrap.appendChild(ta);
  } else if (t === 'radio') {
    const group = document.createElement('div');
    group.className = 'fp-radio-group';
    field.opcoes.forEach(op => {
      const id = field.id + '_' + op.value;
      const lab = document.createElement('label');
      lab.className = 'fp-radio';
      lab.htmlFor = id;
      const r = document.createElement('input');
      r.type = 'radio';
      r.id = id;
      r.name = field.id;
      r.value = op.value;
      if (stored === op.value) r.checked = true;
      r.addEventListener('change', () => onFieldChange(blockId, field.id, op.value));
      lab.appendChild(r);
      const span = document.createElement('span');
      span.textContent = op.label;
      lab.appendChild(span);
      group.appendChild(lab);
    });
    wrap.appendChild(group);
  } else if (t === 'checkbox') {
    const group = document.createElement('div');
    group.className = 'fp-check-group';
    const arr = Array.isArray(stored) ? stored : [];
    field.opcoes.forEach(op => {
      const id = field.id + '_' + op.value;
      const lab = document.createElement('label');
      lab.className = 'fp-check';
      lab.htmlFor = id;
      const c = document.createElement('input');
      c.type = 'checkbox';
      c.id = id;
      c.name = field.id;
      c.value = op.value;
      c.checked = arr.indexOf(op.value) !== -1;
      c.addEventListener('change', () => {
        const cur = state.respostas[blockId]?.[field.id];
        const list = Array.isArray(cur) ? cur.slice() : [];
        const i = list.indexOf(op.value);
        if (c.checked && i === -1) list.push(op.value);
        else if (!c.checked && i !== -1) list.splice(i, 1);
        onFieldChange(blockId, field.id, list);
      });
      lab.appendChild(c);
      const span = document.createElement('span');
      span.textContent = op.label;
      lab.appendChild(span);
      group.appendChild(lab);
    });
    wrap.appendChild(group);
  } else if (t === 'checkbox-aceite') {
    const lab = document.createElement('label');
    lab.className = 'fp-check fp-check-aceite';
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.name = field.id;
    c.checked = !!stored;
    c.addEventListener('change', () => onFieldChange(blockId, field.id, c.checked));
    lab.appendChild(c);
    const span = document.createElement('span');
    span.textContent = ' Eu li e concordo.';
    lab.appendChild(span);
    // Mostrar o texto do label antes do checkbox (já está no labelEl acima)
    wrap.appendChild(lab);
  }
  return wrap;
}
function onFieldChange(blockId, fieldId, value) {
  if (!state.respostas[blockId]) state.respostas[blockId] = {};
  if (value === '' || value == null || (Array.isArray(value) && value.length === 0)) {
    delete state.respostas[blockId][fieldId];
  } else {
    state.respostas[blockId][fieldId] = value;
  }
  // Reaplicar showIf no bloco atual
  const block = BLOCKS[state.currentBlock];
  const container = document.querySelector('.fp-fields');
  if (block && container) applyShowIfRules(block, container);
}

// ─── Lógica de showIf ───────────────────────────
function applyShowIfRules(block, container) {
  const respBloco = state.respostas[block.id] || {};
  block.fields.forEach(field => {
    if (!field.showIf) return;
    const el = container.querySelector('[data-field-id="' + field.id + '"]');
    if (!el) return;
    const visible = evaluateShowIf(field.showIf, respBloco);
    el.style.display = visible ? '' : 'none';
    if (!visible) {
      // Limpar valor se ficar invisível
      delete state.respostas[block.id][field.id];
    }
  });
}

function evaluateShowIf(rule, resp) {
  if (!rule || !rule.field) return true;
  const v = resp[rule.field];
  if ('equals' in rule) return v === rule.equals;
  if ('notEquals' in rule) return v !== rule.notEquals;
  if ('in' in rule && Array.isArray(rule.in)) return rule.in.indexOf(v) !== -1;
  return true;
}

// ─── Validação ──────────────────────────────────
function collectAndValidate(block, container) {
  const errors = [];
  const respBloco = state.respostas[block.id] || {};
  block.fields.forEach(field => {
    if (!field.obrigatorio) return;
    // Pular se o campo está oculto pelo showIf
    if (field.showIf && !evaluateShowIf(field.showIf, respBloco)) return;
    const v = respBloco[field.id];
    const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
    if (empty) errors.push('• ' + field.label.replace(/ \*$/, ''));
  });
  return errors;
}

// ─── Submissão final ────────────────────────────
async function submitAll() {
  if (state.isDev) {
    console.log('[DEV] Respostas coletadas:', state.respostas);
    alert('Modo dev: respostas no console (F12).');
    return;
  }

  const payload = {
    respostas: state.respostas,
    metadata: {
      versao: '1.0.0',
      durationMin: Math.round((Date.now() - state.startedAt) / 60000),
      skippedBlocks: BLOCKS.filter(b => !state.respostas[b.id]).map(b => b.id),
    },
  };

  try {
    const r = await fetch(API_BASE + '/api/anamnese/responder/' + state.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) {
      alert('Erro ao enviar: ' + (data.message || data.error || r.status));
      return;
    }
    showSuccess(data);
  } catch (e) {
    alert('Erro de rede: ' + e.message);
  }
}

// ─── Telas auxiliares ───────────────────────────
function showError(msg) {
  const root = document.getElementById('app');
  root.innerHTML = '<div class="fp-card fp-error"><h2>Não foi possível abrir esta anamnese</h2><p>' + escapeHtml(msg) + '</p></div>';
}

function showAlreadyAnswered(when) {
  const root = document.getElementById('app');
  root.innerHTML = '<div class="fp-card fp-info"><h2>Anamnese já respondida</h2>' +
    '<p>Esta anamnese foi respondida em ' + escapeHtml(formatDate(when)) + ' e não pode ser preenchida novamente.</p>' +
    '<p>Em caso de dúvidas, entre em contato com o Prof. Fontes Júnior.</p></div>';
}

function showSuccess(data) {
  const root = document.getElementById('app');
  root.innerHTML = '<div class="fp-card fp-success"><h2>✓ Anamnese enviada</h2>' +
    '<p>Suas respostas foram registradas com sucesso. O Prof. Fontes Júnior receberá sua avaliação e dará retorno em breve.</p>' +
    '<p class="fp-muted">Recebida em ' + escapeHtml(formatDate(data.respondidoEm)) + '</p></div>';
}

// ─── Helpers ────────────────────────────────────
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return iso; }
}
