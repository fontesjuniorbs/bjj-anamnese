/**
 * BJJ Performance Pro — Worker de Anamnese (BUNDLED)
 *
 * Versão única: notifications.js + mapper.js + index.js consolidados.
 * Use este arquivo para deploy via painel Cloudflare (basta colar tudo).
 *
 * Versão: 1.1.0 (bundled)
 */

/**
 * notifications.js — disparo de notificações triplas em paralelo
 *
 * Canais:
 *  1. E-mail via MailChannels (gratuito, integrado Cloudflare Workers)
 *  2. Telegram Bot (via Bot API)
 *  3. Google Sheets (via Apps Script web app webhook)
 *
 * Cada canal é OPCIONAL. Se a env var correspondente não estiver configurada,
 * o canal é silenciosamente ignorado (não falha a resposta ao aluno).
 *
 * Todos os disparos são paralelos (Promise.allSettled) e idempotentes.
 *
 * Versão: 1.0.0
 */

const MAILCHANNELS_ENDPOINT = 'https://api.mailchannels.net/tx/v1/send';

/**
 * Dispara as 3 notificações em paralelo.
 * Retorna { email, telegram, sheets } com status de cada uma.
 */
export async function notifyAll(env, payload) {
  const tasks = [
    sendEmail(env, payload),
    sendTelegram(env, payload),
    sendSheetsRow(env, payload),
  ];

  const results = await Promise.allSettled(tasks);
  return {
    email: simplifyResult(results[0]),
    telegram: simplifyResult(results[1]),
    sheets: simplifyResult(results[2]),
  };
}

function simplifyResult(r) {
  if (r.status === 'fulfilled') return r.value;
  return { sent: false, error: String(r.reason?.message || r.reason || 'desconhecido') };
}

/* ───────────────────────────────────────────────
 * 1. E-MAIL via MailChannels
 * ─────────────────────────────────────────────── */

async function sendEmail(env, payload) {
  if (!env.NOTIFY_EMAIL_TO || !env.NOTIFY_EMAIL_FROM) {
    return { sent: false, skipped: true, reason: 'env vars de e-mail não configuradas' };
  }

  const { token, nomeAluno, respondidoEm, blocosFlags } = payload;
  const link = `${env.PUBLIC_BASE_URL || 'https://bjj-anamnese.pages.dev'}/admin.html?t=${token}`;

  const subject = `Anamnese respondida — ${nomeAluno}`;
  const html = renderEmailHTML({
    nomeAluno,
    respondidoEm,
    blocosFlags,
    link,
    profissional: env.NOTIFY_PROFESSIONAL_NAME || 'Prof. Esp. Fontes Júnior',
  });
  const text = `Anamnese respondida por ${nomeAluno} em ${formatPtDate(respondidoEm)}.\n\nVer respostas: ${link}`;

  const body = {
    personalizations: [{ to: [{ email: env.NOTIFY_EMAIL_TO }] }],
    from: { email: env.NOTIFY_EMAIL_FROM, name: 'BODYSIZE Anamnese' },
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html },
    ],
  };

  const r = await fetch(MAILCHANNELS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    return { sent: false, status: r.status, error: errText.substring(0, 300) };
  }
  return { sent: true, channel: 'mailchannels' };
}

