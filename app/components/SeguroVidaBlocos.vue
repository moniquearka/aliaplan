<script setup lang="ts">
import { computed } from 'vue'
import type { SeguroVidaData, CoberturaSeguro } from '~/stores/jornada'

const props = defineProps<{
  modelValue: SeguroVidaData
  isEditing: boolean
  capitalMorteBase: number   // Capital Segurado do bloco Morte (para calcular limites DIH/DIT)
}>()
const emit = defineEmits<{ 'update:modelValue': [val: SeguroVidaData] }>()

// ── Opções ────────────────────────────────────────────────────────────────────
const VIGENCIA_VITALICIA_TEMP = ['Vitalícia', 'Temporária 5 anos', 'Temporária 10 anos', 'Temporária 15 anos', 'Temporária 20 anos', 'Temporária 25 anos']
const VIGENCIA_TEMP_ONLY = ['Temporária 5 anos', 'Temporária 10 anos', 'Temporária 15 anos', 'Temporária 20 anos', 'Temporária 25 anos']
const PRAZO_OPTS = ['Vitalício', '5 anos', '10 anos', '15 anos', '20 anos', '25 anos', '30 anos']
const PRAZO_OPTS_SAF = ['10 anos', '15 anos', '20 anos', '25 anos', '30 anos']
const CINCO_ANOS_ONLY = ['5 anos']

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

// ── Cálculo de totais ─────────────────────────────────────────────────────────
const totalMensal = computed(() => {
  let total = 0
  const sv = props.modelValue
  const cobKeys: (keyof SeguroVidaData)[] = ['morte', 'morteTemp', 'iea', 'ipa', 'ied', 'dg', 'dih', 'dit', 'saf']
  for (const k of cobKeys) {
    const cob = sv[k] as CoberturaSeguro
    if (cob.ativo) total += parseBRL(cob.contribuicaoMensal)
  }
  return total
})
const totalAnual = computed(() => {
  let total = 0
  const sv = props.modelValue
  const cobKeys: (keyof SeguroVidaData)[] = ['morte', 'morteTemp', 'iea', 'ipa', 'ied', 'dg', 'dih', 'dit', 'saf']
  for (const k of cobKeys) {
    const cob = sv[k] as CoberturaSeguro
    if (cob.ativo) total += parseBRL(cob.contribuicaoAnual)
  }
  return total
})

// ── Limites DIH/DIT ───────────────────────────────────────────────────────────
const maxDIH = computed(() => {
  const limite = props.capitalMorteBase / 250
  return Math.min(limite, 1000)
})
const maxDIT = computed(() => {
  const limite = props.capitalMorteBase * 0.1
  return Math.min(limite, 30000)
})

// ── Estilos reutilizáveis ─────────────────────────────────────────────────────
const cardStyle = { border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#fff' }
const labelStyle = { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', marginBottom: '4px', display: 'block' }
const inputStyle = { border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '6px 10px', fontSize: '13px', background: '#fff', color: 'oklch(20% 0.05 250)', outline: 'none', width: '100%' }
const selectStyle = { border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '6px 10px', fontSize: '13px', background: '#fff', color: 'oklch(20% 0.05 250)', outline: 'none', width: '100%', cursor: 'pointer' }
const readonlyVal = { fontSize: '13px', color: 'oklch(25% 0.05 250)', fontWeight: 500 }
const gridRow = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }
const gridRow2 = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }
const gridRow4 = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '12px' }
const simNaoStyle = { display: 'flex', gap: '16px', alignItems: 'center' }
</script>

