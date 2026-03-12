import { defineStore } from 'pinia'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FundoSelecionado {
  nome: string
  cnpj: string
  tipo: string
  taxaAdm: string
  taxaAdmMax?: string
  taxaPerformance?: string | null
  rentabilidade?: string
  classificacao?: string
  estrategia?: string
  qualificado?: boolean
  rent12m?: string
  rent24m?: string
  rent36m?: string
  percentual: string
  valorAtribuido: string
  percentualAporte: string
  valorAporte: string
  processoSusep: string
}

export interface Cobertura {
  nome: string
  valorMin: string
  valorMax: string
  vigencia: string
  prazoPagamento: string
  capitalSegurado: string
  contribuicaoMensal: string
}

export interface SubPlano {
  id: string
  contribuicaoMensal: string
  aporteInicial: string
  fundos: FundoSelecionado[]
  tipoPlano: string
  riskValue: number
}

export interface Plano {
  id: string
  tipo: 'previdencia' | 'seguro'
  idadeAposentadoria: string
  subPlanos: SubPlano[]
  capitalSegurado: string
  premioMensal: string
  produtoRecomendado: string
  vigencia: string
  tempoContribuicao: string
  coberturas: Cobertura[]
}

export interface Proponente {
  nomeCompleto: string
  nomeSocial: string
  cpf: string
  dataNascimento: string
  telefone: string
  email: string
  rendaMensal: string
  ocupacao: string
  especificacaoOcupacao: string
  empresa: string
  genero: string
}

export interface DetalhamentoData {
  proponente: Proponente
  planos: Plano[]
}

export interface Vulnerabilidade {
  iconKey: string
  titulo: string
  descricao: string
  solucao: string
}

export interface TimelineItem {
  periodo: string
  titulo: string
  descricao: string
  riscoLabel: string
  riscos: string[]
}

export interface ProtegeItem {
  titulo: string
  subtitulo: string
  valor: string
}