function renderEmailHTML(data) {
  const flags = data.blocosFlags || {};
  const flagItems = [];
  if (flags.parqAlerta)        flagItems.push('⚠ PAR-Q+ com sinais positivos — revisar antes de prescrever');
  if (flags.acsmAtencao)       flagItems.push('⚠ ACSM 2018 indica necessidade de avaliação clínica');
  if (flags.lesoesAtivas)      flagItems.push('⚠ Lesões ativas reportadas');
  if (flags.usoErgogenicos)    flagItems.push('ⓘ Uso atual de ergogênicos hormonais relatado');
  if (flags.rwlqRisco)         flagItems.push('⚠ RWLQ indica padrão de risco de corte de peso');
  if (flags.leafqRisco)        flagItems.push('⚠ LEAF-Q ≥ 8: risco de RED-S — avaliar tríade da atleta');
  if (flags.psqiRuim)          flagItems.push('⚠ PSQI > 5: qualidade de sono insuficiente');

  const flagsHtml = flagItems.length > 0
    ? `<ul style="padding-left:20px; margin:8px 0;">${flagItems.map(f => `<li style="margin:4px 0;">${escapeHtml(f)}</li>`).join('')}</ul>`
    : '<p style="color:#5C6680; margin:8px 0;">Nenhum sinal de alerta automático detectado.</p>';

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#F4F5F7; color:#11151a;">
  <div style="max-width:560px; margin:0 auto; padding:24px;">
    <div style="background:#fff; border-radius:12px; padding:32px; border-top:4px solid #FF405C;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
        <div style="width:42px; height:42px; background:#FF405C; color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; border-radius:8px;">BP</div>
        <div>
          <div style="font-size:14px; font-weight:600; color:#11151a;">BJJ Performance Pro</div>
          <div style="font-size:11px; color:#5C6680; letter-spacing:0.4px;">BODYSIZE · ANAMNESE</div>
        </div>
      </div>

      <h1 style="font-size:18px; margin:0 0 12px 0; color:#11151a;">Anamnese respondida</h1>
      <p style="margin:0 0 8px 0; font-size:14px;">Atleta: <strong>${escapeHtml(data.nomeAluno)}</strong></p>
      <p style="margin:0 0 16px 0; font-size:13px; color:#5C6680;">Recebida em ${escapeHtml(formatPtDate(data.respondidoEm))}.</p>

      <div style="background:#F4F5F7; border-radius:8px; padding:14px 16px; margin:16px 0;">
        <div style="font-size:12px; font-weight:600; color:#11151a; margin-bottom:6px; letter-spacing:0.3px;">SINAIS DE ALERTA</div>
        ${flagsHtml}
      </div>

      <div style="text-align:center; margin:24px 0 8px 0;">
        <a href="${escapeHtml(data.link)}" style="display:inline-block; padding:12px 24px; background:#FF405C; color:#fff; font-weight:600; text-decoration:none; border-radius:8px; font-size:14px;">Abrir no painel</a>
      </div>

      <hr style="border:none; border-top:1px solid #E5E7EB; margin:24px 0;">
      <p style="font-size:11px; color:#7B859A; margin:0; text-align:center;">${escapeHtml(data.profissional)} — CREF 005654-G/AM<br>BODYSIZE — Manaus, AM</p>
    </div>
  </div>
</body></html>`;
}

/* ───────────────────────────────────────────────
 * 2. TELEGRAM BOT
 * ─────────────────────────────────────────────── */

async function sendTelegram(env, payload) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { sent: false, skipped: true, reason: 'env vars de Telegram não configuradas' };
  }

  const { token, nomeAluno, respondidoEm, blocosFlags } = payload;
  const link = `${env.PUBLIC_BASE_URL || 'https://bjj-anamnese.pages.dev'}/admin.html?t=${token}`;

  const flags = blocosFlags || {};
  const flagLines = [];
  if (flags.parqAlerta)     flagLines.push('⚠️ PAR-Q+ positivo');
  if (flags.acsmAtencao)    flagLines.push('⚠️ ACSM atenção');
  if (flags.lesoesAtivas)   flagLines.push('⚠️ Lesões ativas');
  if (flags.usoErgogenicos) flagLines.push('ℹ️ Ergogênicos em uso');
  if (flags.rwlqRisco)      flagLines.push('⚠️ RWLQ risco');
  if (flags.leafqRisco)     flagLines.push('⚠️ LEAF-Q risco RED-S');
  if (flags.psqiRuim)       flagLines.push('⚠️ PSQI > 5');

  const flagsBlock = flagLines.length > 0 ? '\n\n' + flagLines.join('\n') : '\n\n_Sem alertas automáticos._';

  const text = `*Anamnese respondida*\n\n👤 ${escapeMd(nomeAluno)}\n🕒 ${escapeMd(formatPtDate(respondidoEm))}${flagsBlock}\n\n[Abrir no painel](${link})`;

  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    return { sent: false, status: r.status, error: errText.substring(0, 300) };
  }
  return { sent: true, channel: 'telegram' };
}

/* ───────────────────────────────────────────────
 * 3. GOOGLE SHEETS via Apps Script webhook
 * ─────────────────────────────────────────────── */

async function sendSheetsRow(env, payload) {
  if (!env.SHEETS_WEBHOOK_URL) {
    return { sent: false, skipped: true, reason: 'SHEETS_WEBHOOK_URL não configurada' };
  }

  const { token, nomeAluno, respondidoEm, criadoEm, blocosFlags } = payload;
  const link = `${env.PUBLIC_BASE_URL || 'https://bjj-anamnese.pages.dev'}/admin.html?t=${token}`;
  const flags = blocosFlags || {};

  const row = {
    timestamp: new Date().toISOString(),
    token,
    nomeAluno,
    criadoEm: criadoEm || '',
    respondidoEm: respondidoEm || '',
    parqAlerta: flags.parqAlerta ? 'SIM' : 'não',
    acsmAtencao: flags.acsmAtencao ? 'SIM' : 'não',
    lesoesAtivas: flags.lesoesAtivas ? 'SIM' : 'não',
    usoErgogenicos: flags.usoErgogenicos ? 'SIM' : 'não',
    rwlqRisco: flags.rwlqRisco ? 'SIM' : 'não',
    leafqRisco: flags.leafqRisco ? 'SIM' : 'não',
    psqiRuim: flags.psqiRuim ? 'SIM' : 'não',
    link,
  };

  const r = await fetch(env.SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    return { sent: false, status: r.status, error: errText.substring(0, 300) };
  }
  return { sent: true, channel: 'sheets' };
}

/* ───────────────────────────────────────────────
 * Helpers
 * ─────────────────────────────────────────────── */

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeMd(s) {
  return String(s == null ? '' : s).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

function formatPtDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { timeZone: 'America/Manaus', dateStyle: 'short', timeStyle: 'short' });
  } catch { return iso; }
}

/* ───────────────────────────────────────────────
 * Computa flags de alerta a partir das respostas
 * ─────────────────────────────────────────────── */
export function computeAlertFlags(respostas) {
  const r = respostas || {};
  const flags = {};

  // PAR-Q+: qualquer resposta SIM nas 7 perguntas iniciais → alerta
  const parq = r.bloco11_parq || {};
  const parqSimItems = ['parq_p1_cardiaco','parq_p2_dor_peito','parq_p3_tontura',
                        'parq_p4_doenca_cronica','parq_p5_medicacao',
                        'parq_p6_musculoesqueletico','parq_p7_supervisao'];
  flags.parqAlerta = parqSimItems.some(k => parq[k] === 'sim');

  // ACSM 2018: doença conhecida ou sintomas → atenção
  const acsm = r.bloco12_acsm || {};
  flags.acsmAtencao = acsm.acsm_p2_doenca_conhecida === 'sim' ||
                      acsm.acsm_p3_sintomas === 'sim';

  // Lesões: temLesoesPassadas === 'ativa' ou dor atual >= 6
  const lesoes = r.bloco07_lesoes || {};
  flags.lesoesAtivas = lesoes.temLesoesPassadas === 'ativa' ||
                       (typeof lesoes.dorAtualGeral === 'number' && lesoes.dorAtualGeral >= 6);

  // Ergogênicos hormonais: uso atual
  const ergo = r.bloco09_ergogenicos || {};
  flags.usoErgogenicos = ergo.usoErgogenicosHormonais === 'usa_atualmente' ||
                         ergo.usoErgogenicosHormonais === 'trt_acompanhado';

  // RWLQ: passou mal alguma vez OU usa restrição severa OU sem orientação
  const rwlq = r.bloco13_rwlq || {};
  flags.rwlqRisco = rwlq.rwlq_p8_passou_mal === 'sim' ||
                    (Array.isArray(rwlq.rwlq_p6_metodos) &&
                     rwlq.rwlq_p6_metodos.some(m => ['restricao_alimentar_severa','desidratacao_intensa','sauna_termica'].includes(m))) ||
                    rwlq.rwlq_p7_quem_orientou === 'sozinho';

  // LEAF-Q: amenorreia ou lesoes 12m + GI sintomas frequentes
  const leafq = r.bloco14_leafq || {};
  let leafqScore = 0;
  if (leafq.leafq_p1_lesoes_12m === 'sim') leafqScore += 2;
  if (leafq.leafq_p3_dor_abdominal === 'frequente') leafqScore += 1;
  if (leafq.leafq_p4_inchada === 'frequente') leafqScore += 1;
  if (leafq.leafq_p5_constipacao === 'frequente') leafqScore += 1;
  if (leafq.leafq_p7_menstruacao_regular === 'nao') leafqScore += 2;
  if (leafq.leafq_p8_amenorreia === 'sim') leafqScore += 4;
  flags.leafqRisco = leafqScore >= 8;
  flags.leafqScore = leafqScore;

  // PSQI: cálculo simplificado (4 itens auto-relatados)
  // Score >5 indica má qualidade de sono
  const psqi = r.bloco15_psqi || {};
  let psqiScore = 0;
  // qualidade geral
  const q6 = psqi.psqi_p6_qualidade_geral;
  if (q6 === 'muito_ruim') psqiScore += 3;
  else if (q6 === 'ruim') psqiScore += 2;
  else if (q6 === 'boa') psqiScore += 1;
  // medicação
  const q7 = psqi.psqi_p7_medicacao_dormir;
  if (q7 === 'tres_mais') psqiScore += 3;
  else if (q7 === 'uma_dois') psqiScore += 2;
  else if (q7 === 'menos_uma') psqiScore += 1;
  // dificuldade acordado
  const q8 = psqi.psqi_p8_dificuldade_acordado;
  if (q8 === 'tres_mais') psqiScore += 3;
  else if (q8 === 'uma_dois') psqiScore += 2;
  else if (q8 === 'menos_uma') psqiScore += 1;
  // entusiasmo
  const q9 = psqi.psqi_p9_entusiasmo;
  if (q9 === 'muito_grande') psqiScore += 3;
  else if (q9 === 'grande') psqiScore += 2;
  else if (q9 === 'pequena') psqiScore += 1;
  flags.psqiRuim = psqiScore > 5;
  flags.psqiScore = psqiScore;

  return flags;
}


/**
 * mapper.js — Conversor anamnese → schema atleta do HUB
 *
 * Transforma o objeto `respostas` (17 blocos) recebido do formulário público
 * em um registro compatível com o storage `bjj_pp_atletas_v1` do HUB local.
 *
 * É usado em DOIS lugares:
 *  - Worker (resposta do endpoint /api/anamnese/atleta/:token)
 *  - Painel admin (geração do JSON a colar/importar no HUB local)
 *
 * Schema-alvo: { id, criadoEm, atualizadoEm, dadosPessoais, bjj, lesoes,
 *                disponibilidade, equipamentos, antropometria, prontidao,
 *                nutricao, objetivos, anamneseTokenOrigem }
 *
 * Versão: 1.0.0
 */

export function mapAnamneseToAtleta(registro) {
  const r = registro?.respostas || {};
  const meta = registro?.metadata || {};

  const b1  = r.bloco01_identificacao   || {};
  const b2  = r.bloco02_antropometria   || {};
  const b3  = r.bloco03_bjj             || {};
  const b4  = r.bloco04_fc              || {};
  const b5  = r.bloco05_disponibilidade || {};
  const b6  = r.bloco06_equipamentos    || {};
  const b7  = r.bloco07_lesoes          || {};
  const b8  = r.bloco08_suplementacao   || {};
  const b9  = r.bloco09_ergogenicos     || {};
  const b10 = r.bloco10_nutricao        || {};
  const b11 = r.bloco11_parq            || {};
  const b12 = r.bloco12_acsm            || {};
  const b13 = r.bloco13_rwlq            || {};
  const b14 = r.bloco14_leafq           || {};
  const b15 = r.bloco15_psqi            || {};
  const b16 = r.bloco16_objetivos       || {};

  const idadeAnos = calcAge(b1.dataNascimento);

  return {
    id: 'atleta_' + (registro.token || cryptoId()),
    criadoEm: registro?.respondidoEm || new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    versaoSchema: 'bjj_pp_atletas_v1',
    anamneseTokenOrigem: registro?.token || null,

    dadosPessoais: {
      nomeCompleto:    b1.nomeCompleto || '',
      apelido:         b1.apelido || null,
      dataNascimento:  b1.dataNascimento || null,
      idadeAnos,
      sexoBiologico:   b1.sexoBiologico || null,
      email:           b1.email || null,
      telefone:        b1.telefone || null,
      cidade:          b1.cidade || null,
      estado:          b1.estado || null,
      profissao:       b1.profissao || null,
    },

    antropometria: hasAny(b2) ? {
      pesoKg:          numOrNull(b2.pesoKg),
      alturaCm:        numOrNull(b2.alturaCm),
      cintura:         numOrNull(b2.circCintura),
      quadril:         numOrNull(b2.circQuadril),
      bracoRel:        numOrNull(b2.circBracoRelaxado),
      coxa:            numOrNull(b2.circCoxa),
      panturrilha:     numOrNull(b2.circPanturrilha),
      antebraco:       numOrNull(b2.circAntebraco),
      peitoral:        numOrNull(b2.circPeitoral),
      autoreferida: true,
      notas: 'Coletada via anamnese online; recomenda-se medição presencial para precisão.',
    } : null,

    bjj: {
      faixaAtual:           b3.faixaAtual || null,
      anosPraticaTotal:     numOrNull(b3.anosPraticaBJJ),
      anosFaixaAtual:       numOrNull(b3.anosFaixaAtual),
      modalidadePrincipal:  b3.modalidadePrincipal || null,
      frequenciaSemanalBJJ: numOrNull(b3.frequenciaSemanal),
      competeAtualmente:    b3.competeAtualmente || null,
      federacaoPrincipal:   b3.federacaoPrincipal || null,
    },

    forcaCondicionamento: {
      idadeTreinamentoFC:    b4.idadeTreinamento || null,
      jaTreinou:             b4.jaTreinou || null,
      nivelTecnico:          b4.nivelTecnico || null,
      supervisaoAtual:       b4.supervisaoAtual || null,
      historicoCargasMaximas: b4.historicoCargas || null,
    },

    disponibilidade: {
      diasSemanaFC:          b5.diasDisponiveisFC || [],
      diasSemanaBJJ:         b5.diasBJJ || [],
      horarioPreferido:      b5.horarioPreferido || null,
      duracaoMaximaSessaoMin: numOrNull(b5.duracaoMaximaSessao),
      ordemTreinos:          b5.ordemTreinos || null,
    },

    equipamentos: {
      localTreino:    b6.localTreino || null,
      equipamentos:   b6.equipamentos || [],
    },

    lesoes: {
      temLesoesPassadas:    b7.temLesoesPassadas || null,
      detalhamentoLesoes:   b7.detalhamentoLesoes || null,
      regioesAfetadas:      b7.regioesAfetadas || [],
      cirurgiasOrtopedicas: b7.cirurgiasOrtopedicas || null,
      detalhamentoCirurgias: b7.detalhamentoCirurgias || null,
      dorAtualGeral:        numOrNull(b7.dorAtualGeral),
      restricoesMedicas:    b7.restricoesMedicas || null,
    },

    suplementacao: {
      usaSuplementos:       b8.usaSuplementos || null,
      listaSuplementos:     b8.listaSuplementos || null,
      usaMedicacaoContinua: b8.usaMedicacaoContinua || null,
      listaMedicacoes:      b8.listaMedicacoes || null,
      usaCafeinaPreTreino:  b8.usaCafeinaPreTreino || null,
    },

    ergogenicos: {
      uso:                          b9.usoErgogenicosHormonais || null,
      tipoProtocolo:                b9.tipoProtocolo || null,
      acompanhamentoMedico:         b9.acompanhamentoMedico || null,
      frequenciaExames:             b9.frequenciaExames || null,
      tempoTotalUsoVida:            b9.tempoTotalUsoVida || null,
      tempoUltimoCiclo:             b9.tempoUltimoCiclo || null,
      efeitosColateraisRelatados:   b9.efeitosColateraisRelatados || null,
    },

    nutricao: {
      refeicoesDia:                  numOrNull(b10.refeicoesDia),
      acompanhamentoNutricional:     b10.temAcompanhamentoNutricional || null,
      restricoesAlimentares:         b10.restricoesAlimentares || [],
      consumoAguaLitrosDia:          numOrNull(b10.consumoAguaDiario),
      consumoAlcoolSemana:           b10.consumoAlcoolSemana || null,
      tabagismo:                     b10.tabagismo || null,
      qualidadeAutoavaliada:         numOrNull(b10.qualidadeAutoavaliada),
    },

    prontidao: {
      parq: {
        cardiaco:           b11.parq_p1_cardiaco || null,
        dorPeito:           b11.parq_p2_dor_peito || null,
        tontura:            b11.parq_p3_tontura || null,
        doencaCronica:      b11.parq_p4_doenca_cronica || null,
        medicacao:          b11.parq_p5_medicacao || null,
        musculoesqueletico: b11.parq_p6_musculoesqueletico || null,
        supervisao:         b11.parq_p7_supervisao || null,
        possuiAlerta:       hasParqAlert(b11),
      },
      acsm: {
        atividadeRegular:   b12.acsm_p1_atividade_regular || null,
        doencaConhecida:    b12.acsm_p2_doenca_conhecida || null,
        sintomas:           b12.acsm_p3_sintomas || null,
        intensidadeAlvo:    b12.acsm_p4_intensidade_alvo || null,
        possuiAtencao:      b12.acsm_p2_doenca_conhecida === 'sim' ||
                            b12.acsm_p3_sintomas === 'sim',
      },
      rwlq: hasAny(b13) ? {
        compete:            b13.rwlq_p1_compete_categoria || null,
        kgPerdidos:         b13.rwlq_p2_kg_perdidos || null,
        tempoPerda:         b13.rwlq_p3_tempo_perda || null,
        competicoesAno:     numOrNull(b13.rwlq_p4_competicoes_ano),
        dificuldadeRecup:   b13.rwlq_p5_dificuldade_recuperacao || null,
        metodos:            b13.rwlq_p6_metodos || [],
        quemOrientou:       b13.rwlq_p7_quem_orientou || null,
        passouMal:          b13.rwlq_p8_passou_mal || null,
      } : null,
      leafq: hasAny(b14) ? {
        lesoes12m:          b14.leafq_p1_lesoes_12m || null,
        dorAbdominal:       b14.leafq_p3_dor_abdominal || null,
        inchada:            b14.leafq_p4_inchada || null,
        constipacao:        b14.leafq_p5_constipacao || null,
        diarreia:           b14.leafq_p6_diarreia || null,
        menstruacaoRegular: b14.leafq_p7_menstruacao_regular || null,
        amenorreia:         b14.leafq_p8_amenorreia || null,
        idadeMenarca:       numOrNull(b14.leafq_p9_idade_menarca),
        scoreCalculado:     calcLeafqScore(b14),
      } : null,
      psqi: {
        horarioDeitar:      b15.psqi_p1_horario_deitar || null,
        minPegarSono:       numOrNull(b15.psqi_p2_min_pegar_sono),
        horarioLevantar:    b15.psqi_p3_horario_levantar || null,
        horasEfetivas:      numOrNull(b15.psqi_p4_horas_efetivas),
        qualidadeGeral:     b15.psqi_p6_qualidade_geral || null,
        medicacaoDormir:    b15.psqi_p7_medicacao_dormir || null,
        dificuldadeAcordado: b15.psqi_p8_dificuldade_acordado || null,
        entusiasmo:         b15.psqi_p9_entusiasmo || null,
        scoreCalculado:     calcPsqiScore(b15),
      },
    },

    objetivos: {
      objetivoPrincipal:        b16.objetivoPrincipal || null,
      proximaCompeticaoData:    b16.proximaCompeticaoData || null,
      proximaCompeticaoNome:    b16.proximaCompeticaoNome || null,
      categoriaPesoAlvo:        b16.categoriaPesoAlvo || null,
      nivelComprometimento:     numOrNull(b16.nivelComprometimento),
      historicoConsultoriaAnterior: b16.historicoConsultoriaAnterior || null,
      observacoesAdicionais:    b16.observacoesAdicionais || null,
    },

    metadataAnamnese: {
      versao: meta.versao || null,
      preenchidoEm: registro?.respondidoEm || null,
      duracaoMin: meta.durationMin || null,
      blocosPulados: meta.skippedBlocks || [],
    },
  };
}

/* ─── Helpers ─────────────────────────────────────────── */

function numOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function hasAny(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj).some(v =>
    v !== null && v !== undefined && v !== '' &&
    !(Array.isArray(v) && v.length === 0)
  );
}

function calcAge(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

function hasParqAlert(b11) {
  const items = ['parq_p1_cardiaco','parq_p2_dor_peito','parq_p3_tontura',
                 'parq_p4_doenca_cronica','parq_p5_medicacao',
                 'parq_p6_musculoesqueletico','parq_p7_supervisao'];
  return items.some(k => b11[k] === 'sim');
}

function calcLeafqScore(b14) {
  let s = 0;
  if (b14.leafq_p1_lesoes_12m === 'sim') s += 2;
  if (b14.leafq_p3_dor_abdominal === 'frequente') s += 1;
  if (b14.leafq_p4_inchada === 'frequente') s += 1;
  if (b14.leafq_p5_constipacao === 'frequente') s += 1;
  if (b14.leafq_p7_menstruacao_regular === 'nao') s += 2;
  if (b14.leafq_p8_amenorreia === 'sim') s += 4;
  return s;
}

function calcPsqiScore(b15) {
  let s = 0;
  const map3 = { muito_ruim: 3, ruim: 2, boa: 1, muito_boa: 0 };
  const mapFreq = { tres_mais: 3, uma_dois: 2, menos_uma: 1, nunca: 0 };
  const mapEnt = { muito_grande: 3, grande: 2, pequena: 1, nenhuma: 0 };
  if (b15.psqi_p6_qualidade_geral)     s += map3[b15.psqi_p6_qualidade_geral] ?? 0;
  if (b15.psqi_p7_medicacao_dormir)    s += mapFreq[b15.psqi_p7_medicacao_dormir] ?? 0;
  if (b15.psqi_p8_dificuldade_acordado) s += mapFreq[b15.psqi_p8_dificuldade_acordado] ?? 0;
  if (b15.psqi_p9_entusiasmo)          s += mapEnt[b15.psqi_p9_entusiasmo] ?? 0;
  return s;
}

function cryptoId() {
  // Fallback simples sem dependências
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}


/**
 * BJJ Performance Pro — Worker de Anamnese
 *
 * Backend serverless rodando em Cloudflare Workers.
 * 3 endpoints REST + utilitários.
 *
 * Endpoints:
 *   POST /api/anamnese/criar              — gera link único (auth required)
 *   GET  /api/anamnese/buscar/:token      — busca anamnese por token (público, para o aluno preencher)
 *   POST /api/anamnese/responder/:token   — recebe respostas do aluno (público, valida token)
 *   GET  /api/anamnese/listar             — lista todas anamneses (auth required)
 *   GET  /api/anamnese/detalhe/:token     — detalhes completos (auth required)
 *   DELETE /api/anamnese/:token           — remove anamnese (auth required)
 *   GET  /api/health                       — status check
 *
 * Storage: KV namespace `ANAMNESES`
 *   chave: token (UUID v4 sem hífens)
 *   valor: { status, criadoEm, respondidoEm, dadosAluno, respostas, ip }
 *
 * Versão: 1.0.0
 * Autor: BODYSIZE — Prof. Esp. Fontes Júnior, CREF 005654-G/AM
 */


const VERSION = '1.1.0';
const TOKEN_LENGTH = 32; // UUID v4 sem hífens
const MAX_PAYLOAD_SIZE = 500 * 1024; // 500 KB

// ─── Utilitários ─────────────────────────────────────────────────

function generateToken() {
  // UUID v4 sem hífens — 32 chars hex
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    }
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());

  // Permitir file:// (HUB local) e qualquer um da lista
  const isAllowed = origin === '' ||
                    origin === 'null' ||
                    origin.startsWith('file://') ||
                    allowed.some(a => origin === a || origin.startsWith(a));

  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request, env)).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

function authRequired(request, env) {
  const token = request.headers.get('X-Auth-Token');
  if (!token || token !== env.AUTH_TOKEN) {
    return jsonResponse({ error: 'unauthorized', message: 'Token de autenticação ausente ou inválido' }, 401);
  }
  return null;
}

function validateTokenFormat(token) {
  return typeof token === 'string' && /^[a-f0-9]{32}$/.test(token);
}

// ─── Handlers ────────────────────────────────────────────────────

/**
 * POST /api/anamnese/criar
 * Body: { nomeAluno: string, contatoAluno?: string, observacoes?: string }
 * Auth: requer X-Auth-Token
 * Retorna: { token, url, criadoEm }
 */
async function handlerCriar(request, env) {
  const authError = authRequired(request, env);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json', message: 'Body deve ser JSON válido' }, 400);
  }

  const nomeAluno = (body.nomeAluno || '').trim();
  if (!nomeAluno || nomeAluno.length < 3 || nomeAluno.length > 120) {
    return jsonResponse({ error: 'invalid_name', message: 'nomeAluno deve ter 3-120 caracteres' }, 400);
  }

  const token = generateToken();
  const agora = new Date().toISOString();

  const registro = {
    token,
    status: 'pendente',
    criadoEm: agora,
    respondidoEm: null,
    dadosAluno: {
      nomeAluno,
      contatoAluno: body.contatoAluno || null,
      observacoes: body.observacoes || null,
    },
    respostas: null,
    ipPreenchimento: null,
    versaoSchema: '1.0.0',
  };

  await env.ANAMNESES.put(token, JSON.stringify(registro));

  // Determinar host da página de anamnese
  const url = new URL(request.url);
  const pagesHost = env.PAGES_HOST || `bjj-anamnese.pages.dev`;
  const formUrl = `https://${pagesHost}/anamnese.html?t=${token}`;

  return jsonResponse({
    token,
    url: formUrl,
    criadoEm: agora,
    nomeAluno,
    status: 'pendente',
  }, 201);
}

