/**
 * BJJ Performance Pro — Configuração dos blocos da anamnese
 *
 * Define a estrutura completa dos 17 blocos do formulário de anamnese.
 * Consumido por form-logic.js no frontend.
 *
 * Operadores de showIf suportados:
 *   { field, equals: 'valor' }
 *   { field, in: ['v1','v2','v3'] }
 *   { field, notEquals: 'valor' }
 *
 * Versão: 2.0.0
 *   - PAR-Q+ promovido a Bloco 1 (gate de prontidão antes do questionário longo)
 *   - Demais blocos renumerados em cadeia
 *   - ACSM 2018 mantido após Lesões/Suplementação (contexto clínico complementar)
 */

export const BLOCKS = [

  // BLOCO 1 — PAR-Q+ (gate de prontidão, vem primeiro)
  {
    id: 'bloco01_parq',
    numero: 1,
    titulo: 'PAR-Q+ (Questionário de Prontidão para Atividade Física)',
    obrigatorio: true,
    intro: 'Antes de qualquer outra pergunta, precisamos confirmar que você pode iniciar o programa com segurança. Responda com sinceridade absoluta. Qualquer SIM em pergunta crítica não significa impedimento, apenas que precisamos de uma camada extra de cuidado.',
    fields: [
      { id: 'parq_p1_cardiaco', label: 'Algum médico já lhe disse que você possui um problema cardíaco e que só deveria realizar atividade física recomendada por um médico?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'parq_p2_dor_peito', label: 'Você sente dor no peito quando realiza atividade física?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'parq_p3_tontura', label: 'No último mês, você sentiu tontura ao se levantar ou perdeu a consciência?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'parq_p4_doenca_cronica', label: 'Possui alguma doença crônica diagnosticada (hipertensão, diabetes, asma, etc.)?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'parq_p5_medicacao', label: 'Toma medicamentos prescritos atualmente?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'parq_p6_musculoesqueletico', label: 'Possui algum problema ósseo, articular ou muscular agravado por exercício?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'parq_p7_supervisao', label: 'Algum profissional de saúde recomendou que você só pratique exercícios sob supervisão?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
    ],
  },

  // BLOCO 2 — Identificação
  {
    id: 'bloco02_identificacao',
    numero: 2,
    titulo: 'Identificação',
    obrigatorio: true,
    intro: 'Estes dados são confidenciais e usados apenas pelo Prof. Fontes Júnior para sua avaliação.',
    fields: [
      { id: 'nomeCompleto', label: 'Nome completo', tipo: 'text', obrigatorio: true, maxLength: 120 },
      { id: 'apelido', label: 'Apelido / como prefere ser chamado', tipo: 'text', obrigatorio: false, maxLength: 60 },
      { id: 'dataNascimento', label: 'Data de nascimento', tipo: 'date', obrigatorio: true },
      { id: 'sexoBiologico', label: 'Sexo biológico', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'masculino', label: 'Masculino' },
        { value: 'feminino', label: 'Feminino' },
      ]},
      { id: 'email', label: 'E-mail', tipo: 'email', obrigatorio: false, maxLength: 120 },
      { id: 'telefone', label: 'Telefone / WhatsApp', tipo: 'tel', obrigatorio: false, maxLength: 30, ajuda: 'Pré-preenchido a partir do cadastro do seu treinador. Confirme ou ajuste se necessário.' },
      { id: 'cidade', label: 'Cidade', tipo: 'text', obrigatorio: false, maxLength: 80 },
      { id: 'estado', label: 'Estado (UF)', tipo: 'text', obrigatorio: false, maxLength: 2 },
      { id: 'profissao', label: 'Profissão / ocupação principal', tipo: 'text', obrigatorio: false, maxLength: 80 },
    ],
  },

  // BLOCO 3 — Antropometria
  {
    id: 'bloco03_antropometria',
    numero: 3,
    titulo: 'Antropometria',
    subtitulo: 'Medidas autorrelatadas',
    obrigatorio: false,
    intro: 'Se não souber alguma medida, deixe em branco. Recomenda-se medição presencial para precisão.',
    fields: [
      { id: 'pesoKg', label: 'Peso atual (kg)', tipo: 'number', obrigatorio: false, min: 30, max: 250, step: 0.1 },
      { id: 'alturaCm', label: 'Altura (cm)', tipo: 'number', obrigatorio: false, min: 120, max: 230, step: 1 },
      { id: 'circCintura', label: 'Cintura (cm)', tipo: 'number', obrigatorio: false, min: 40, max: 200, step: 0.5 },
      { id: 'circQuadril', label: 'Quadril (cm)', tipo: 'number', obrigatorio: false, min: 40, max: 200, step: 0.5 },
      { id: 'circBracoRelaxado', label: 'Braço relaxado (cm)', tipo: 'number', obrigatorio: false, min: 15, max: 70, step: 0.5 },
      { id: 'circCoxa', label: 'Coxa (cm)', tipo: 'number', obrigatorio: false, min: 30, max: 100, step: 0.5 },
      { id: 'circPanturrilha', label: 'Panturrilha (cm)', tipo: 'number', obrigatorio: false, min: 20, max: 60, step: 0.5 },
      { id: 'circAntebraco', label: 'Antebraço (cm)', tipo: 'number', obrigatorio: false, min: 15, max: 50, step: 0.5 },
      { id: 'circPeitoral', label: 'Peitoral (cm)', tipo: 'number', obrigatorio: false, min: 60, max: 160, step: 0.5 },
    ],
  },

  // BLOCO 4 — Histórico de BJJ
  {
    id: 'bloco04_bjj',
    numero: 4,
    titulo: 'Histórico de Jiu-Jitsu',
    obrigatorio: true,
    fields: [
      { id: 'faixaAtual', label: 'Faixa atual', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'branca', label: 'Branca' },
        { value: 'azul', label: 'Azul' },
        { value: 'roxa', label: 'Roxa' },
        { value: 'marrom', label: 'Marrom' },
        { value: 'preta', label: 'Preta' },
      ]},
      { id: 'anosPraticaBJJ', label: 'Anos totais de prática', tipo: 'number', obrigatorio: true, min: 0, max: 60, step: 0.5 },
      { id: 'anosFaixaAtual', label: 'Anos na faixa atual', tipo: 'number', obrigatorio: false, min: 0, max: 30, step: 0.5 },
      { id: 'modalidadePrincipal', label: 'Modalidade principal', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'gi', label: 'Com kimono (Gi)' },
        { value: 'nogi', label: 'Sem kimono (No-Gi)' },
        { value: 'ambos', label: 'Ambos igualmente' },
      ]},
      { id: 'frequenciaSemanal', label: 'Frequência semanal de BJJ (sessões)', tipo: 'number', obrigatorio: true, min: 0, max: 14, step: 1 },
      { id: 'competeAtualmente', label: 'Compete atualmente?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
        { value: 'pretendo', label: 'Pretendo competir em breve' },
      ]},
      { id: 'federacaoPrincipal', label: 'Federação principal (opcional)', tipo: 'text', obrigatorio: false, maxLength: 60,
        showIf: { field: 'competeAtualmente', in: ['sim', 'pretendo'] } },
    ],
  },

  // BLOCO 5 — Força e Condicionamento
  {
    id: 'bloco05_fc',
    numero: 5,
    titulo: 'Força e Condicionamento',
    obrigatorio: true,
    fields: [
      { id: 'idadeTreinamento', label: 'Idade de treinamento (tempo total de musculação/F&C)', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'iniciante', label: 'Iniciante (menos de 1 ano)' },
        { value: 'intermediario', label: 'Intermediário (1 a 3 anos)' },
        { value: 'avancado', label: 'Avançado (3 a 6 anos)' },
        { value: 'muito_avancado', label: 'Muito avançado (mais de 6 anos)' },
      ]},
      { id: 'jaTreinou', label: 'Já fez treinamento estruturado de força?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim_atualmente', label: 'Sim, treino atualmente' },
        { value: 'sim_passado', label: 'Sim, mas parei' },
        { value: 'nao', label: 'Nunca treinei estruturadamente' },
      ]},
      { id: 'nivelTecnico', label: 'Nível técnico nos exercícios básicos (agachamento, supino, terra, remada)', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nao_conheco', label: 'Não conheço a execução' },
        { value: 'basico', label: 'Conheço, mas tenho dificuldades' },
        { value: 'bom', label: 'Boa execução técnica' },
        { value: 'excelente', label: 'Excelente execução, com cargas elevadas' },
      ]},
      { id: 'supervisaoAtual', label: 'Possui supervisão profissional atualmente?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'sim_personal', label: 'Sim, personal trainer' },
        { value: 'sim_treinador_bjj', label: 'Sim, treinador de BJJ' },
        { value: 'autoinstruido', label: 'Treino sozinho' },
        { value: 'nao_treino', label: 'Não treino F&C atualmente' },
      ]},
      { id: 'historicoCargas', label: 'Histórico de cargas máximas conhecidas (opcional)', tipo: 'textarea', obrigatorio: false, placeholder: 'Ex: agachamento 120kg x 3, supino 90kg x 5, terra 150kg x 1...', maxLength: 500 },
    ],
  },

  // BLOCO 6 — Disponibilidade
  {
    id: 'bloco06_disponibilidade',
    numero: 6,
    titulo: 'Disponibilidade de tempo',
    obrigatorio: true,
    intro: 'Marque os dias e horários em que você consegue treinar com regularidade.',
    fields: [
      { id: 'diasDisponiveisFC', label: 'Dias disponíveis para força e condicionamento', tipo: 'checkbox', obrigatorio: true, opcoes: [
        { value: 'seg', label: 'Segunda' }, { value: 'ter', label: 'Terça' }, { value: 'qua', label: 'Quarta' },
        { value: 'qui', label: 'Quinta' }, { value: 'sex', label: 'Sexta' }, { value: 'sab', label: 'Sábado' },
        { value: 'dom', label: 'Domingo' },
      ]},
      { id: 'diasBJJ', label: 'Dias em que treina BJJ', tipo: 'checkbox', obrigatorio: true, opcoes: [
        { value: 'seg', label: 'Segunda' }, { value: 'ter', label: 'Terça' }, { value: 'qua', label: 'Quarta' },
        { value: 'qui', label: 'Quinta' }, { value: 'sex', label: 'Sexta' }, { value: 'sab', label: 'Sábado' },
        { value: 'dom', label: 'Domingo' },
      ]},
      { id: 'horarioPreferido', label: 'Horário preferido para F&C', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'manha', label: 'Manhã' },
        { value: 'tarde', label: 'Tarde' },
        { value: 'noite', label: 'Noite' },
        { value: 'flexivel', label: 'Horário flexível' },
      ]},
      { id: 'duracaoMaximaSessao', label: 'Duração máxima por sessão (minutos)', tipo: 'number', obrigatorio: true, min: 15, max: 180, step: 5 },
      { id: 'ordemTreinos', label: 'Ordem habitual quando treina F&C e BJJ no mesmo dia', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'fc_antes', label: 'F&C antes do BJJ' },
        { value: 'bjj_antes', label: 'BJJ antes do F&C' },
        { value: 'separados', label: 'Em períodos diferentes do dia' },
        { value: 'nao_mesmo_dia', label: 'Nunca no mesmo dia' },
      ]},
    ],
  },

  // BLOCO 7 — Equipamentos
  {
    id: 'bloco07_equipamentos',
    numero: 7,
    titulo: 'Local e equipamentos',
    obrigatorio: true,
    fields: [
      { id: 'localTreino', label: 'Onde você treina F&C?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'academia_completa', label: 'Academia completa (todos os equipamentos)' },
        { value: 'academia_basica', label: 'Academia básica (limitada)' },
        { value: 'casa_equipada', label: 'Em casa, com equipamentos próprios' },
        { value: 'casa_minimal', label: 'Em casa, equipamentos mínimos / peso corporal' },
        { value: 'misto', label: 'Misto (varia)' },
      ]},
      { id: 'equipamentos', label: 'Equipamentos disponíveis (marque todos que aplicam)', tipo: 'checkbox', obrigatorio: false, opcoes: [
        { value: 'barra_anilhas', label: 'Barra olímpica + anilhas' },
        { value: 'rack_squat', label: 'Rack ou suporte de agachamento' },
        { value: 'banco', label: 'Banco regulável' },
        { value: 'halteres', label: 'Halteres ajustáveis ou faixa ampla' },
        { value: 'kettlebells', label: 'Kettlebells' },
        { value: 'maquinas', label: 'Máquinas (polia, leg press, etc)' },
        { value: 'cardio', label: 'Equipamentos de cardio (esteira, bike)' },
        { value: 'elasticos', label: 'Elásticos / faixas' },
        { value: 'barra_fixa', label: 'Barra fixa / paralelas' },
        { value: 'pesos_livres_simples', label: 'Apenas pesos livres simples' },
        { value: 'peso_corporal', label: 'Apenas peso corporal' },
      ]},
    ],
  },

  // BLOCO 8 — Lesões
  {
    id: 'bloco08_lesoes',
    numero: 8,
    titulo: 'Histórico de lesões',
    obrigatorio: true,
    intro: 'Inclua tudo que possa influenciar a prescrição: lesões antigas, dores recorrentes, cirurgias.',
    fields: [
      { id: 'temLesoesPassadas', label: 'Possui histórico de lesões?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'nao', label: 'Não' },
        { value: 'antigas', label: 'Sim, lesões antigas já curadas' },
        { value: 'recorrentes', label: 'Sim, lesões que voltam ocasionalmente' },
        { value: 'ativa', label: 'Sim, lesão ativa atualmente' },
      ]},
      { id: 'detalhamentoLesoes', label: 'Detalhe as lesões (tipo, quando, tratamento)', tipo: 'textarea', obrigatorio: false, maxLength: 1000,
        showIf: { field: 'temLesoesPassadas', in: ['antigas', 'recorrentes', 'ativa'] } },
      { id: 'regioesAfetadas', label: 'Regiões afetadas', tipo: 'checkbox', obrigatorio: false, opcoes: [
        { value: 'ombro', label: 'Ombro' }, { value: 'cotovelo', label: 'Cotovelo' },
        { value: 'punho_mao', label: 'Punho / mão / dedos' }, { value: 'cervical', label: 'Pescoço / cervical' },
        { value: 'lombar', label: 'Lombar' }, { value: 'quadril', label: 'Quadril' },
        { value: 'joelho', label: 'Joelho' }, { value: 'tornozelo_pe', label: 'Tornozelo / pé' },
        { value: 'costela_torax', label: 'Costela / tórax' }, { value: 'outra', label: 'Outra' },
      ], showIf: { field: 'temLesoesPassadas', in: ['antigas', 'recorrentes', 'ativa'] } },
      { id: 'cirurgiasOrtopedicas', label: 'Já realizou cirurgia ortopédica?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'nao', label: 'Não' },
        { value: 'sim_recuperado', label: 'Sim, totalmente recuperado(a)' },
        { value: 'sim_em_recuperacao', label: 'Sim, em recuperação' },
      ]},
      { id: 'detalhamentoCirurgias', label: 'Detalhe as cirurgias (tipo, ano, evolução)', tipo: 'textarea', obrigatorio: false, maxLength: 600,
        showIf: { field: 'cirurgiasOrtopedicas', in: ['sim_recuperado', 'sim_em_recuperacao'] } },
      { id: 'dorAtualGeral', label: 'Nível de dor atual geral (0 a 10, sendo 10 a pior)', tipo: 'number', obrigatorio: true, min: 0, max: 10, step: 1 },
      { id: 'restricoesMedicas', label: 'Restrições médicas / movimentos que evita', tipo: 'textarea', obrigatorio: false, maxLength: 500 },
    ],
  },

  // BLOCO 9 — Suplementação e medicação
  {
    id: 'bloco09_suplementacao',
    numero: 9,
    titulo: 'Suplementação e medicação',
    obrigatorio: true,
    fields: [
      { id: 'usaSuplementos', label: 'Utiliza suplementos alimentares?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
      ]},
      { id: 'listaSuplementos', label: 'Liste os suplementos (nome e dose)', tipo: 'textarea', obrigatorio: false, maxLength: 600,
        placeholder: 'Ex: Whey 30g pós-treino, creatina 5g/dia, multivitamínico, ômega 3 1g/dia',
        showIf: { field: 'usaSuplementos', equals: 'sim' } },
      { id: 'usaMedicacaoContinua', label: 'Utiliza medicação contínua?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
      ]},
      { id: 'listaMedicacoes', label: 'Liste as medicações (nome, dose, motivo)', tipo: 'textarea', obrigatorio: false, maxLength: 600,
        showIf: { field: 'usaMedicacaoContinua', equals: 'sim' } },
      { id: 'usaCafeinaPreTreino', label: 'Consome cafeína / pré-treino antes dos treinos?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'sempre', label: 'Sempre' },
        { value: 'as_vezes', label: 'Às vezes' },
        { value: 'raro', label: 'Raramente / nunca' },
      ]},
    ],
  },

  // BLOCO 10 — Recursos ergogênicos hormonais
  {
    id: 'bloco10_ergogenicos',
    numero: 10,
    titulo: 'Recursos ergogênicos hormonais',
    subtitulo: 'Confidencial e não-judicativo',
    obrigatorio: true,
    intro: 'Esta seção é absolutamente confidencial e não-judicativa. As informações são usadas exclusivamente para calibrar volume, intensidade e progressão da sua periodização de forma segura. Nenhum dado é compartilhado fora desta plataforma. Apenas a primeira pergunta é obrigatória, os campos seguintes ajudam a personalizar melhor seu treino, mas todos são opcionais.',
    fields: [
      {
        id: 'usoErgogenicosHormonais',
        label: 'Você utiliza ou já utilizou recursos ergogênicos hormonais?',
        tipo: 'radio',
        obrigatorio: true,
        opcoes: [
          { value: 'nunca', label: 'Nunca utilizei' },
          { value: 'passado', label: 'Já utilizei no passado, hoje não' },
          { value: 'sim_atual', label: 'Faço uso atualmente' },
          { value: 'trt_acompanhado', label: 'TRT (terapia de reposição) acompanhada por médico' },
          { value: 'prefiro_nao_responder', label: 'Prefiro não responder' },
        ],
      },
      {
        id: 'tipoProtocolo',
        label: 'Tipo de protocolo (opcional)',
        tipo: 'radio',
        obrigatorio: false,
        ajuda: 'Se quiser detalhar, escolha a opção mais próxima da sua realidade.',
        opcoes: [
          { value: 'trt_prescrito', label: 'TRT prescrita por médico' },
          { value: 'blast_cruise', label: 'Blast and cruise' },
          { value: 'ciclos_pontuais', label: 'Ciclos pontuais' },
          { value: 'sarms', label: 'SARMs' },
          { value: 'gh_peptideos', label: 'GH / peptídeos' },
          { value: 'outros', label: 'Outros' },
        ],
        showIf: { field: 'usoErgogenicosHormonais', in: ['sim_atual', 'passado', 'trt_acompanhado'] },
      },
      {
        id: 'acompanhamentoMedico',
        label: 'Acompanhamento médico (opcional)',
        tipo: 'radio',
        obrigatorio: false,
        opcoes: [
          { value: 'regular', label: 'Sim, regular' },
          { value: 'esporadico', label: 'Sim, esporádico' },
          { value: 'nao', label: 'Não tenho acompanhamento' },
        ],
        showIf: { field: 'usoErgogenicosHormonais', in: ['sim_atual', 'trt_acompanhado'] },
      },
      {
        id: 'frequenciaExames',
        label: 'Frequência de exames laboratoriais (opcional)',
        tipo: 'radio',
        obrigatorio: false,
        opcoes: [
          { value: 'trimestral', label: 'Trimestral' },
          { value: 'semestral', label: 'Semestral' },
          { value: 'anual', label: 'Anual' },
          { value: 'nao_faco', label: 'Não faço regularmente' },
        ],
        showIf: { field: 'usoErgogenicosHormonais', in: ['sim_atual', 'trt_acompanhado'] },
      },
      {
        id: 'tempoTotalUsoVida',
        label: 'Tempo total de uso ao longo da vida (opcional)',
        tipo: 'radio',
        obrigatorio: false,
        opcoes: [
          { value: 'menor_1ano', label: 'Menos de 1 ano' },
          { value: '1_3anos', label: '1 a 3 anos' },
          { value: '3_5anos', label: '3 a 5 anos' },
          { value: 'maior_5anos', label: 'Mais de 5 anos' },
        ],
        showIf: { field: 'usoErgogenicosHormonais', in: ['sim_atual', 'passado', 'trt_acompanhado'] },
      },
      {
        id: 'tempoUltimoCiclo',
        label: 'Tempo desde o último ciclo (opcional)',
        tipo: 'radio',
        obrigatorio: false,
        ajuda: 'Apenas para quem usou no passado e parou.',
        opcoes: [
          { value: 'menor_3m', label: 'Menos de 3 meses' },
          { value: '3_12m', label: '3 a 12 meses' },
          { value: 'maior_12m', label: 'Mais de 12 meses' },
        ],
        showIf: { field: 'usoErgogenicosHormonais', equals: 'passado' },
      },
      {
        id: 'efeitosColateraisRelatados',
        label: 'Efeitos colaterais já relatados (opcional)',
        tipo: 'textarea',
        obrigatorio: false,
        placeholder: 'Ex: alterações de pressão, alterações de humor, ginecomastia, supressão de eixo, etc. Se nenhum, deixe em branco.',
        maxLength: 500,
        showIf: { field: 'usoErgogenicosHormonais', in: ['sim_atual', 'passado', 'trt_acompanhado'] },
      },
    ],
  },

  // BLOCO 11 — Nutrição e estilo de vida
  {
    id: 'bloco11_nutricao',
    numero: 11,
    titulo: 'Nutrição e estilo de vida',
    obrigatorio: true,
    fields: [
      { id: 'refeicoesDia', label: 'Quantas refeições faz por dia?', tipo: 'number', obrigatorio: true, min: 1, max: 10, step: 1 },
      { id: 'temAcompanhamentoNutricional', label: 'Possui acompanhamento nutricional?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim_regular', label: 'Sim, regularmente' },
        { value: 'sim_esporadico', label: 'Sim, esporadicamente' },
        { value: 'nao', label: 'Não' },
      ]},
      { id: 'restricoesAlimentares', label: 'Possui restrições alimentares?', tipo: 'checkbox', obrigatorio: false, opcoes: [
        { value: 'nenhuma', label: 'Nenhuma' },
        { value: 'lactose', label: 'Intolerância à lactose' },
        { value: 'gluten', label: 'Intolerância ao glúten / celíaco' },
        { value: 'vegetariano', label: 'Vegetariano(a)' },
        { value: 'vegano', label: 'Vegano(a)' },
        { value: 'alergias', label: 'Alergias alimentares' },
        { value: 'religiosa', label: 'Restrição religiosa' },
        { value: 'outra', label: 'Outra' },
      ]},
      { id: 'consumoAguaDiario', label: 'Consumo médio de água por dia (litros)', tipo: 'number', obrigatorio: true, min: 0.2, max: 10, step: 0.1 },
      { id: 'consumoAlcoolSemana', label: 'Consumo de bebida alcoólica por semana', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nao_consumo', label: 'Não consumo' },
        { value: 'social', label: 'Apenas socialmente (1-2 vezes/mês)' },
        { value: 'leve', label: 'Leve (1-3 doses/semana)' },
        { value: 'moderado', label: 'Moderado (4-7 doses/semana)' },
        { value: 'alto', label: 'Alto (8+ doses/semana)' },
      ]},
      { id: 'tabagismo', label: 'Tabagismo', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nunca', label: 'Nunca fumei' },
        { value: 'ex', label: 'Ex-fumante' },
        { value: 'social', label: 'Fumo social (eventualmente)' },
        { value: 'regular', label: 'Fumo regularmente' },
      ]},
      { id: 'qualidadeAutoavaliada', label: 'Avalie sua alimentação atual (0 a 10, sendo 10 a melhor)', tipo: 'number', obrigatorio: true, min: 0, max: 10, step: 1 },
    ],
  },

  // BLOCO 12 — ACSM 2018
  {
    id: 'bloco12_acsm',
    numero: 12,
    titulo: 'Triagem ACSM 2018',
    obrigatorio: true,
    fields: [
      { id: 'acsm_p1_atividade_regular', label: 'Você participa de atividade física regular há pelo menos 3 meses (≥3x/semana, intensidade moderada ou maior)?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'acsm_p2_doenca_conhecida', label: 'Possui alguma doença cardiovascular, metabólica (diabetes) ou renal diagnosticada?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'acsm_p3_sintomas', label: 'Apresenta sinais ou sintomas sugestivos (dor no peito em esforço, falta de ar inexplicada, tontura, palpitações, fadiga incomum)?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'acsm_p4_intensidade_alvo', label: 'Pretende treinar em qual intensidade?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'leve', label: 'Leve a moderada' },
        { value: 'moderada_vigorosa', label: 'Moderada a vigorosa' },
        { value: 'vigorosa', label: 'Vigorosa / alta intensidade' },
      ]},
    ],
  },

  // BLOCO 13 — RWLQ
  {
    id: 'bloco13_rwlq',
    numero: 13,
    titulo: 'Corte de peso (RWLQ)',
    subtitulo: 'Apenas para quem compete em categorias de peso',
    obrigatorio: false,
    intro: 'Se você não compete em categorias de peso, pode pular este bloco.',
    fields: [
      { id: 'rwlq_p1_compete_categoria', label: 'Compete em categoria de peso?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'rwlq_p2_kg_perdidos', label: 'Quanto peso costuma perder antes de uma competição?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'menor_2', label: 'Menos de 2 kg' },
        { value: '2_4', label: '2 a 4 kg' },
        { value: '4_6', label: '4 a 6 kg' },
        { value: 'maior_6', label: 'Mais de 6 kg' },
      ], showIf: { field: 'rwlq_p1_compete_categoria', equals: 'sim' } },
      { id: 'rwlq_p3_tempo_perda', label: 'Em quanto tempo costuma fazer essa perda?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'menor_3d', label: 'Menos de 3 dias' },
        { value: '3_7d', label: '3 a 7 dias' },
        { value: '1_2sem', label: '1 a 2 semanas' },
        { value: 'maior_2sem', label: 'Mais de 2 semanas' },
      ], showIf: { field: 'rwlq_p1_compete_categoria', equals: 'sim' } },
      { id: 'rwlq_p4_competicoes_ano', label: 'Quantas competições por ano?', tipo: 'number', obrigatorio: false, min: 0, max: 30, step: 1,
        showIf: { field: 'rwlq_p1_compete_categoria', equals: 'sim' } },
      { id: 'rwlq_p5_dificuldade_recuperacao', label: 'Dificuldade percebida para recuperar performance após corte', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nenhuma', label: 'Nenhuma' },
        { value: 'leve', label: 'Leve' },
        { value: 'moderada', label: 'Moderada' },
        { value: 'severa', label: 'Severa' },
      ], showIf: { field: 'rwlq_p1_compete_categoria', equals: 'sim' } },
      { id: 'rwlq_p6_metodos', label: 'Métodos utilizados para corte (marque todos)', tipo: 'checkbox', obrigatorio: false, opcoes: [
        { value: 'restricao_alimentar_leve', label: 'Restrição alimentar leve' },
        { value: 'restricao_alimentar_severa', label: 'Restrição alimentar severa (jejum prolongado)' },
        { value: 'desidratacao_leve', label: 'Restrição hídrica leve' },
        { value: 'desidratacao_intensa', label: 'Desidratação intensa (cuspir, deixar de beber)' },
        { value: 'sauna_termica', label: 'Sauna / banho quente / roupa térmica' },
        { value: 'cardio_extra', label: 'Cardio em jejum / extra' },
        { value: 'diureticos', label: 'Diuréticos / laxantes' },
      ], showIf: { field: 'rwlq_p1_compete_categoria', equals: 'sim' } },
      { id: 'rwlq_p7_quem_orientou', label: 'Quem orienta o processo de corte?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nutricionista', label: 'Nutricionista esportivo' },
        { value: 'medico', label: 'Médico' },
        { value: 'treinador', label: 'Treinador / técnico' },
        { value: 'sozinho', label: 'Faço por conta própria' },
      ], showIf: { field: 'rwlq_p1_compete_categoria', equals: 'sim' } },
      { id: 'rwlq_p8_passou_mal', label: 'Já passou mal (tontura, desmaio, hipoglicemia) durante ou após corte?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ], showIf: { field: 'rwlq_p1_compete_categoria', equals: 'sim' } },
    ],
  },

  // BLOCO 14 — LEAF-Q
  {
    id: 'bloco14_leafq',
    numero: 14,
    titulo: 'LEAF-Q (saúde feminina e RED-S)',
    subtitulo: 'Apenas para atletas do sexo feminino',
    obrigatorio: false,
    intro: 'Bloco específico para identificar risco de Síndrome de Deficiência Energética Relativa (RED-S). Pode ser pulado por atletas masculinos.',
    fields: [
      { id: 'leafq_p1_lesoes_12m', label: 'Teve mais de uma lesão musculoesquelética nos últimos 12 meses?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'leafq_p2_dias_perdidos', label: 'Quantos dias de treino perdeu por lesão nos últimos 12 meses?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nenhum', label: 'Nenhum' },
        { value: '1_7', label: '1 a 7 dias' },
        { value: '8_21', label: '8 a 21 dias' },
        { value: 'maior_21', label: 'Mais de 21 dias' },
      ]},
      { id: 'leafq_p3_dor_abdominal', label: 'Sente dor abdominal frequente sem causa aparente?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nunca', label: 'Nunca' },
        { value: 'as_vezes', label: 'Às vezes' },
        { value: 'frequente', label: 'Frequentemente' },
      ]},
      { id: 'leafq_p4_inchada', label: 'Sente-se inchada com frequência?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nunca', label: 'Nunca' },
        { value: 'as_vezes', label: 'Às vezes' },
        { value: 'frequente', label: 'Frequentemente' },
      ]},
      { id: 'leafq_p5_constipacao', label: 'Sofre de constipação?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nunca', label: 'Nunca' },
        { value: 'as_vezes', label: 'Às vezes' },
        { value: 'frequente', label: 'Frequentemente' },
      ]},
      { id: 'leafq_p6_diarreia', label: 'Sofre de diarreia?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'nunca', label: 'Nunca' },
        { value: 'as_vezes', label: 'Às vezes' },
        { value: 'frequente', label: 'Frequentemente' },
      ]},
      { id: 'leafq_p7_menstruacao_regular', label: 'Sua menstruação é regular (a cada 25-35 dias)?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' },
        { value: 'uso_contraceptivo', label: 'Uso contraceptivo hormonal' },
      ]},
      { id: 'leafq_p8_amenorreia', label: 'Já teve ausência de menstruação por 3 meses ou mais (sem gravidez)?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'leafq_p9_idade_menarca', label: 'Idade da primeira menstruação (menarca)', tipo: 'number', obrigatorio: false, min: 8, max: 20, step: 1 },
    ],
  },

  // BLOCO 15 — PSQI
  {
    id: 'bloco15_psqi',
    numero: 15,
    titulo: 'Qualidade do sono (PSQI simplificado)',
    obrigatorio: true,
    fields: [
      { id: 'psqi_p1_horario_deitar', label: 'Em média, a que horas você se deita para dormir?', tipo: 'time', obrigatorio: false },
      { id: 'psqi_p2_min_pegar_sono', label: 'Em média, quanto tempo (minutos) leva para pegar no sono?', tipo: 'number', obrigatorio: false, min: 0, max: 240, step: 5 },
      { id: 'psqi_p3_horario_levantar', label: 'A que horas costuma se levantar?', tipo: 'time', obrigatorio: false },
      { id: 'psqi_p4_horas_efetivas', label: 'Quantas horas efetivas dorme por noite?', tipo: 'number', obrigatorio: true, min: 1, max: 14, step: 0.5 },
      { id: 'psqi_p6_qualidade_geral', label: 'Como avalia a qualidade geral do seu sono?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'muito_boa', label: 'Muito boa' },
        { value: 'boa', label: 'Boa' },
        { value: 'ruim', label: 'Ruim' },
        { value: 'muito_ruim', label: 'Muito ruim' },
      ]},
      { id: 'psqi_p7_medicacao_dormir', label: 'Frequência com que usa medicação para dormir', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'nunca', label: 'Nunca' },
        { value: 'menos_uma', label: 'Menos de 1x/semana' },
        { value: 'uma_dois', label: '1-2x/semana' },
        { value: 'tres_mais', label: '3 ou mais vezes/semana' },
      ]},
      { id: 'psqi_p8_dificuldade_acordado', label: 'Frequência com que tem dificuldade de ficar acordado durante o dia', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'nunca', label: 'Nunca' },
        { value: 'menos_uma', label: 'Menos de 1x/semana' },
        { value: 'uma_dois', label: '1-2x/semana' },
        { value: 'tres_mais', label: '3 ou mais vezes/semana' },
      ]},
      { id: 'psqi_p9_entusiasmo', label: 'Em que grau o cansaço afeta seu entusiasmo em realizar tarefas?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'nenhuma', label: 'Nenhuma dificuldade' },
        { value: 'pequena', label: 'Pequena' },
        { value: 'grande', label: 'Grande' },
        { value: 'muito_grande', label: 'Muito grande' },
      ]},
    ],
  },

  // BLOCO 16 — Objetivos
  {
    id: 'bloco16_objetivos',
    numero: 16,
    titulo: 'Objetivos e expectativas',
    obrigatorio: true,
    fields: [
      { id: 'objetivoPrincipal', label: 'Qual é o seu objetivo principal com a periodização?', tipo: 'radio', obrigatorio: true, opcoes: [
        { value: 'performance_competicao', label: 'Performance para competição' },
        { value: 'performance_treino', label: 'Performance para treinos / rolas' },
        { value: 'reducao_lesoes', label: 'Redução de lesões / longevidade' },
        { value: 'composicao_corporal', label: 'Composição corporal (perder gordura / ganhar massa)' },
        { value: 'condicionamento_geral', label: 'Condicionamento geral / saúde' },
      ]},
      { id: 'proximaCompeticaoData', label: 'Data da próxima competição (se houver)', tipo: 'date', obrigatorio: false },
      { id: 'proximaCompeticaoNome', label: 'Nome / descrição da próxima competição', tipo: 'text', obrigatorio: false, maxLength: 100 },
      { id: 'categoriaPesoAlvo', label: 'Categoria de peso alvo (kg)', tipo: 'number', obrigatorio: false, min: 40, max: 130, step: 0.5 },
      { id: 'nivelComprometimento', label: 'Nível de comprometimento com o programa (0 a 10)', tipo: 'number', obrigatorio: true, min: 0, max: 10, step: 1 },
      { id: 'historicoConsultoriaAnterior', label: 'Já fez consultoria de F&C para BJJ antes?', tipo: 'radio', obrigatorio: false, opcoes: [
        { value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' },
      ]},
      { id: 'observacoesAdicionais', label: 'Algo mais que considere importante informar', tipo: 'textarea', obrigatorio: false, maxLength: 1000 },
    ],
  },

  // BLOCO 17 — Consentimento
  {
    id: 'bloco17_consentimento',
    numero: 17,
    titulo: 'Consentimento e autorização',
    obrigatorio: true,
    intro: 'Para concluir a anamnese, é necessário aceitar os termos abaixo. Estes consentimentos são exigidos pela LGPD e pelas boas práticas do CREF.',
    fields: [
      { id: 'aceiteLGPD', label: 'Autorizo o tratamento dos meus dados de saúde para fins exclusivos de avaliação física e prescrição de treinamento, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018). Os dados não serão compartilhados com terceiros sem minha autorização.', tipo: 'checkbox-aceite', obrigatorio: true },
      { id: 'aceiteResponsabilidade', label: 'Declaro que as informações prestadas são verdadeiras, que estou ciente dos riscos inerentes à prática de exercícios físicos e Jiu-Jitsu, e que assumo a responsabilidade de informar imediatamente qualquer alteração no meu estado de saúde durante o programa.', tipo: 'checkbox-aceite', obrigatorio: true },
      { id: 'aceiteContato', label: 'Autorizo o Prof. Fontes Júnior a entrar em contato comigo (WhatsApp, e-mail) para acompanhamento da minha avaliação e do programa.', tipo: 'checkbox-aceite', obrigatorio: false },
    ],
  },

];

export default BLOCKS;
