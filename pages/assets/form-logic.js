/**
 * BJJ Performance Pro — form-logic.js
 *
 * Motor de renderização do formulário de anamnese.
 *
 * Versão: 2.0.1 (2026-05-16)
 *   - Tela de boas-vindas com nome do aluno antes do questionário
 *   - PAR-Q+ promovido a Bloco 1 com gate estratificado (P1/P2/P3/P6)
 *   - Tela de bloqueio para procurar médico, com escape via "tenho liberação"
 *   - Pré-preenchimento do campo Telefone a partir do cadastro do treinador
 *   - Logging robusto em submitAll (console detalhado, fluxo de erro mais resiliente)
 *   - Modo Clean (estilos definidos em anamnese.html)
 *   - Fix missing_block: POST final envia aliases de bloco exigidos pelo Worker
 */

import { BLOCKS } from './blocks-config.js';

// ─── Configuração ───────────────────────────────
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8787'
  : 'https://bjj-anamnese-api.fontesedf.workers.dev';

// PAR-Q estratificado: somente estes campos disparam o gate de bloqueio
const PARQ_BLOCK_ID = 'bloco01_parq';
const PARQ_GATE_FIELDS = [
  'parq_p1_cardiaco',
  'parq_p2_dor_peito',
  'parq_p3_tontura',
  'parq_p6_musculoesqueletico',
];

const SUBMIT_BLOCK_ID = 'final';

function getSubmitBlockAliases(extra = {}) {
  return {
    block: extra.block || SUBMIT_BLOCK_ID,
    bloco: extra.bloco || SUBMIT_BLOCK_ID,
    blockId: extra.blockId || SUBMIT_BLOCK_ID,
    section: extra.section || SUBMIT_BLOCK_ID,
    etapa: extra.etapa || SUBMIT_BLOCK_ID,
    step: extra.step || SUBMIT_BLOCK_ID,
    currentBlock: extra.currentBlock || SUBMIT_BLOCK_ID,
    blocoAtual: extra.blocoAtual || SUBMIT_BLOCK_ID,
    formBlock: extra.formBlock || SUBMIT_BLOCK_ID,
    modo: extra.modo || 'anamnese_completa',
    form: extra.form || 'anamnese',
    status: extra.status || 'respondida',
  };
}

function getWorkerCompatRespostas(respostas) {
  const out = { ...(respostas || {}) };
  const aliases = {
    bloco01_identificacao: 'bloco02_identificacao',
    bloco02_antropometria: 'bloco03_antropometria',
    bloco03_bjj: 'bloco04_bjj',
    bloco04_fc: 'bloco05_fc',
    bloco05_disponibilidade: 'bloco06_disponibilidade',
    bloco06_equipamentos: 'bloco07_equipamentos',
    bloco07_lesoes: 'bloco08_lesoes',
    bloco08_suplementacao: 'bloco09_suplementacao',
    bloco09_ergogenicos: 'bloco10_ergogenicos',
    bloco10_nutricao: 'bloco11_nutricao',
    bloco11_parq: 'bloco01_parq',
    bloco13_rwlq: 'bloco13_rwlq',
    bloco14_leafq: 'bloco14_leafq',
    bloco15_psqi: 'bloco15_psqi',
    bloco16_objetivos: 'bloco16_objetivos',
    bloco17_consentimento: 'bloco17_consentimento',
  };

  Object.entries(aliases).forEach(([legacyId, currentId]) => {
    if (!out[legacyId] && out[currentId]) out[legacyId] = out[currentId];
  });

  return out;
}

// ─── State global ───────────────────────────────
const state = {
  token: null,
  nomeAluno: null,
  telefoneAluno: null,
  isDev: false,
  screen: 'loading',
  currentBlock: 0,
  respostas: {},
  parqOverride: false,
  startedAt: Date.now(),
};

// ─── Inicialização ───────────────────────────────
async function init() {
  console.log('[BJJ Anamnese] form-logic.js v2.0.1 missing_block fix carregado');
  const params = new URLSearchParams(location.search);
  state.token = params.get('t');
  state.isDev = params.get('dev') === '1';

  if (state.isDev) {
    state.nomeAluno = params.get('nome') || 'Atleta de Teste';
    state.telefoneAluno = params.get('tel') || '';
    renderWelcome();
    return;
  }

  if (!state.token) {
    showError('Link inválido', 'O token não foi encontrado na URL. Solicite um novo link ao seu treinador.');
    return;
  }

  try {
    const url = API_BASE + '/api/anamnese/buscar/' + encodeURIComponent(state.token);
    console.log('[Init] GET', url);
    const resp = await fetch(url);
    console.log('[Init] response status', resp.status);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    console.log('[Init] dados recebidos', data);

    state.nomeAluno = data.nomeAluno || data.nome || data.atleta || 'Atleta';
    state.telefoneAluno = data.telefone || data.whatsapp || data.tel || '';

    if (data.status === 'respondida' || data.respondidaEm) {
      showAlreadyAnswered();
      return;
    }

    renderWelcome();
  } catch (e) {
    console.error('[Init] FALHA', e);
    showError('Não foi possível carregar', 'Verifique sua conexão ou solicite um novo link ao seu treinador.');
  }
}

// ─── Tela de boas-vindas ───────────────────────────────
function renderWelcome() {
  state.screen = 'welcome';
  const root = document.getElementById('app');
  if (!root) return;

  const primeiroNome = (state.nomeAluno || 'Atleta').split(' ')[0];

  root.innerHTML =
    '<section class="fp-welcome">' +
      '<div class="fp-welcome-card">' +
        '<p class="fp-welcome-tag">Anamnese de Força e Condicionamento</p>' +
        '<h1 class="fp-welcome-title">Seja muito bem-vindo(a) ao time, ' + escapeHtml(primeiroNome) + '.</h1>' +
        '<div class="fp-welcome-body">' +
          '<p>Esta anamnese é o ponto de partida da sua periodização. As respostas que você der aqui vão guiar cada decisão que tomarei sobre o seu treino: cargas, volumes, prioridades, cuidados.</p>' +
          '<p>Por isso, eu te peço uma coisa: <strong>responda com calma e com o máximo de detalhe possível</strong>. Quanto mais preciso você for, mais cirúrgico será o seu programa. Cada campo em branco é uma informação a menos para eu trabalhar a seu favor.</p>' +
          '<p>Reserve dez a quinze minutos sem distração. Se não souber alguma medida agora, deixe em branco e me avise depois. O que <strong>não</strong> pode acontecer é dado preenchido no chute.</p>' +
          '<p class="fp-welcome-cta-line">Vamos começar.</p>' +
        '</div>' +
        '<button type="button" class="fp-btn fp-btn-primary fp-btn-lg" id="welcomeBtnStart">Começar a anamnese</button>' +
        '<p class="fp-welcome-meta">17 blocos · 10 a 15 minutos · respostas confidenciais</p>' +
      '</div>' +
    '</section>';

  document.getElementById('welcomeBtnStart').addEventListener('click', () => {
    state.screen = 'form';
    renderFormShell();
    showBlock(0);
  });
}

