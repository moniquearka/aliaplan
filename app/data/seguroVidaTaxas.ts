// Tabela de taxas por faixa etária e gênero para cálculo automático de Contribuição do Seguro de Vida Horizonte (Icatu)
// Unidade: taxa por R$ 1.000 de Capital Segurado por mês (‰/mês)
// Fonte: tabela de referência Horizonte Icatu — valores aproximados para fins de cotação

// ── Tipos ──────────────────────────────────────────────────────────────────────
export type Genero = 'Masculino' | 'Feminino' | 'Não-binário' | 'Prefiro não informar'

export interface TaxaFaixa {
  idadeMin: number
  idadeMax: number
  taxaMasc: number  // por R$ 1.000 de CS por mês
  taxaFem: number   // por R$ 1.000 de CS por mês
}

// ── Morte Natural ou Acidental + ADET (MQC_Adc) — Vitalício ──────────────────
export const TAXAS_MORTE_VITALICIO: TaxaFaixa[] = [
  { idadeMin: 18, idadeMax: 20, taxaMasc: 0.08,  taxaFem: 0.05 },
  { idadeMin: 21, idadeMax: 25, taxaMasc: 0.09,  taxaFem: 0.06 },
  { idadeMin: 26, idadeMax: 30, taxaMasc: 0.11,  taxaFem: 0.07 },
  { idadeMin: 31, idadeMax: 35, taxaMasc: 0.14,  taxaFem: 0.09 },
  { idadeMin: 36, idadeMax: 40, taxaMasc: 0.19,  taxaFem: 0.12 },
  { idadeMin: 41, idadeMax: 45, taxaMasc: 0.28,  taxaFem: 0.17 },
  { idadeMin: 46, idadeMax: 50, taxaMasc: 0.42,  taxaFem: 0.25 },
  { idadeMin: 51, idadeMax: 55, taxaMasc: 0.65,  taxaFem: 0.38 },
  { idadeMin: 56, idadeMax: 60, taxaMasc: 1.00,  taxaFem: 0.58 },
  { idadeMin: 61, idadeMax: 65, taxaMasc: 1.55,  taxaFem: 0.90 },
  { idadeMin: 66, idadeMax: 70, taxaMasc: 2.40,  taxaFem: 1.40 },
  { idadeMin: 71, idadeMax: 75, taxaMasc: 3.80,  taxaFem: 2.20 },
]

// ── Morte Básica Temporária (MQC_Basica) ─────────────────────────────────────
// Taxas menores que vitalício (sem ADET), fator ~0.85
export const TAXAS_MORTE_TEMPORARIA: TaxaFaixa[] = TAXAS_MORTE_VITALICIO.map(f => ({
  ...f,
  taxaMasc: +(f.taxaMasc * 0.85).toFixed(4),
  taxaFem:  +(f.taxaFem  * 0.85).toFixed(4),
}))

// ── IEA — Indenização Especial de Morte por Acidente ─────────────────────────
// Acidente puro: taxa bem menor que morte natural
export const TAXAS_IEA: TaxaFaixa[] = [
  { idadeMin: 18, idadeMax: 30, taxaMasc: 0.025, taxaFem: 0.018 },
  { idadeMin: 31, idadeMax: 40, taxaMasc: 0.030, taxaFem: 0.022 },
  { idadeMin: 41, idadeMax: 50, taxaMasc: 0.040, taxaFem: 0.028 },
  { idadeMin: 51, idadeMax: 60, taxaMasc: 0.055, taxaFem: 0.038 },
  { idadeMin: 61, idadeMax: 70, taxaMasc: 0.075, taxaFem: 0.052 },
  { idadeMin: 71, idadeMax: 75, taxaMasc: 0.100, taxaFem: 0.070 },
]