<template>
  <!-- ── Preferência do Proponente ── -->
  <div :style="{ ...cardStyle, background: 'oklch(97% 0.003 260)', marginBottom: '20px' }">
    <p :style="{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(40% 0.05 250)', marginBottom: '12px' }">Preferência do Proponente</p>
    <div :style="gridRow">
      <div>
        <span :style="labelStyle">Vigência *</span>
        <select v-if="isEditing" :value="modelValue.vigenciaGlobal" @change="(e) => updateField('vigenciaGlobal', (e.target as HTMLSelectElement).value)" :style="selectStyle">
          <option v-for="v in VIGENCIA_VITALICIA_TEMP" :key="v" :value="v">{{ v }}</option>
        </select>
        <p v-else :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
      </div>
      <div>
        <span :style="labelStyle">Prazo de Pagamento *</span>
        <select v-if="isEditing" :value="modelValue.prazoPagamentoGlobal" @change="(e) => updateField('prazoPagamentoGlobal', (e.target as HTMLSelectElement).value)" :style="selectStyle">
          <option v-for="p in PRAZO_OPTS" :key="p" :value="p">{{ p }}</option>
        </select>
        <p v-else :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
      </div>
    </div>
  </div>

  <!-- ── 1. Morte Natural ou Acidental + Adiantamento por Doença Terminal (Obrigatório) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <div :style="{ width: '14px', height: '14px', borderRadius: '3px', background: 'oklch(20% 0.05 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Morte Natural ou Acidental + Adiantamento por Doença Terminal <span :style="{ fontSize: '11px', color: 'oklch(50% 0.15 30)', fontWeight: 600 }">(Obrigatório)</span></p>
    </div>
    <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginBottom: '12px', marginLeft: '22px' }">Código: MQC_Adc | Capital Livre | Mín: R$ 50.000 | Máx: R$ 20.000.000</p>
    <div :style="gridRow">
      <div>
        <span :style="labelStyle">Vigência</span>
        <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
      </div>
      <div>
        <span :style="labelStyle">Prazo de Pagamento</span>
        <p :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
      </div>
      <div>
        <span :style="labelStyle">Capital Segurado *</span>
        <input v-if="isEditing" type="text" :value="modelValue.morte.capitalSegurado" @input="(e) => updateCobertura('morte', 'capitalSegurado', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
        <p v-else :style="readonlyVal">{{ modelValue.morte.capitalSegurado || '—' }}</p>
      </div>
    </div>
    <div :style="{ ...gridRow2, marginTop: '12px' }">
      <div>
        <span :style="labelStyle">Contribuição Mensal</span>
        <input v-if="isEditing" type="text" :value="modelValue.morte.contribuicaoMensal" @input="(e) => updateCobertura('morte', 'contribuicaoMensal', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
        <p v-else :style="readonlyVal">{{ modelValue.morte.contribuicaoMensal || '—' }}</p>
      </div>
      <div>
        <span :style="labelStyle">Contribuição Anual</span>
        <input v-if="isEditing" type="text" :value="modelValue.morte.contribuicaoAnual" @input="(e) => updateCobertura('morte', 'contribuicaoAnual', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
        <p v-else :style="readonlyVal">{{ modelValue.morte.contribuicaoAnual || '—' }}</p>
      </div>
    </div>
  </div>

  <!-- ── 2. Morte Natural ou Acidental (Vigência Temporária) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.morteTemp.ativo" @change="() => toggleCobertura('morteTemp')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.morteTemp.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.morteTemp.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Morte Natural ou Acidental (Vigência Temporária)</p>
    </div>
    <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginBottom: '12px', marginLeft: '22px' }">Código: MQC_Basica | Capital Livre | Mín: R$ 50.000 | Máx: R$ 20.000.000</p>
    <template v-if="modelValue.morteTemp.ativo">
      <div :style="gridRow">
        <div>
          <span :style="labelStyle">Vigência</span>
          <select v-if="isEditing" :value="modelValue.morteTemp.vigencia" @change="(e) => updateCobertura('morteTemp', 'vigencia', (e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="v in VIGENCIA_TEMP_ONLY" :key="v" :value="v">{{ v }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.morteTemp.vigencia || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Prazo de Pagamento</span>
          <select v-if="isEditing" :value="modelValue.morteTemp.prazoPagamento" @change="(e) => updateCobertura('morteTemp', 'prazoPagamento', (e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="p in PRAZO_OPTS" :key="p" :value="p">{{ p }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.morteTemp.prazoPagamento || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.morteTemp.capitalSegurado" @input="(e) => updateCobertura('morteTemp', 'capitalSegurado', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.morteTemp.capitalSegurado || '—' }}</p>
        </div>
      </div>
      <div :style="{ ...gridRow2, marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Contribuição Mensal</span>
          <input v-if="isEditing" type="text" :value="modelValue.morteTemp.contribuicaoMensal" @input="(e) => updateCobertura('morteTemp', 'contribuicaoMensal', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.morteTemp.contribuicaoMensal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição Anual</span>
          <input v-if="isEditing" type="text" :value="modelValue.morteTemp.contribuicaoAnual" @input="(e) => updateCobertura('morteTemp', 'contribuicaoAnual', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.morteTemp.contribuicaoAnual || '—' }}</p>
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
    </div>
    <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginBottom: '12px', marginLeft: '22px' }">Código: IEA | Capital Livre | Mín: R$ 50.000 | Máx: R$ 10.000.000</p>
    <template v-if="modelValue.iea.ativo">
      <div :style="gridRow">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Prazo de Pagamento</span>
          <p :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.iea.capitalSegurado" @input="(e) => updateCobertura('iea', 'capitalSegurado', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.iea.capitalSegurado || '—' }}</p>
        </div>
      </div>
      <div :style="{ ...gridRow2, marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Contribuição Mensal</span>
          <input v-if="isEditing" type="text" :value="modelValue.iea.contribuicaoMensal" @input="(e) => updateCobertura('iea', 'contribuicaoMensal', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.iea.contribuicaoMensal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição Anual</span>
          <input v-if="isEditing" type="text" :value="modelValue.iea.contribuicaoAnual" @input="(e) => updateCobertura('iea', 'contribuicaoAnual', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.iea.contribuicaoAnual || '—' }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- ── 4. Invalidez Permanente Total ou Parcial por Acidente (IPA) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.ipa.ativo" @change="() => toggleCobertura('ipa')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.ipa.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.ipa.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Invalidez Permanente Total ou Parcial por Acidente (IPA)</p>
    </div>
    <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginBottom: '12px', marginLeft: '22px' }">Código: IPA / IPA2 / IPAM / IPAM2 | Capital Livre | Mín: R$ 50.000 | Máx: R$ 10.000.000</p>
    <template v-if="modelValue.ipa.ativo">
      <div :style="gridRow">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Prazo de Pagamento</span>
          <p :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.ipa.capitalSegurado" @input="(e) => updateCobertura('ipa', 'capitalSegurado', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.ipa.capitalSegurado || '—' }}</p>
        </div>
      </div>
      <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Retirar Vínculo de Capital?</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.ipa.retirarVinculo === 'Sim'" @change="() => updateCobertura('ipa', 'retirarVinculo', 'Sim')" /> Sim
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.ipa.retirarVinculo !== 'Sim'" @change="() => updateCobertura('ipa', 'retirarVinculo', 'Não')" /> Não
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.ipa.retirarVinculo || 'Não' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Majorada?</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.ipa.majorada === 'Sim'" @change="() => updateCobertura('ipa', 'majorada', 'Sim')" /> Sim
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.ipa.majorada !== 'Sim'" @change="() => updateCobertura('ipa', 'majorada', 'Não')" /> Não
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.ipa.majorada || 'Não' }}</p>
        </div>
      </div>
      <div :style="{ ...gridRow2, marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Contribuição Mensal</span>
          <input v-if="isEditing" type="text" :value="modelValue.ipa.contribuicaoMensal" @input="(e) => updateCobertura('ipa', 'contribuicaoMensal', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.ipa.contribuicaoMensal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição Anual</span>
          <input v-if="isEditing" type="text" :value="modelValue.ipa.contribuicaoAnual" @input="(e) => updateCobertura('ipa', 'contribuicaoAnual', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.ipa.contribuicaoAnual || '—' }}</p>
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
    </div>
    <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginBottom: '12px', marginLeft: '22px' }">Código: IED | Capital Livre | Mín: R$ 50.000 | Máx: R$ 1.000.000</p>
    <template v-if="modelValue.ied.ativo">
      <div :style="gridRow">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Prazo de Pagamento</span>
          <p :style="readonlyVal">{{ modelValue.prazoPagamentoGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.ied.capitalSegurado" @input="(e) => updateCobertura('ied', 'capitalSegurado', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.ied.capitalSegurado || '—' }}</p>
        </div>
      </div>
      <div :style="{ ...gridRow2, marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Contribuição Mensal</span>
          <input v-if="isEditing" type="text" :value="modelValue.ied.contribuicaoMensal" @input="(e) => updateCobertura('ied', 'contribuicaoMensal', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.ied.contribuicaoMensal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição Anual</span>
          <input v-if="isEditing" type="text" :value="modelValue.ied.contribuicaoAnual" @input="(e) => updateCobertura('ied', 'contribuicaoAnual', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.ied.contribuicaoAnual || '—' }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- ── 6. Doenças Graves (DG) ── -->
  <div :style="cardStyle">
    <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }">
      <input v-if="isEditing" type="checkbox" :checked="modelValue.dg.ativo" @change="() => toggleCobertura('dg')" :style="{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }" />
      <div v-else :style="{ width: '14px', height: '14px', borderRadius: '3px', background: modelValue.dg.ativo ? 'oklch(20% 0.05 250)' : 'oklch(88% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg v-if="modelValue.dg.ativo" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">Doenças Graves (DG)</p>
    </div>
    <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginBottom: '12px', marginLeft: '22px' }">Código: DG_24 | Capital Livre | Mín: R$ 50.000 | Máx: R$ 1.000.000 | Vigência: até 5 anos</p>
    <template v-if="modelValue.dg.ativo">
      <div :style="gridRow">
        <div>
          <span :style="labelStyle">Vigência</span>
          <select v-if="isEditing" :value="modelValue.dg.vigencia" @change="(e) => updateCobertura('dg', 'vigencia', (e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="v in VIGENCIA_TEMP_ONLY" :key="v" :value="v">{{ v }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.dg.vigencia || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Prazo de Pagamento</span>
          <select v-if="isEditing" :value="modelValue.dg.prazoPagamento" @change="(e) => updateCobertura('dg', 'prazoPagamento', (e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="p in PRAZO_OPTS" :key="p" :value="p">{{ p }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.dg.prazoPagamento || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado *</span>
          <input v-if="isEditing" type="text" :value="modelValue.dg.capitalSegurado" @input="(e) => updateCobertura('dg', 'capitalSegurado', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dg.capitalSegurado || '—' }}</p>
        </div>
      </div>
      <div :style="{ ...gridRow2, marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Contribuição Mensal</span>
          <input v-if="isEditing" type="text" :value="modelValue.dg.contribuicaoMensal" @input="(e) => updateCobertura('dg', 'contribuicaoMensal', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dg.contribuicaoMensal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição Anual</span>
          <input v-if="isEditing" type="text" :value="modelValue.dg.contribuicaoAnual" @input="(e) => updateCobertura('dg', 'contribuicaoAnual', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dg.contribuicaoAnual || '—' }}</p>
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
    </div>
    <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginBottom: '12px', marginLeft: '22px' }">Código: DIH / DIHUTI | Capital Livre | Mín: R$ 100 | Máx: R$ 1.000 (ou Capital Morte ÷ 250) | Vigência: 5 anos</p>
    <template v-if="modelValue.dih.ativo">
      <div :style="gridRow">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">5 anos</p>
        </div>
        <div>
          <span :style="labelStyle">Prazo de Pagamento</span>
          <p :style="readonlyVal">5 anos</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado * <span :style="{ fontSize: '10px', color: 'oklch(50% 0.1 200)', fontWeight: 400 }" title="Referente ao valor da diária">ⓘ</span></span>
          <input v-if="isEditing" type="text" :value="modelValue.dih.capitalSegurado" @input="(e) => updateCobertura('dih', 'capitalSegurado', (e.target as HTMLInputElement).value)" :placeholder="`R$ 100,00 – R$ ${maxDIH.toFixed(2).replace('.', ',')}`" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dih.capitalSegurado || '—' }}</p>
          <p v-if="isEditing" :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Referente ao valor da diária. Máx: {{ formatBRL(maxDIH) || 'R$ 1.000,00' }}</p>
        </div>
      </div>
      <div :style="{ marginTop: '12px' }">
        <span :style="labelStyle">DIH com adicional de UTI?</span>
        <div v-if="isEditing" :style="simNaoStyle">
          <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
            <input type="radio" :checked="modelValue.dih.dihUTI === 'Sim'" @change="() => updateCobertura('dih', 'dihUTI', 'Sim')" /> Sim
          </label>
          <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
            <input type="radio" :checked="modelValue.dih.dihUTI !== 'Sim'" @change="() => updateCobertura('dih', 'dihUTI', 'Não')" /> Não
          </label>
        </div>
        <p v-else :style="readonlyVal">{{ modelValue.dih.dihUTI || 'Não' }}</p>
      </div>
      <div :style="{ ...gridRow2, marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Contribuição Mensal</span>
          <input v-if="isEditing" type="text" :value="modelValue.dih.contribuicaoMensal" @input="(e) => updateCobertura('dih', 'contribuicaoMensal', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dih.contribuicaoMensal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição Anual</span>
          <input v-if="isEditing" type="text" :value="modelValue.dih.contribuicaoAnual" @input="(e) => updateCobertura('dih', 'contribuicaoAnual', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dih.contribuicaoAnual || '—' }}</p>
        </div>
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
    </div>
    <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginBottom: '12px', marginLeft: '22px' }">Código: DIT0_7M1/M2 ou DIT0_15M1/M2 | Capital Livre | Mín: R$ 1.000 | Máx: R$ 30.000 (ou 10% Capital Morte) | Vigência: 5 anos</p>
    <template v-if="modelValue.dit.ativo">
      <div :style="gridRow">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">5 anos</p>
        </div>
        <div>
          <span :style="labelStyle">Prazo de Pagamento</span>
          <p :style="readonlyVal">5 anos</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado * <span :style="{ fontSize: '10px', color: 'oklch(50% 0.1 200)', fontWeight: 400 }" title="Definido como se fosse a renda mensal">ⓘ</span></span>
          <input v-if="isEditing" type="text" :value="modelValue.dit.capitalSegurado" @input="(e) => updateCobertura('dit', 'capitalSegurado', (e.target as HTMLInputElement).value)" :placeholder="`R$ 1.000,00 – R$ ${maxDIT.toLocaleString('pt-BR', {minimumFractionDigits:2})}`" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dit.capitalSegurado || '—' }}</p>
          <p v-if="isEditing" :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', marginTop: '2px' }">Definido como se fosse a renda mensal. Máx: {{ formatBRL(maxDIT) || 'R$ 30.000,00' }}</p>
        </div>
      </div>
      <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Franquia Reduzida?</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.franquiaReduzida === 'Sim'" @change="() => updateCobertura('dit', 'franquiaReduzida', 'Sim')" /> Sim
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.franquiaReduzida !== 'Sim'" @change="() => updateCobertura('dit', 'franquiaReduzida', 'Não')" /> Não
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.dit.franquiaReduzida || 'Não' }}</p>
        </div>
        <div v-if="modelValue.dit.franquiaReduzida === 'Sim'">
          <span :style="labelStyle">Quantidade de Dias</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.quantidadeDias === '7 dias'" @change="() => updateCobertura('dit', 'quantidadeDias', '7 dias')" /> 7 dias
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.quantidadeDias === '15 dias'" @change="() => updateCobertura('dit', 'quantidadeDias', '15 dias')" /> 15 dias
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.dit.quantidadeDias || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Eventos com LER/DORT/LTC?</span>
          <div v-if="isEditing" :style="simNaoStyle">
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.lerDortLtc === 'Sim'" @change="() => updateCobertura('dit', 'lerDortLtc', 'Sim')" /> Sim
            </label>
            <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
              <input type="radio" :checked="modelValue.dit.lerDortLtc !== 'Sim'" @change="() => updateCobertura('dit', 'lerDortLtc', 'Não')" /> Não
            </label>
          </div>
          <p v-else :style="readonlyVal">{{ modelValue.dit.lerDortLtc || 'Não' }}</p>
        </div>
      </div>
      <div :style="{ ...gridRow2, marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Contribuição Mensal</span>
          <input v-if="isEditing" type="text" :value="modelValue.dit.contribuicaoMensal" @input="(e) => updateCobertura('dit', 'contribuicaoMensal', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dit.contribuicaoMensal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição Anual</span>
          <input v-if="isEditing" type="text" :value="modelValue.dit.contribuicaoAnual" @input="(e) => updateCobertura('dit', 'contribuicaoAnual', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.dit.contribuicaoAnual || '—' }}</p>
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
    </div>
    <p :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', marginBottom: '12px', marginLeft: '22px' }">Código: SAF_Ind / SAF_Fam | Uniforme | Capital fixo: R$ 12.000</p>
    <template v-if="modelValue.saf.ativo">
      <div :style="gridRow">
        <div>
          <span :style="labelStyle">Vigência</span>
          <p :style="readonlyVal">{{ modelValue.vigenciaGlobal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Prazo de Pagamento</span>
          <select v-if="isEditing" :value="modelValue.saf.prazoPagamento" @change="(e) => updateCobertura('saf', 'prazoPagamento', (e.target as HTMLSelectElement).value)" :style="selectStyle">
            <option v-for="p in PRAZO_OPTS_SAF" :key="p" :value="p">{{ p }}</option>
          </select>
          <p v-else :style="readonlyVal">{{ modelValue.saf.prazoPagamento || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Capital Segurado</span>
          <p :style="readonlyVal">R$ 12.000,00</p>
        </div>
      </div>
      <div :style="{ marginTop: '12px' }">
        <span :style="labelStyle">Tipo de SAF</span>
        <div v-if="isEditing" :style="simNaoStyle">
          <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
            <input type="radio" :checked="modelValue.saf.tipoSAF === 'Individual'" @change="() => updateCobertura('saf', 'tipoSAF', 'Individual')" /> Individual
          </label>
          <label :style="{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }">
            <input type="radio" :checked="modelValue.saf.tipoSAF === 'Familiar'" @change="() => updateCobertura('saf', 'tipoSAF', 'Familiar')" /> Familiar
          </label>
        </div>
        <p v-else :style="readonlyVal">{{ modelValue.saf.tipoSAF || 'Individual' }}</p>
      </div>
      <div :style="{ ...gridRow2, marginTop: '12px' }">
        <div>
          <span :style="labelStyle">Contribuição Mensal</span>
          <input v-if="isEditing" type="text" :value="modelValue.saf.contribuicaoMensal" @input="(e) => updateCobertura('saf', 'contribuicaoMensal', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.saf.contribuicaoMensal || '—' }}</p>
        </div>
        <div>
          <span :style="labelStyle">Contribuição Anual</span>
          <input v-if="isEditing" type="text" :value="modelValue.saf.contribuicaoAnual" @input="(e) => updateCobertura('saf', 'contribuicaoAnual', (e.target as HTMLInputElement).value)" placeholder="R$ 0,00" :style="inputStyle" />
          <p v-else :style="readonlyVal">{{ modelValue.saf.contribuicaoAnual || '—' }}</p>
        </div>
      </div>
    </template>
  </div>

  <!-- ── Totais: Contribuição Mensal / Anual ── -->
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