/**
 * GET /api/anamnese/buscar/:token
 * Público — usado pela página de anamnese para verificar token e exibir nome do aluno.
 * Retorna apenas dados não-sensíveis: nome do aluno + status.
 */
async function handlerBuscar(token, env) {
  if (!validateTokenFormat(token)) {
    return jsonResponse({ error: 'invalid_token', message: 'Formato de token inválido' }, 400);
  }

  const data = await env.ANAMNESES.get(token);
  if (!data) {
    return jsonResponse({ error: 'not_found', message: 'Anamnese não encontrada ou expirada' }, 404);
  }

  const registro = JSON.parse(data);

  if (registro.status === 'respondida') {
    return jsonResponse({
      status: 'ja_respondida',
      message: 'Esta anamnese já foi respondida e não pode ser preenchida novamente.',
      respondidoEm: registro.respondidoEm,
    }, 409);
  }

  // Retornar apenas dados públicos seguros
  return jsonResponse({
    token: registro.token,
    status: registro.status,
    nomeAluno: registro.dadosAluno.nomeAluno,
    criadoEm: registro.criadoEm,
    versaoSchema: registro.versaoSchema,
  });
}

/**
 * POST /api/anamnese/responder/:token
 * Body: { respostas: { bloco01_..., bloco02_..., ... } }
 * Público — qualquer um com o token válido pode responder.
 */
