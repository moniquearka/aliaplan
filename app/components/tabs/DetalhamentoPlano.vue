<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useJornadaStore } from '~/stores/jornada'
import { FUNDOS_DISPONIVEIS, HORIZONTE_VALORES, HORIZONTE_COBERTURAS, HORIZONTE_NOMES, VIGENCIA_OPTIONS } from '~/data/fundosData'
import type { Plano, SubPlano, Cobertura, FundoSelecionado } from '~/stores/jornada'

const props = defineProps<{ onBack?: () => void; onNext?: () => void }>()
const emit = defineEmits<{ back: []; next: [] }>()

const store = useJornadaStore()
const isEditing = ref(false)
const draft = ref(JSON.parse(JSON.stringify(store.detalhamentoData)))
const editActionDone = ref(false)

const data = computed(() => isEditing.value ? draft.value : store.detalhamentoData)

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Editing ──────────────────────────────────────────────────────────────────
function handleEdit() {
  draft.value = JSON.parse(JSON.stringify(store.detalhamentoData))
  isEditing.value = true
}
function handleCancel() {
  isEditing.value = false
  editActionDone.value = true
}
function handleSave() {
  // Validar soma dos percentuais
  for (const plano of draft.value.planos) {
    if (plano.tipo !== 'previdencia') continue
    for (let si = 0; si < plano.subPlanos.length; si++) {
      const sub = plano.subPlanos[si]
      if (sub.fundos.length < 2) continue
      const soma = sub.fundos.reduce((acc: number, f: FundoSelecionado) => acc + (parseFloat(f.percentual) || 0), 0)
      if (Math.abs(soma - 100) >= 0.01) {
        alert(`A soma dos percentuais dos fundos é ${soma.toFixed(0)}%. Ajuste para totalizar 100% antes de salvar.`)
        return
      }
    }
  }
  store.saveDetalhamentoData(draft.value)
  isEditing.value = false
  editActionDone.value = true
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
    }
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
const fundSearchState = ref<Record<string, { search: string; showModal: boolean; tipoPlano: string }>>({})
function getFundSearch(subId: string) {
  if (!fundSearchState.value[subId]) {
    fundSearchState.value[subId] = { search: '', showModal: false, tipoPlano: 'PGBL' }
  }
  return fundSearchState.value[subId]
}
function getFilteredFundos(sub: SubPlano) {
  const state = getFundSearch(sub.id)
  const contrib = parseMoney(sub.contribuicaoMensal)
  const aporte = parseMoney(sub.aporteInicial)
  return FUNDOS_DISPONIVEIS.filter((f: any) => {
    if (sub.tipoPlano === 'PGBL' && !f.codigoPGBL) return false
    if (sub.tipoPlano === 'VGBL' && !f.susepVGBL) return false
    if (!f.nome.toLowerCase().includes(state.search.toLowerCase()) && !f.cnpj.includes(state.search)) return false
    if (contrib === 0 && aporte === 0) return true
    const contribuicaoOk = contrib > 0 && contrib >= Math.max(100, f.contribuicaoMinima)
    const aporteOk = aporte > 0 && aporte >= Math.max(1000, f.aporteMinimo)
    return contribuicaoOk || aporteOk
  })
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

      <!-- Tipo de Investimento -->
      <div :style="{ marginBottom: '24px' }">
        <label class="field-label">Tipo de Investimento</label>
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
              <label class="field-label">Contribuição Mensal</label>
              <input v-if="isEditing" type="text" :value="sub.contribuicaoMensal" @change="(e) => setSubField(plano, sub, 'contribuicaoMensal', (e.target as HTMLInputElement).value)" class="field-input" placeholder="R$ 0,00" />
              <p v-else class="field-value">{{ sub.contribuicaoMensal || '—' }}</p>
            </div>
            <div>
              <label class="field-label">Valor do Aporte Inicial</label>
              <input v-if="isEditing" type="text" :value="sub.aporteInicial" @change="(e) => setSubField(plano, sub, 'aporteInicial', (e.target as HTMLInputElement).value)" class="field-input" placeholder="R$ 0,00" />
              <p v-else class="field-value">{{ sub.aporteInicial || '—' }}</p>
            </div>
          </div>

          <!-- Tipo de Plano (PGBL/VGBL) -->
          <div :style="{ marginBottom: '12px' }">
            <label class="field-label">Tipo de Plano</label>
            <select v-if="isEditing" :value="sub.tipoPlano" @change="(e) => { const p = draft.planos.find((x: Plano) => x.id === plano.id); const s = p?.subPlanos.find((x: SubPlano) => x.id === sub.id); if (s) s.tipoPlano = (e.target as HTMLSelectElement).value as 'PGBL' | 'VGBL' }" class="field-select">
              <option value="PGBL">PGBL</option>
              <option value="VGBL">VGBL</option>
            </select>
            <p v-else class="field-value">{{ sub.tipoPlano }}</p>
          </div>

          <!-- Seleção de Fundos -->
          <div>
            <label class="field-label" :style="{ marginBottom: '8px', display: 'block' }">Seleção de Fundos</label>

            <!-- Botão abrir modal -->
            <button v-if="isEditing" @click="getFundSearch(sub.id).showModal = true"
              :style="{ padding: '8px 14px', fontSize: '13px', borderRadius: '6px', border: '1px solid oklch(90% 0.005 260)', background: '#fff', color: 'oklch(20% 0.05 250)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Buscar Fundo
            </button>

            <!-- Modal de busca -->
            <div v-if="getFundSearch(sub.id).showModal" :style="{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <div :style="{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '16px' }">
                <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
                  <h3 :style="{ fontSize: '16px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: 0 }">Selecionar Fundo</h3>
                  <button @click="getFundSearch(sub.id).showModal = false" :style="{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'oklch(45% 0.02 250)' }">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <input type="text" v-model="getFundSearch(sub.id).search" placeholder="Buscar por nome ou CNPJ..." class="field-input" />
                <div :style="{ overflowY: 'auto', flex: 1 }">
                  <table :style="{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }">
                    <thead>
                      <tr :style="{ background: 'oklch(95% 0.005 260)' }">
                        <th :style="{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'oklch(45% 0.02 250)' }">Fundo</th>
                        <th :style="{ padding: '8px 6px', textAlign: 'center', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'oklch(45% 0.02 250)' }">Taxa Adm.</th>
                        <th :style="{ padding: '8px 6px', textAlign: 'center', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'oklch(45% 0.02 250)' }">Classificação</th>
                        <th :style="{ padding: '8px 6px', textAlign: 'center', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'oklch(45% 0.02 250)' }">Sel.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="f in getFilteredFundos(sub)" :key="f.cnpj" :style="{ borderBottom: '1px solid oklch(93% 0.003 260)', cursor: 'pointer' }" @click="toggleFundo(plano, sub, f)">
                        <td :style="{ padding: '8px 10px', color: 'oklch(20% 0.05 250)', fontWeight: 500 }">
                          <p :style="{ margin: 0, fontSize: '12px', fontWeight: 600 }">{{ f.nome }}</p>
                          <p :style="{ margin: 0, fontSize: '11px', color: 'oklch(55% 0.02 250)' }">{{ f.cnpj }}</p>
                        </td>
                        <td :style="{ padding: '8px 6px', textAlign: 'center', color: 'oklch(45% 0.02 250)' }">{{ f.taxa }}</td>
                        <td :style="{ padding: '8px 6px', textAlign: 'center', color: 'oklch(45% 0.02 250)' }">{{ f.classificacao || '—' }}</td>
                        <td :style="{ padding: '8px 6px', textAlign: 'center' }">
                          <div :style="{ width: '18px', height: '18px', borderRadius: '4px', border: sub.fundos.some((sf: FundoSelecionado) => sf.cnpj === f.cnpj) ? 'none' : '1px solid oklch(80% 0.005 260)', background: sub.fundos.some((sf: FundoSelecionado) => sf.cnpj === f.cnpj) ? 'oklch(20% 0.05 250)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }">
                            <svg v-if="sub.fundos.some((sf: FundoSelecionado) => sf.cnpj === f.cnpj)" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Fundos selecionados -->
            <div v-if="sub.fundos.length > 0" :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
              <div v-if="isEditing"><label class="field-label" :style="{ marginBottom: '4px', display: 'block' }">Fundos Selecionados</label></div>
              <div v-for="fundo in sub.fundos" :key="fundo.cnpj" :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '10px 14px', background: '#fff', display: 'grid', gridTemplateColumns: '1fr auto 28px', gridTemplateRows: 'auto auto auto', columnGap: '12px', rowGap: '6px', alignItems: 'start' }">
                <!-- Nome -->
                <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: 0, gridColumn: 1, gridRow: 1, wordBreak: 'break-word' }">{{ fundo.nome }}</p>
                <!-- Contribuição Mensal -->
                <div :style="{ gridColumn: 2, gridRow: 1 }">
                  <p :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', margin: '0 0 3px 0', textAlign: 'right' }">Contribuição Mensal</p>
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }">
                    <template v-if="isEditing">
                      <input type="text" :value="fundo.percentual" @input="(e) => handleContribPercentualChange(plano, sub, fundo, (e.target as HTMLInputElement).value)" :style="{ width: '44px', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '3px 5px', fontSize: '12px', textAlign: 'center', outline: 'none' }" />
                      <span :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)' }">%</span>
                      <input type="text" :value="fundo.valorAtribuido" @input="(e) => handleContribValorChange(plano, sub, fundo, (e.target as HTMLInputElement).value)" :style="{ width: '90px', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '3px 5px', fontSize: '12px', textAlign: 'right', outline: 'none' }" placeholder="R$ 0,00" />
                    </template>
                    <template v-else>
                      <span :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)' }">{{ fundo.percentual }}%</span>
                      <span :style="{ fontSize: '12px', fontWeight: 500, color: 'oklch(20% 0.05 250)' }">{{ fundo.valorAtribuido || '—' }}</span>
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
                <!-- CNPJ -->
                <p :style="{ gridColumn: 1, gridRow: 2, fontSize: '12px', color: 'oklch(45% 0.02 250)', margin: 0 }">{{ fundo.cnpj }}</p>
                <!-- Aporte Inicial -->
                <div :style="{ gridColumn: 2, gridRow: 2 }">
                  <p :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', margin: '0 0 3px 0', textAlign: 'right' }">Aporte Inicial</p>
                  <div :style="{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }">
                    <template v-if="isEditing">
                      <input type="text" :value="fundo.percentualAporte" @input="(e) => handleAportePercentualChange(plano, sub, fundo, (e.target as HTMLInputElement).value)" :style="{ width: '44px', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '3px 5px', fontSize: '12px', textAlign: 'center', outline: 'none' }" />
                      <span :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)' }">%</span>
                      <input type="text" :value="fundo.valorAporte" @input="(e) => handleAporteValorChange(plano, sub, fundo, (e.target as HTMLInputElement).value)" :style="{ width: '90px', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '3px 5px', fontSize: '12px', textAlign: 'right', outline: 'none' }" placeholder="R$ 0,00" />
                    </template>
                    <template v-else>
                      <span :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)' }">{{ fundo.percentualAporte }}%</span>
                      <span :style="{ fontSize: '12px', fontWeight: 500, color: 'oklch(20% 0.05 250)' }">{{ fundo.valorAporte || '—' }}</span>
                    </template>
                  </div>
                </div>
                <!-- Taxa/Rentabilidade/Classificação -->
                <div :style="{ gridColumn: '1 / -1', gridRow: 3, display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'nowrap', paddingTop: '2px' }">
                  <div v-for="item in [{ label: 'Taxa Máx. Adm.', value: (fundo as any).taxaAdmMax || fundo.taxaAdm }, { label: 'Rentabilidade', value: fundo.rentabilidade }, { label: 'Classificação', value: fundo.classificacao }]" :key="item.label" :style="{ display: 'flex', alignItems: 'center', gap: '5px' }">
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

        <!-- Adicionar sub-plano -->
        <button v-if="isEditing" @click="addSubPlano(plano)" :style="{ width: '100%', border: '1px dashed rgba(30,64,175,0.4)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: 'oklch(20% 0.05 250)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500, marginTop: '4px', marginBottom: '8px' }">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Adicionar Novo Tipo de Plano
        </button>
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

        <!-- Tabela de coberturas -->
        <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }">
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
                <th :style="{ textAlign: 'center', padding: '8px 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Prazo de Pagamento</th>
                <th :style="{ textAlign: 'right', padding: '8px 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Capital Segurado</th>
                <th :style="{ textAlign: 'right', padding: '8px 16px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Contribuição Mensal</th>
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
                  <span v-else :style="{ display: 'block', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '11px' }">{{ cob.nome }}</span>
                </td>
                <td :style="{ padding: '10px 6px', textAlign: 'center', fontSize: '11px', whiteSpace: 'nowrap' }">
                  <select v-if="isEditing" :value="cob.vigencia" @change="(e) => updateCobertura(plano, i, 'vigencia', (e.target as HTMLSelectElement).value)" :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '4px 4px', fontSize: '11px', background: '#fff', color: 'oklch(20% 0.05 250)', outline: 'none', width: '100%' }">
                    <option v-for="v in VIGENCIA_OPTIONS" :key="v" :value="v">{{ v }}</option>
                  </select>
                  <span v-else :style="{ color: 'oklch(45% 0.02 250)', fontSize: '11px' }">{{ cob.vigencia || '—' }}</span>
                </td>
                <td :style="{ padding: '10px 6px', textAlign: 'center', fontSize: '11px', whiteSpace: 'nowrap' }">
                  <input v-if="isEditing" type="text" :value="cob.prazoPagamento" @input="(e) => updateCobertura(plano, i, 'prazoPagamento', (e.target as HTMLInputElement).value)" placeholder="ex: 20 anos" :style="{ width: '100%', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '4px 6px', fontSize: '11px', background: '#fff', color: 'oklch(20% 0.05 250)', outline: 'none', textAlign: 'center' }" />
                  <span v-else :style="{ color: 'oklch(45% 0.02 250)', fontSize: '11px' }">{{ cob.prazoPagamento || '—' }}</span>
                </td>
                <td :style="{ padding: '10px 6px', textAlign: 'right', fontSize: '11px', whiteSpace: 'nowrap' }">
                  <span :style="{ color: (cob.capitalSegurado || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cs || calcCapitalSegurado(cob)) ? 'oklch(30% 0.05 250)' : 'oklch(70% 0.01 260)', fontWeight: 500, fontSize: '11px' }">
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

        <!-- Adicionar cobertura -->
        <button v-if="isEditing" @click="addCobertura(plano)" :style="{ width: '100%', border: '1px dashed rgba(30,64,175,0.4)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', color: 'oklch(20% 0.05 250)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500, marginBottom: '8px' }">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Adicionar Cobertura
        </button>
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
  </div>
</template>