// ── IPA — Invalidez Permanente por Acidente ───────────────────────────────────
export const TAXAS_IPA: TaxaFaixa[] = [
  { idadeMin: 18, idadeMax: 30, taxaMasc: 0.030, taxaFem: 0.022 },
  { idadeMin: 31, idadeMax: 40, taxaMasc: 0.038, taxaFem: 0.028 },
  { idadeMin: 41, idadeMax: 50, taxaMasc: 0.052, taxaFem: 0.038 },
  { idadeMin: 51, idadeMax: 60, taxaMasc: 0.072, taxaFem: 0.052 },
  { idadeMin: 61, idadeMax: 70, taxaMasc: 0.098, taxaFem: 0.070 },
  { idadeMin: 71, idadeMax: 75, taxaMasc: 0.130, taxaFem: 0.092 },
]
// Majorada: fator +40%
export const FATOR_IPA_MAJORADA = 1.40

// ── IED — Indenização Especial de Invalidez por Doença ───────────────────────
export const TAXAS_IED: TaxaFaixa[] = [
  { idadeMin: 18, idadeMax: 25, taxaMasc: 0.045, taxaFem: 0.055 },
  { idadeMin: 26, idadeMax: 30, taxaMasc: 0.055, taxaFem: 0.065 },
  { idadeMin: 31, idadeMax: 35, taxaMasc: 0.070, taxaFem: 0.082 },
  { idadeMin: 36, idadeMax: 40, taxaMasc: 0.095, taxaFem: 0.108 },
  { idadeMin: 41, idadeMax: 45, taxaMasc: 0.135, taxaFem: 0.148 },
  { idadeMin: 46, idadeMax: 50, taxaMasc: 0.190, taxaFem: 0.205 },
  { idadeMin: 51, idadeMax: 55, taxaMasc: 0.275, taxaFem: 0.290 },
  { idadeMin: 56, idadeMax: 60, taxaMasc: 0.400, taxaFem: 0.415 },
  { idadeMin: 61, idadeMax: 65, taxaMasc: 0.580, taxaFem: 0.595 },
  { idadeMin: 66, idadeMax: 70, taxaMasc: 0.850, taxaFem: 0.865 },
  { idadeMin: 71, idadeMax: 75, taxaMasc: 1.250, taxaFem: 1.265 },
]

// ── DG — Diagnóstico de Doenças Graves ───────────────────────────────────────
// Disponível até 65 anos
export const TAXAS_DG: TaxaFaixa[] = [
  { idadeMin: 18, idadeMax: 25, taxaMasc: 0.060, taxaFem: 0.075 },
  { idadeMin: 26, idadeMax: 30, taxaMasc: 0.075, taxaFem: 0.090 },
  { idadeMin: 31, idadeMax: 35, taxaMasc: 0.100, taxaFem: 0.115 },
  { idadeMin: 36, idadeMax: 40, taxaMasc: 0.140, taxaFem: 0.155 },
  { idadeMin: 41, idadeMax: 45, taxaMasc: 0.200, taxaFem: 0.215 },
  { idadeMin: 46, idadeMax: 50, taxaMasc: 0.290, taxaFem: 0.305 },
  { idadeMin: 51, idadeMax: 55, taxaMasc: 0.420, taxaFem: 0.435 },
  { idadeMin: 56, idadeMax: 60, taxaMasc: 0.610, taxaFem: 0.625 },
  { idadeMin: 61, idadeMax: 65, taxaMasc: 0.880, taxaFem: 0.895 },
]

