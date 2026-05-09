/**
 * mapper.js — Conversor anamnese -> schema atleta do HUB
 *
 * Espelho da função do worker_index-bundled.js, usado pelo admin
 * para gerar o JSON pronto para colar no localStorage do HUB.
 *
 * Schema-alvo: bjj_pp_atletas_v1
 * Versão: 1.0.0
 */

export function mapAnamneseToAtleta(registro) {
  const r = registro?.respostas || {};
  const meta = registro?.metadata || {};

  const b1 = r.bloco01_identificacao || {};
  const b2 = r.bloco02_antropometria || {};
  const b3 = r.bloco03_bjj || {};
  const b4 = r.bloco04_fc || {};
  const b5 = r.bloco05_disponibilidade || {};
  const b6 = r.bloco06_equipamentos || {};
  const b7 = r.bloco07_lesoes || {};
  const b8 = r.bloco08_suplementacao || {};
  const b9 = r.bloco09_ergogenicos || {};
  const b10 = r.bloco10_nutricao || {};
  const b11 = r.bloco11_parq || {};
  const b12 = r.bloco12_acsm || {};
  const b13 = r.bloco13_rwlq || {};
  const b14 = r.bloco14_leafq || {};
  const b15 = r.bloco15_psqi || {};
  const b16 = r.bloco16_objetivos || {};

  const idadeAnos = calcAge(b1.dataNascimento);

  return {
    id: 'atleta_' + (registro.token || cryptoId()),
    criadoEm: registro?.respondidoEm || new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    versaoSchema: 'bjj_pp_atletas_v1',
    anamneseTokenOrigem: registro?.token || null,

    dadosPessoais: {
      nomeCompleto: b1.nomeCompleto || '',
      apelido: b1.apelido || null,
      dataNascimento: b1.dataNascimento || null,
      idadeAnos,
      sexoBiologico: b1.sexoBiologico || null,
      email: b1.email || null,
      telefone: b1.telefone || null,
      cidade: b1.cidade || null,
      estado: b1.estado || null,
      profissao: b1.profissao || null,
    },

    antropometria: hasAny(b2) ? {
      pesoKg: numOrNull(b2.pesoKg),
      alturaCm: numOrNull(b2.alturaCm),
      cintura: numOrNull(b2.circCintura),
      quadril: numOrNull(b2.circQuadril),
      bracoRel: numOrNull(b2.circBracoRelaxado),
      coxa: numOrNull(b2.circCoxa),
      panturrilha: numOrNull(b2.circPanturrilha),
      antebraco: numOrNull(b2.circAntebraco),
      peitoral: numOrNull(b2.circPeitoral),
      autoreferida: true,
      notas: 'Coletada via anamnese online; recomenda-se medição presencial para precisão.',
    } : null,

    bjj: {
      faixaAtual: b3.faixaAtual || null,
      anosPraticaTotal: numOrNull(b3.anosPraticaBJJ),
      anosFaixaAtual: numOrNull(b3.anosFaixaAtual),
      modalidadePrincipal: b3.modalidadePrincipal || null,
      frequenciaSemanalBJJ: numOrNull(b3.frequenciaSemanal),
      competeAtualmente: b3.competeAtualmente || null,
      federacaoPrincipal: b3.federacaoPrincipal || null,
    },

    forcaCondicionamento: {
      idadeTreinamentoFC: b4.idadeTreinamento || null,
      jaTreinou: b4.jaTreinou || null,
      nivelTecnico: b4.nivelTecnico || null,
      supervisaoAtual: b4.supervisaoAtual || null,
      historicoCargasMaximas: b4.historicoCargas || null,
    },

    disponibilidade: {
      diasSemanaFC: b5.diasDisponiveisFC || [],
      diasSemanaBJJ: b5.diasBJJ || [],
      horarioPreferido: b5.horarioPreferido || null,
      duracaoMaximaSessaoMin: numOrNull(b5.duracaoMaximaSessao),
      ordemTreinos: b5.ordemTreinos || null,
    },

    equipamentos: {
      localTreino: b6.localTreino || null,
      equipamentos: b6.equipamentos || [],
    },

    lesoes: {
      temLesoesPassadas: b7.temLesoesPassadas || null,
      detalhamentoLesoes: b7.detalhamentoLesoes || null,
      regioesAfetadas: b7.regioesAfetadas || [],
      cirurgiasOrtopedicas: b7.cirurgiasOrtopedicas || null,
      detalhamentoCirurgias: b7.detalhamentoCirurgias || null,
      dorAtualGeral: numOrNull(b7.dorAtualGeral),
      restricoesMedicas: b7.restricoesMedicas || null,
    },

    suplementacao: {
      usaSuplementos: b8.usaSuplementos || null,
      listaSuplementos: b8.listaSuplementos || null,
      usaMedicacaoContinua: b8.usaMedicacaoContinua || null,
      listaMedicacoes: b8.listaMedicacoes || null,
      usaCafeinaPreTreino: b8.usaCafeinaPreTreino || null,
    },

    ergogenicos: {
      uso: b9.usoErgogenicosHormonais || null,
      tipoProtocolo: b9.tipoProtocolo || null,
      acompanhamentoMedico: b9.acompanhamentoMedico || null,
      frequenciaExames: b9.frequenciaExames || null,
      tempoTotalUsoVida: b9.tempoTotalUsoVida || null,
      tempoUltimoCiclo: b9.tempoUltimoCiclo || null,
      efeitosColateraisRelatados: b9.efeitosColateraisRelatados || null,
    },

    nutricao: {
      refeicoesDia: numOrNull(b10.refeicoesDia),
      acompanhamentoNutricional: b10.temAcompanhamentoNutricional || null,
      restricoesAlimentares: b10.restricoesAlimentares || [],
      consumoAguaLitrosDia: numOrNull(b10.consumoAguaDiario),
      consumoAlcoolSemana: b10.consumoAlcoolSemana || null,
      tabagismo: b10.tabagismo || null,
      qualidadeAutoavaliada: numOrNull(b10.qualidadeAutoavaliada),
    },

    objetivos: {
      objetivoPrincipal: b16.objetivoPrincipal || null,
      proximaCompeticaoData: b16.proximaCompeticaoData || null,
      proximaCompeticaoNome: b16.proximaCompeticaoNome || null,
      categoriaPesoAlvo: b16.categoriaPesoAlvo || null,
      nivelComprometimento: numOrNull(b16.nivelComprometimento),
      historicoConsultoriaAnterior: b16.historicoConsultoriaAnterior || null,
      observacoesAdicionais: b16.observacoesAdicionais || null,
    },

    metadataAnamnese: {
      versao: meta.versao || null,
      preenchidoEm: registro?.respondidoEm || null,
      duracaoMin: meta.durationMin || null,
      blocosPulados: meta.skippedBlocks || [],
    },
  };
}

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

function cryptoId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
