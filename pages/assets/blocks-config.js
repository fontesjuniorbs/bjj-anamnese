/**
 * BJJ Performance Pro — Configuração dos blocos da anamnese
 *
 * Este arquivo define a estrutura de TODOS os blocos do formulário
 * de anamnese online. É consumido por form-logic.js no frontend.
 *
 * Estrutura de cada bloco:
 *   {
 *     id, numero, titulo, subtitulo?, obrigatorio, intro?,
 *     fields: [
 *       { id, label, tipo, obrigatorio, opcoes?, showIf?, ... }
 *     ]
 *   }
 *
 * Operadores de showIf suportados:
 *   { field, equals: 'valor' }      // igualdade
 *   { field, in: ['v1','v2','v3'] } // verificação por lista
 *
 * Versão: 1.1.0 (P3: Bloco 9 com follow-ups opcionais — Linha C modificada)
 */

export const BLOCKS = [
    // ───────────────────────────────────────────────
    // Blocos 1 a 8: a serem adicionados em commits posteriores
    // ───────────────────────────────────────────────

  {
        id: 'bloco09_ergogenicos',
        numero: 9,
        titulo: 'Recursos ergogênicos hormonais',
        subtitulo: 'Confidencial e não-judicativo',
        obrigatorio: true,
        intro: 'Esta seção é absolutamente confidencial e não-judicativa. As informações são usadas exclusivamente para calibrar volume, intensidade e progressão da sua periodização de forma segura. Nenhum dado é compartilhado fora desta plataforma. Apenas a primeira pergunta é obrigatória — os campos seguintes ajudam a personalizar melhor seu treino, mas todos são opcionais.',
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

    // ───────────────────────────────────────────────
    // Blocos 10 a 17: a serem adicionados em commits posteriores
    // ───────────────────────────────────────────────
  ];

export default BLOCKS;