export interface ResumoData {
  perfil: { tipo: string; descricao: string }
  cenario: { titulo: string; itens: string[] }
  vulnerabilidades: Vulnerabilidade[]
  timeline: TimelineItem[]
  protege: ProtegeItem[]
  garante: { comProtecao: string[] }
  solucoes: {
    protecao: { valor: string; percentual: string; itens: string[] }
    previdencia: { valor: string; percentual: string; itens: string[]; citacao: string }
  }
  visaoLongoPrazo?: string
  produtoSelecionado?: 'ambos' | 'seguro' | 'previdencia'
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const initialResumoData: ResumoData = {
  perfil: {
    tipo: 'EXECUTORA - ANALÍTICA - CONSERVADORA',
    descricao: 'Orientada a resultados, toma decisões financeiras com cautela e conservadorismo, priorizando a segurança familiar e a previsibilidade do futuro.',
  },
  cenario: {
    titulo: 'Impacto da perda de uma renda:',
    itens: [
      'Perda imediata de 42% a 58% da renda familiar',
      'Patrimônio consumido em ~27 meses',
      'Futuro dos filhos comprometido',
    ],
  },
  vulnerabilidades: [
    { iconKey: 'Users', titulo: 'Ausência Prematura', descricao: 'Impacto severo no padrão de vida dos filhos e dependentes devido à perda da renda principal.', solucao: 'Seguro de Vida Vitalício' },
    { iconKey: 'Briefcase', titulo: 'Invalidez Laborativa', descricao: 'Interrupção da capacidade de gerar receita por doença ou acidente, comprometendo o fluxo de caixa.', solucao: 'Seguro de Invalidez + DIT' },
    { iconKey: 'Heart', titulo: 'Doenças Graves', descricao: 'Custos elevados de tratamento que podem consumir rapidamente a reserva de liquidez e investimentos.', solucao: 'Cobertura para Doenças Graves' },
    { iconKey: 'Shield', titulo: 'Sucessão Patrimonial', descricao: 'Custos de inventário e impostos (ITCMD) podem bloquear até 20% do patrimônio familiar.', solucao: 'Seguro para Custeio de Inventário' },
    { iconKey: 'TrendingUp', titulo: 'Longevidade Financeira', descricao: 'Risco de sobreviver à capacidade da reserva financeira acumulada (viver mais que o dinheiro).', solucao: 'Aporte em Previdência Privada' },
  ],
  timeline: [
    { periodo: 'HOJE (40 ANOS)', titulo: 'Momento Atual', descricao: 'Estabilidade na carreira, renda sólida, patrimônio em formação (R$ 800k).', riscoLabel: 'RISCO ATUAL', riscos: ['ZERO Proteção', 'Perda de renda = Déficit', 'Patrimônio acaba em 27 meses', 'Família exposta'] },
    { periodo: 'PRÓXIMOS 3-5 ANOS', titulo: 'Crescimento Profissional', descricao: 'Ambição de ascender ao cargo de Diretoria. Potencial aumento de renda.', riscoLabel: 'RISCO PROFISSIONAL', riscos: ['Renda concentrada em CLT', 'Pretensão não alcançada', 'Estresse/Burnout'] },
    { periodo: 'PRÓXIMOS 5-10 ANOS', titulo: 'Educação dos Filhos', descricao: 'Custos elevados com escola e faculdade (R$ 300-500k). Possível intercâmbio.', riscoLabel: 'RISCO EDUCACIONAL', riscos: ['Inflação Educacional', 'Interrupção dos estudos', 'Perda do padrão escolar'] },
    { periodo: 'PRÓXIMOS 10-20 ANOS', titulo: 'Transição de Carreira', descricao: 'Decisão de empreender em negócio próprio.', riscoLabel: 'RISCO FINANCEIRO', riscos: ['Baixa reserva financeira devido a altos custos ao longo dos anos', 'Falta de backup familiar', 'Fracasso do negócio'] },
    { periodo: 'EM 20 ANOS (60 ANOS)', titulo: 'Aposentadoria Planejada aos 60 anos', descricao: 'Objetivo: Renda mensal de R$ 29k. Necessidade de patrimônio de R$ 4,2M.', riscoLabel: 'RISCO LONGEVIDADE', riscos: ['Custos médicos altos', 'Depender dos filhos', 'Patrimônio insuficiente'] },
  ],
  protege: [
    { titulo: 'Educação dos Filhos', subtitulo: 'Faculdade + Intercâmbio', valor: 'R$ 1,1 Milhão' },
    { titulo: 'Empreendedorismo', subtitulo: 'Capital Inicial + Reserva', valor: 'R$ 700 Mil' },
    { titulo: 'Aposentadoria', subtitulo: 'Patrimônio Necessário', valor: 'R$ 4 Milhões' },
    { titulo: 'Patrimônio Atual', subtitulo: 'Investimentos', valor: 'R$ 800 Mil' },
  ],
  garante: {
    comProtecao: ['Patrimônio Intacto', 'Faculdade Garantida', 'Renda Vitalícia Mantida'],
  },
  solucoes: {
    protecao: { valor: 'R$ 2.500,00', percentual: '18', itens: ['Tranquilidade para o futuro', 'Proteção do patrimônio', 'Segurança para enfrentar imprevistos'] },
    previdencia: { valor: 'R$ 1.650,00', percentual: '12', itens: ['Aposentadoria com renda previsível', 'Confiança no planejamento sucessório'], citacao: 'A estabilidade financeira não é apenas sobre quanto você ganha ou tem, mas sobre quanto você está protegido contra imprevistos.' },
  },
  produtoSelecionado: 'ambos',
}

const initialDetalhamentoData: DetalhamentoData = {
  proponente: {
    nomeCompleto: 'Taís Oliveira Costa',
    nomeSocial: '',
    cpf: '123.456.789-00',
    dataNascimento: '1984-05-15',
    telefone: '(21) 99999-0000',
    email: 'tais.oliveira@email.com',
    rendaMensal: 'R$ 18.000,00',
    ocupacao: 'Gerente',
    especificacaoOcupacao: '',
    empresa: 'Medley Farmacêutica Ltda.',
    genero: 'Feminino',
  },
  planos: [
    {
      id: 'prev-1',
      tipo: 'previdencia',
      idadeAposentadoria: '60 anos',
      subPlanos: [
        {
          id: 'sub-1',
          contribuicaoMensal: 'R$ 1.650,00',
          aporteInicial: 'R$ 10.000,00',
          tipoPlano: 'PGBL',
          riskValue: 30,
          fundos: [],
        },
      ],
      capitalSegurado: '',
      premioMensal: '',
      produtoRecomendado: '',
      vigencia: '',
      tempoContribuicao: '',
      coberturas: [],
    },
    {
      id: 'seg-1',
      tipo: 'seguro',
      idadeAposentadoria: '',
      subPlanos: [],
      capitalSegurado: 'R$ 2.000.000,00',
      premioMensal: 'R$ 2.500,00',
      produtoRecomendado: 'Horizonte',
      vigencia: 'Vitalícia',
      tempoContribuicao: '20 anos',
      coberturas: [
        { nome: 'Morte Natural ou Acidental + Adiantamento por Doença Terminal (obrigatório)', valorMin: 'R$ 50.000,00', valorMax: 'R$ 20.000.000,00', vigencia: 'Vitalícia', prazoPagamento: '', capitalSegurado: 'R$ 2.961.000,00', contribuicaoMensal: 'R$ 1.184,40' },
        { nome: 'Indenização Especial de Morte por Acidente (IEA)', valorMin: 'R$ 50.000,00', valorMax: 'R$ 10.000.000,00', vigencia: 'Vitalícia', prazoPagamento: '', capitalSegurado: 'R$ 1.484.000,00', contribuicaoMensal: 'R$ 593,60' },
        { nome: 'Invalidez Permanente por Acidente - Total ou Parcial (IPA)', valorMin: 'R$ 50.000,00', valorMax: 'R$ 10.000.000,00', vigencia: 'Vitalícia', prazoPagamento: '', capitalSegurado: 'R$ 1.484.000,00', contribuicaoMensal: 'R$ 593,60' },
        { nome: 'Indenização Especial de Invalidez por Doença (IED)', valorMin: 'R$ 50.000,00', valorMax: 'R$ 1.000.000,00', vigencia: 'Vitalícia', prazoPagamento: '', capitalSegurado: 'R$ 155.000,00', contribuicaoMensal: 'R$ 62,00' },
        { nome: 'Doenças Graves (DG)', valorMin: 'R$ 50.000,00', valorMax: 'R$ 1.000.000,00', vigencia: 'Vitalícia', prazoPagamento: '', capitalSegurado: 'R$ 155.000,00', contribuicaoMensal: 'R$ 62,00' },
        { nome: 'Diária por Incapacidade Temporária (DIT)', valorMin: 'R$ 1,00', valorMax: 'R$ 30.000,00', vigencia: 'Vitalícia', prazoPagamento: '', capitalSegurado: 'R$ 4.000,00', contribuicaoMensal: 'R$ 1,60' },
        { nome: 'Diária por Internação Hospitalar (DIH)', valorMin: 'R$ 100,00', valorMax: 'R$ 1.000,00', vigencia: 'Vitalícia', prazoPagamento: '', capitalSegurado: 'R$ 2.000,00', contribuicaoMensal: 'R$ 0,80' },
        { nome: 'Serviço de Assistência Funeral (SAF)', valorMin: 'R$ 21.000,00', valorMax: 'R$ 12.000,00', vigencia: 'Vitalícia', prazoPagamento: '', capitalSegurado: 'R$ 5.000,00', contribuicaoMensal: 'R$ 2,00' },
      ],
    },
  ],
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useJornadaStore = defineStore('jornada', {
  state: () => ({
    resumoData: { ...initialResumoData } as ResumoData,
    detalhamentoData: JSON.parse(JSON.stringify(initialDetalhamentoData)) as DetalhamentoData,
  }),
  actions: {
    saveResumoData(data: ResumoData) {
      this.resumoData = data
    },
    saveDetalhamentoData(data: DetalhamentoData) {
      this.detalhamentoData = data
    },
    setProdutoSelecionado(produto: 'ambos' | 'seguro' | 'previdencia') {
      this.resumoData.produtoSelecionado = produto
      // Sincronizar planos do Detalhamento
      const planosAtuais = this.detalhamentoData.planos
      const planoPrev = planosAtuais.find(p => p.tipo === 'previdencia')
      const planoSeg = planosAtuais.find(p => p.tipo === 'seguro')
      const defaultPrev = JSON.parse(JSON.stringify(initialDetalhamentoData.planos.find(p => p.tipo === 'previdencia')!))
      const defaultSeg = JSON.parse(JSON.stringify(initialDetalhamentoData.planos.find(p => p.tipo === 'seguro')!))
      if (produto === 'ambos') {
        this.detalhamentoData.planos = [planoPrev || defaultPrev, planoSeg || defaultSeg]
      } else if (produto === 'seguro') {
        this.detalhamentoData.planos = [planoSeg || defaultSeg]
      } else {
        this.detalhamentoData.planos = [planoPrev || defaultPrev]
      }
    },
  },
})