// ─── Estrutura do formulário (header + progress + main) ───────────────────────────────
function renderFormShell() {
  const root = document.getElementById('app');
  if (!root) return;

  root.innerHTML =
    '<header class="fp-header">' +
      '<p class="fp-brand">BJJ PERFORMANCE</p>' +
      '<h1 class="fp-title">Anamnese · ' + escapeHtml(state.nomeAluno || 'Atleta') + '</h1>' +
      '<p class="fp-subtitle">Suas respostas são confidenciais e usadas exclusivamente para sua avaliação.</p>' +
    '</header>' +
    '<div class="fp-progress-wrap">' +
      '<div class="fp-progress-track">' +
        '<div class="fp-progress-bar" id="progressBar"></div>' +
      '</div>' +
      '<span class="fp-progress-text" id="progressText">Bloco 1 de ' + BLOCKS.length + '</span>' +
    '</div>' +
    '<main id="fp-blocks" class="fp-main"></main>';
}

// ─── Renderização de bloco ───────────────────────────────
function showBlock(idx) {
  state.currentBlock = idx;
  const block = BLOCKS[idx];
  if (!block) {
    console.error('[showBlock] bloco não encontrado para idx', idx);
    return;
  }

  const main = document.getElementById('fp-blocks');
  if (!main) return;
  main.innerHTML = '';

  // Atualizar progresso
  const pct = ((idx + 1) / BLOCKS.length) * 100;
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  if (progressBar) progressBar.style.width = pct.toFixed(1) + '%';
  if (progressText) progressText.textContent = 'Bloco ' + (idx + 1) + ' de ' + BLOCKS.length;

  const card = document.createElement('section');
  card.className = 'fp-card';

  // Cabeçalho do bloco
  let html = '<div class="fp-block-header">';
  html += '<span class="fp-block-num">' + block.numero + '</span>';
  html += '<div class="fp-block-meta"><h2>' + escapeHtml(block.titulo) + '</h2>';
  if (block.subtitulo) html += '<p class="fp-block-sub">' + escapeHtml(block.subtitulo) + '</p>';
  html += '</div></div>';
  if (block.intro) html += '<p class="fp-block-intro">' + escapeHtml(block.intro) + '</p>';
  card.innerHTML = html;

  // Renderizar campos
  const fieldsContainer = document.createElement('div');
  fieldsContainer.className = 'fp-fields';
  card.appendChild(fieldsContainer);

  block.fields.forEach(field => {
    try {
      const fieldEl = renderField(block.id, field);
      fieldsContainer.appendChild(fieldEl);
    } catch (e) {
      console.error('[showBlock] erro ao renderizar campo', field.id, e);
    }
  });

  // Aplicar showIf inicial
  applyShowIfRules(block, fieldsContainer);

  // Botões de navegação
  const nav = document.createElement('div');
  nav.className = 'fp-nav';

  if (idx > 0) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'fp-btn fp-btn-ghost';
    back.textContent = '← Voltar';
    back.addEventListener('click', () => showBlock(idx - 1));
    nav.appendChild(back);
  } else {
    // Spacer para alinhamento
    const spacer = document.createElement('span');
    nav.appendChild(spacer);
  }

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'fp-btn fp-btn-primary';
  next.textContent = idx === BLOCKS.length - 1 ? 'Enviar anamnese' : 'Avançar →';
  next.addEventListener('click', () => onAdvance(block, fieldsContainer));
  nav.appendChild(next);

  card.appendChild(nav);
  main.appendChild(card);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Renderização de campo individual ───────────────────────────────
