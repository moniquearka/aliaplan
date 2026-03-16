<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SeguroVidaData, CoberturaSeguro } from '~/stores/jornada'
import {
  calcContribuicaoMensal, calcContribuicaoAnual,
  isElegivelPorIdade, type Genero
} from '~/data/seguroVidaTaxas'

const props = defineProps<{
  modelValue: SeguroVidaData
  isEditing: boolean
  capitalMorteBase: number   // Capital Segurado do bloco Morte (para calcular limites)
  idadeProponente: number    // Idade calculada a partir da data de nascimento
  generoProponente: Genero   // Gênero do proponente
}>()
const emit = defineEmits<{ 'update:modelValue': [val: SeguroVidaData] }>()

// ── Opções ────────────────────────────────────────────────────────────────────
const VIGENCIA_VITALICIA_TEMP = ['Vitalícia', 'Temporária 5 anos', 'Temporária 10 anos', 'Temporária 15 anos', 'Temporária 20 anos', 'Temporária 25 anos']
const VIGENCIA_TEMP_ONLY = ['Temporária 5 anos', 'Temporária 10 anos', 'Temporária 15 anos', 'Temporária 20 anos', 'Temporária 25 anos']
const TEMPO_CONTRIB_OPTS = ['Vitalício', '5 anos', '10 anos', '15 anos', '20 anos', '25 anos', '30 anos']
const TEMPO_CONTRIB_SAF = ['10 anos', '15 anos', '20 anos', '25 anos', '30 anos']

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseBRL(val: string): number {
  if (!val) return 0
  const clean = val.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(clean) || 0
}
function formatBRL(val: number): string {
  if (isNaN(val) || val === 0) return ''
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Update helpers ────────────────────────────────────────────────────────────
function updateField(key: keyof SeguroVidaData, value: any) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
function updateCobertura(key: keyof SeguroVidaData, field: keyof CoberturaSeguro, value: any) {
  const cob = { ...(props.modelValue[key] as CoberturaSeguro), [field]: value }
  emit('update:modelValue', { ...props.modelValue, [key]: cob })
}
function toggleCobertura(key: keyof SeguroVidaData) {
  const cob = props.modelValue[key] as CoberturaSeguro
  emit('update:modelValue', { ...props.modelValue, [key]: { ...cob, ativo: !cob.ativo } })
}

// ── Cálculo automático de Contribuição ───────────────────────────────────────
function recalcCobertura(key: keyof SeguroVidaData) {
  const sv = props.modelValue
  const cob = sv[key] as CoberturaSeguro
  if (!cob.ativo) return
  const cs = parseBRL(cob.capitalSegurado)
  if (cs <= 0) return

  let mensal = 0
  const idade = props.idadeProponente
  const genero = props.generoProponente

  switch (key) {
    case 'morte':
      mensal = calcContribuicaoMensal('morte', cs, idade, genero, { vigenciaGlobal: sv.vigenciaGlobal })
      break
    case 'morteTemp':
      mensal = calcContribuicaoMensal('morteTemp', cs, idade, genero)
      break
    case 'iea':
      mensal = calcContribuicaoMensal('iea', cs, idade, genero)
      break
    case 'ipa':
      mensal = calcContribuicaoMensal('ipa', cs, idade, genero, { majorada: cob.majorada === 'Sim' })
      break
    case 'ied':
      mensal = calcContribuicaoMensal('ied', cs, idade, genero)
      break
    case 'dg':
      mensal = calcContribuicaoMensal('dg', cs, idade, genero)
      break
    case 'dih':
      mensal = calcContribuicaoMensal('dih', cs, idade, genero, { dihUTI: cob.dihUTI === 'Sim' })
      break
    case 'dit':
      mensal = calcContribuicaoMensal('dit', cs, idade, genero, {
        franquiaReduzida: cob.franquiaReduzida === 'Sim',
        quantidadeDias: cob.quantidadeDias as any,
        lerDortLtc: cob.lerDortLtc === 'Sim',
      })
      break
    case 'saf':
      mensal = calcContribuicaoMensal('saf', 12000, idade, genero, { tipoSAF: cob.tipoSAF as any })
      break
  }

  const anual = calcContribuicaoAnual(mensal)
  const newCob = {
    ...cob,
    contribuicaoMensal: mensal > 0 ? formatBRL(mensal) : '',
    contribuicaoAnual: anual > 0 ? formatBRL(anual) : '',
  }
  emit('update:modelValue', { ...sv, [key]: newCob })
}

// Recalcular todas as coberturas ativas quando Capital Segurado muda
function onCapitalChange(key: keyof SeguroVidaData, value: string) {
  updateCobertura(key, 'capitalSegurado', value)
  // Aguarda o próximo tick para recalcular
  setTimeout(() => recalcCobertura(key), 50)
}

// Recalcular quando opções mudam (majorada, dihUTI, etc.)
function onOpcaoChange(key: keyof SeguroVidaData, field: keyof CoberturaSeguro, value: any) {
  updateCobertura(key, field, value)
  setTimeout(() => recalcCobertura(key), 50)
}

// Recalcular todas as coberturas ativas quando idade/gênero muda
watch(() => [props.idadeProponente, props.generoProponente], () => {
  const sv = props.modelValue
  const cobKeys: (keyof SeguroVidaData)[] = ['morte', 'morteTemp', 'iea', 'ipa', 'ied', 'dg', 'dih', 'dit', 'saf']
  for (const k of cobKeys) {
    const cob = sv[k] as CoberturaSeguro
    if (cob?.ativo && parseBRL(cob.capitalSegurado) > 0) {
      setTimeout(() => recalcCobertura(k), 50)
    }
  }
})

// ── Validações de Capital Segurado ────────────────────────────────────────────
const capitalMorteNum = computed(() => parseBRL(props.modelValue.morte.capitalSegurado))
const maxCapitalIPA = computed(() => capitalMorteNum.value)
const maxCapitalDG = computed(() => capitalMorteNum.value * 0.10)
const maxDIH = computed(() => Math.min(capitalMorteNum.value / 250, 1000))
const maxDIT = computed(() => Math.min(capitalMorteNum.value * 0.10, 30000))

const erroIPA = computed(() => {
  if (!props.modelValue.ipa.ativo) return ''
  const cs = parseBRL(props.modelValue.ipa.capitalSegurado)
  if (cs > maxCapitalIPA.value && maxCapitalIPA.value > 0)
    return `Capital IPA não pode exceder o Capital de Morte (${formatBRL(maxCapitalIPA.value)})`
  return ''
})
const erroDG = computed(() => {
  if (!props.modelValue.dg.ativo) return ''
  const cs = parseBRL(props.modelValue.dg.capitalSegurado)
  if (cs > maxCapitalDG.value && maxCapitalDG.value > 0)
    return `Capital DG não pode exceder 10% do Capital de Morte (${formatBRL(maxCapitalDG.value)})`
  return ''
})

// ── Elegibilidade por idade ───────────────────────────────────────────────────
const elegivelDG = computed(() => isElegivelPorIdade('dg', props.idadeProponente))
const elegivelDIH = computed(() => isElegivelPorIdade('dih', props.idadeProponente))
const elegivelDIT = computed(() => isElegivelPorIdade('dit', props.idadeProponente))

// ── Sincronizar Vigência → Prazo de Pagamento automaticamente ─────────────────
function onVigenciaChange(novaVigencia: string) {
  let novoPrazo = props.modelValue.prazoPagamentoGlobal
  const matchTemp = novaVigencia.match(/Temporária (\d+) anos/i)
  if (matchTemp) {
    novoPrazo = `${matchTemp[1]} anos`
  }
  emit('update:modelValue', { ...props.modelValue, vigenciaGlobal: novaVigencia, prazoPagamentoGlobal: novoPrazo })
}

function onMorteTempVigenciaChange(novaVigencia: string) {
  const matchTemp = novaVigencia.match(/(\d+) anos/i)
  const novoPrazo = matchTemp ? `${matchTemp[1]} anos` : props.modelValue.morteTemp.prazoPagamento
  emit('update:modelValue', { ...props.modelValue, morteTemp: { ...props.modelValue.morteTemp, vigencia: novaVigencia, prazoPagamento: novoPrazo } })
}

// ── Visibilidade condicional dos blocos de Morte ──────────────────────────────
// Quando Vigência contém 'Temporária': bloco 1 vira 'Morte Básica', bloco 2 some
// Quando Vigência = 'Vitalícia' e Prazo = '5 anos': bloco 2 some
const isTemporaria = computed(() => (props.modelValue.vigenciaGlobal || '').toLowerCase().includes('temporária') || (props.modelValue.vigenciaGlobal || '').toLowerCase().includes('temporaria'))
const mostrarMorteTemp = computed(() => {
  if (isTemporaria.value) return false
  const prazo = props.modelValue.prazoPagamentoGlobal || ''
  if (prazo === '5 anos') return false
  return true
})

// ── Tooltip state ─────────────────────────────────────────────────────────────
const tooltipVisible = ref(false)
const tooltipText = ref('')
const tooltipX = ref(0)
const tooltipY = ref(0)
const TOOLTIPS: Record<string, string> = {
  morte: 'Cobertura obrigatória: garante indenização aos beneficiários em caso de morte natural ou acidental. Inclui adiantamento integral em vida caso o segurado seja diagnosticado com doença em estágio terminal.',
  morteTemp: 'Cobertura de morte com vigência temporária: garante indenização aos beneficiários em caso de morte natural ou acidental durante o período de vigência contratado.',
  iea: 'Cobertura adicional à morte básica: garante indenização extra aos beneficiários quando o falecimento do segurado ocorrer exclusivamente por acidente.',
  ipa: 'Garante indenização ao próprio segurado em caso de perda permanente — total ou parcial — de membros ou funções do corpo causada por acidente.',
  ied: 'Garante indenização ao segurado que, em decorrência de doença, perde de forma total e permanente a capacidade de exercer qualquer atividade que lhe garanta subsistência.',
  dg: 'Proporciona indenização em vida ao segurado diagnosticado com doenças graves como câncer, infarto, AVC, Alzheimer, Parkinson, ELA, insuficiência renal crônica, entre outras.',
  dih: 'Garante ao segurado uma indenização por dia de internação hospitalar, a partir do primeiro dia, seja por doença ou acidente.',
  dit: 'Garante indenização diária caso o segurado fique impossibilitado de exercer suas atividades profissionais por mais de 15 dias consecutivos, em decorrência de doença ou acidente.',
  saf: 'Oferece suporte completo à família do segurado em caso de falecimento, cobrindo despesas com o serviço funerário (urna, traslado, velório e sepultamento).',
}
function showTooltip(event: MouseEvent, key: string) {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  tooltipText.value = TOOLTIPS[key] || ''
  tooltipX.value = rect.left + rect.width / 2
  tooltipY.value = rect.top - 8
  tooltipVisible.value = true
}
function hideTooltip() { tooltipVisible.value = false }

// ── Cálculo de totais ─────────────────────────────────────────────────────────
const totalMensal = computed(() => {
  let total = 0
  const sv = props.modelValue
  const cobKeys: (keyof SeguroVidaData)[] = ['morte', 'morteTemp', 'iea', 'ipa', 'ied', 'dg', 'dih', 'dit', 'saf']
  for (const k of cobKeys) {
    const cob = sv[k] as CoberturaSeguro
    if (cob?.ativo) total += parseBRL(cob.contribuicaoMensal)
  }
  return total
})
const totalAnual = computed(() => {
  let total = 0
  const sv = props.modelValue
  const cobKeys: (keyof SeguroVidaData)[] = ['morte', 'morteTemp', 'iea', 'ipa', 'ied', 'dg', 'dih', 'dit', 'saf']
  for (const k of cobKeys) {
    const cob = sv[k] as CoberturaSeguro
    if (cob?.ativo) total += parseBRL(cob.contribuicaoAnual)
  }
  return total
})

// ── Estilos reutilizáveis ─────────────────────────────────────────────────────
const cardStyle = { border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#fff' }
const cardDisabled = { border: '1px solid oklch(93% 0.003 260)', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: 'oklch(97% 0.002 260)', opacity: '0.6' }
const labelStyle = { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', marginBottom: '4px', display: 'block' }
const inputStyle = { border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '6px 8px', fontSize: '13px', background: '#fff', color: 'oklch(20% 0.05 250)', outline: 'none', width: '88%' }
const inputReadonly = { border: '1px solid oklch(93% 0.003 260)', borderRadius: '4px', padding: '6px 8px', fontSize: '13px', background: 'oklch(97% 0.002 260)', color: 'oklch(35% 0.03 250)', outline: 'none', width: '88%' }
const selectStyle = { border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '6px 8px', fontSize: '13px', background: '#fff', color: 'oklch(20% 0.05 250)', outline: 'none', width: '88%', cursor: 'pointer' }
const readonlyVal = { fontSize: '13px', color: 'oklch(25% 0.05 250)', fontWeight: 500 }
const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px' }
const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }
const simNaoStyle = { display: 'flex', gap: '16px', alignItems: 'center' }
const erroStyle = { fontSize: '11px', color: 'oklch(50% 0.2 25)', marginTop: '4px', fontWeight: 600 }
const badgeIndisponivel = { fontSize: '11px', color: 'oklch(50% 0.15 30)', background: 'oklch(95% 0.03 30)', border: '1px solid oklch(88% 0.06 30)', borderRadius: '4px', padding: '2px 8px', display: 'inline-block', marginTop: '4px' }
</script>

<template>
  <!-- ── Preferência do Proponente ── -->
  <div :style="{ ...cardStyle, background: 'oklch(97% 0.003 260)', marginBottom: '20px' }">
    <p :style="{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(40% 0.05 250)', marginBottom: '12px' }">Preferência do Proponente</p>
    <div :style="grid3">
      <div>
        <span :style="labelStyle">Vigência *</span>
        <select v-if="isEditing" :value="modelValue.vigenciaGlobal" @change="(e) => onVigenciaChange((e.target as HTMLSelectElement).value)" :style="selectStyle">
          <option v-for="v in VIGENCIA_VITALICIA_TEMP" :key="v" :value="v">{{ v }}</option>
        </select>
        <p v-else :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
      </div>
      <div>
        <span :style="labelStyle">Tempo de Contribuição *</span>
        <select v-if="isEditing" :value="modelValue.prazoPagamentoGlobal" @change="(e) => updateField('prazoPagamentoGlobal', (e.target as HTMLSelectElement).value)" :style="selectStyle">
          <option v-for="p in TEMPO_CONTRIB_OPTS" :key="p" :value="p">{{ p }}</option>
        </select>
        <p v-else :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
      </div>
      <div>
        <span :style="labelStyle">Proponente</span>
        <p :style="readonlyVal">{{ idadeProponente > 0 ? `${idadeProponente} anos` : '—' }} · {{ generoProponente || '—' }}</p>
      </div>
    </div>
  </div>

  <!-- ── 1. Morte Natural ou Acidental + Adiantamento por Doença Terminal (Obrigatório) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }">
      <div :style="{ width: '14px', height: '14px', borderRadius: '3px', background: 'oklch(20% 0.05 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">
        <span v-if="isTemporaria">Morte Básica</span>
        <span v-else>Morte Natural ou Acidental + Adiantamento por Doença Terminal <span :style="{ fontSize: '11px', color: 'oklch(50% 0.15 30)', fontWeight: 600 }">(Obrigatório)</span></span>
      </p>
      <!-- Tooltip icon -->
      <div :style="{ marginLeft: 'auto', cursor: 'pointer', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" @mouseenter="(e) => showTooltip(e, 'morte')" @mouseleave="hideTooltip">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v1m0 3v4"/></svg>
      </div>
    </div>
    <div :style="grid4">
      <div>
        <span :style="labelStyle">Vigência</span>
        <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
      </div>
      <div>
        <span :style="labelStyle">Tempo de Contribuição</span>
        <p :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
      </div>
      <div>
        <span :style="labelStyle">Capital Segurado *</span>
        <input v-if="isEditing" type="text" :value="modelValue.morte.capitalSegurado" @input="(e) => onCapitalChange('morte', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
        <p v-else :style="readonlyVal">{{ modelValue.morte.capitalSegurado || '—' }}</p>
        <p :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Mín: R$ 50.000 | Máx: R$ 20.000.000</p>
      </div>
      <div>
        <span :style="labelStyle">Contribuição</span>
        <input v-if="isEditing" type="text" :value="modelValue.tipoContribuicao === 'anual' ? modelValue.morte.contribuicaoAnual : modelValue.morte.contribuicaoMensal" readonly :style="inputReadonly" placeholder="Calculado automaticamente" />
        <p v-else :style="readonlyVal">{{ (modelValue.tipoContribuicao === 'anual' ? modelValue.morte.contribuicaoAnual : modelValue.morte.contribuicaoMensal) || '—' }}</p>
      </div>
    </div>
  </div>

  <!-- ── 2. Morte Natural ou Acidental (Vigência Temporária) ── -->
  <div v-if="mostrarMorteTemp" :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.morteTemp.ativo" @change="() => toggleCobertura('morteTemp')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.morteTemp.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.morteTemp.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Morte Natural ou Acidental (Vigência Temporária)</p>
      <div :style="{ marginLeft: 'auto', cursor: 'pointer', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" @mouseenter="(e) => showTooltip(e, 'morteTemp')" @mouseleave="hideTooltip">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v1m0 3v4"/></svg>
      </div>
    </div>
    <template v-if="modelValue.morteTemp.ativo">
      <div :style="grid4">
        <div>
          <span :style="labelStyle">Vigência</span>
          <select v-if="isEditing" :value="modelValue.morteTemp.vigencia" @change="(e) => onMorteTempVigenciaChange((e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="v in VIGENCIA_TEMP_ONLY" :key="v" :value="v">{{ v }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.morteTemp.vigencia || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Tempo de Contribuição</span>
          <select v-if="isEditing" :value="modelValue.morteTemp.prazoPagamento" @change="(e) => updateCobertura('morteTemp', 'prazoPagamento', (e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="p in TEMPO_CONTRIB_OPTS" :key="p" :value="p">{{ p }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.morteTemp.prazoPagamento || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.morteTemp.capitalSegurado" @input="(e) => onCapitalChange('morteTemp', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.morteTemp.capitalSegurado || '—' }}</p>
          <p :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Mín: R$ 50.000 | Máx: R$ 20.000.000</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição</span>
          <input v-if="isEditing" type="text" :value="modelValue.tipoContribuicao === 'anual' ? modelValue.morteTemp.contribuicaoAnual : modelValue.morteTemp.contribuicaoMensal" readonly :style="inputReadonly" placeholder="Calculado automaticamente" />
          <p v-else :style="readonlyVal">{{ (modelValue.tipoContribuicao === 'anual' ? modelValue.morteTemp.contribuicaoAnual : modelValue.morteTemp.contribuicaoMensal) || '—' }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- ── 3. Indenização Especial de Morte por Acidente (IEA) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.iea.ativo" @change="() => toggleCobertura('iea')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.iea.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.iea.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Indenização Especial de Morte por Acidente (IEA)</p>
      <div :style="{ marginLeft: 'auto', cursor: 'pointer', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" @mouseenter="(e) => showTooltip(e, 'iea')" @mouseleave="hideTooltip">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v1m0 3v4"/></svg>
      </div>
    </div>
    <template v-if="modelValue.iea.ativo">
      <div :style="grid4">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Tempo de Contribuição</span>
          <p :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.iea.capitalSegurado" @input="(e) => onCapitalChange('iea', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.iea.capitalSegurado || '—' }}</p>
          <p :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Mín: R$ 50.000 | Máx: R$ 10.000.000</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição</span>
          <input v-if="isEditing" type="text" :value="modelValue.tipoContribuicao === 'anual' ? modelValue.iea.contribuicaoAnual : modelValue.iea.contribuicaoMensal" readonly :style="inputReadonly" placeholder="Calculado automaticamente" />
          <p v-else :style="readonlyVal">{{ (modelValue.tipoContribuicao === 'anual' ? modelValue.iea.contribuicaoAnual : modelValue.iea.contribuicaoMensal) || '—' }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- ── 4. Invalidez Permanente Parcial ou Total por Acidente (IPA) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.ipa.ativo" @change="() => toggleCobertura('ipa')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.ipa.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.ipa.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Invalidez Permanente Parcial ou Total por Acidente (IPA)</p>
      <div :style="{ marginLeft: 'auto', cursor: 'pointer', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" @mouseenter="(e) => showTooltip(e, 'ipa')" @mouseleave="hideTooltip">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v1m0 3v4"/></svg>
      </div>
    </div>
    <template v-if="modelValue.ipa.ativo">
      <div :style="grid4">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Tempo de Contribuição</span>
          <p :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.ipa.capitalSegurado" @input="(e) => onCapitalChange('ipa', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.ipa.capitalSegurado || '—' }}</p>
          <p v-if="erroIPA" :style="erroStyle">⚠ {{ erroIPA }}</p>
          <p v-else :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Mín: R$ 50.000 | Máx: R$ 10.000.000</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição</span>
          <input v-if="isEditing" type="text" :value="modelValue.tipoContribuicao === 'anual' ? modelValue.ipa.contribuicaoAnual : modelValue.ipa.contribuicaoMensal" readonly :style="inputReadonly" placeholder="Calculado automaticamente" />
          <p v-else :style="readonlyVal">{{ (modelValue.tipoContribuicao === 'anual' ? modelValue.ipa.contribuicaoAnual : modelValue.ipa.contribuicaoMensal) || '—' }}</p>
        </div>
      </div>
      <div :style="{ ...grid2, marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Retirar Vínculo de Capital?</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.ipa.retirarVinculo === 'Sim'" @change="() => onOpcaoChange('ipa', 'retirarVinculo', 'Sim')" /> Sim
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.ipa.retirarVinculo !== 'Sim'" @change="() => onOpcaoChange('ipa', 'retirarVinculo', 'Não')" /> Não
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.ipa.retirarVinculo || 'Não' }}</p>
        </div>
        <div>
          <span :style="labelStyle">IPA Majorada?</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.ipa.majorada === 'Sim'" @change="() => onOpcaoChange('ipa', 'majorada', 'Sim')" /> Sim
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.ipa.majorada !== 'Sim'" @change="() => onOpcaoChange('ipa', 'majorada', 'Não')" /> Não
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.ipa.majorada || 'Não' }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- ── 5. Indenização Especial de Invalidez por Doença (IED) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.ied.ativo" @change="() => toggleCobertura('ied')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.ied.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.ied.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Indenização Especial de Invalidez por Doença (IED)</p>
      <div :style="{ marginLeft: 'auto', cursor: 'pointer', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" @mouseenter="(e) => showTooltip(e, 'ied')" @mouseleave="hideTooltip">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v1m0 3v4"/></svg>
      </div>
    </div>
    <template v-if="modelValue.ied.ativo">
      <div :style="grid4">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Tempo de Contribuição</span>
          <p :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.ied.capitalSegurado" @input="(e) => onCapitalChange('ied', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.ied.capitalSegurado || '—' }}</p>
          <p :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Mín: R$ 50.000 | Máx: R$ 1.000.000</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição</span>
          <input v-if="isEditing" type="text" :value="modelValue.tipoContribuicao === 'anual' ? modelValue.ied.contribuicaoAnual : modelValue.ied.contribuicaoMensal" readonly :style="inputReadonly" placeholder="Calculado automaticamente" />
          <p v-else :style="readonlyVal">{{ (modelValue.tipoContribuicao === 'anual' ? modelValue.ied.contribuicaoAnual : modelValue.ied.contribuicaoMensal) || '—' }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- ── 6. Diagnóstico de Doenças Graves (DG) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.dg.ativo" @change="() => toggleCobertura('dg')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.dg.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.dg.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Diagnóstico de Doenças Graves (DG)</p>

      <div :style="{ marginLeft: 'auto', cursor: 'pointer', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" @mouseenter="(e) => showTooltip(e, 'dg')" @mouseleave="hideTooltip">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v1m0 3v4"/></svg>
      </div>
    </div>
    <template v-if="modelValue.dg.ativo">
      <div :style="grid4">
        <div>
          <span :style="labelStyle">Vigência</span>
          <select v-if="isEditing" :value="modelValue.dg.vigencia" @change="(e) => updateCobertura('dg', 'vigencia', (e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="v in VIGENCIA_TEMP_ONLY" :key="v" :value="v">{{ v }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.dg.vigencia || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Tempo de Contribuição</span>
          <select v-if="isEditing" :value="modelValue.dg.prazoPagamento" @change="(e) => updateCobertura('dg', 'prazoPagamento', (e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="p in TEMPO_CONTRIB_OPTS" :key="p" :value="p">{{ p }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.dg.prazoPagamento || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.dg.capitalSegurado" @input="(e) => onCapitalChange('dg', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dg.capitalSegurado || '—' }}</p>
          <p v-if="erroDG" :style="erroStyle">⚠ {{ erroDG }}</p>
          <p v-else :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Mín: R$ 50.000 | Máx: R$ 1.000.000</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição</span>
          <input v-if="isEditing" type="text" :value="modelValue.tipoContribuicao === 'anual' ? modelValue.dg.contribuicaoAnual : modelValue.dg.contribuicaoMensal" readonly :style="inputReadonly" placeholder="Calculado automaticamente" />
          <p v-else :style="readonlyVal">{{ (modelValue.tipoContribuicao === 'anual' ? modelValue.dg.contribuicaoAnual : modelValue.dg.contribuicaoMensal) || '—' }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- ── 7. Diária de Internação Hospitalar (DIH) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.dih.ativo" @change="() => toggleCobertura('dih')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.dih.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.dih.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Diária de Internação Hospitalar (DIH)</p>

      <div :style="{ marginLeft: 'auto', cursor: 'pointer', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" @mouseenter="(e) => showTooltip(e, 'dih')" @mouseleave="hideTooltip">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v1m0 3v4"/></svg>
      </div>
    </div>
    <template v-if="modelValue.dih.ativo">
      <div :style="grid4">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">5 anos</p>
        </div>
        <div>
          <span :style="labelStyle">Tempo de Contribuição</span>
          <p :style="readonlyVal">5 anos</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado (diária) *</span>
          <input v-if="isEditing" type="text" :value="modelValue.dih.capitalSegurado" @input="(e) => onCapitalChange('dih', (e.target as HTMLInputElement).value)" :placeholder="`R$ 100,00 – ${formatBRL(maxDIH)}`" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dih.capitalSegurado || '—' }}</p>
          <p :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Mín: R$ 100 | Máx: R$ 1.000</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição</span>
          <input v-if="isEditing" type="text" :value="modelValue.tipoContribuicao === 'anual' ? modelValue.dih.contribuicaoAnual : modelValue.dih.contribuicaoMensal" readonly :style="inputReadonly" placeholder="Calculado automaticamente" />
          <p v-else :style="readonlyVal">{{ (modelValue.tipoContribuicao === 'anual' ? modelValue.dih.contribuicaoAnual : modelValue.dih.contribuicaoMensal) || '—' }}</p>
        </div>
      </div>
      <div :style="{ marginTop: '12px' }">
        <span :style="labelStyle">DIH com adicional de UTI?</span>
        <div v-if="isEditing" :style="simNaoStyle">
          <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
            <input type="radio" :checked="modelValue.dih.dihUTI === 'Sim'" @change="() => onOpcaoChange('dih', 'dihUTI', 'Sim')" /> Sim
          </label>
          <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
            <input type="radio" :checked="modelValue.dih.dihUTI !== 'Sim'" @change="() => onOpcaoChange('dih', 'dihUTI', 'Não')" /> Não
          </label>
        </div>
        <p v-else :style="readonlyVal">{{ modelValue.dih.dihUTI || 'Não' }}</p>
      </div>
    </template>
  </div>

  <!-- ── 8. Diária de Incapacidade Temporária (DIT) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.dit.ativo" @change="() => toggleCobertura('dit')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.dit.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.dit.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Diária de Incapacidade Temporária (DIT)</p>

      <div :style="{ marginLeft: 'auto', cursor: 'pointer', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" @mouseenter="(e) => showTooltip(e, 'dit')" @mouseleave="hideTooltip">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v1m0 3v4"/></svg>
      </div>
    </div>
    <template v-if="modelValue.dit.ativo">
      <div :style="grid4">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">5 anos</p>
        </div>
        <div>
          <span :style="labelStyle">Tempo de Contribuição</span>
          <p :style="readonlyVal">5 anos</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado (diária) *</span>
          <input v-if="isEditing" type="text" :value="modelValue.dit.capitalSegurado" @input="(e) => onCapitalChange('dit', (e.target as HTMLInputElement).value)" :placeholder="`R$ 1.000,00 – ${formatBRL(maxDIT)}`" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dit.capitalSegurado || '—' }}</p>
          <p :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Mín: R$ 1.000 | Máx: R$ 30.000.000</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição</span>
          <input v-if="isEditing" type="text" :value="modelValue.tipoContribuicao === 'anual' ? modelValue.dit.contribuicaoAnual : modelValue.dit.contribuicaoMensal" readonly :style="inputReadonly" placeholder="Calculado automaticamente" />
          <p v-else :style="readonlyVal">{{ (modelValue.tipoContribuicao === 'anual' ? modelValue.dit.contribuicaoAnual : modelValue.dit.contribuicaoMensal) || '—' }}</p>
        </div>
      </div>
      <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Franquia Reduzida?</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.franquiaReduzida === 'Sim'" @change="() => onOpcaoChange('dit', 'franquiaReduzida', 'Sim')" /> Sim
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.franquiaReduzida !== 'Sim'" @change="() => onOpcaoChange('dit', 'franquiaReduzida', 'Não')" /> Não
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.dit.franquiaReduzida || 'Não' }}</p>
        </div>
        <div v-if="modelValue.dit.franquiaReduzida === 'Sim'">
          <span :style="labelStyle">Quantidade de Dias</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.quantidadeDias === '7 dias'" @change="() => onOpcaoChange('dit', 'quantidadeDias', '7 dias')" /> 7 dias
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.quantidadeDias === '15 dias'" @change="() => onOpcaoChange('dit', 'quantidadeDias', '15 dias')" /> 15 dias
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.dit.quantidadeDias || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Eventos com LER/DORT/LTC?</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.lerDortLtc === 'Sim'" @change="() => onOpcaoChange('dit', 'lerDortLtc', 'Sim')" /> Sim
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.lerDortLtc !== 'Sim'" @change="() => onOpcaoChange('dit', 'lerDortLtc', 'Não')" /> Não
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.dit.lerDortLtc || 'Não' }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- ── 9. Serviço de Assistência Funeral (SAF) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.saf.ativo" @change="() => toggleCobertura('saf')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.saf.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.saf.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Serviço de Assistência Funeral (SAF)</p>
      <div :style="{ marginLeft: 'auto', cursor: 'pointer', color: 'oklch(55% 0.02 250)', flexShrink: 0 }" @mouseenter="(e) => showTooltip(e, 'saf')" @mouseleave="hideTooltip">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v1m0 3v4"/></svg>
      </div>
    </div>
    <template v-if="modelValue.saf.ativo">
      <div :style="grid4">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Tempo de Contribuição</span>
          <select v-if="isEditing" :value="modelValue.saf.prazoPagamento" @change="(e) => updateCobertura('saf', 'prazoPagamento', (e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="p in TEMPO_CONTRIB_SAF" :key="p" :value="p">{{ p }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.saf.prazoPagamento || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado</span>
          <p :style="readonlyVal">R$ 12.000,00</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição</span>
          <input v-if="isEditing" type="text" :value="modelValue.tipoContribuicao === 'anual' ? modelValue.saf.contribuicaoAnual : modelValue.saf.contribuicaoMensal" readonly :style="inputReadonly" placeholder="Calculado automaticamente" />
          <p v-else :style="readonlyVal">{{ (modelValue.tipoContribuicao === 'anual' ? modelValue.saf.contribuicaoAnual : modelValue.saf.contribuicaoMensal) || '—' }}</p>
        </div>
      </div>
      <div :style="{ marginTop: '12px' }">
        <span :style="labelStyle">Tipo de SAF</span>
        <div v-if="isEditing" :style="simNaoStyle">
          <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
            <input type="radio" :checked="modelValue.saf.tipoSAF === 'Individual'" @change="() => onOpcaoChange('saf', 'tipoSAF', 'Individual')" /> Individual
          </label>
          <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
            <input type="radio" :checked="modelValue.saf.tipoSAF === 'Familiar'" @change="() => onOpcaoChange('saf', 'tipoSAF', 'Familiar')" /> Familiar
          </label>
        </div>
        <p v-else :style="readonlyVal">{{ modelValue.saf.tipoSAF || 'Individual' }}</p>
      </div>
    </template>
  </div>

  <!-- ── Tooltip Overlay ── -->
  <teleport to="body">
    <div v-if="tooltipVisible" :style="{ position: 'fixed', left: tooltipX + 'px', top: tooltipY + 'px', transform: 'translateX(-50%) translateY(-100%)', background: 'oklch(15% 0.05 250)', color: '#fff', fontSize: '12px', lineHeight: '1.5', padding: '10px 14px', borderRadius: '8px', maxWidth: '320px', zIndex: 9999, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }">
      {{ tooltipText }}
      <div :style="{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid oklch(15% 0.05 250)' }"></div>
    </div>
  </teleport>

  <!-- ── Resumo de Contribuição ── -->
  <div :style="{ border: '1px solid oklch(85% 0.01 250)', borderRadius: '8px', padding: '16px', marginTop: '8px', background: 'oklch(97% 0.003 260)' }">
    <p :style="{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(40% 0.05 250)', marginBottom: '12px' }">Resumo de Contribuição</p>
    <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }">
      <!-- Contribuição Mensal -->
      <div :style="{ border: `2px solid ${modelValue.tipoContribuicao === 'mensal' ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)'}`, borderRadius: '8px', padding: '14px', background: modelValue.tipoContribuicao === 'mensal' ? 'oklch(20% 0.05 250)' : '#fff', cursor: isEditing ? 'pointer' : 'default', transition: 'all 0.2s' }" @click="() => { if (isEditing) updateField('tipoContribuicao', 'mensal') }">
        <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }">
          <div :style="{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${modelValue.tipoContribuicao === 'mensal' ? '#fff' : 'oklch(60% 0.02 250)'}`, background: modelValue.tipoContribuicao === 'mensal' ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
            <div v-if="modelValue.tipoContribuicao === 'mensal'" :style="{ width: '8px', height: '8px', borderRadius: '50%', background: 'oklch(20% 0.05 250)' }"></div>
          </div>
          <span :style="{ fontSize: '13px', fontWeight: 600, color: modelValue.tipoContribuicao === 'mensal' ? '#fff' : 'oklch(30% 0.05 250)' }">Contribuição mensal</span>
        </div>
        <p :style="{ fontSize: '22px', fontWeight: 700, color: modelValue.tipoContribuicao === 'mensal' ? '#fff' : 'oklch(20% 0.05 250)', margin: 0, marginLeft: '24px' }">{{ totalMensal > 0 ? totalMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00' }}</p>
        <p :style="{ fontSize: '11px', color: modelValue.tipoContribuicao === 'mensal' ? 'rgba(255,255,255,0.7)' : 'oklch(55% 0.02 250)', margin: 0, marginLeft: '24px', marginTop: '2px' }">(12 x = {{ (totalMensal * 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }})</p>
      </div>
      <!-- Contribuição Anual -->
      <div :style="{ border: `2px solid ${modelValue.tipoContribuicao === 'anual' ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)'}`, borderRadius: '8px', padding: '14px', background: modelValue.tipoContribuicao === 'anual' ? 'oklch(20% 0.05 250)' : '#fff', cursor: isEditing ? 'pointer' : 'default', transition: 'all 0.2s' }" @click="() => { if (isEditing) updateField('tipoContribuicao', 'anual') }">
        <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }">
          <div :style="{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${modelValue.tipoContribuicao === 'anual' ? '#fff' : 'oklch(60% 0.02 250)'}`, background: modelValue.tipoContribuicao === 'anual' ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
            <div v-if="modelValue.tipoContribuicao === 'anual'" :style="{ width: '8px', height: '8px', borderRadius: '50%', background: 'oklch(20% 0.05 250)' }"></div>
          </div>
          <span :style="{ fontSize: '13px', fontWeight: 600, color: modelValue.tipoContribuicao === 'anual' ? '#fff' : 'oklch(30% 0.05 250)' }">Contribuição anual</span>
        </div>
        <p :style="{ fontSize: '22px', fontWeight: 700, color: modelValue.tipoContribuicao === 'anual' ? '#fff' : 'oklch(20% 0.05 250)', margin: 0, marginLeft: '24px' }">{{ totalAnual > 0 ? totalAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00' }}</p>
        <p :style="{ fontSize: '11px', color: modelValue.tipoContribuicao === 'anual' ? 'rgba(255,255,255,0.7)' : 'oklch(55% 0.02 250)', margin: 0, marginLeft: '24px', marginTop: '2px' }">(Desconto aplicado de 4%)</p>
      </div>
    </div>
  </div>
</template>
