/**
 * admin-logic.js — Painel administrativo do professor
 *
 * Funcionalidades:
 * - Login com X-Auth-Token (armazenado em sessionStorage)
 * - Listagem de anamneses (filtros: pendente, respondida, todos)
 * - Visualização de detalhe completo
 * - Geração de JSON do atleta (compatível com HUB) usando mapper.js
 * - Acesso direto via URL com ?t=token
 *
 * Versão: 1.0.0
 */

import { mapAnamneseToAtleta } from './mapper.js';

const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:8787'
  : 'https://bjj-anamnese-api.fontesjuniorbs.workers.dev';

const state = {
  authToken: sessionStorage.getItem('bjj_admin_token') || '',
  view: 'list',
  filtroStatus: 'todos',
  anamneses: [],
  current: null,
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  const params = new URLSearchParams(location.search);
  const token = params.get('t');
  if (token) {
    state.view = 'detalhe';
    state.currentToken = token;
  }
  if (!state.authToken) {
    renderLogin();
  } else if (state.view === 'detalhe') {
    loadDetalhe(state.currentToken);
  } else {
    loadList();
  }
}

// ─── Login ──────────────────────────────────────
function renderLogin() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const card = document.createElement('section');
  card.className = 'fp-card';
  card.innerHTML = '<div class="fp-block-header"><span class="fp-block-num">⚡</span><div><h2>Painel BJJ Performance</h2><p class="fp-block-sub">Acesso restrito ao professor</p></div></div>' +
    '<div class="fp-fields">' +
    '<div class="fp-field"><label class="fp-label">Token de autenticação</label>' +
    '<input id="authInput" type="password" class="fp-input" placeholder="Cole o X-Auth-Token aqui" autocomplete="current-password" />' +
    '</div></div>' +
    '<div class="fp-nav"><button id="loginBtn" class="fp-btn fp-btn-primary">Entrar</button></div>';
  root.appendChild(card);
  document.getElementById('loginBtn').addEventListener('click', () => {
    const v = document.getElementById('authInput').value.trim();
    if (!v) return alert('Informe o token.');
    state.authToken = v;
    sessionStorage.setItem('bjj_admin_token', v);
    if (state.view === 'detalhe') loadDetalhe(state.currentToken);
    else loadList();
  });
  document.getElementById('authInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  });
}

function logout() {
  state.authToken = '';
  sessionStorage.removeItem('bjj_admin_token');
  renderLogin();
}

// ─── Listagem ───────────────────────────────────
async function loadList() {
  renderLoading('Carregando anamneses...');
  try {
    const r = await fetch(API_BASE + '/api/anamnese/listar?status=' + state.filtroStatus, {
      headers: { 'X-Auth-Token': state.authToken },
    });
    if (r.status === 401) { logout(); return; }
    if (!r.ok) throw new Error('Erro ' + r.status);
    const data = await r.json();
    state.anamneses = data.anamneses || [];
    renderList();
  } catch (e) {
    renderError('Erro ao carregar lista: ' + e.message);
  }
}

function renderList() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const card = document.createElement('section');
  card.className = 'fp-card';
  let html = '<div class="fp-block-header"><span class="fp-block-num">📋</span><div><h2>Anamneses</h2><p class="fp-block-sub">' + state.anamneses.length + ' registro(s)</p></div></div>';
  html += '<div class="fp-filters">';
  ['todos','pendente','respondida'].forEach(s => {
    const active = s === state.filtroStatus ? ' active' : '';
    html += '<button class="fp-filter' + active + '" data-st="' + s + '">' + s + '</button>';
  });
  html += '<button class="fp-filter" id="logoutBtn">Sair</button>';
  html += '</div>';
  if (state.anamneses.length === 0) {
    html += '<p class="fp-muted">Nenhuma anamnese neste filtro.</p>';
  } else {
    html += '<div class="fp-table">';
    state.anamneses.forEach(a => {
      const status = a.status === 'respondida' ? '✓ respondida' : '⏳ pendente';
      const cls = a.status === 'respondida' ? 'st-resp' : 'st-pend';
      html += '<div class="fp-row ' + cls + '" data-token="' + escapeHtml(a.token) + '">' +
        '<div class="fp-row-name">' + escapeHtml(a.nomeAluno) + '</div>' +
        '<div class="fp-row-st">' + status + '</div>' +
        '<div class="fp-row-date">' + escapeHtml(formatDate(a.respondidoEm || a.criadoEm)) + '</div>' +
        '</div>';
    });
    html += '</div>';
  }
  card.innerHTML = html;
  root.appendChild(card);
  card.querySelectorAll('.fp-filter[data-st]').forEach(btn => {
    btn.addEventListener('click', () => { state.filtroStatus = btn.dataset.st; loadList(); });
  });
  card.querySelectorAll('.fp-row').forEach(r => {
    r.addEventListener('click', () => loadDetalhe(r.dataset.token));
  });
  document.getElementById('logoutBtn').addEventListener('click', logout);
}
// ─── Detalhe ────────────────────────────────────
async function loadDetalhe(token) {
  state.currentToken = token;
  renderLoading('Carregando detalhe...');
  try {
    const r = await fetch(API_BASE + '/api/anamnese/detalhe/' + token, {
      headers: { 'X-Auth-Token': state.authToken },
    });
    if (r.status === 401) { logout(); return; }
    if (!r.ok) throw new Error('Erro ' + r.status);
    state.current = await r.json();
    renderDetalhe();
  } catch (e) {
    renderError('Erro ao carregar detalhe: ' + e.message);
  }
}