async function handlerResponder(token, request, env) {
  if (!validateTokenFormat(token)) {
    return jsonResponse({ error: 'invalid_token', message: 'Token inválido' }, 400);
  }

  const contentLength = parseInt(request.headers.get('Content-Length') || '0');
  if (contentLength > MAX_PAYLOAD_SIZE) {
    return jsonResponse({ error: 'payload_too_large', message: 'Payload excede limite de 500KB' }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  if (!body.respostas || typeof body.respostas !== 'object') {
    return jsonResponse({ error: 'missing_respostas', message: 'Campo "respostas" obrigatório' }, 400);
  }

  // Validar blocos obrigatórios mínimos
  const obrigatorios = ['bloco01_identificacao', 'bloco17_consentimento'];
  for (const b of obrigatorios) {
    if (!body.respostas[b]) {
      return jsonResponse({
        error: 'missing_block',
        message: `Bloco obrigatório ausente: ${b}`,
        bloco: b
      }, 400);
    }
  }

  // Validar consentimento LGPD
  const consent = body.respostas.bloco17_consentimento;
  if (!consent.aceiteLGPD || !consent.aceiteResponsabilidade) {
    return jsonResponse({
      error: 'consent_required',
      message: 'Consentimento LGPD e responsabilidade são obrigatórios'
    }, 400);
  }

  // Buscar registro existente
  const existing = await env.ANAMNESES.get(token);
  if (!existing) {
    return jsonResponse({ error: 'not_found', message: 'Token inválido ou expirado' }, 404);
  }

  const registro = JSON.parse(existing);
  if (registro.status === 'respondida') {
    return jsonResponse({
      error: 'already_answered',
      message: 'Esta anamnese já foi respondida',
      respondidoEm: registro.respondidoEm
    }, 409);
  }

  // Atualizar registro
  const agora = new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || 'desconhecido';

  registro.status = 'respondida';
  registro.respondidoEm = agora;
  registro.respostas = body.respostas;
  registro.ipPreenchimento = ip;
  registro.metadata = body.metadata || {};

  await env.ANAMNESES.put(token, JSON.stringify(registro));

  // Disparo das notificações (e-mail + Telegram + Sheets) — em background
  // Não bloqueia a resposta ao aluno. Cada canal é opcional via env vars.
  const blocosFlags = computeAlertFlags(body.respostas);
  const notifyPayload = {
    token,
    nomeAluno: registro.dadosAluno?.nomeAluno || 'Atleta',
    criadoEm: registro.criadoEm,
    respondidoEm: agora,
    blocosFlags,
  };

  // ctx pode estar disponível via env._ctx (encadeado pelo router)
  const notifyPromise = notifyAll(env, notifyPayload).then((result) => {
    console.log('[notify result]', JSON.stringify(result));
  }).catch(e => console.error('[notify fatal]', e));

  if (env._ctx && typeof env._ctx.waitUntil === 'function') {
    env._ctx.waitUntil(notifyPromise);
  } else {
    // Em ambiente de teste ou sem ctx: aguardar para não perder
    await notifyPromise.catch(() => {});
  }

  return jsonResponse({
    success: true,
    message: 'Anamnese registrada com sucesso. Obrigado!',
    respondidoEm: agora,
  });
}

/**
 * GET /api/anamnese/listar
 * Auth: requer X-Auth-Token
 * Query params: ?status=pendente|respondida|todos (default: todos)
 *               ?limit=N (default: 100)
 * Retorna: lista de anamneses (sem respostas detalhadas, apenas resumo)
 */
async function handlerListar(request, env) {
  const authError = authRequired(request, env);
  if (authError) return authError;

  const url = new URL(request.url);
  const filtroStatus = url.searchParams.get('status') || 'todos';
  const limit = parseInt(url.searchParams.get('limit') || '100');

  const lista = await env.ANAMNESES.list({ limit: Math.min(limit, 1000) });

  const resultados = [];
  for (const key of lista.keys) {
    const data = await env.ANAMNESES.get(key.name);
    if (!data) continue;

    const registro = JSON.parse(data);
    if (filtroStatus !== 'todos' && registro.status !== filtroStatus) continue;

    resultados.push({
      token: registro.token,
      status: registro.status,
      nomeAluno: registro.dadosAluno?.nomeAluno || '?',
      criadoEm: registro.criadoEm,
      respondidoEm: registro.respondidoEm,
      versaoSchema: registro.versaoSchema,
    });
  }

  // Ordenar por criadoEm DESC
  resultados.sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));

  return jsonResponse({
    total: resultados.length,
    filtro: filtroStatus,
    anamneses: resultados,
  });
}

