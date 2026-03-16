<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useJornadaStore } from '~/stores/jornada'
import { FUNDOS_DISPONIVEIS, HORIZONTE_VALORES, HORIZONTE_COBERTURAS, HORIZONTE_NOMES, VIGENCIA_OPTIONS, PRAZO_PAGAMENTO_OPTIONS, COBERTURA_TOOLTIPS } from '~/data/fundosData'
import type { Plano, SubPlano, Cobertura, FundoSelecionado, SeguroVidaData, Assistencias } from '~/stores/jornada'
import SeguroVidaBlocos from '~/components/SeguroVidaBlocos.vue'

const props = defineProps<{ onBack?: () => void; onNext?: () => void }>()
const emit = defineEmits<{ back: []; next: []; 'editing-change': [editing: boolean] }>()

const store = useJornadaStore()
const isEditing = ref(false)
const draft = ref(JSON.parse(JSON.stringify(store.detalhamentoData)))
const editActionDone = ref(false)

const data = computed(() => isEditing.value ? draft.value : store.detalhamentoData)

// ── Tooltip customizado para coberturas ──────────────────────────────────────
const tooltipVisible = ref(false)
const tooltipText = ref('')
const tooltipX = ref(0)
const tooltipY = ref(0)
function showTooltip(event: MouseEvent, text: string) {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  tooltipText.value = text
  tooltipX.value = rect.left + rect.width / 2
  tooltipY.value = rect.top - 8
  tooltipVisible.value = true
}
function hideTooltip() {
  tooltipVisible.value = false
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function riscoCorParaLabel(cor: string): string {
  const mapa: Record<string, string> = {
    '#3B82F6': 'Muito Baixo',
    '#22C55E': 'Baixo',
    '#EAB308': 'Médio',
    '#F97316': 'Alto',
    '#EF4444': 'Muito Alto'
  }
  return mapa[cor?.toUpperCase()] || mapa[cor] || cor || '—'
}

function parseBRL(val: string): number {
  if (!val) return 0
  const clean = val.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(clean) || 0
}
function formatBRL(val: number): string {
  if (isNaN(val) || val === 0) return ''
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatMoney(num: number): string {
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function parseMoney(s: string): number {
  if (!s) return 0
  const clean = s.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? 0 : n
}
function calcCapitalSegurado(cob: Cobertura): string {
  if (cob.capitalSegurado) return cob.capitalSegurado
  const min = parseBRL(cob.valorMin)
  const max = parseBRL(cob.valorMax)
  if (!min || !max) return ''
  return formatBRL((min + max) / 2)
}

const HORIZONTE_TAXAS: Record<string, Record<string, number>> = {
  'Vitalícia': { '5': 0.0028, '10': 0.0015, '15': 0.0010, '20': 0.00075, '25': 0.00060, '30': 0.00050, 'vitalicio': 0.00040 },
  'Temporária 5 anos': { '5': 0.00080, '10': 0.00060, '15': 0.00050, '20': 0.00040, '25': 0.00035 },
  'Temporária 10 anos': { '5': 0.00120, '10': 0.00090, '15': 0.00070, '20': 0.00060, '25': 0.00050 },
  'Temporária 15 anos': { '5': 0.00160, '10': 0.00120, '15': 0.00090, '20': 0.00075, '25': 0.00060 },
  'Temporária 20 anos': { '5': 0.00200, '10': 0.00150, '15': 0.00110, '20': 0.00090, '25': 0.00075 },
  'Temporária 25 anos': { '5': 0.00240, '10': 0.00180, '15': 0.00130, '20': 0.00105, '25': 0.00085 },
}
function calcContribuicaoMensal(capitalSeguradoStr: string, vigencia: string, prazoPagamento: string): string {
  const cs = parseBRL(capitalSeguradoStr)
  if (!cs || !vigencia) return ''
  const prazoMatch = prazoPagamento.match(/(\d+)/)
  const prazoKey = prazoMatch ? prazoMatch[1] : 'vitalicio'
  const taxaMap = HORIZONTE_TAXAS[vigencia]
  if (!taxaMap) return ''
  const taxa = taxaMap[prazoKey] || taxaMap['vitalicio'] || Object.values(taxaMap)[0]
  if (!taxa) return ''
  return formatBRL(cs * taxa)
}

function redistributePercentuais(fundos: FundoSelecionado[], contribuicaoMensal: string, aporteInicial: string): FundoSelecionado[] {
  if (fundos.length === 0) return fundos
  const base = Math.floor(100 / fundos.length)
  const remainder = 100 - base * fundos.length
  const aporteBase = parseMoney(aporteInicial)
  const contribBase = parseMoney(contribuicaoMensal)
  return fundos.map((f, i) => {
    const pct = i === 0 ? base + remainder : base
    return {
      ...f,
      percentual: String(pct),
      valorAtribuido: contribBase > 0 ? formatMoney((pct / 100) * contribBase) : f.valorAtribuido,
      percentualAporte: String(pct),
      valorAporte: aporteBase > 0 ? formatMoney((pct / 100) * aporteBase) : f.valorAporte,
    }
  })
}

// ── Computed: idade e gênero do proponente ────────────────────────────────────
const idadeProponente = computed(() => {
  const dn = store.resumoData?.proponente?.dataNascimento
  if (!dn) return 0
  const parts = dn.split('/')
  if (parts.length !== 3) return 0
  const birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
})
const generoProponente = computed<'Feminino' | 'Masculino'>(() => {
  const g = store.resumoData?.proponente?.genero || 'Feminino'
  return g === 'Masculino' ? 'Masculino' : 'Feminino'
})

// ── Editing ──────────────────────────────────────────────────────────────────
function handleEdit() {
  draft.value = JSON.parse(JSON.stringify(store.detalhamentoData))
  // Espelhar valores de Soluções Propostas nos campos de Contribuição Mensal
  const solucoes = store.resumoData?.solucoes
  if (solucoes) {
    for (const plano of draft.value.planos) {
      if (plano.tipo === 'previdencia' && solucoes.previdencia?.valor) {
        for (const sub of plano.subPlanos) {
          sub.contribuicaoMensal = solucoes.previdencia.valor
        }
      }
      if (plano.tipo === 'seguro' && solucoes.protecao?.valor) {
        plano.premioMensal = solucoes.protecao.valor
      }
    }
  }
  isEditing.value = true
  emit('editing-change', true)
}
function handleCancel() {
  isEditing.value = false
  editActionDone.value = true
  emit('editing-change', false)
}
function handleSave() {
  const proponente = store.resumoData?.proponente
  const idadeAtual = proponente?.dataNascimento
    ? Math.floor((Date.now() - new Date(proponente.dataNascimento.split('/').reverse().join('-')).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  for (const plano of draft.value.planos) {
    if (plano.tipo !== 'previdencia') continue

    // Validar Idade de aposentadoria
    const idadeAp = parseInt(plano.idadeAposentadoria)
    if (!plano.idadeAposentadoria || isNaN(idadeAp)) {
      alert('Preencha o campo "Idade que deseja se aposentar" antes de salvar.')
      return
    }
    if (idadeAtual !== null && idadeAp <= idadeAtual) {
      alert(`A idade de aposentadoria deve ser maior que a idade atual (${idadeAtual} anos). Informe pelo menos ${idadeAtual + 1} anos.`)
      return
    }

    for (let si = 0; si < plano.subPlanos.length; si++) {
      const sub = plano.subPlanos[si]

      // Validar: pelo menos Contribuição Mensal ou Aporte Inicial
      const contrib = parseMoney(sub.contribuicaoMensal)
      const aporte = parseMoney(sub.aporteInicial)
      if (contrib === 0 && aporte === 0) {
        alert(`No sub-plano ${si + 1} (${sub.tipoPlano}), preencha pelo menos um dos campos: Contribuição Mensal ou Valor do Aporte Inicial.`)
        return
      }

      // Validar mínimos
      if (contrib > 0 && contrib < 100) {
        alert(`A Contribuição Mensal mínima é R$ 100,00. Corrija o valor no sub-plano ${si + 1} (${sub.tipoPlano}).`)
        return
      }
      if (aporte > 0 && aporte < 1000) {
        alert(`O Valor do Aporte Inicial mínimo é R$ 1.000,00. Corrija o valor no sub-plano ${si + 1} (${sub.tipoPlano}).`)
        return
      }

      // Validar valor mínimo dos fundos (R$ 50)
      for (const f of sub.fundos) {
        const valorContrib = parseMoney(f.valorAtribuido)
        if (valorContrib > 0 && valorContrib < 50) {
          alert(`O Valor Atribuído de Contribuição Mensal do fundo "${f.nome}" deve ser no mínimo R$ 50,00.`)
          return
        }
        const valorAporte = parseMoney(f.valorAporte)
        if (valorAporte > 0 && valorAporte < 50) {
          alert(`O Valor Atribuído de Aporte Inicial do fundo "${f.nome}" deve ser no mínimo R$ 50,00.`)
          return
        }
      }

      // Validar distribuição obrigatória dos fundos
      if (sub.fundos.length > 0) {
        if (contrib > 0) {
          const somaContrib = sub.fundos.reduce((acc: number, f: FundoSelecionado) => acc + parseMoney(f.valorAtribuido), 0)
          if (Math.abs(somaContrib - contrib) > 0.02) {
            alert(`A soma dos valores atribuídos de Contribuição Mensal (${formatMoney(somaContrib)}) deve ser igual ao total (${formatMoney(contrib)}). Redistribua os valores.`)
            return
          }
        }
        if (aporte > 0) {
          const somaAporte = sub.fundos.reduce((acc: number, f: FundoSelecionado) => acc + parseMoney(f.valorAporte), 0)
          if (Math.abs(somaAporte - aporte) > 0.02) {
            alert(`A soma dos valores atribuídos de Aporte Inicial (${formatMoney(somaAporte)}) deve ser igual ao total (${formatMoney(aporte)}). Redistribua os valores.`)
            return
          }
        }
      }

      // Validar soma dos percentuais
      if (sub.fundos.length >= 2) {
        const soma = sub.fundos.reduce((acc: number, f: FundoSelecionado) => acc + (parseFloat(f.percentual) || 0), 0)
        if (Math.abs(soma - 100) >= 0.01) {
          alert(`A soma dos percentuais dos fundos é ${soma.toFixed(0)}%. Ajuste para totalizar 100% antes de salvar.`)
          return
        }
      }
    }
  }
  // Validar Capital Segurado das coberturas de Seguro de Vida
  for (const plano of draft.value.planos) {
    if (plano.tipo !== 'seguro' || !plano.seguroVida) continue
    const sv = plano.seguroVida
    const capitalMorte = parseBRL(sv.morte?.capitalSegurado || '')
    if (capitalMorte > 0) {
      // IPA ≤ Capital de Morte
      if (sv.ipa?.ativo) {
        const csIPA = parseBRL(sv.ipa.capitalSegurado || '')
        if (csIPA > capitalMorte) {
          alert(`O Capital Segurado da cobertura IPA (${formatBRL(csIPA)}) não pode exceder o Capital de Morte (${formatBRL(capitalMorte)}). Corrija antes de salvar.`)
          return
        }
      }
      // DG ≤ 10% do Capital de Morte
      if (sv.dg?.ativo) {
        const csDG = parseBRL(sv.dg.capitalSegurado || '')
        const maxDG = capitalMorte * 0.10
        if (csDG > maxDG) {
          alert(`O Capital Segurado da cobertura DG (${formatBRL(csDG)}) não pode exceder 10% do Capital de Morte (${formatBRL(maxDG)}). Corrija antes de salvar.`)
          return
        }
      }
    }
  }
  store.saveDetalhamentoData(draft.value)
  isEditing.value = false
  editActionDone.value = true
  emit('editing-change', false)
}

// ── Plano operations ──────────────────────────────────────────────────────────
function updatePlano(id: string, updated: Plano) {
  draft.value.planos = draft.value.planos.map((p: Plano) => p.id === id ? updated : p)
}
function removePlano(id: string) {
  draft.value.planos = draft.value.planos.filter((p: Plano) => p.id !== id)
}
function addPlano() {
  const newPlano: Plano = {
    id: `plano-${Date.now()}`,
    tipo: 'previdencia',
    produtoRecomendado: 'Horizonte',
    idadeAposentadoria: '',
    vigencia: '',
    tempoContribuicao: '',
    capitalSegurado: '',
    premioMensal: '',
    coberturas: HORIZONTE_COBERTURAS.map((c: any) => ({ ...c })),
    subPlanos: [{ id: `sub-${Date.now()}`, contribuicaoMensal: '', aporteInicial: '', tipoPlano: 'PGBL', riskValue: 30, fundos: [] }],
  }
  draft.value.planos.push(newPlano)
}

// ── SubPlano operations ───────────────────────────────────────────────────────
function updateSubPlano(plano: Plano, subId: string, updated: SubPlano) {
  const newPlano = { ...plano, subPlanos: plano.subPlanos.map((s: SubPlano) => s.id === subId ? updated : s) }
  updatePlano(plano.id, newPlano)
}
function removeSubPlano(plano: Plano, subId: string) {
  const newPlano = { ...plano, subPlanos: plano.subPlanos.filter((s: SubPlano) => s.id !== subId) }
  updatePlano(plano.id, newPlano)
}
function addSubPlano(plano: Plano) {
  const newSub: SubPlano = { id: `sub-${Date.now()}`, contribuicaoMensal: '', aporteInicial: '', tipoPlano: 'PGBL', riskValue: 30, fundos: [] }
  updatePlano(plano.id, { ...plano, subPlanos: [...plano.subPlanos, newSub] })
}
function addSubPlanoOposto(plano: Plano) {
  // Determinar o tipo oposto ao já existente
  const tiposExistentes = plano.subPlanos.map((s: SubPlano) => s.tipoPlano)
  let tipoOposto: 'PGBL' | 'VGBL' = 'VGBL'
  if (tiposExistentes.includes('VGBL') && !tiposExistentes.includes('PGBL')) tipoOposto = 'PGBL'
  else if (tiposExistentes.includes('PGBL') && !tiposExistentes.includes('VGBL')) tipoOposto = 'VGBL'
  const newSub: SubPlano = { id: `sub-${Date.now()}`, contribuicaoMensal: '', aporteInicial: '', tipoPlano: tipoOposto, riskValue: 30, fundos: [] }
  updatePlano(plano.id, { ...plano, subPlanos: [...plano.subPlanos, newSub] })
}
function setSubField(plano: Plano, sub: SubPlano, key: keyof SubPlano, value: string) {
  let updatedSub = { ...sub, [key]: value }
  if (key === 'contribuicaoMensal') {
    const newContribBase = parseMoney(value)
    const fundosNorm = sub.fundos.length === 1 && (parseFloat(sub.fundos[0].percentual) || 0) === 0
      ? [{ ...sub.fundos[0], percentual: '100' }] : sub.fundos
    updatedSub.fundos = fundosNorm.map((f: FundoSelecionado) => {
      const pct = parseFloat(f.percentual) || 0
      const valor = newContribBase > 0 && pct > 0 ? (pct / 100) * newContribBase : 0
      return { ...f, valorAtribuido: newContribBase > 0 && valor > 0 ? formatMoney(valor) : f.valorAtribuido }
    })
  }
  if (key === 'aporteInicial') {
    const newAporteBase = parseMoney(value)
    const fundosNorm = sub.fundos.length === 1 && (parseFloat(sub.fundos[0].percentualAporte) || 0) === 0
      ? [{ ...sub.fundos[0], percentualAporte: '100' }] : sub.fundos
    updatedSub.fundos = fundosNorm.map((f: FundoSelecionado) => {
      const pct = parseFloat(f.percentualAporte) || 0
      const valor = newAporteBase > 0 && pct > 0 ? (pct / 100) * newAporteBase : 0
      return { ...f, valorAporte: newAporteBase > 0 && valor > 0 ? formatMoney(valor) : f.valorAporte }
    })
  }
  updateSubPlano(plano, sub.id, updatedSub)
}

// ── Fundo operations ──────────────────────────────────────────────────────────
function toggleFundo(plano: Plano, sub: SubPlano, f: typeof FUNDOS_DISPONIVEIS[0]) {
  const exists = sub.fundos.some((sf: FundoSelecionado) => sf.cnpj === f.cnpj)
  let newFundos: FundoSelecionado[]
  if (exists) {
    const remaining = sub.fundos.filter((sf: FundoSelecionado) => sf.cnpj !== f.cnpj)
    newFundos = redistributePercentuais(remaining, sub.contribuicaoMensal, sub.aporteInicial)
  } else {
    const rawPerf = f.taxaPerformance || ''
    const taxaPerf = (rawPerf === 'Não há*' || rawPerf === 'Não há' || rawPerf === '') ? null : rawPerf
    const newFundo: FundoSelecionado = {
      nome: f.nome, cnpj: f.cnpj, tipo: sub.tipoPlano,
      taxaAdm: f.taxa, taxaAdmMax: (f as any).taxaAdmMax || f.taxa,
      taxaPerformance: taxaPerf, rentabilidade: f.rentabilidade || '-',
      classificacao: f.classificacao || '-',
      percentual: '0', valorAtribuido: '', percentualAporte: '0', valorAporte: '',
      processoSusep: sub.tipoPlano === 'PGBL' ? ((f as any).susepPGBL || '') : ((f as any).susepVGBL || ''),
      qualificado: (f as any).qualificado || false,
      estrategia: (f as any).estrategia || '',
      risco: (f as any).risco || '',
      riscoNum: (f as any).riscoNum || 0,
      riscoCor: (f as any).riscoCor || '#4285F4',
      rent12m: (f as any).rent12m || '',
      rent24m: (f as any).rent24m || '',
      rent36m: (f as any).rent36m || '',
    } as any
    newFundos = redistributePercentuais([...sub.fundos, newFundo], sub.contribuicaoMensal, sub.aporteInicial)
  }
  updateSubPlano(plano, sub.id, { ...sub, fundos: newFundos })
}
function updateFundoField(plano: Plano, sub: SubPlano, cnpj: string, key: keyof FundoSelecionado, value: string) {
  const newFundos = sub.fundos.map((f: FundoSelecionado) => f.cnpj === cnpj ? { ...f, [key]: value } : f)
  updateSubPlano(plano, sub.id, { ...sub, fundos: newFundos })
}
function updateFundoMultiple(plano: Plano, sub: SubPlano, cnpj: string, fields: Partial<FundoSelecionado>) {
  const newFundos = sub.fundos.map((f: FundoSelecionado) => f.cnpj === cnpj ? { ...f, ...fields } : f)
  updateSubPlano(plano, sub.id, { ...sub, fundos: newFundos })
}
function handleContribPercentualChange(plano: Plano, sub: SubPlano, fundo: FundoSelecionado, raw: string) {
  const pct = raw.replace(/[^0-9.,]/g, '')
  const contribBase = parseMoney(sub.contribuicaoMensal)
  if (contribBase > 0) {
    const pctNum = parseFloat(pct.replace(',', '.')) || 0
    const valor = (pctNum / 100) * contribBase
    const valorStr = valor > 0 ? formatMoney(valor) : ''
    updateFundoMultiple(plano, sub, fundo.cnpj, { percentual: pct, valorAtribuido: valorStr })
  } else {
    updateFundoField(plano, sub, fundo.cnpj, 'percentual', pct)
  }
}
function handleContribValorChange(plano: Plano, sub: SubPlano, fundo: FundoSelecionado, rawInput: string) {
  const digits = rawInput.replace(/\D/g, '')
  const contribBase = parseMoney(sub.contribuicaoMensal)
  if (!digits) {
    updateFundoMultiple(plano, sub, fundo.cnpj, { valorAtribuido: '', percentual: contribBase > 0 ? '0' : fundo.percentual })
    return
  }
  const num = parseInt(digits, 10) / 100
  const valorStr = formatMoney(num)
  if (contribBase > 0) {
    const pct = Math.round((num / contribBase) * 100)
    updateFundoMultiple(plano, sub, fundo.cnpj, { valorAtribuido: valorStr, percentual: String(pct) })
  } else {
    updateFundoField(plano, sub, fundo.cnpj, 'valorAtribuido', valorStr)
  }
}
function handleAportePercentualChange(plano: Plano, sub: SubPlano, fundo: FundoSelecionado, raw: string) {
  const pct = raw.replace(/[^0-9.,]/g, '')
  const aporteBase = parseMoney(sub.aporteInicial)
  if (aporteBase > 0) {
    const pctNum = parseFloat(pct.replace(',', '.')) || 0
    const valor = (pctNum / 100) * aporteBase
    const valorStr = valor > 0 ? formatMoney(valor) : ''
    updateFundoMultiple(plano, sub, fundo.cnpj, { percentualAporte: pct, valorAporte: valorStr })
  } else {
    updateFundoField(plano, sub, fundo.cnpj, 'percentualAporte', pct)
  }
}
function handleAporteValorChange(plano: Plano, sub: SubPlano, fundo: FundoSelecionado, rawInput: string) {
  const digits = rawInput.replace(/\D/g, '')
  const aporteBase = parseMoney(sub.aporteInicial)
  if (!digits) {
    updateFundoMultiple(plano, sub, fundo.cnpj, { valorAporte: '', percentualAporte: aporteBase > 0 ? '0' : fundo.percentualAporte })
    return
  }
  const num = parseInt(digits, 10) / 100
  const valorStr = formatMoney(num)
  if (aporteBase > 0) {
    const pct = Math.round((num / aporteBase) * 100)
    updateFundoMultiple(plano, sub, fundo.cnpj, { valorAporte: valorStr, percentualAporte: String(pct) })
  } else {
    updateFundoField(plano, sub, fundo.cnpj, 'valorAporte', valorStr)
  }
}

// ── Cobertura operations ──────────────────────────────────────────────────────
function updateCobertura(plano: Plano, idx: number, key: keyof Cobertura, value: string) {
  const updated = plano.coberturas.map((c: Cobertura, i: number) => {
    if (i !== idx) return c
    const newCob = { ...c, [key]: value }
    if (key === 'vigencia' || key === 'nome') {
      const nomeRef = key === 'nome' ? value : c.nome
      const vigRef = key === 'vigencia' ? value : c.vigencia
      const lookup = (HORIZONTE_VALORES as any)[nomeRef]?.[vigRef]
      if (lookup) return { ...newCob, capitalSegurado: lookup.cs, contribuicaoMensal: lookup.cm }
    }
    return newCob
  })
  updatePlano(plano.id, { ...plano, coberturas: updated })
}
function addCobertura(plano: Plano) {
  const newCob: Cobertura = { nome: '', valorMin: '', valorMax: '', vigencia: 'Vitalícia', prazoPagamento: '', capitalSegurado: '', contribuicaoMensal: '' }
  updatePlano(plano.id, { ...plano, coberturas: [...plano.coberturas, newCob] })
}
function removeCobertura(plano: Plano, idx: number) {
  updatePlano(plano.id, { ...plano, coberturas: plano.coberturas.filter((_: Cobertura, i: number) => i !== idx) })
}
function cobTotal(plano: Plano): number {
  return plano.coberturas.reduce((acc: number, cob: Cobertura) => {
    const lookup = (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]
    const cs = cob.capitalSegurado || lookup?.cs || calcCapitalSegurado(cob)
    const cm = cob.contribuicaoMensal || lookup?.cm || calcContribuicaoMensal(cs, cob.vigencia, cob.prazoPagamento)
    return acc + parseBRL(cm)
  }, 0)
}

// ── Fund search state ─────────────────────────────────────────────────────────
const fundSearchState = ref<Record<string, { search: string; showModal: boolean; tipoPlano: string; sortField: string; sortDir: 'asc' | 'desc' }>>({})
function getFundSearch(subId: string) {
  if (!fundSearchState.value[subId]) {
    fundSearchState.value[subId] = { search: '', showModal: false, tipoPlano: 'PGBL', sortField: '', sortDir: 'asc' }
  }
  return fundSearchState.value[subId]
}
function getFilteredFundos(sub: SubPlano) {
  const state = getFundSearch(sub.id)
  const contrib = parseMoney(sub.contribuicaoMensal)
  const aporte = parseMoney(sub.aporteInicial)
  const filtered = FUNDOS_DISPONIVEIS.filter((f: any) => {
    if (sub.tipoPlano === 'PGBL' && !f.codigoPGBL) return false
    if (sub.tipoPlano === 'VGBL' && !f.susepVGBL) return false
    if (!f.nome.toLowerCase().includes(state.search.toLowerCase()) && !f.cnpj.includes(state.search)) return false
    if (contrib === 0 && aporte === 0) return true
    const contribuicaoOk = contrib > 0 && contrib >= Math.max(100, f.contribuicaoMinima)
    const aporteOk = aporte > 0 && aporte >= Math.max(1000, f.aporteMinimo)
    return contribuicaoOk || aporteOk
  })
  if (!state.sortField) return filtered
  return [...filtered].sort((a: any, b: any) => {
    let va: number, vb: number
    if (state.sortField === 'taxa') {
      va = parseFloat(a.taxa) || 0
      vb = parseFloat(b.taxa) || 0
    } else if (state.sortField === 'risco') {
      va = a.riscoNum || 0
      vb = b.riscoNum || 0
    } else {
      va = parseFloat(a.rentabilidade) || 0
      vb = parseFloat(b.rentabilidade) || 0
    }
    return state.sortDir === 'asc' ? va - vb : vb - va
  })
}
function toggleSort(sub: SubPlano, field: string) {
  const state = getFundSearch(sub.id)
  if (state.sortField === field) {
    state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
  } else {
    state.sortField = field
    state.sortDir = 'asc'
  }
}

const continuerDisabled = computed(() => isEditing.value)
</script>

<template>
  <div>
    <!-- Header -->
    <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }">
      <div :style="{ display: 'flex', alignItems: 'center', gap: '12px' }">
        <div :style="{ width: '36px', height: '36px', borderRadius: '50%', background: 'oklch(95% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <svg class="h-4 w-4" :style="{ color: 'oklch(45% 0.02 250)' }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </div>
        <h1 :style="{ fontSize: '20px', fontWeight: 600, color: 'oklch(20% 0.05 250)' }">Detalhamento do Plano</h1>
      </div>
      <button @click="isEditing ? handleCancel() : handleEdit()" :style="{ width: '36px', height: '36px', borderRadius: '8px', background: 'oklch(95% 0.005 260)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(45% 0.02 250)' }">
        <svg v-if="isEditing" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </button>
    </div>

    <!-- Planos -->
    <div v-for="(plano, idx) in data.planos" :key="plano.id" :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderLeft: '4px solid rgba(30,64,175,0.3)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }">
      <!-- Plano header -->
      <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }">
        <p :style="{ fontSize: '15px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Dados do Plano {{ idx + 1 }}</p>
        <button v-if="isEditing && data.planos.length > 1" @click="removePlano(plano.id)" :style="{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'oklch(55% 0.02 250)' }">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      <!-- Tipo de Produto -->
      <div :style="{ marginBottom: '24px' }">
        <label class="field-label">Tipo de Produto</label>
        <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginTop: '8px' }">
          <button v-for="opt in [{ id: 'previdencia', label: 'Previdência' }, { id: 'seguro', label: 'Seguro de Vida' }]" :key="opt.id"
            @click="() => { if (!isEditing) return; const p = isEditing ? draft.planos.find((x: Plano) => x.id === plano.id) : null; if (!p) return; if (opt.id === 'seguro') { p.tipo = 'seguro'; if (!p.coberturas.length) p.coberturas = HORIZONTE_COBERTURAS.map((c: any) => ({...c})); p.produtoRecomendado = p.produtoRecomendado || 'Horizonte' } else { p.tipo = 'previdencia'; if (!p.subPlanos.length) p.subPlanos = [{ id: `sub-${Date.now()}`, contribuicaoMensal: '', aporteInicial: '', tipoPlano: 'PGBL', riskValue: 30, fundos: [] }] } }"
            :style="{ padding: '12px 16px', borderRadius: '8px', border: `1px solid ${plano.tipo === opt.id ? 'oklch(20% 0.05 250)' : 'oklch(90% 0.005 260)'}`, background: plano.tipo === opt.id ? 'oklch(20% 0.05 250)' : '#fff', color: plano.tipo === opt.id ? '#fff' : 'oklch(20% 0.05 250)', fontSize: '13px', fontWeight: 500, cursor: isEditing ? 'pointer' : 'default', transition: 'all 0.15s' }">
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Previdência -->
      <template v-if="plano.tipo === 'previdencia'">
        <!-- Idade aposentadoria -->
        <div :style="{ marginBottom: '24px' }">
          <label class="field-label">Idade que deseja se aposentar</label>
          <div :style="{ marginTop: '6px' }">
            <input v-if="isEditing" type="text" :value="(isEditing ? draft.planos.find((x: Plano) => x.id === plano.id) : plano)?.idadeAposentadoria"
              @input="(e) => { const p = draft.planos.find((x: Plano) => x.id === plano.id); if (p) p.idadeAposentadoria = (e.target as HTMLInputElement).value }"
              class="field-input" />
            <p v-else class="field-value">{{ plano.idadeAposentadoria || '—' }}</p>
          </div>
        </div>

        <!-- Sub-planos -->
        <div v-for="sub in plano.subPlanos" :key="sub.id" :style="{ border: '1px solid oklch(92% 0.004 260)', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: 'oklch(98.5% 0.002 260)' }">
          <!-- Remove sub-plano -->
          <div v-if="isEditing && plano.subPlanos.length > 1" :style="{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }">
            <button @click="removeSubPlano(plano, sub.id)" :style="{ padding: '4px 10px', fontSize: '12px', color: 'oklch(45% 0.02 250)', border: '1px solid oklch(90% 0.005 260)', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }">Remover</button>
          </div>

          <!-- Contribuição + Aporte -->
          <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }">
            <div>
              <label class="field-label">Contribuição Mensal <span style="color:#dc2626">*</span></label>
              <input v-if="isEditing" type="text" :value="sub.contribuicaoMensal" @change="(e) => setSubField(plano, sub, 'contribuicaoMensal', (e.target as HTMLInputElement).value)" class="field-input" placeholder="R$ 0,00" />
              <p v-else class="field-value">{{ sub.contribuicaoMensal || '—' }}</p>
            </div>
            <div>
              <label class="field-label">Valor do Aporte Inicial <span style="color:#dc2626">*</span></label>
              <input v-if="isEditing" type="text" :value="sub.aporteInicial" @change="(e) => setSubField(plano, sub, 'aporteInicial', (e.target as HTMLInputElement).value)" class="field-input" placeholder="R$ 0,00" />
              <p v-else class="field-value">{{ sub.aporteInicial || '—' }}</p>
            </div>
          </div>

          <!-- Tipo do Plano (PGBL/VGBL) radio buttons -->
          <div :style="{ marginBottom: '12px' }">
            <label class="field-label">Tipo do Plano <span style="color:#dc2626">*</span></label>
            <!-- Modo edição: radio buttons estilizados com círculo -->
            <div v-if="isEditing" :style="{ display: 'flex', gap: '20px', marginTop: '8px' }">
              <label v-for="opt in ['PGBL', 'VGBL']" :key="opt"
                :style="{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }"
                @click="() => { const p = draft.planos.find((x: Plano) => x.id === plano.id); const s = p?.subPlanos.find((x: SubPlano) => x.id === sub.id); if (s) s.tipoPlano = opt as 'PGBL' | 'VGBL' }">
                <!-- Círculo radio -->
                <span :style="{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${sub.tipoPlano === opt ? '#1e40af' : 'oklch(75% 0.01 260)'}`, background: '#fff', flexShrink: 0, transition: 'border-color 0.15s' }">
                  <span v-if="sub.tipoPlano === opt" :style="{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e40af', display: 'block' }" />
                </span>
                <span :style="{ fontSize: '13px', fontWeight: sub.tipoPlano === opt ? 600 : 400, color: sub.tipoPlano === opt ? 'oklch(20% 0.05 250)' : 'oklch(45% 0.02 250)' }">{{ opt }}</span>
              </label>
            </div>
            <!-- Modo visualização: badge com nome do plano selecionado -->
            <div v-else :style="{ marginTop: '6px' }">
              <span :style="{ display: 'inline-block', fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', background: 'oklch(95% 0.005 260)', border: '1px solid oklch(85% 0.005 260)', borderRadius: '6px', padding: '4px 14px' }">{{ sub.tipoPlano }}</span>
            </div>
          </div>

          <!-- Seleção de Fundos -->
          <div>
            <!-- Botão abrir modal (modo edição) -->
            <template v-if="isEditing">
              <label class="field-label" :style="{ marginBottom: '4px', display: 'block' }">Buscar Fundos Disponíveis <span style="color:#dc2626">*</span></label>
              <button type="button" @click="() => { getFundSearch(sub.id).search = ''; getFundSearch(sub.id).showModal = true }"
                :style="{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: '1px solid oklch(90% 0.005 260)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', background: '#fff', color: 'oklch(55% 0.02 250)', cursor: 'pointer', height: '40px', textAlign: 'left', boxSizing: 'border-box', marginBottom: '4px' }">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" :style="{ flexShrink: 0, color: 'oklch(55% 0.02 250)' }">
                  <circle cx="11" cy="11" r="8" />
                  <path stroke-linecap="round" d="m21 21-4.35-4.35" />
                </svg>
                Nome ou CNPJ do Fundo
              </button>
              <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginTop: '4px', marginBottom: '8px' }">{{ getFilteredFundos(sub).length }} fundos disponíveis</p>
            </template>
            <template v-else>
              <label class="field-label" :style="{ marginBottom: '8px', display: 'block' }">Seleção de Fundos</label>
            </template>

            <!-- Modal de busca (design idêntico ao site de referência) -->
            <div v-if="getFundSearch(sub.id).showModal"
              :style="{ position: 'fixed', top: 0, bottom: 0, left: '280px', right: 0, zIndex: 200, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }"
              @click.self="getFundSearch(sub.id).showModal = false">
              <div :style="{ background: '#fff', borderRadius: '12px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', width: 'min(1100px, 96vw)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }">
                <!-- Header do modal -->
                <div :style="{ padding: '20px 24px 16px', borderBottom: '1px solid oklch(93% 0.003 260)' }">
                  <div :style="{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }">
                    <div>
                      <h3 :style="{ fontSize: '15px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Buscar Fundos Disponíveis</h3>
                      <p :style="{ fontSize: '12px', color: 'oklch(55% 0.02 250)', margin: '4px 0 0' }">{{ getFilteredFundos(sub).length }} de {{ FUNDOS_DISPONIVEIS.length }} fundos encontrados</p>
                    </div>
                    <div :style="{ display: 'flex', alignItems: 'flex-start', gap: '12px' }">
                      <!-- Termômetro de Risco -->
                      <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', minWidth: '220px' }">
                        <div :style="{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }">
                          <span :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', whiteSpace: 'nowrap' }">Termômetro de Risco</span>
                          <div :style="{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid oklch(75% 0.01 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', fontSize: '9px', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" title="Indica o nível de risco dos fundos selecionados">i</div>
                        </div>
                        <div :style="{ display: 'flex', flexDirection: 'column', gap: '2px', width: '220px', flexShrink: 0 }">
                          <div :style="{ width: '100%', display: 'flex', height: '4px', borderRadius: '2px', overflow: 'hidden' }">
                            <div v-for="(seg, si) in [{ color: '#4285F4' }, { color: '#34A853' }, { color: '#FBBC04' }, { color: '#EA8600' }, { color: '#EA4335' }]" :key="si" :style="{ flex: 1, background: seg.color, height: '100%' }"></div>
                          </div>
                          <div :style="{ display: 'flex', justifyContent: 'space-between' }">
                            <span :style="{ fontSize: '9px', color: 'oklch(65% 0.01 260)' }">Muito baixo</span>
                            <span :style="{ fontSize: '9px', color: 'oklch(65% 0.01 260)' }">Média</span>
                            <span :style="{ fontSize: '9px', color: 'oklch(65% 0.01 260)' }">Muito alto</span>
                          </div>
                        </div>
                      </div>
                      <!-- Botão fechar -->
                      <button type="button" @click="getFundSearch(sub.id).showModal = false"
                        :style="{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid oklch(88% 0.005 260)', background: 'oklch(97% 0.003 260)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(45% 0.02 250)', flexShrink: 0, marginTop: '2px' }" title="Fechar">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <!-- Campo de busca com ícone -->
                  <div :style="{ position: 'relative' }">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" :style="{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'oklch(55% 0.02 250)', pointerEvents: 'none' }">
                      <circle cx="11" cy="11" r="8" />
                      <path stroke-linecap="round" d="m21 21-4.35-4.35" />
                    </svg>
                    <input autofocus type="text" v-model="getFundSearch(sub.id).search" placeholder="Pesquisar por nome ou CNPJ do fundo..."
                      :style="{ width: '100%', border: '1px solid oklch(88% 0.005 260)', borderRadius: '8px', padding: '9px 12px 9px 36px', fontSize: '13px', background: 'oklch(98% 0.002 260)', color: 'oklch(20% 0.05 250)', outline: 'none', boxSizing: 'border-box' }" />
                  </div>
                </div>
                <!-- Tabela de fundos -->
                <div :style="{ overflowX: 'auto', overflowY: 'auto', flex: 1 }">
                  <table :style="{ width: '100%', minWidth: '900px', fontSize: '12px', borderCollapse: 'collapse', tableLayout: 'auto' }">
                    <colgroup>
                      <col style="width: 36px" />
                      <col style="min-width: 280px" />
                      <col style="width: 120px" />
                      <col style="width: 130px" />
                      <col style="width: 150px" />
                      <col style="min-width: 160px" />
                    </colgroup>
                    <thead :style="{ background: 'oklch(96% 0.004 260)', position: 'sticky', top: 0, zIndex: 1 }">
                      <tr>
                        <th :style="{ textAlign: 'left', padding: '10px 10px', fontWeight: 600, color: 'oklch(45% 0.02 250)', width: '28px' }"></th>
                        <th :style="{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'oklch(45% 0.02 250)' }">Nome</th>
                        <th @click="toggleSort(sub, 'rentabilidade')" :style="{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', borderLeft: '1px solid oklch(91% 0.004 260)' }">
                          <span :style="{ display: 'inline-flex', alignItems: 'center', gap: '5px' }">
                            Rentabilidade
                            <span :style="{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '3px' }">
                              <span :style="{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `5px solid ${getFundSearch(sub.id).sortField === 'rentabilidade' && getFundSearch(sub.id).sortDir === 'asc' ? 'oklch(20% 0.05 250)' : 'oklch(75% 0.01 260)'}` }"></span>
                              <span :style="{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${getFundSearch(sub.id).sortField === 'rentabilidade' && getFundSearch(sub.id).sortDir === 'desc' ? 'oklch(20% 0.05 250)' : 'oklch(75% 0.01 260)'}` }"></span>
                            </span>
                          </span>
                        </th>
                        <th @click="toggleSort(sub, 'risco')" :style="{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', borderLeft: '1px solid oklch(91% 0.004 260)' }">
                          <span :style="{ display: 'inline-flex', alignItems: 'center', gap: '5px' }">
                            Grau de Risco
                            <span :style="{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '3px' }">
                              <span :style="{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `5px solid ${getFundSearch(sub.id).sortField === 'risco' && getFundSearch(sub.id).sortDir === 'asc' ? 'oklch(20% 0.05 250)' : 'oklch(75% 0.01 260)'}` }"></span>
                              <span :style="{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${getFundSearch(sub.id).sortField === 'risco' && getFundSearch(sub.id).sortDir === 'desc' ? 'oklch(20% 0.05 250)' : 'oklch(75% 0.01 260)'}` }"></span>
                            </span>
                          </span>
                        </th>
                        <th @click="toggleSort(sub, 'taxa')" :style="{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', borderLeft: '1px solid oklch(91% 0.004 260)' }">
                          <span :style="{ display: 'inline-flex', alignItems: 'center', gap: '5px' }">
                            Taxa Máx. Adm.
                            <span :style="{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '3px' }">
                              <span :style="{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `5px solid ${getFundSearch(sub.id).sortField === 'taxa' && getFundSearch(sub.id).sortDir === 'asc' ? 'oklch(20% 0.05 250)' : 'oklch(75% 0.01 260)'}` }"></span>
                              <span :style="{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${getFundSearch(sub.id).sortField === 'taxa' && getFundSearch(sub.id).sortDir === 'desc' ? 'oklch(20% 0.05 250)' : 'oklch(75% 0.01 260)'}` }"></span>
                            </span>
                          </span>
                        </th>
                        <th :style="{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap', borderLeft: '1px solid oklch(91% 0.004 260)' }">Estratégia</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="f in getFilteredFundos(sub)" :key="f.cnpj"
                        @click="toggleFundo(plano, sub, f)"
                        :style="{ cursor: 'pointer', borderTop: '1px solid oklch(94% 0.003 260)', background: sub.fundos.some((sf: FundoSelecionado) => sf.cnpj === f.cnpj) ? 'rgba(30,64,175,0.05)' : 'transparent' }"
                        @mouseenter="(e: MouseEvent) => { if (!sub.fundos.some((sf: FundoSelecionado) => sf.cnpj === f.cnpj)) (e.currentTarget as HTMLElement).style.background = 'oklch(97.5% 0.003 260)' }"
                        @mouseleave="(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.background = sub.fundos.some((sf: FundoSelecionado) => sf.cnpj === f.cnpj) ? 'rgba(30,64,175,0.05)' : 'transparent' }">

                        <td :style="{ padding: '10px 10px' }">
                          <input type="checkbox" :checked="sub.fundos.some((sf: FundoSelecionado) => sf.cnpj === f.cnpj)" readonly :style="{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'oklch(20% 0.05 250)' }" />
                        </td>
                        <td :style="{ padding: '10px 14px' }">
                          <div :style="{ fontWeight: 500, color: 'oklch(20% 0.05 250)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }">{{ f.nome }}</div>
                          <div :style="{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'nowrap' }">
                            <span :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', whiteSpace: 'nowrap' }">{{ f.cnpj }}</span>
                            <span v-if="(f as any).qualificado" :style="{ fontSize: '10px', fontWeight: 600, color: 'oklch(50% 0.01 260)', background: 'oklch(93% 0.003 260)', border: '1px solid oklch(85% 0.005 260)', borderRadius: '3px', padding: '1px 5px', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }">QUALIFICADO</span>
                          </div>
                        </td>
                        <td :style="{ padding: '10px 14px', textAlign: 'right', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap', borderLeft: '1px solid oklch(93% 0.003 260)' }">{{ (f as any).rent12m || '—' }}</td>
                        <td :style="{ padding: '10px 14px', textAlign: 'center', borderLeft: '1px solid oklch(93% 0.003 260)' }">
                          <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                            <div :style="{ width: '14px', height: '14px', borderRadius: '50%', background: (f as any).riscoCor || '#4285F4', flexShrink: 0 }"></div>
                          </div>
                        </td>
                        <td :style="{ padding: '10px 14px', textAlign: 'right', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap', borderLeft: '1px solid oklch(93% 0.003 260)' }">{{ f.taxa }}</td>
                        <td :style="{ padding: '10px 14px', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap', borderLeft: '1px solid oklch(93% 0.003 260)' }">{{ (f as any).estrategia || f.classificacao || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!-- Rodapé do modal -->
                <div :style="{ padding: '12px 24px', borderTop: '1px solid oklch(93% 0.003 260)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
                  <span :style="{ fontSize: '12px', color: 'oklch(55% 0.02 250)' }">{{ sub.fundos.length }} fundo{{ sub.fundos.length !== 1 ? 's' : '' }} selecionado{{ sub.fundos.length !== 1 ? 's' : '' }}</span>
                  <button type="button" @click="getFundSearch(sub.id).showModal = false"
                    :style="{ background: 'oklch(20% 0.05 250)', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }">Confirmar</button>
                </div>
              </div>
            </div>

            <!-- Fundos selecionados -->
            <div v-if="sub.fundos.length > 0" :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
              <div v-if="isEditing"><label class="field-label" :style="{ marginBottom: '4px', display: 'block' }">Fundos Selecionados</label></div>
              <!-- Card de fundo - layout idêntico ao site de referência -->
              <div v-for="fundo in sub.fundos" :key="fundo.cnpj"
                :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '10px 14px', background: '#fff', display: 'grid', gridTemplateColumns: '1fr auto 28px', gridTemplateRows: 'auto auto auto auto', columnGap: '12px', rowGap: '6px', alignItems: 'start', overflow: 'hidden' }">
                <!-- Row 1: Nome | Contribuição Mensal label+campos | Remover -->
                <div :style="{ gridColumn: 1, gridRow: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }">
                  <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: 0, wordBreak: 'break-word' }">{{ fundo.nome }}</p>
                </div>
                <!-- Contribuição Mensal - componente cp idêntico ao React -->
                <div :style="{ gridColumn: 2, gridRow: 1, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, justifyContent: 'flex-end', whiteSpace: 'nowrap' }">
                  <span :style="{ fontSize: '10px', fontWeight: 600, color: 'oklch(45% 0.04 250)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }">Contribuição Mensal:</span>
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '3px' }">
                    <span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', whiteSpace: 'nowrap' }">Valor Atribuído</span>
                    <template v-if="isEditing">
                      <input type="text" :value="fundo.valorAtribuido" @input="(e) => handleContribValorChange(plano, sub, fundo, (e.target as HTMLInputElement).value)" :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '2px 5px', fontSize: '11px', width: '76px', fontFamily: 'inherit', textAlign: 'center', outline: 'none' }" placeholder="0,00" />
                    </template>
                    <template v-else>
                      <span :style="{ fontSize: '11px', fontWeight: 500, color: 'oklch(20% 0.05 250)', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '1px 5px', width: '76px', textAlign: 'center', display: 'inline-block' }">{{ fundo.valorAtribuido || '0,00' }}</span>
                    </template>
                  </div>
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '3px' }">
                    <span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', whiteSpace: 'nowrap' }">Percentual Atribuído</span>
                    <template v-if="isEditing">
                      <div :style="{ display: 'flex', alignItems: 'center', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', background: 'oklch(98% 0.002 260)', overflow: 'hidden', width: '52px' }">
                        <input type="text" :value="fundo.percentual" @input="(e) => handleContribPercentualChange(plano, sub, fundo, (e.target as HTMLInputElement).value)" :style="{ border: 'none', outline: 'none', padding: '2px 2px 2px 4px', fontSize: '11px', width: '34px', textAlign: 'right', background: 'transparent', color: 'oklch(20% 0.05 250)', fontFamily: 'inherit' }" />
                        <span :style="{ fontSize: '11px', color: 'oklch(40% 0.02 250)', paddingRight: '4px', userSelect: 'none', pointerEvents: 'none' }">%</span>
                      </div>
                    </template>
                    <template v-else>
                      <span :style="{ fontSize: '11px', fontWeight: 600, color: 'oklch(20% 0.05 250)', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '1px 5px', width: '52px', textAlign: 'center', display: 'inline-block' }">{{ fundo.percentual }}%</span>
                    </template>
                  </div>
                </div>
                <!-- Remover -->
                <div :style="{ gridColumn: 3, gridRow: 1, display: 'flex', justifyContent: 'center' }">
                  <button v-if="isEditing" @click="toggleFundo(plano, sub, FUNDOS_DISPONIVEIS.find((f: any) => f.cnpj === fundo.cnpj)!)" :style="{ padding: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'oklch(55% 0.02 250)' }">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <!-- Row 2: CNPJ + tarja QUALIFICADO | Aporte Inicial label+campos | (vazio) -->
                <div :style="{ gridColumn: 1, gridRow: 2, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'nowrap' }">
                  <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', margin: 0, whiteSpace: 'nowrap' }">{{ fundo.cnpj }}</p>
                  <span v-if="(fundo as any).qualificado" :style="{ fontSize: '10px', fontWeight: 600, color: 'oklch(50% 0.01 260)', background: 'oklch(93% 0.003 260)', border: '1px solid oklch(85% 0.005 260)', borderRadius: '3px', padding: '1px 5px', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }">QUALIFICADO</span>
                </div>
                <!-- Aporte Inicial - componente cp idêntico ao React -->
                <div :style="{ gridColumn: 2, gridRow: 2, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, justifyContent: 'flex-end', whiteSpace: 'nowrap' }">
                  <span :style="{ fontSize: '10px', fontWeight: 600, color: 'oklch(45% 0.04 250)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }">Aporte Inicial:</span>
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '3px' }">
                    <span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', whiteSpace: 'nowrap' }">Valor Atribuído</span>
                    <template v-if="isEditing">
                      <input type="text" :value="fundo.valorAporte" @input="(e) => handleAporteValorChange(plano, sub, fundo, (e.target as HTMLInputElement).value)" :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '2px 5px', fontSize: '11px', width: '76px', fontFamily: 'inherit', textAlign: 'center', outline: 'none' }" placeholder="0,00" />
                    </template>
                    <template v-else>
                      <span :style="{ fontSize: '11px', fontWeight: 500, color: 'oklch(20% 0.05 250)', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '1px 5px', width: '76px', textAlign: 'center', display: 'inline-block' }">{{ fundo.valorAporte || '0,00' }}</span>
                    </template>
                  </div>
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '3px' }">
                    <span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', whiteSpace: 'nowrap' }">Percentual Atribuído</span>
                    <template v-if="isEditing">
                      <div :style="{ display: 'flex', alignItems: 'center', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', background: 'oklch(98% 0.002 260)', overflow: 'hidden', width: '52px' }">
                        <input type="text" :value="fundo.percentualAporte" @input="(e) => handleAportePercentualChange(plano, sub, fundo, (e.target as HTMLInputElement).value)" :style="{ border: 'none', outline: 'none', padding: '2px 2px 2px 4px', fontSize: '11px', width: '34px', textAlign: 'right', background: 'transparent', color: 'oklch(20% 0.05 250)', fontFamily: 'inherit' }" />
                        <span :style="{ fontSize: '11px', color: 'oklch(40% 0.02 250)', paddingRight: '4px', userSelect: 'none', pointerEvents: 'none' }">%</span>
                      </div>
                    </template>
                    <template v-else>
                      <span :style="{ fontSize: '11px', fontWeight: 600, color: 'oklch(20% 0.05 250)', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '1px 5px', width: '52px', textAlign: 'center', display: 'inline-block' }">{{ fundo.percentualAporte }}%</span>
                    </template>
                  </div>
                </div>
                <div :style="{ gridColumn: 3, gridRow: 2 }"></div>
                <!-- Row 3: Grau de Risco (texto), Taxa Máx. Adm., Estratégia -->
                <div :style="{ gridColumn: '1 / -1', gridRow: 3, display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'nowrap', paddingTop: '2px' }">
                  <div v-for="item in [
                    { label: 'Grau de Risco', value: riscoCorParaLabel((fundo as any).riscoCor) },
                    { label: 'Taxa Máx. Adm.', value: (fundo as any).taxaAdmMax || fundo.taxaAdm },
                    { label: 'Estratégia', value: (fundo as any).estrategia || fundo.classificacao }
                  ]" :key="item.label" :style="{ display: 'flex', alignItems: 'center', gap: '5px' }">
                    <span :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', whiteSpace: 'nowrap' }">{{ item.label }}:</span>
                    <span :style="{ fontSize: '12px', fontWeight: 500, color: 'oklch(20% 0.05 250)', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '1px 6px', background: 'oklch(97% 0.003 260)', whiteSpace: 'nowrap' }">{{ item.value || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p v-else-if="!isEditing" :style="{ fontSize: '13px', color: 'oklch(55% 0.02 250)', fontStyle: 'italic', marginTop: '8px' }">Nenhum fundo selecionado.</p>

            <!-- Indicador soma percentuais -->
            <div v-if="isEditing && sub.fundos.length > 1" :style="{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: Math.abs(sub.fundos.reduce((a: number, f: FundoSelecionado) => a + (parseFloat(f.percentual) || 0), 0) - 100) < 0.01 ? 'oklch(97% 0.02 145)' : 'oklch(97% 0.03 25)', border: `1px solid ${Math.abs(sub.fundos.reduce((a: number, f: FundoSelecionado) => a + (parseFloat(f.percentual) || 0), 0) - 100) < 0.01 ? 'oklch(75% 0.12 145)' : 'oklch(70% 0.15 25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }">
              <span :style="{ fontSize: '12px', fontWeight: 500 }">
                {{ Math.abs(sub.fundos.reduce((a: number, f: FundoSelecionado) => a + (parseFloat(f.percentual) || 0), 0) - 100) < 0.01 ? 'Distribuição dos percentuais: 100% ✓' : `Soma dos percentuais: ${sub.fundos.reduce((a: number, f: FundoSelecionado) => a + (parseFloat(f.percentual) || 0), 0).toFixed(0)}% — ajuste para totalizar 100%` }}
              </span>
              <button v-if="Math.abs(sub.fundos.reduce((a: number, f: FundoSelecionado) => a + (parseFloat(f.percentual) || 0), 0) - 100) >= 0.01"
                @click="updateSubPlano(plano, sub.id, { ...sub, fundos: redistributePercentuais(sub.fundos, sub.contribuicaoMensal, sub.aporteInicial) })"
                :style="{ fontSize: '11px', padding: '3px 10px', borderRadius: '4px', border: '1px solid oklch(70% 0.15 25)', background: 'oklch(40% 0.15 25)', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }">
                Redistribuir igualmente
              </button>
            </div>
          </div>
        </div>

        <!-- Adicionar Novo Tipo de Plano: desabilitar se já há PGBL e VGBL ou 2+ sub-planos -->
        <template v-if="isEditing">
          <button
            @click="addSubPlanoOposto(plano)"
            :disabled="plano.subPlanos.length >= 2 || (plano.subPlanos.some((s: SubPlano) => s.tipoPlano === 'PGBL') && plano.subPlanos.some((s: SubPlano) => s.tipoPlano === 'VGBL'))"
            :style="{ width: '100%', border: '1px dashed rgba(30,64,175,0.4)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: (plano.subPlanos.length >= 2 || (plano.subPlanos.some((s: SubPlano) => s.tipoPlano === 'PGBL') && plano.subPlanos.some((s: SubPlano) => s.tipoPlano === 'VGBL'))) ? 'oklch(65% 0.01 260)' : 'oklch(20% 0.05 250)', background: 'transparent', cursor: (plano.subPlanos.length >= 2 || (plano.subPlanos.some((s: SubPlano) => s.tipoPlano === 'PGBL') && plano.subPlanos.some((s: SubPlano) => s.tipoPlano === 'VGBL'))) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500, marginTop: '4px', marginBottom: '8px', opacity: (plano.subPlanos.length >= 2 || (plano.subPlanos.some((s: SubPlano) => s.tipoPlano === 'PGBL') && plano.subPlanos.some((s: SubPlano) => s.tipoPlano === 'VGBL'))) ? 0.45 : 1 }">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Adicionar Novo Tipo de Plano
          </button>
        </template>
      </template>

      <!-- Seguro de Vida -->
      <template v-if="plano.tipo === 'seguro'">
        <!-- Produto Recomendado -->
        <div :style="{ marginBottom: '24px' }">
          <label class="field-label">Produto Recomendado</label>
          <div :style="{ marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '8px', border: '1px solid oklch(20% 0.05 250)', background: 'rgba(30,64,175,0.04)' }">
            <div>
              <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Horizonte</p>
              <p :style="{ fontSize: '12px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">O Horizonte é o seguro de vida que oferece a combinação perfeita entre proteção e a possibilidade de formação de reserva, de forma temporária ou durante toda a vida.</p>
            </div>
          </div>
        </div>

        <!-- Novo bloco de coberturas individuais -->
        <SeguroVidaBlocos
          v-if="plano.seguroVida"
          :model-value="(isEditing ? draft.planos.find((x: Plano) => x.id === plano.id) : plano)?.seguroVida || plano.seguroVida"
          :is-editing="isEditing"
          :capital-morte-base="parseBRL((isEditing ? draft.planos.find((x: Plano) => x.id === plano.id) : plano)?.seguroVida?.morte?.capitalSegurado || '')"
          :idade-proponente="idadeProponente"
          :genero-proponente="generoProponente"
          @update:model-value="(val: SeguroVidaData) => { const p = draft.planos.find((x: Plano) => x.id === plano.id); if (p) p.seguroVida = val }"
        />

        <!-- Tabela de coberturas REMOVIDA -->
        <div v-if="false" :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }">
          <table :style="{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', tableLayout: 'fixed' }">
            <colgroup>
              <col style="width: auto" />
              <col style="width: 148px" />
              <col style="width: 120px" />
              <col style="width: 138px" />
              <col style="width: 160px" />
              <col v-if="isEditing" style="width: 30px" />
            </colgroup>
            <thead>
              <tr :style="{ background: 'oklch(95% 0.005 260)', borderBottom: '1px solid oklch(90% 0.005 260)' }">
                <th :style="{ textAlign: 'left', padding: '8px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Cobertura</th>
                <th :style="{ textAlign: 'center', padding: '8px 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Vigência</th>
                <th :style="{ textAlign: 'center', padding: '8px 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Tempo de Contribuição</th>
                <th :style="{ textAlign: 'right', padding: '8px 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Capital Segurado</th>
                <th :style="{ textAlign: 'right', padding: '8px 16px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Prêmio</th>
                <th v-if="isEditing" :style="{ padding: '8px 4px' }"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(cob, i) in plano.coberturas" :key="i" :style="{ borderBottom: i < plano.coberturas.length - 1 ? '1px solid oklch(93% 0.003 260)' : 'none' }">
                <td :style="{ padding: '10px 10px', color: 'oklch(30% 0.05 250)', fontWeight: i === 0 ? 600 : 400, fontSize: '11px', lineHeight: 1.4 }">
                  <select v-if="isEditing" :value="cob.nome" @change="(e) => { const nomeNovo = (e.target as HTMLSelectElement).value; const lookup = (HORIZONTE_VALORES as any)[nomeNovo]?.[cob.vigencia || 'Vitalícia']; const updated = plano.coberturas.map((c: Cobertura, idx: number) => idx === i ? { ...c, nome: nomeNovo, capitalSegurado: lookup?.cs || '', contribuicaoMensal: lookup?.cm || '' } : c); updatePlano(plano.id, { ...plano, coberturas: updated }) }" :style="{ width: '100%', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '4px 6px', fontSize: '11px', background: '#fff', color: 'oklch(20% 0.05 250)', outline: 'none' }">
                    <option value="">Selecione...</option>
                    <option v-for="nome in HORIZONTE_NOMES" :key="nome" :value="nome">{{ nome }}</option>
                  </select>
                  <!-- Modo visualização: nome com ícone de info tooltip customizado -->
                  <span v-else :style="{ display: 'flex', alignItems: 'flex-start', gap: '4px' }">
                    <span :style="{ display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '11px' }">{{ cob.nome }}</span>
                    <span
                      v-if="COBERTURA_TOOLTIPS[cob.nome]"
                      @mouseenter="(e) => showTooltip(e as MouseEvent, COBERTURA_TOOLTIPS[cob.nome])"
                      @mouseleave="hideTooltip"
                      :style="{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', borderRadius: '50%', border: '1px solid oklch(60% 0.02 250)', fontSize: '9px', fontWeight: 700, color: 'oklch(45% 0.02 250)', cursor: 'help', flexShrink: 0, marginTop: '1px', background: 'oklch(96% 0.005 260)' }"
                    >i</span>
                  </span>
                </td>
                <td :style="{ padding: '10px 6px', textAlign: 'center', fontSize: '11px', whiteSpace: 'nowrap' }">
                  <select v-if="isEditing" :value="cob.vigencia" @change="(e) => updateCobertura(plano, i, 'vigencia', (e.target as HTMLSelectElement).value)" :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '4px 4px', fontSize: '11px', background: '#fff', color: 'oklch(20% 0.05 250)', outline: 'none', width: '100%' }">
                    <option v-for="v in VIGENCIA_OPTIONS" :key="v" :value="v">{{ v }}</option>
                  </select>
                  <span v-else :style="{ color: 'oklch(45% 0.02 250)', fontSize: '11px' }">{{ cob.vigencia || '—' }}</span>
                </td>
                <td :style="{ padding: '10px 6px', textAlign: 'center', fontSize: '11px', whiteSpace: 'nowrap' }">
                  <select v-if="isEditing" :value="cob.prazoPagamento" @change="(e) => updateCobertura(plano, i, 'prazoPagamento', (e.target as HTMLSelectElement).value)" :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '4px 4px', fontSize: '11px', background: '#fff', color: 'oklch(20% 0.05 250)', outline: 'none', width: '100%', cursor: 'pointer' }">
                    <option value="">Selecione...</option>
                    <option v-for="p in PRAZO_PAGAMENTO_OPTIONS" :key="p" :value="p">{{ p }}</option>
                  </select>
                  <span v-else :style="{ color: 'oklch(45% 0.02 250)', fontSize: '11px' }">{{ cob.prazoPagamento || '—' }}</span>
                </td>
                <td :style="{ padding: '10px 6px', textAlign: 'right', fontSize: '11px', whiteSpace: 'nowrap' }">
                  <input v-if="isEditing" type="text" :value="cob.capitalSegurado || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cs || calcCapitalSegurado(cob)" @input="(e) => updateCobertura(plano, i, 'capitalSegurado', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="{ width: '100%', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '4px 6px', fontSize: '11px', background: '#fff', color: 'oklch(30% 0.05 250)', outline: 'none', textAlign: 'right' }" />
                  <span v-else :style="{ color: (cob.capitalSegurado || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cs || calcCapitalSegurado(cob)) ? 'oklch(30% 0.05 250)' : 'oklch(70% 0.01 260)', fontWeight: 500, fontSize: '11px' }">
                    {{ cob.capitalSegurado || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cs || calcCapitalSegurado(cob) || '—' }}
                  </span>
                </td>
                <td :style="{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', whiteSpace: 'nowrap' }">
                  <span :style="{ color: (cob.contribuicaoMensal || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cm || calcContribuicaoMensal(cob.capitalSegurado || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cs || calcCapitalSegurado(cob), cob.vigencia, cob.prazoPagamento)) ? 'oklch(20% 0.1 145)' : 'oklch(70% 0.01 260)', fontWeight: 600, whiteSpace: 'nowrap' }">
                    {{ cob.contribuicaoMensal || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cm || calcContribuicaoMensal(cob.capitalSegurado || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cs || calcCapitalSegurado(cob), cob.vigencia, cob.prazoPagamento) || '—' }}
                  </span>
                </td>
                <td v-if="isEditing" :style="{ padding: '10px 8px', textAlign: 'center' }">
                  <button v-if="plano.coberturas.length > 1" @click="removeCobertura(plano, i)" :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'oklch(60% 0.02 250)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="cobTotal(plano) > 0">
              <tr :style="{ background: 'oklch(95% 0.005 260)', borderTop: '2px solid oklch(88% 0.005 260)' }">
                <td :colspan="isEditing ? 4 : 4" :style="{ padding: '10px 10px', fontSize: '12px', fontWeight: 700, color: 'oklch(30% 0.05 250)', textAlign: 'right' }">Valor Total</td>
                <td :style="{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.1 145)' }">{{ formatBRL(cobTotal(plano)) }}</td>
                <td v-if="isEditing"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Adicionar cobertura e Assistências & Benefícios REMOVIDOS -->
      </template>
    </div>

    <!-- Adicionar novo plano -->
    <button v-if="isEditing && data.planos.length < 2" @click="addPlano()" :style="{ width: '100%', border: '1px dashed rgba(30,64,175,0.4)', borderRadius: '8px', padding: '14px 16px', fontSize: '13px', color: 'oklch(20% 0.05 250)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500, marginBottom: '16px' }">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Adicionar um novo plano
    </button>

    <!-- Navigation -->
    <div :style="{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '8px', paddingBottom: '16px', gap: '8px' }">
      <template v-if="isEditing">
        <button @click="handleCancel()" :style="{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: '1px solid oklch(80% 0.005 260)', background: '#fff', color: 'oklch(30% 0.05 250)', cursor: 'pointer' }">Cancelar</button>
        <button @click="handleSave()" :style="{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', background: 'oklch(20% 0.05 250)', color: '#fff', cursor: 'pointer' }">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Salvar
        </button>
      </template>
      <button @click="() => { if (continuerDisabled) { alert('Salve ou cancele as alterações antes de continuar.'); return; } emit('next') }" :disabled="continuerDisabled" :style="{ display: 'flex', alignItems: 'center', gap: '8px', background: continuerDisabled ? 'oklch(75% 0.01 260)' : 'oklch(20% 0.05 250)', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: continuerDisabled ? 'not-allowed' : 'pointer', opacity: continuerDisabled ? 0.6 : 1 }">
        Continuar
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>

    <!-- Tooltip customizado para coberturas -->
    <Teleport to="body">
      <div
        v-if="tooltipVisible"
        :style="{
          position: 'fixed',
          left: tooltipX + 'px',
          top: tooltipY + 'px',
          transform: 'translate(-50%, -100%)',
          background: 'oklch(15% 0.04 250)',
          color: '#fff',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: '1.5',
          maxWidth: '320px',
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }"
      >
        {{ tooltipText }}
        <!-- Seta apontando para baixo -->
        <div :style="{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid oklch(15% 0.04 250)' }" />
      </div>
    </Teleport>
  </div>
</template>