function renderDetalhe() {
  const a = state.current;
  const root = document.getElementById('app');
  root.innerHTML = '';
  const card = document.createElement('section');
  card.className = 'fp-card';
  let html = '<div class="fp-block-header"><span class="fp-block-num">' + (a.status === 'respondida' ? '✓' : '⏳') + '</span><div><h2>' + escapeHtml(a.dadosAluno?.nomeAluno || '?') + '</h2><p class="fp-block-sub">' + escapeHtml(a.status) + ' · token ' + escapeHtml(a.token.substring(0,8)) + '...</p></div></div>';
  html += '<div class="fp-nav" style="justify-content:flex-start; margin: 16px 0;">';
  html += '<button class="fp-btn fp-btn-secondary" id="backBtn">← Voltar</button>';
  if (a.status === 'respondida') {
    html += '<button class="fp-btn fp-btn-primary" id="exportBtn">Exportar JSON do HUB</button>';
  }
  html += '</div>';
  if (a.status !== 'respondida') {
    html += '<p class="fp-muted">Esta anamnese ainda não foi respondida pelo atleta.</p>';
    html += '<p class="fp-muted">Link: <code>https://bjj-anamnese.pages.dev/anamnese.html?t=' + escapeHtml(a.token) + '</code></p>';
  } else {
    html += '<div id="detalheBlocos"></div>';
  }
  card.innerHTML = html;
  root.appendChild(card);
  document.getElementById('backBtn').addEventListener('click', () => { state.view = 'list'; loadList(); });
  if (a.status === 'respondida') {
    renderRespostas(a);
    document.getElementById('exportBtn').addEventListener('click', () => exportarJson(a));
  }
}

function renderRespostas(a) {
  const cont = document.getElementById('detalheBlocos');
  if (!cont) return;
  const respostas = a.respostas || {};
  Object.keys(respostas).forEach(blocoId => {
    const sec = document.createElement('div');
    sec.className = 'fp-bloco-detalhe';
    let html = '<h3>' + escapeHtml(blocoId.replace(/_/g, ' ')) + '</h3><table class="fp-resp-table">';
    const data = respostas[blocoId] || {};
    Object.keys(data).forEach(k => {
      let v = data[k];
      if (Array.isArray(v)) v = v.join(', ');
      if (v === true) v = 'sim';
      if (v === false) v = 'não';
      html += '<tr><td class="fp-resp-key">' + escapeHtml(k) + '</td><td>' + escapeHtml(String(v == null ? '—' : v)) + '</td></tr>';
    });
    html += '</table>';
    sec.innerHTML = html;
    cont.appendChild(sec);
  });
}

function exportarJson(a) {
  const atleta = mapAnamneseToAtleta(a);
  const json = JSON.stringify(atleta, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    alert('JSON do atleta copiado para a área de transferência!\n\nCole no HUB local em:\nlocalStorage > bjj_pp_atletas_v1');
  }).catch(() => {
    // Fallback: mostrar em modal
    showJsonModal(json);
  });
}

function showJsonModal(json) {
  const overlay = document.createElement('div');
  overlay.className = 'fp-modal';
  overlay.innerHTML = '<div class="fp-modal-card"><h3>JSON do atleta</h3>' +
    '<textarea readonly class="fp-textarea" rows="20">' + escapeHtml(json) + '</textarea>' +
    '<div class="fp-nav"><button class="fp-btn fp-btn-secondary" id="closeMod">Fechar</button></div></div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#closeMod').addEventListener('click', () => overlay.remove());
}

// ─── Telas auxiliares ───────────────────────────
function renderLoading(msg) {
  const root = document.getElementById('app');
  root.innerHTML = '<div class="fp-card" style="text-align:center;"><p class="fp-muted">' + escapeHtml(msg) + '</p></div>';
}

function renderError(msg) {
  const root = document.getElementById('app');
  root.innerHTML = '<div class="fp-card fp-error"><h2>Erro</h2><p>' + escapeHtml(msg) + '</p>' +
    '<div class="fp-nav"><button class="fp-btn fp-btn-secondary" id="retryBtn">Tentar novamente</button></div></div>';
  document.getElementById('retryBtn').addEventListener('click', () => init());
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