function renderField(blockId, field) {
  const wrap = document.createElement('div');
  wrap.className = 'fp-field';
  wrap.setAttribute('data-field-id', field.id);

  const t = field.tipo;
  const fid = blockId + '_' + field.id;

  // Label
  const labelText = field.label + (field.obrigatorio ? ' *' : '');
  const label = document.createElement('label');
  label.className = 'fp-label';
  label.setAttribute('for', fid);
  label.textContent = labelText;
  wrap.appendChild(label);

  if (field.ajuda) {
    const help = document.createElement('p');
    help.className = 'fp-help';
    help.textContent = field.ajuda;
    wrap.appendChild(help);
  }

  // Pré-preenchimento do telefone (item 2 do briefing)
  let prefilled = '';
  if (field.id === 'telefone' && state.telefoneAluno) {
    prefilled = state.telefoneAluno;
    if (!state.respostas[blockId]) state.respostas[blockId] = {};
    if (!state.respostas[blockId][field.id]) state.respostas[blockId][field.id] = state.telefoneAluno;
  }

  // Recuperar valor já preenchido em caso de back/forward
  const stored = state.respostas[blockId] && state.respostas[blockId][field.id];
  const currentValue = (stored !== undefined ? stored : prefilled);

  if (t === 'text' || t === 'email' || t === 'tel' || t === 'date' || t === 'time') {
    const input = document.createElement('input');
    input.type = t;
    input.id = fid;
    input.className = 'fp-input';
    if (field.maxLength) input.maxLength = field.maxLength;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (currentValue) input.value = currentValue;
    input.addEventListener('input', () => onFieldChange(blockId, field.id, input.value));
    wrap.appendChild(input);
  } else if (t === 'number') {
    const input = document.createElement('input');
    input.type = 'number';
    input.id = fid;
    input.className = 'fp-input';
    if (field.min != null) input.min = field.min;
    if (field.max != null) input.max = field.max;
    if (field.step != null) input.step = field.step;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (currentValue !== '' && currentValue != null) input.value = currentValue;
    input.addEventListener('input', () => {
      const v = input.value === '' ? '' : Number(input.value);
      onFieldChange(blockId, field.id, v);
    });
    wrap.appendChild(input);
  } else if (t === 'textarea') {
    const ta = document.createElement('textarea');
    ta.id = fid;
    ta.className = 'fp-textarea';
    ta.rows = 4;
    if (field.maxLength) ta.maxLength = field.maxLength;
    if (field.placeholder) ta.placeholder = field.placeholder;
    if (currentValue) ta.value = currentValue;
    ta.addEventListener('input', () => onFieldChange(blockId, field.id, ta.value));
    wrap.appendChild(ta);
  } else if (t === 'radio') {
    const group = document.createElement('div');
    group.className = 'fp-radio-group';
    (field.opcoes || []).forEach((op, i) => {
      const optId = fid + '_' + i;
      const lab = document.createElement('label');
      lab.className = 'fp-radio';
      lab.setAttribute('for', optId);
      const input = document.createElement('input');
      input.type = 'radio';
      input.id = optId;
      input.name = fid;
      input.value = op.value;
      if (currentValue === op.value) input.checked = true;
      input.addEventListener('change', () => {
        if (input.checked) onFieldChange(blockId, field.id, op.value);
      });
      const span = document.createElement('span');
      span.textContent = op.label;
      lab.appendChild(input);
      lab.appendChild(span);
      group.appendChild(lab);
    });
    wrap.appendChild(group);
  } else if (t === 'checkbox') {
    const group = document.createElement('div');
    group.className = 'fp-checkbox-group';
    const currentArr = Array.isArray(currentValue) ? currentValue : [];
    (field.opcoes || []).forEach((op, i) => {
      const optId = fid + '_' + i;
      const lab = document.createElement('label');
      lab.className = 'fp-checkbox';
      lab.setAttribute('for', optId);
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = optId;
      input.value = op.value;
      if (currentArr.indexOf(op.value) !== -1) input.checked = true;
      input.addEventListener('change', () => {
        const checked = Array.from(group.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
        onFieldChange(blockId, field.id, checked);
      });
      const span = document.createElement('span');
      span.textContent = op.label;
      lab.appendChild(input);
      lab.appendChild(span);
      group.appendChild(lab);
    });
    wrap.appendChild(group);
  } else if (t === 'checkbox-aceite') {
    const lab = document.createElement('label');
    lab.className = 'fp-checkbox-aceite';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = fid;
    if (currentValue === true) input.checked = true;
    input.addEventListener('change', () => onFieldChange(blockId, field.id, input.checked));
    const span = document.createElement('span');
    span.textContent = field.label;
    lab.innerHTML = '';
    lab.appendChild(input);
    lab.appendChild(span);
    // Substituir o label original (que tem o texto longo) por este
    wrap.removeChild(label);
    wrap.appendChild(lab);
  }

  return wrap;
}

// ─── Mudança de campo ───────────────────────────────
function onFieldChange(blockId, fieldId, value) {
  if (!state.respostas[blockId]) state.respostas[blockId] = {};
  if (value === '' || value == null || (Array.isArray(value) && value.length === 0)) {
    delete state.respostas[blockId][fieldId];
  } else {
    state.respostas[blockId][fieldId] = value;
  }
  // Reaplica showIf no bloco corrente
  const block = BLOCKS[state.currentBlock];
  const container = document.querySelector('.fp-fields');
  if (block && container) applyShowIfRules(block, container);
}

// ─── Lógica de showIf ───────────────────────────────
function applyShowIfRules(block, container) {
  if (!state.respostas[block.id]) state.respostas[block.id] = {};
  const respBloco = state.respostas[block.id];
  block.fields.forEach(field => {
    if (!field.showIf) return;
    const el = container.querySelector('[data-field-id="' + field.id + '"]');
    if (!el) return;
    const visible = evaluateShowIf(field.showIf, respBloco);
    el.style.display = visible ? '' : 'none';
    if (!visible) {
      delete respBloco[field.id];
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

// ─── Avanço de bloco ───────────────────────────────
function onAdvance(block, container) {
  const errors = collectAndValidate(block, container);
  if (errors.length > 0) {
    alert('Por favor, corrija os seguintes pontos antes de avançar:\n\n' + errors.join('\n'));
    return;
  }

  // Gate do PAR-Q (estratificado: somente P1, P2, P3, P6)
  if (block.id === PARQ_BLOCK_ID && !state.parqOverride) {
    const flagged = checkParqGate();
    if (flagged.length > 0) {
      console.log('[PAR-Q gate] perguntas críticas marcadas como SIM:', flagged);
      renderParqGate(flagged);
      return;
    }
  }

  if (state.currentBlock === BLOCKS.length - 1) {
    submitAll();
  } else {
    showBlock(state.currentBlock + 1);
  }
}

function collectAndValidate(block, container) {
  const errors = [];
  if (!state.respostas[block.id]) state.respostas[block.id] = {};
  const respBloco = state.respostas[block.id];
  block.fields.forEach(field => {
    if (!field.obrigatorio) return;
    if (field.showIf && !evaluateShowIf(field.showIf, respBloco)) return;
    const v = respBloco[field.id];
    const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0) || v === false;
    if (empty) errors.push('• ' + field.label.replace(/ \*$/, ''));
  });
  return errors;
}

// ─── PAR-Q gate ───────────────────────────────
function checkParqGate() {
  const respBloco = state.respostas[PARQ_BLOCK_ID] || {};
  return PARQ_GATE_FIELDS.filter(fid => respBloco[fid] === 'sim');
}

function renderParqGate(flagged) {
  state.screen = 'parq-gate';
  const root = document.getElementById('app');
  if (!root) return;

  // Mapear ids para textos legíveis
  const labelMap = {
    parq_p1_cardiaco: 'problema cardíaco diagnosticado',
    parq_p2_dor_peito: 'dor no peito durante atividade física',
    parq_p3_tontura: 'tontura ou perda de consciência recente',
    parq_p6_musculoesqueletico: 'problema osteomuscular agravado por exercício',
  };
  const flaggedHtml = flagged.map(f => '<li>' + escapeHtml(labelMap[f] || f) + '</li>').join('');

  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-warning">' +
        '<div class="fp-gate-icon">!</div>' +
        '<h1 class="fp-gate-title">Precisamos parar aqui por um momento.</h1>' +
        '<div class="fp-gate-body">' +
          '<p>Algumas das suas respostas indicam fatores que pedem <strong>avaliação médica antes do início do programa</strong>:</p>' +
          '<ul class="fp-gate-list">' + flaggedHtml + '</ul>' +
          '<p>Isso <strong>não</strong> é impedimento nem desqualificação. É uma camada de cuidado que se faz necessária para que possamos prescrever com segurança absoluta.</p>' +
          '<p>Se você ainda não tem liberação médica, te peço que procure um cardiologista ou seu médico de confiança e nos retorne quando tiver o aval. Vou te aguardar.</p>' +
          '<p>Se você <strong>já tem liberação médica vigente</strong> para a prática esportiva, pode seguir normalmente.</p>' +
        '</div>' +
        '<div class="fp-gate-actions">' +
          '<button type="button" class="fp-btn fp-btn-ghost" id="gateBtnMedico">Vou procurar médico antes</button>' +
          '<button type="button" class="fp-btn fp-btn-primary" id="gateBtnContinuar">Já tenho liberação, prosseguir</button>' +
        '</div>' +
      '</div>' +
    '</section>';

  document.getElementById('gateBtnMedico').addEventListener('click', () => {
    renderMedicoBlock();
  });
  document.getElementById('gateBtnContinuar').addEventListener('click', () => {
    state.parqOverride = true;
    state.screen = 'form';
    renderFormShell();
    showBlock(state.currentBlock + 1);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMedicoBlock() {
  state.screen = 'medico-block';
  const root = document.getElementById('app');
  if (!root) return;

  // Envia parcial ao Worker para o professor saber que houve bloqueio
  enviarParqBloqueio();

  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-info">' +
        '<div class="fp-gate-icon">+</div>' +
        '<h1 class="fp-gate-title">Obrigado pela sinceridade.</h1>' +
        '<div class="fp-gate-body">' +
          '<p>Suas respostas iniciais foram salvas. O Prof. Fontes Júnior foi notificado e vai entrar em contato para orientar os próximos passos.</p>' +
          '<p>Quando você tiver o aval médico em mãos, é só nos retornar com a liberação que retomamos o processo do ponto onde paramos.</p>' +
          '<p class="fp-gate-soft">Você pode fechar esta página agora.</p>' +
        '</div>' +
      '</div>' +
    '</section>';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function enviarParqBloqueio() {
  if (state.isDev || !state.token) return;
  const payload = {
    ...getSubmitBlockAliases({ status: 'parq_bloqueado' }),
    respostas: state.respostas,
    parqBlocked: true,
    metadata: {
      versao: '2.0.0',
      durationMin: Math.round((Date.now() - state.startedAt) / 60000),
      submittedAt: new Date().toISOString(),
      reason: 'parq_gate_triggered',
    },
  };
  try {
    const url = API_BASE + '/api/anamnese/responder/' + encodeURIComponent(state.token);
    console.log('[PAR-Q bloqueio] POST parcial', url);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[PAR-Q bloqueio] response', resp.status);
  } catch (e) {
    console.error('[PAR-Q bloqueio] falha ao enviar', e);
  }
}

// ─── Submissão final ───────────────────────────────
async function submitAll() {
  console.log('[Submit] Início', {
    token: state.token,
    blocosRespondidos: Object.keys(state.respostas).length,
    parqOverride: state.parqOverride,
  });

  if (state.isDev) {
    console.log('[DEV] Respostas coletadas:', state.respostas);
    alert('Modo dev: respostas no console (F12).');
    return;
  }

  if (!state.token) {
    showError('Sem token', 'Não é possível enviar sem um token válido.');
    return;
  }

  const payload = {
    ...getSubmitBlockAliases({ status: 'respondida' }),
    respostas: getWorkerCompatRespostas(state.respostas),
    parqOverride: state.parqOverride,
    metadata: {
      versao: '2.0.0',
      durationMin: Math.round((Date.now() - state.startedAt) / 60000),
      skippedBlocks: BLOCKS.filter(b => !state.respostas[b.id]).map(b => b.id),
      submittedAt: new Date().toISOString(),
    },
  };

  console.log('[Submit] payload', payload);

  // UI: estado de envio
  const btn = document.querySelector('.fp-btn-primary');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Enviando...';
  }

  const url = API_BASE + '/api/anamnese/responder/' + encodeURIComponent(state.token);
  console.log('[Submit] POST', url);

  let resp;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[Submit] response status', resp.status, resp.statusText);
  } catch (e) {
    console.error('[Submit] FALHA NA REDE', e);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Tentar novamente';
    }
    showError('Falha de rede', 'Não foi possível enviar suas respostas. Verifique sua conexão e tente novamente.');
    return;
  }

  let data = null;
  try {
    const txt = await resp.text();
    console.log('[Submit] response raw', txt);
    if (txt) data = JSON.parse(txt);
    console.log('[Submit] response parsed', data);
  } catch (e) {
    console.warn('[Submit] response não é JSON válido', e);
  }

  if (!resp.ok) {
    console.error('[Submit] FALHA HTTP', resp.status, data);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Tentar novamente';
    }
    const msg = (data && (data.error || data.message)) || ('Erro HTTP ' + resp.status);
    showError('Erro ao enviar', msg);
    return;
  }

  console.log('[Submit] SUCESSO', data);
  showSuccess();
}

// ─── Telas auxiliares ───────────────────────────────
function showError(titulo, msg) {
  state.screen = 'error';
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-error">' +
        '<div class="fp-gate-icon">×</div>' +
        '<h1 class="fp-gate-title">' + escapeHtml(titulo) + '</h1>' +
        '<div class="fp-gate-body"><p>' + escapeHtml(msg) + '</p></div>' +
      '</div>' +
    '</section>';
}

function showAlreadyAnswered() {
  state.screen = 'submitted';
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-info">' +
        '<div class="fp-gate-icon">✓</div>' +
        '<h1 class="fp-gate-title">Esta anamnese já foi respondida.</h1>' +
        '<div class="fp-gate-body">' +
          '<p>Suas respostas já estão com o Prof. Fontes Júnior. Não é possível preenchê-la novamente.</p>' +
          '<p class="fp-gate-soft">Em caso de dúvida, entre em contato pelo WhatsApp.</p>' +
        '</div>' +
      '</div>' +
    '</section>';
}

function showSuccess() {
  state.screen = 'submitted';
  const root = document.getElementById('app');
  if (!root) return;
  const primeiroNome = (state.nomeAluno || 'Atleta').split(' ')[0];
  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-success">' +
        '<div class="fp-gate-icon">✓</div>' +
        '<h1 class="fp-gate-title">Recebido, ' + escapeHtml(primeiroNome) + '. Obrigado.</h1>' +
        '<div class="fp-gate-body">' +
          '<p>Suas respostas foram enviadas com sucesso. O Prof. Fontes Júnior fará sua avaliação e dará retorno em breve.</p>' +
          '<p class="fp-gate-soft">Você pode fechar esta página.</p>' +
        '</div>' +
      '</div>' +
    '</section>';
}

// ─── Helpers ───────────────────────────────
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Bootstrap ───────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
/**
 * BJJ Performance Pro — form-logic.js
 *
 * Motor de renderização do formulário de anamnese.
 *
 * Versão: 2.0.1 (2026-05-16)
 *   - Tela de boas-vindas com nome do aluno antes do questionário
 *   - PAR-Q+ promovido a Bloco 1 com gate estratificado (P1/P2/P3/P6)
 *   - Tela de bloqueio para procurar médico, com escape via "tenho liberação"
 *   - Pré-preenchimento do campo Telefone a partir do cadastro do treinador
 *   - Logging robusto em submitAll (console detalhado, fluxo de erro mais resiliente)
 *   - Modo Clean (estilos definidos em anamnese.html)
 *   - Fix missing_block: POST final envia aliases de bloco exigidos pelo Worker
 */

import { BLOCKS } from './blocks-config.js';

// ─── Configuração ───────────────────────────────
const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8787'
  : 'https://bjj-anamnese-api.fontesedf.workers.dev';

// PAR-Q estratificado: somente estes campos disparam o gate de bloqueio
const PARQ_BLOCK_ID = 'bloco01_parq';
const PARQ_GATE_FIELDS = [
  'parq_p1_cardiaco',
  'parq_p2_dor_peito',
  'parq_p3_tontura',
  'parq_p6_musculoesqueletico',
];

const SUBMIT_BLOCK_ID = 'final';

function getSubmitBlockAliases(extra = {}) {
  return {
    block: extra.block || SUBMIT_BLOCK_ID,
    bloco: extra.bloco || SUBMIT_BLOCK_ID,
    blockId: extra.blockId || SUBMIT_BLOCK_ID,
    section: extra.section || SUBMIT_BLOCK_ID,
    etapa: extra.etapa || SUBMIT_BLOCK_ID,
    step: extra.step || SUBMIT_BLOCK_ID,
    currentBlock: extra.currentBlock || SUBMIT_BLOCK_ID,
    blocoAtual: extra.blocoAtual || SUBMIT_BLOCK_ID,
    formBlock: extra.formBlock || SUBMIT_BLOCK_ID,
    modo: extra.modo || 'anamnese_completa',
    form: extra.form || 'anamnese',
    status: extra.status || 'respondida',
  };
}

// ─── State global ───────────────────────────────
const state = {
  token: null,
  nomeAluno: null,
  telefoneAluno: null,
  isDev: false,
  screen: 'loading',
  currentBlock: 0,
  respostas: {},
  parqOverride: false,
  startedAt: Date.now(),
};

// ─── Inicialização ───────────────────────────────
async function init() {
  console.log('[BJJ Anamnese] form-logic.js v2.0.0 carregado');
  const params = new URLSearchParams(location.search);
  state.token = params.get('t');
  state.isDev = params.get('dev') === '1';

  if (state.isDev) {
    state.nomeAluno = params.get('nome') || 'Atleta de Teste';
    state.telefoneAluno = params.get('tel') || '';
    renderWelcome();
    return;
  }

  if (!state.token) {
    showError('Link inválido', 'O token não foi encontrado na URL. Solicite um novo link ao seu treinador.');
    return;
  }

  try {
    const url = API_BASE + '/api/anamnese/buscar/' + encodeURIComponent(state.token);
    console.log('[Init] GET', url);
    const resp = await fetch(url);
    console.log('[Init] response status', resp.status);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    console.log('[Init] dados recebidos', data);

    state.nomeAluno = data.nomeAluno || data.nome || data.atleta || 'Atleta';
    state.telefoneAluno = data.telefone || data.whatsapp || data.tel || '';

    if (data.status === 'respondida' || data.respondidaEm) {
      showAlreadyAnswered();
      return;
    }

    renderWelcome();
  } catch (e) {
    console.error('[Init] FALHA', e);
    showError('Não foi possível carregar', 'Verifique sua conexão ou solicite um novo link ao seu treinador.');
  }
}

// ─── Tela de boas-vindas ───────────────────────────────
function renderWelcome() {
  state.screen = 'welcome';
  const root = document.getElementById('app');
  if (!root) return;

  const primeiroNome = (state.nomeAluno || 'Atleta').split(' ')[0];

  root.innerHTML =
    '<section class="fp-welcome">' +
      '<div class="fp-welcome-card">' +
        '<p class="fp-welcome-tag">Anamnese de Força e Condicionamento</p>' +
        '<h1 class="fp-welcome-title">Seja muito bem-vindo(a) ao time, ' + escapeHtml(primeiroNome) + '.</h1>' +
        '<div class="fp-welcome-body">' +
          '<p>Esta anamnese é o ponto de partida da sua periodização. As respostas que você der aqui vão guiar cada decisão que tomarei sobre o seu treino: cargas, volumes, prioridades, cuidados.</p>' +
          '<p>Por isso, eu te peço uma coisa: <strong>responda com calma e com o máximo de detalhe possível</strong>. Quanto mais preciso você for, mais cirúrgico será o seu programa. Cada campo em branco é uma informação a menos para eu trabalhar a seu favor.</p>' +
          '<p>Reserve dez a quinze minutos sem distração. Se não souber alguma medida agora, deixe em branco e me avise depois. O que <strong>não</strong> pode acontecer é dado preenchido no chute.</p>' +
          '<p class="fp-welcome-cta-line">Vamos começar.</p>' +
        '</div>' +
        '<button type="button" class="fp-btn fp-btn-primary fp-btn-lg" id="welcomeBtnStart">Começar a anamnese</button>' +
        '<p class="fp-welcome-meta">17 blocos · 10 a 15 minutos · respostas confidenciais</p>' +
      '</div>' +
    '</section>';

  document.getElementById('welcomeBtnStart').addEventListener('click', () => {
    state.screen = 'form';
    renderFormShell();
    showBlock(0);
  });
}

// ─── Estrutura do formulário (header + progress + main) ───────────────────────────────
function renderFormShell() {
  const root = document.getElementById('app');
  if (!root) return;

  root.innerHTML =
    '<header class="fp-header">' +
      '<p class="fp-brand">BJJ PERFORMANCE</p>' +
      '<h1 class="fp-title">Anamnese · ' + escapeHtml(state.nomeAluno || 'Atleta') + '</h1>' +
      '<p class="fp-subtitle">Suas respostas são confidenciais e usadas exclusivamente para sua avaliação.</p>' +
    '</header>' +
    '<div class="fp-progress-wrap">' +
      '<div class="fp-progress-track">' +
        '<div class="fp-progress-bar" id="progressBar"></div>' +
      '</div>' +
      '<span class="fp-progress-text" id="progressText">Bloco 1 de ' + BLOCKS.length + '</span>' +
    '</div>' +
    '<main id="fp-blocks" class="fp-main"></main>';
}

// ─── Renderização de bloco ───────────────────────────────
function showBlock(idx) {
  state.currentBlock = idx;
  const block = BLOCKS[idx];
  if (!block) {
    console.error('[showBlock] bloco não encontrado para idx', idx);
    return;
  }

  const main = document.getElementById('fp-blocks');
  if (!main) return;
  main.innerHTML = '';

  // Atualizar progresso
  const pct = ((idx + 1) / BLOCKS.length) * 100;
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  if (progressBar) progressBar.style.width = pct.toFixed(1) + '%';
  if (progressText) progressText.textContent = 'Bloco ' + (idx + 1) + ' de ' + BLOCKS.length;

  const card = document.createElement('section');
  card.className = 'fp-card';

  // Cabeçalho do bloco
  let html = '<div class="fp-block-header">';
  html += '<span class="fp-block-num">' + block.numero + '</span>';
  html += '<div class="fp-block-meta"><h2>' + escapeHtml(block.titulo) + '</h2>';
  if (block.subtitulo) html += '<p class="fp-block-sub">' + escapeHtml(block.subtitulo) + '</p>';
  html += '</div></div>';
  if (block.intro) html += '<p class="fp-block-intro">' + escapeHtml(block.intro) + '</p>';
  card.innerHTML = html;

  // Renderizar campos
  const fieldsContainer = document.createElement('div');
  fieldsContainer.className = 'fp-fields';
  card.appendChild(fieldsContainer);

  block.fields.forEach(field => {
    try {
      const fieldEl = renderField(block.id, field);
      fieldsContainer.appendChild(fieldEl);
    } catch (e) {
      console.error('[showBlock] erro ao renderizar campo', field.id, e);
    }
  });

  // Aplicar showIf inicial
  applyShowIfRules(block, fieldsContainer);

  // Botões de navegação
  const nav = document.createElement('div');
  nav.className = 'fp-nav';

  if (idx > 0) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'fp-btn fp-btn-ghost';
    back.textContent = '← Voltar';
    back.addEventListener('click', () => showBlock(idx - 1));
    nav.appendChild(back);
  } else {
    // Spacer para alinhamento
    const spacer = document.createElement('span');
    nav.appendChild(spacer);
  }

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'fp-btn fp-btn-primary';
  next.textContent = idx === BLOCKS.length - 1 ? 'Enviar anamnese' : 'Avançar →';
  next.addEventListener('click', () => onAdvance(block, fieldsContainer));
  nav.appendChild(next);

  card.appendChild(nav);
  main.appendChild(card);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Renderização de campo individual ───────────────────────────────
function renderField(blockId, field) {
  const wrap = document.createElement('div');
  wrap.className = 'fp-field';
  wrap.setAttribute('data-field-id', field.id);

  const t = field.tipo;
  const fid = blockId + '_' + field.id;

  // Label
  const labelText = field.label + (field.obrigatorio ? ' *' : '');
  const label = document.createElement('label');
  label.className = 'fp-label';
  label.setAttribute('for', fid);
  label.textContent = labelText;
  wrap.appendChild(label);

  if (field.ajuda) {
    const help = document.createElement('p');
    help.className = 'fp-help';
    help.textContent = field.ajuda;
    wrap.appendChild(help);
  }

  // Pré-preenchimento do telefone (item 2 do briefing)
  let prefilled = '';
  if (field.id === 'telefone' && state.telefoneAluno) {
    prefilled = state.telefoneAluno;
    if (!state.respostas[blockId]) state.respostas[blockId] = {};
    if (!state.respostas[blockId][field.id]) state.respostas[blockId][field.id] = state.telefoneAluno;
  }

  // Recuperar valor já preenchido em caso de back/forward
  const stored = state.respostas[blockId] && state.respostas[blockId][field.id];
  const currentValue = (stored !== undefined ? stored : prefilled);

  if (t === 'text' || t === 'email' || t === 'tel' || t === 'date' || t === 'time') {
    const input = document.createElement('input');
    input.type = t;
    input.id = fid;
    input.className = 'fp-input';
    if (field.maxLength) input.maxLength = field.maxLength;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (currentValue) input.value = currentValue;
    input.addEventListener('input', () => onFieldChange(blockId, field.id, input.value));
    wrap.appendChild(input);
  } else if (t === 'number') {
    const input = document.createElement('input');
    input.type = 'number';
    input.id = fid;
    input.className = 'fp-input';
    if (field.min != null) input.min = field.min;
    if (field.max != null) input.max = field.max;
    if (field.step != null) input.step = field.step;
    if (field.placeholder) input.placeholder = field.placeholder;
    if (currentValue !== '' && currentValue != null) input.value = currentValue;
    input.addEventListener('input', () => {
      const v = input.value === '' ? '' : Number(input.value);
      onFieldChange(blockId, field.id, v);
    });
    wrap.appendChild(input);
  } else if (t === 'textarea') {
    const ta = document.createElement('textarea');
    ta.id = fid;
    ta.className = 'fp-textarea';
    ta.rows = 4;
    if (field.maxLength) ta.maxLength = field.maxLength;
    if (field.placeholder) ta.placeholder = field.placeholder;
    if (currentValue) ta.value = currentValue;
    ta.addEventListener('input', () => onFieldChange(blockId, field.id, ta.value));
    wrap.appendChild(ta);
  } else if (t === 'radio') {
    const group = document.createElement('div');
    group.className = 'fp-radio-group';
    (field.opcoes || []).forEach((op, i) => {
      const optId = fid + '_' + i;
      const lab = document.createElement('label');
      lab.className = 'fp-radio';
      lab.setAttribute('for', optId);
      const input = document.createElement('input');
      input.type = 'radio';
      input.id = optId;
      input.name = fid;
      input.value = op.value;
      if (currentValue === op.value) input.checked = true;
      input.addEventListener('change', () => {
        if (input.checked) onFieldChange(blockId, field.id, op.value);
      });
      const span = document.createElement('span');
      span.textContent = op.label;
      lab.appendChild(input);
      lab.appendChild(span);
      group.appendChild(lab);
    });
    wrap.appendChild(group);
  } else if (t === 'checkbox') {
    const group = document.createElement('div');
    group.className = 'fp-checkbox-group';
    const currentArr = Array.isArray(currentValue) ? currentValue : [];
    (field.opcoes || []).forEach((op, i) => {
      const optId = fid + '_' + i;
      const lab = document.createElement('label');
      lab.className = 'fp-checkbox';
      lab.setAttribute('for', optId);
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = optId;
      input.value = op.value;
      if (currentArr.indexOf(op.value) !== -1) input.checked = true;
      input.addEventListener('change', () => {
        const checked = Array.from(group.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
        onFieldChange(blockId, field.id, checked);
      });
      const span = document.createElement('span');
      span.textContent = op.label;
      lab.appendChild(input);
      lab.appendChild(span);
      group.appendChild(lab);
    });
    wrap.appendChild(group);
  } else if (t === 'checkbox-aceite') {
    const lab = document.createElement('label');
    lab.className = 'fp-checkbox-aceite';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = fid;
    if (currentValue === true) input.checked = true;
    input.addEventListener('change', () => onFieldChange(blockId, field.id, input.checked));
    const span = document.createElement('span');
    span.textContent = field.label;
    lab.innerHTML = '';
    lab.appendChild(input);
    lab.appendChild(span);
    // Substituir o label original (que tem o texto longo) por este
    wrap.removeChild(label);
    wrap.appendChild(lab);
  }

  return wrap;
}

// ─── Mudança de campo ───────────────────────────────
function onFieldChange(blockId, fieldId, value) {
  if (!state.respostas[blockId]) state.respostas[blockId] = {};
  if (value === '' || value == null || (Array.isArray(value) && value.length === 0)) {
    delete state.respostas[blockId][fieldId];
  } else {
    state.respostas[blockId][fieldId] = value;
  }
  // Reaplica showIf no bloco corrente
  const block = BLOCKS[state.currentBlock];
  const container = document.querySelector('.fp-fields');
  if (block && container) applyShowIfRules(block, container);
}

// ─── Lógica de showIf ───────────────────────────────
function applyShowIfRules(block, container) {
  if (!state.respostas[block.id]) state.respostas[block.id] = {};
  const respBloco = state.respostas[block.id];
  block.fields.forEach(field => {
    if (!field.showIf) return;
    const el = container.querySelector('[data-field-id="' + field.id + '"]');
    if (!el) return;
    const visible = evaluateShowIf(field.showIf, respBloco);
    el.style.display = visible ? '' : 'none';
    if (!visible) {
      delete respBloco[field.id];
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

// ─── Avanço de bloco ───────────────────────────────
function onAdvance(block, container) {
  const errors = collectAndValidate(block, container);
  if (errors.length > 0) {
    alert('Por favor, corrija os seguintes pontos antes de avançar:\n\n' + errors.join('\n'));
    return;
  }

  // Gate do PAR-Q (estratificado: somente P1, P2, P3, P6)
  if (block.id === PARQ_BLOCK_ID && !state.parqOverride) {
    const flagged = checkParqGate();
    if (flagged.length > 0) {
      console.log('[PAR-Q gate] perguntas críticas marcadas como SIM:', flagged);
      renderParqGate(flagged);
      return;
    }
  }

  if (state.currentBlock === BLOCKS.length - 1) {
    submitAll();
  } else {
    showBlock(state.currentBlock + 1);
  }
}

function collectAndValidate(block, container) {
  const errors = [];
  if (!state.respostas[block.id]) state.respostas[block.id] = {};
  const respBloco = state.respostas[block.id];
  block.fields.forEach(field => {
    if (!field.obrigatorio) return;
    if (field.showIf && !evaluateShowIf(field.showIf, respBloco)) return;
    const v = respBloco[field.id];
    const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0) || v === false;
    if (empty) errors.push('• ' + field.label.replace(/ \*$/, ''));
  });
  return errors;
}

// ─── PAR-Q gate ───────────────────────────────
function checkParqGate() {
  const respBloco = state.respostas[PARQ_BLOCK_ID] || {};
  return PARQ_GATE_FIELDS.filter(fid => respBloco[fid] === 'sim');
}

function renderParqGate(flagged) {
  state.screen = 'parq-gate';
  const root = document.getElementById('app');
  if (!root) return;

  // Mapear ids para textos legíveis
  const labelMap = {
    parq_p1_cardiaco: 'problema cardíaco diagnosticado',
    parq_p2_dor_peito: 'dor no peito durante atividade física',
    parq_p3_tontura: 'tontura ou perda de consciência recente',
    parq_p6_musculoesqueletico: 'problema osteomuscular agravado por exercício',
  };
  const flaggedHtml = flagged.map(f => '<li>' + escapeHtml(labelMap[f] || f) + '</li>').join('');

  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-warning">' +
        '<div class="fp-gate-icon">!</div>' +
        '<h1 class="fp-gate-title">Precisamos parar aqui por um momento.</h1>' +
        '<div class="fp-gate-body">' +
          '<p>Algumas das suas respostas indicam fatores que pedem <strong>avaliação médica antes do início do programa</strong>:</p>' +
          '<ul class="fp-gate-list">' + flaggedHtml + '</ul>' +
          '<p>Isso <strong>não</strong> é impedimento nem desqualificação. É uma camada de cuidado que se faz necessária para que possamos prescrever com segurança absoluta.</p>' +
          '<p>Se você ainda não tem liberação médica, te peço que procure um cardiologista ou seu médico de confiança e nos retorne quando tiver o aval. Vou te aguardar.</p>' +
          '<p>Se você <strong>já tem liberação médica vigente</strong> para a prática esportiva, pode seguir normalmente.</p>' +
        '</div>' +
        '<div class="fp-gate-actions">' +
          '<button type="button" class="fp-btn fp-btn-ghost" id="gateBtnMedico">Vou procurar médico antes</button>' +
          '<button type="button" class="fp-btn fp-btn-primary" id="gateBtnContinuar">Já tenho liberação, prosseguir</button>' +
        '</div>' +
      '</div>' +
    '</section>';

  document.getElementById('gateBtnMedico').addEventListener('click', () => {
    renderMedicoBlock();
  });
  document.getElementById('gateBtnContinuar').addEventListener('click', () => {
    state.parqOverride = true;
    state.screen = 'form';
    renderFormShell();
    showBlock(state.currentBlock + 1);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMedicoBlock() {
  state.screen = 'medico-block';
  const root = document.getElementById('app');
  if (!root) return;

  // Envia parcial ao Worker para o professor saber que houve bloqueio
  enviarParqBloqueio();

  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-info">' +
        '<div class="fp-gate-icon">+</div>' +
        '<h1 class="fp-gate-title">Obrigado pela sinceridade.</h1>' +
        '<div class="fp-gate-body">' +
          '<p>Suas respostas iniciais foram salvas. O Prof. Fontes Júnior foi notificado e vai entrar em contato para orientar os próximos passos.</p>' +
          '<p>Quando você tiver o aval médico em mãos, é só nos retornar com a liberação que retomamos o processo do ponto onde paramos.</p>' +
          '<p class="fp-gate-soft">Você pode fechar esta página agora.</p>' +
        '</div>' +
      '</div>' +
    '</section>';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function enviarParqBloqueio() {
  if (state.isDev || !state.token) return;
  const payload = {
    ...getSubmitBlockAliases({ status: 'parq_bloqueado' }),
    respostas: state.respostas,
    parqBlocked: true,
    metadata: {
      versao: '2.0.0',
      durationMin: Math.round((Date.now() - state.startedAt) / 60000),
      submittedAt: new Date().toISOString(),
      reason: 'parq_gate_triggered',
    },
  };
  try {
    const url = API_BASE + '/api/anamnese/responder/' + encodeURIComponent(state.token);
    console.log('[PAR-Q bloqueio] POST parcial', url);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[PAR-Q bloqueio] response', resp.status);
  } catch (e) {
    console.error('[PAR-Q bloqueio] falha ao enviar', e);
  }
}

// ─── Submissão final ───────────────────────────────
async function submitAll() {
  console.log('[Submit] Início', {
    token: state.token,
    blocosRespondidos: Object.keys(state.respostas).length,
    parqOverride: state.parqOverride,
  });

  if (state.isDev) {
    console.log('[DEV] Respostas coletadas:', state.respostas);
    alert('Modo dev: respostas no console (F12).');
    return;
  }

  if (!state.token) {
    showError('Sem token', 'Não é possível enviar sem um token válido.');
    return;
  }

  const payload = {
    ...getSubmitBlockAliases({ status: 'respondida' }),
    respostas: state.respostas,
    parqOverride: state.parqOverride,
    metadata: {
      versao: '2.0.0',
      durationMin: Math.round((Date.now() - state.startedAt) / 60000),
      skippedBlocks: BLOCKS.filter(b => !state.respostas[b.id]).map(b => b.id),
      submittedAt: new Date().toISOString(),
    },
  };

  console.log('[Submit] payload', payload);

  // UI: estado de envio
  const btn = document.querySelector('.fp-btn-primary');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Enviando...';
  }

  const url = API_BASE + '/api/anamnese/responder/' + encodeURIComponent(state.token);
  console.log('[Submit] POST', url);

  let resp;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[Submit] response status', resp.status, resp.statusText);
  } catch (e) {
    console.error('[Submit] FALHA NA REDE', e);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Tentar novamente';
    }
    showError('Falha de rede', 'Não foi possível enviar suas respostas. Verifique sua conexão e tente novamente.');
    return;
  }

  let data = null;
  try {
    const txt = await resp.text();
    console.log('[Submit] response raw', txt);
    if (txt) data = JSON.parse(txt);
    console.log('[Submit] response parsed', data);
  } catch (e) {
    console.warn('[Submit] response não é JSON válido', e);
  }

  if (!resp.ok) {
    console.error('[Submit] FALHA HTTP', resp.status, data);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Tentar novamente';
    }
    const msg = (data && (data.error || data.message)) || ('Erro HTTP ' + resp.status);
    showError('Erro ao enviar', msg);
    return;
  }

  console.log('[Submit] SUCESSO', data);
  showSuccess();
}

// ─── Telas auxiliares ───────────────────────────────
function showError(titulo, msg) {
  state.screen = 'error';
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-error">' +
        '<div class="fp-gate-icon">×</div>' +
        '<h1 class="fp-gate-title">' + escapeHtml(titulo) + '</h1>' +
        '<div class="fp-gate-body"><p>' + escapeHtml(msg) + '</p></div>' +
      '</div>' +
    '</section>';
}

function showAlreadyAnswered() {
  state.screen = 'submitted';
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-info">' +
        '<div class="fp-gate-icon">✓</div>' +
        '<h1 class="fp-gate-title">Esta anamnese já foi respondida.</h1>' +
        '<div class="fp-gate-body">' +
          '<p>Suas respostas já estão com o Prof. Fontes Júnior. Não é possível preenchê-la novamente.</p>' +
          '<p class="fp-gate-soft">Em caso de dúvida, entre em contato pelo WhatsApp.</p>' +
        '</div>' +
      '</div>' +
    '</section>';
}

function showSuccess() {
  state.screen = 'submitted';
  const root = document.getElementById('app');
  if (!root) return;
  const primeiroNome = (state.nomeAluno || 'Atleta').split(' ')[0];
  root.innerHTML =
    '<section class="fp-gate">' +
      '<div class="fp-gate-card fp-gate-success">' +
        '<div class="fp-gate-icon">✓</div>' +
        '<h1 class="fp-gate-title">Recebido, ' + escapeHtml(primeiroNome) + '. Obrigado.</h1>' +
        '<div class="fp-gate-body">' +
          '<p>Suas respostas foram enviadas com sucesso. O Prof. Fontes Júnior fará sua avaliação e dará retorno em breve.</p>' +
          '<p class="fp-gate-soft">Você pode fechar esta página.</p>' +
        '</div>' +
      '</div>' +
    '</section>';
}

// ─── Helpers ───────────────────────────────
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Bootstrap ───────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