// ── DIH — Diária de Internação Hospitalar ─────────────────────────────────────
// Taxa por R$ 1,00 de diária por mês (vigência 5 anos)
// Disponível até 65 anos
export const TAXAS_DIH: TaxaFaixa[] = [
  { idadeMin: 18, idadeMax: 25, taxaMasc: 0.0180, taxaFem: 0.0220 },
  { idadeMin: 26, idadeMax: 30, taxaMasc: 0.0200, taxaFem: 0.0240 },
  { idadeMin: 31, idadeMax: 35, taxaMasc: 0.0240, taxaFem: 0.0280 },
  { idadeMin: 36, idadeMax: 40, taxaMasc: 0.0290, taxaFem: 0.0330 },
  { idadeMin: 41, idadeMax: 45, taxaMasc: 0.0360, taxaFem: 0.0400 },
  { idadeMin: 46, idadeMax: 50, taxaMasc: 0.0460, taxaFem: 0.0500 },
  { idadeMin: 51, idadeMax: 55, taxaMasc: 0.0600, taxaFem: 0.0640 },
  { idadeMin: 56, idadeMax: 60, taxaMasc: 0.0800, taxaFem: 0.0840 },
  { idadeMin: 61, idadeMax: 65, taxaMasc: 0.1100, taxaFem: 0.1140 },
]
// Adicional UTI: fator +50%
export const FATOR_DIH_UTI = 1.50

// ── DIT — Diária de Incapacidade Temporária ───────────────────────────────────
// Taxa por R$ 1,00 de diária por mês (vigência 5 anos)
// Disponível até 65 anos
export const TAXAS_DIT_7DIAS: TaxaFaixa[] = [
  { idadeMin: 18, idadeMax: 25, taxaMasc: 0.0250, taxaFem: 0.0300 },
  { idadeMin: 26, idadeMax: 30, taxaMasc: 0.0280, taxaFem: 0.0330 },
  { idadeMin: 31, idadeMax: 35, taxaMasc: 0.0330, taxaFem: 0.0380 },
  { idadeMin: 36, idadeMax: 40, taxaMasc: 0.0400, taxaFem: 0.0450 },
  { idadeMin: 41, idadeMax: 45, taxaMasc: 0.0500, taxaFem: 0.0550 },
  { idadeMin: 46, idadeMax: 50, taxaMasc: 0.0640, taxaFem: 0.0690 },
  { idadeMin: 51, idadeMax: 55, taxaMasc: 0.0830, taxaFem: 0.0880 },
  { idadeMin: 56, idadeMax: 60, taxaMasc: 0.1100, taxaFem: 0.1150 },
  { idadeMin: 61, idadeMax: 65, taxaMasc: 0.1500, taxaFem: 0.1550 },
]
export const TAXAS_DIT_15DIAS: TaxaFaixa[] = TAXAS_DIT_7DIAS.map(f => ({
  ...f,
  taxaMasc: +(f.taxaMasc * 0.80).toFixed(4),
  taxaFem:  +(f.taxaFem  * 0.80).toFixed(4),
}))
// LER/DORT/LTC: fator +20%
export const FATOR_DIT_LER = 1.20

// ── SAF — Serviço de Assistência Funeral ─────────────────────────────────────
// Capital fixo R$ 12.000 — taxa por R$ 1.000 de CS
export const TAXAS_SAF_INDIVIDUAL: TaxaFaixa[] = [
  { idadeMin: 18, idadeMax: 30, taxaMasc: 0.055, taxaFem: 0.045 },
  { idadeMin: 31, idadeMax: 40, taxaMasc: 0.065, taxaFem: 0.055 },
  { idadeMin: 41, idadeMax: 50, taxaMasc: 0.085, taxaFem: 0.072 },
  { idadeMin: 51, idadeMax: 60, taxaMasc: 0.120, taxaFem: 0.100 },
  { idadeMin: 61, idadeMax: 70, taxaMasc: 0.175, taxaFem: 0.148 },
  { idadeMin: 71, idadeMax: 75, taxaMasc: 0.260, taxaFem: 0.220 },
]
// Familiar: fator +60% sobre individual
export const FATOR_SAF_FAMILIAR = 1.60

// ── Função utilitária: buscar taxa por idade e gênero ─────────────────────────
export function getTaxa(tabela: TaxaFaixa[], idade: number, genero: Genero): number {
  const faixa = tabela.find(f => idade >= f.idadeMin && idade <= f.idadeMax)
  if (!faixa) return 0
  // Não-binário e Prefiro não informar usam a média entre masc e fem
  if (genero === 'Masculino') return faixa.taxaMasc
  if (genero === 'Feminino') return faixa.taxaFem
  return (faixa.taxaMasc + faixa.taxaFem) / 2
}