/**
 * GET /api/anamnese/detalhe/:token
 * Auth: requer X-Auth-Token
 * Retorna: registro completo com todas as respostas
 */
async function handlerDetalhe(token, request, env) {
  const authError = authRequired(request, env);
  if (authError) return authError;

  if (!validateTokenFormat(token)) {
    return jsonResponse({ error: 'invalid_token' }, 400);
  }

  const data = await env.ANAMNESES.get(token);
  if (!data) {
    return jsonResponse({ error: 'not_found' }, 404);
  }

  return jsonResponse(JSON.parse(data));
}

/**
 * DELETE /api/anamnese/:token
 * Auth: requer X-Auth-Token
 */
async function handlerDeletar(token, request, env) {
  const authError = authRequired(request, env);
  if (authError) return authError;

  if (!validateTokenFormat(token)) {
    return jsonResponse({ error: 'invalid_token' }, 400);
  }

  await env.ANAMNESES.delete(token);
  return jsonResponse({ success: true, message: 'Anamnese removida' });
}

/**
 * GET /api/anamnese/atleta/:token
 * Auth: requer X-Auth-Token
 * Retorna: registro já mapeado para o schema bjj_pp_atletas_v1 do HUB,
 *          pronto para ser importado/colado no localStorage.
 */
async function handlerAtleta(token, request, env) {
  const authError = authRequired(request, env);
  if (authError) return authError;

  if (!validateTokenFormat(token)) {
    return jsonResponse({ error: 'invalid_token' }, 400);
  }

  const data = await env.ANAMNESES.get(token);
  if (!data) {
    return jsonResponse({ error: 'not_found' }, 404);
  }

  const registro = JSON.parse(data);
  if (registro.status !== 'respondida') {
    return jsonResponse({
      error: 'not_answered',
      message: 'Anamnese ainda não foi respondida',
      status: registro.status,
    }, 409);
  }

  const atleta = mapAnamneseToAtleta(registro);
  return jsonResponse({
    schema: 'bjj_pp_atletas_v1',
    atleta,
    instrucoes: 'Cole este objeto em window.localStorage[\'bjj_pp_atletas_v1\'] no HUB local',
  });
}

/**
 * GET /api/health
 * Status check.
 */
async function handlerHealth(env) {
  return jsonResponse({
    status: 'ok',
    version: VERSION,
    timestamp: new Date().toISOString(),
    kvBound: !!env.ANAMNESES,
    authConfigured: !!env.AUTH_TOKEN,
  });
}

// ─── Router principal ────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    // Anexar ctx ao env para que handlers internos possam usar waitUntil
    env._ctx = ctx;

    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
      });
    }

    let response;
    try {
      // Roteamento
      if (pathname === '/api/health' && method === 'GET') {
        response = await handlerHealth(env);
      }
      else if (pathname === '/api/anamnese/criar' && method === 'POST') {
        response = await handlerCriar(request, env);
      }
      else if (pathname === '/api/anamnese/listar' && method === 'GET') {
        response = await handlerListar(request, env);
      }
      else if (pathname.startsWith('/api/anamnese/buscar/') && method === 'GET') {
        const token = pathname.split('/').pop();
        response = await handlerBuscar(token, env);
      }
      else if (pathname.startsWith('/api/anamnese/detalhe/') && method === 'GET') {
        const token = pathname.split('/').pop();
        response = await handlerDetalhe(token, request, env);
      }
      else if (pathname.startsWith('/api/anamnese/atleta/') && method === 'GET') {
        const token = pathname.split('/').pop();
        response = await handlerAtleta(token, request, env);
      }
      else if (pathname.startsWith('/api/anamnese/responder/') && method === 'POST') {
        const token = pathname.split('/').pop();
        response = await handlerResponder(token, request, env);
      }
      else if (pathname.startsWith('/api/anamnese/') && method === 'DELETE') {
        const token = pathname.split('/').pop();
        response = await handlerDeletar(token, request, env);
      }
      else {
        response = jsonResponse({
          error: 'not_found',
          message: 'Endpoint não encontrado',
          path: pathname,
          method
        }, 404);
      }
    } catch (err) {
      console.error('Worker error:', err);
      response = jsonResponse({
        error: 'internal_error',
        message: err.message || 'Erro interno do servidor',
      }, 500);
    }

    return withCors(response, request, env);
  }
};