// ── Função principal: calcular contribuição mensal de uma cobertura ───────────
export function calcContribuicaoMensal(
  cobertura: 'morte' | 'morteTemp' | 'iea' | 'ipa' | 'ied' | 'dg' | 'dih' | 'dit' | 'saf',
  capitalSegurado: number,
  idade: number,
  genero: Genero,
  opcoes?: {
    majorada?: boolean
    dihUTI?: boolean
    franquiaReduzida?: boolean
    quantidadeDias?: '7 dias' | '15 dias'
    lerDortLtc?: boolean
    tipoSAF?: 'Individual' | 'Familiar'
    vigenciaGlobal?: string
  }
): number {
  if (capitalSegurado <= 0 || idade < 18) return 0

  let taxa = 0
  const opts = opcoes || {}

  switch (cobertura) {
    case 'morte': {
      const tabela = (opts.vigenciaGlobal && opts.vigenciaGlobal.includes('Temporária'))
        ? TAXAS_MORTE_TEMPORARIA
        : TAXAS_MORTE_VITALICIO
      taxa = getTaxa(tabela, idade, genero)
      return (capitalSegurado / 1000) * taxa
    }
    case 'morteTemp': {
      taxa = getTaxa(TAXAS_MORTE_TEMPORARIA, idade, genero)
      return (capitalSegurado / 1000) * taxa
    }
    case 'iea': {
      taxa = getTaxa(TAXAS_IEA, idade, genero)
      return (capitalSegurado / 1000) * taxa
    }
    case 'ipa': {
      taxa = getTaxa(TAXAS_IPA, idade, genero)
      const fator = opts.majorada ? FATOR_IPA_MAJORADA : 1
      return (capitalSegurado / 1000) * taxa * fator
    }
    case 'ied': {
      taxa = getTaxa(TAXAS_IED, idade, genero)
      return (capitalSegurado / 1000) * taxa
    }
    case 'dg': {
      taxa = getTaxa(TAXAS_DG, idade, genero)
      return (capitalSegurado / 1000) * taxa
    }
    case 'dih': {
      taxa = getTaxa(TAXAS_DIH, idade, genero)
      const fatorUTI = opts.dihUTI ? FATOR_DIH_UTI : 1
      return capitalSegurado * taxa * fatorUTI
    }
    case 'dit': {
      const tabDIT = (opts.franquiaReduzida && opts.quantidadeDias === '7 dias')
        ? TAXAS_DIT_7DIAS
        : TAXAS_DIT_15DIAS
      taxa = getTaxa(tabDIT, idade, genero)
      const fatorLER = opts.lerDortLtc ? FATOR_DIT_LER : 1
      return capitalSegurado * taxa * fatorLER
    }
    case 'saf': {
      const tabSAF = TAXAS_SAF_INDIVIDUAL
      taxa = getTaxa(tabSAF, idade, genero)
      const fatorFam = opts.tipoSAF === 'Familiar' ? FATOR_SAF_FAMILIAR : 1
      return (12000 / 1000) * taxa * fatorFam
    }
    default:
      return 0
  }
}

// ── Calcular contribuição anual (desconto 4%) ─────────────────────────────────
export function calcContribuicaoAnual(contribuicaoMensal: number): number {
  return contribuicaoMensal * 12 * 0.96
}

// ── Verificar elegibilidade por idade ─────────────────────────────────────────
export function isElegivelPorIdade(
  cobertura: 'morte' | 'morteTemp' | 'iea' | 'ipa' | 'ied' | 'dg' | 'dih' | 'dit' | 'saf',
  idade: number
): boolean {
  if (idade < 18 || idade > 75) return false
  return true
}
