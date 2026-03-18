<script setup lang="ts">
import { ref, computed } from 'vue'
import { useJornadaStore } from '~/stores/jornada'

function normalizePeriodo(p: string): string {
  if (!p) return p
  if (p === 'PRÓXIMOS 10-20 ANOS' || p === 'EM 20 ANOS (60 ANOS)') return 'LONGO PRAZO'
  return p
}
import { HORIZONTE_VALORES } from '~/data/fundosData'
import type { Plano, Cobertura, FundoSelecionado, SeguroVidaData, Assistencias } from '~/stores/jornada'

const emit = defineEmits<{ back: [] }>()
const store = useJornadaStore()
const isGenerating = ref(false)

const resumoData = computed(() => store.resumoData)
const detalhamentoData = computed(() => store.detalhamentoData)
const proponente = computed(() => store.detalhamentoData.proponente)

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseBRL(val: string): number {
  if (!val) return 0
  const clean = val.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(clean) || 0
}

const totalInvestimento = computed(() => {
  let total = 0
  for (const plano of detalhamentoData.value.planos) {
    if (plano.tipo === 'seguro') {
      for (const cob of plano.coberturas) {
        const lookup = (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]
        total += parseBRL(cob.contribuicaoMensal || lookup?.cm || '')
      }
    } else {
      for (const sub of plano.subPlanos) {
        total += parseBRL(sub.contribuicaoMensal)
      }
    }
  }
  return total
})

const totalPercentual = computed(() => {
  const p1 = parseFloat(resumoData.value.solucoes.protecao.percentual) || 0
  const p2 = parseFloat(resumoData.value.solucoes.previdencia.percentual) || 0
  return p1 + p2
})

// Detalhamento por produto para o bloco Investimento Total
const totalInvestimentoDetalhes = computed(() => {
  const detalhes: Array<{ produto: string; contribuicaoMensal: number; aporteInicial: number }> = []
  for (const plano of detalhamentoData.value.planos) {
    if (plano.tipo === 'seguro') {
      let contrib = 0
      for (const cob of plano.coberturas) {
        const lookup = (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]
        contrib += parseBRL(cob.contribuicaoMensal || lookup?.cm || '')
      }
      if (contrib > 0) {
        detalhes.push({ produto: 'Seguro de Vida (Horizonte)', contribuicaoMensal: contrib, aporteInicial: 0 })
      }
    } else {
      for (const sub of plano.subPlanos) {
        const contrib = parseBRL(sub.contribuicaoMensal)
        const aporte = parseBRL(sub.aporteInicial)
        if (contrib > 0 || aporte > 0) {
          detalhes.push({
            produto: `Previdência (${sub.tipoPlano})`,
            contribuicaoMensal: contrib,
            aporteInicial: aporte
          })
        }
      }
    }
  }
  return detalhes
})

function visaoLongoPrazo(): string {
  const last = resumoData.value.timeline[resumoData.value.timeline.length - 1]
  return last?.descricao || ''
}

function calcCapitalSegurado(cob: Cobertura): string {
  if (cob.capitalSegurado) return cob.capitalSegurado
  const min = parseBRL(cob.valorMin)
  const max = parseBRL(cob.valorMax)
  if (!min || !max) return ''
  const avg = (min + max) / 2
  return `R$ ${avg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

// ── Salvar Estudo ─────────────────────────────────────────────────────────────
async function handleSalvar() {
  isGenerating.value = true
  try {
    window.open('https://moniquearka.github.io/nura-app/estudos-gerados/', '_blank')
  } catch (err) {
    console.error('Erro ao salvar estudo:', err)
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div :style="{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }">
      <div :style="{ width: '36px', height: '36px', borderRadius: '50%', background: 'oklch(95% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }">
        <svg :style="{ width: '16px', height: '16px', color: 'oklch(45% 0.02 250)' }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h1 :style="{ fontSize: '20px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: 0 }">Revisão do Estudo</h1>
        <p :style="{ fontSize: '12px', color: 'oklch(55% 0.02 250)', marginTop: '2px', marginBottom: 0 }">Confirme todas as informações antes de finalizar. Esta tela é somente leitura.</p>
      </div>
    </div>

    <!-- ── SEÇÃO: Resumo Jornada de Vida ── -->
    <div :style="{ padding: '16px 0' }">

      <!-- Dados do Proponente -->
      <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '20px 24px', marginBottom: '12px' }">
        <h3 :style="{ fontSize: '14px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid oklch(90% 0.005 260)', margin: '0 0 14px 0' }">Dados do Proponente</h3>
        <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px' }">
          <div>
            <p class="field-label">CPF</p>
            <p class="field-value">{{ proponente.cpf || '—' }}</p>
          </div>
          <div>
            <p class="field-label">Nome Completo</p>
            <p class="field-value">{{ proponente.nomeCompleto || '—' }}</p>
          </div>
          <div>
            <p class="field-label">Nome Social</p>
            <p class="field-value">{{ proponente.nomeSocial || '—' }}</p>
          </div>
          <div>
            <p class="field-label">Data de Nascimento</p>
            <p class="field-value">{{ proponente.dataNascimento ? proponente.dataNascimento.split('-').reverse().join('/') : '—' }}</p>
          </div>
          <div>
            <p class="field-label">Telefone</p>
            <p class="field-value">{{ proponente.telefone || '—' }}</p>
          </div>
          <div>
            <p class="field-label">E-mail</p>
            <p class="field-value">{{ proponente.email || '—' }}</p>
          </div>
          <div>
            <p class="field-label">Renda Mensal</p>
            <p class="field-value">{{ proponente.rendaMensal || '—' }}</p>
          </div>
          <div>
            <p class="field-label">Profissão</p>
            <p class="field-value">{{ proponente.ocupacao || '—' }}</p>
          </div>
          <div>
            <p class="field-label">Gênero</p>
            <p class="field-value">{{ (proponente as any).genero || '—' }}</p>
          </div>
          <div>
            <p class="field-label">Empresa</p>
            <p class="field-value">{{ proponente.empresa || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Perfil de Personalidade -->
      <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '20px 24px', marginBottom: '12px' }">
        <h3 :style="{ fontSize: '14px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Perfil de Personalidade</h3>
        <div :style="{ display: 'flex', flexDirection: 'column', gap: '12px' }">
          <div>
            <p class="field-label">Tipo de Perfil</p>
            <p class="field-value">{{ resumoData.perfil.tipo || '—' }}</p>
          </div>
          <div>
            <p class="field-label">Descrição</p>
            <p class="field-value">{{ resumoData.perfil.descricao || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Cenários de Risco Atual -->
      <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '20px 24px', marginBottom: '12px' }">
        <h3 :style="{ fontSize: '14px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Cenários de Risco Atual</h3>
        <div :style="{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '12px 16px' }">
          <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '8px', marginTop: 0 }">{{ resumoData.cenario.titulo }}</p>
          <ul :style="{ display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', padding: 0, margin: 0 }">
            <li v-for="(item, i) in resumoData.cenario.itens" :key="i" :style="{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#1e40af' }">
              <span :style="{ marginTop: '6px', width: '6px', height: '6px', borderRadius: '50%', background: '#1e40af', flexShrink: 0, display: 'inline-block' }"></span>
              {{ item }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Vulnerabilidades Identificadas -->
      <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '20px 24px', marginBottom: '12px' }">
        <h3 :style="{ fontSize: '14px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Vulnerabilidades Identificadas</h3>
        <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
          <div v-for="(vuln, i) in resumoData.vulnerabilidades" :key="i" :style="{ background: '#f8fafc', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '12px' }">
            <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 2px 0' }">{{ vuln.titulo }}</p>
            <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', margin: '0 0 4px 0' }">{{ vuln.descricao }}</p>
            <p :style="{ fontSize: '12px', color: '#1e40af', fontWeight: 500, margin: 0 }">Solução: {{ vuln.solucao }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SEÇÃO: Planejamento de Longo Prazo ── -->
    <div :style="{ padding: '16px 0' }">
      <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '20px 24px', marginBottom: '12px' }">
        <h3 :style="{ fontSize: '14px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Planejamento de Longo Prazo</h3>
        <div :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">
          <template v-for="(item, i) in resumoData.timeline" :key="i">
            <!-- Segundo item do Longo Prazo: já renderizado junto com o primeiro, pular -->
            <template v-if="normalizePeriodo(item.periodo) === 'LONGO PRAZO' && i > 0 && normalizePeriodo(resumoData.timeline[i-1].periodo) === 'LONGO PRAZO'">
            </template>
            <!-- Primeiro item do Longo Prazo: renderiza os dois juntos -->
            <template v-else-if="normalizePeriodo(item.periodo) === 'LONGO PRAZO' && i < resumoData.timeline.length - 1 && normalizePeriodo(resumoData.timeline[i+1].periodo) === 'LONGO PRAZO'">
              <div :style="{ background: '#f8fafc', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '12px 16px' }">
                <span :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-block', marginBottom: '10px' }">LONGO PRAZO</span>
                <div :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">
                  <!-- Linha 1: Transição de Carreira (esq) + Risco Financeiro (dir) -->
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'start' }">
                    <div>
                      <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 4px 0' }">{{ item.titulo }}</p>
                      <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', margin: 0, lineHeight: 1.5 }">{{ item.descricao }}</p>
                    </div>
                    <div v-if="item.riscos.length > 0" :style="{ background: 'rgba(239,246,255,0.8)', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px' }">
                      <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1e40af', margin: '0 0 4px 0' }">{{ item.riscoLabel }}</p>
                      <ul :style="{ display: 'flex', flexDirection: 'column', gap: '2px', listStyle: 'none', padding: 0, margin: 0 }">
                        <li v-for="(r, ri) in item.riscos" :key="ri" :style="{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#1e40af' }">
                          <span :style="{ marginTop: '5px', width: '4px', height: '4px', borderRadius: '50%', background: '#1e40af', flexShrink: 0, display: 'inline-block' }"></span>
                          {{ r }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <!-- Linha 2: Aposentadoria Planejada (esq) + Risco Longevidade (dir) -->
                  <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'start' }">
                    <div>
                      <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 4px 0' }">{{ resumoData.timeline[i+1].titulo }}</p>
                      <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', margin: 0, lineHeight: 1.5 }">{{ resumoData.timeline[i+1].descricao }}</p>
                    </div>
                    <div v-if="resumoData.timeline[i+1].riscos.length > 0" :style="{ background: 'rgba(239,246,255,0.8)', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px' }">
                      <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1e40af', margin: '0 0 4px 0' }">{{ resumoData.timeline[i+1].riscoLabel }}</p>
                      <ul :style="{ display: 'flex', flexDirection: 'column', gap: '2px', listStyle: 'none', padding: 0, margin: 0 }">
                        <li v-for="(r, ri) in resumoData.timeline[i+1].riscos" :key="ri" :style="{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#1e40af' }">
                          <span :style="{ marginTop: '5px', width: '4px', height: '4px', borderRadius: '50%', background: '#1e40af', flexShrink: 0, display: 'inline-block' }"></span>
                          {{ r }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <!-- Itens normais (não Longo Prazo) -->
            <template v-else-if="normalizePeriodo(item.periodo) !== 'LONGO PRAZO'">
              <div :style="{ background: '#f8fafc', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '12px 16px' }">
                <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'start' }">
                  <div>
                    <span :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-block', marginBottom: '6px' }">{{ normalizePeriodo(item.periodo) }}</span>
                    <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 4px 0' }">{{ item.titulo }}</p>
                    <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', margin: 0, lineHeight: 1.5 }">{{ item.descricao }}</p>
                  </div>
                  <div v-if="item.riscos.length > 0" :style="{ background: 'rgba(239,246,255,0.8)', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px' }">
                    <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1e40af', margin: '0 0 4px 0' }">{{ item.riscoLabel }}</p>
                    <ul :style="{ display: 'flex', flexDirection: 'column', gap: '2px', listStyle: 'none', padding: 0, margin: 0 }">
                      <li v-for="(r, ri) in item.riscos" :key="ri" :style="{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: '#1e40af' }">
                        <span :style="{ marginTop: '5px', width: '4px', height: '4px', borderRadius: '50%', background: '#1e40af', flexShrink: 0, display: 'inline-block' }"></span>
                        {{ r }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
        <div :style="{ marginTop: '12px', padding: '10px 14px', background: 'oklch(97% 0.003 260)', borderRadius: '8px', borderLeft: '3px solid oklch(75% 0.03 250)' }">
          <p :style="{ fontSize: '12px', fontWeight: 600, color: 'oklch(45% 0.02 250)', marginBottom: '4px', marginTop: 0 }">Visão de Longo Prazo:</p>
          <p :style="{ fontSize: '13px', color: 'oklch(35% 0.03 250)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }">Cada etapa exigirá preparação financeira específica. O acúmulo de capital deve ser constante para suportar os possíveis picos de despesas. Contar com uma previdência privada é uma ferramenta eficiente de planejamento sucessório, pois garante liquidez imediata para a família, ajudando a cobrir custos como do inventário, que podem ser altos e demorados.</p>
        </div>
      </div>
    </div>

    <!-- ── SEÇÃO: Detalhamento do Plano ── -->
    <div :style="{ padding: '16px 0' }">
      <!-- Divisor: Detalhamento do Plano -->
      <div :style="{ background: 'rgba(241,245,249,0.5)', borderRadius: '8px', padding: '5px 12px', border: '1px solid oklch(90% 0.005 260)', marginBottom: '12px', marginTop: '8px' }">
        <p :style="{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'oklch(45% 0.02 250)', margin: 0 }">Detalhamento do Plano</p>
      </div>

      <!-- Planos -->
      <template v-for="(plano, planoIdx) in detalhamentoData.planos.slice(0, 2)" :key="plano.id">
        <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '20px 24px', marginBottom: '12px' }">
          <h3 :style="{ fontSize: '14px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Dados do Plano {{ planoIdx + 1 }}</h3>

          <!-- Tipo de Investimento badge -->
          <div :style="{ marginBottom: '16px' }">
            <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '4px' }">Tipo de Investimento</span>
            <span :style="{ display: 'inline-block', fontSize: '12px', fontWeight: 600, color: 'oklch(20% 0.05 250)', background: 'oklch(95% 0.005 260)', border: '1px solid oklch(85% 0.005 260)', borderRadius: '6px', padding: '4px 12px' }">
              {{ plano.tipo === 'previdencia' ? 'Previdência' : 'Seguro de Vida' }}
            </span>
          </div>

          <!-- Previdência -->
          <template v-if="plano.tipo === 'previdencia'">
            <div :style="{ marginBottom: '16px' }">
              <p class="field-label">Idade para Aposentadoria</p>
              <p class="field-value">{{ plano.idadeAposentadoria || '—' }}</p>
            </div>
            <div v-for="(sub, si) in plano.subPlanos" :key="sub.id" :style="{ marginBottom: si < plano.subPlanos.length - 1 ? '20px' : 0 }">
              <p v-if="plano.subPlanos.length > 1" :style="{ fontSize: '12px', fontWeight: 600, color: 'oklch(45% 0.02 250)', marginBottom: '8px', marginTop: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }">
                Tipo de Plano {{ si + 1 }}: {{ sub.tipoPlano }}
              </p>
              <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px', marginBottom: '12px' }">
                <div>
                  <p class="field-label">Contribuição Mensal</p>
                  <p class="field-value">{{ sub.contribuicaoMensal || '—' }}</p>
                </div>
                <div>
                  <p class="field-label">Aporte Inicial</p>
                  <p class="field-value">{{ sub.aporteInicial || '—' }}</p>
                </div>
                <div>
                  <p class="field-label">Tipo de Plano</p>
                  <p class="field-value">{{ sub.tipoPlano || '—' }}</p>
                </div>
              </div>
              <!-- Fundos -->
              <div v-if="sub.fundos.length > 0">
                <p :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', marginBottom: '8px', marginTop: 0 }">Fundo Selecionado</p>
                <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
                  <div v-for="fundo in sub.fundos" :key="fundo.cnpj" :style="{ background: '#f8fafc', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '10px 14px' }">
                    <!-- Nome do fundo + tarja QUALIFICADO -->
                    <div :style="{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }">
                      <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: 0, whiteSpace: 'normal', wordBreak: 'break-word', flex: 1 }">{{ fundo.nome }}</p>
                      <span v-if="(fundo as any).qualificado" :style="{ fontSize: '10px', fontWeight: 600, color: 'oklch(50% 0.01 260)', background: 'oklch(93% 0.003 260)', border: '1px solid oklch(85% 0.005 260)', borderRadius: '3px', padding: '1px 5px', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }">QUALIFICADO</span>
                    </div>
                    <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontSize: '11px', color: 'oklch(45% 0.02 250)', marginBottom: '4px' }">
                      <span>{{ fundo.cnpj }}</span>
                      <span v-if="fundo.processoSusep">Processo SUSEP: <span :style="{ color: 'oklch(20% 0.05 250)' }">{{ fundo.processoSusep }}</span></span>
                      <span>Carregamento de Entrada e Saída: <span :style="{ color: 'oklch(20% 0.05 250)' }">0%</span></span>
                    </div>
                    <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontSize: '11px', color: 'oklch(45% 0.02 250)', marginBottom: '4px' }">
                      <span>Taxa Máx. Adm.: <span :style="{ color: 'oklch(20% 0.05 250)' }">{{ (fundo as any).taxaAdmMax || fundo.taxaAdm || '-' }}</span></span>
                      <span>Rentabilidade: <span :style="{ color: 'oklch(20% 0.05 250)' }">{{ (fundo as any).rent12m || fundo.rentabilidade || '-' }}</span></span>
                      <span>Estratégia: <span :style="{ color: 'oklch(20% 0.05 250)' }">{{ (fundo as any).estrategia || fundo.classificacao || '-' }}</span></span>
                      <span v-if="fundo.taxaPerformance">Taxa de Performance: <span :style="{ color: 'oklch(20% 0.05 250)' }">{{ fundo.taxaPerformance }}</span></span>
                    </div>
                    <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', fontSize: '11px' }">
                      <span :style="{ color: 'oklch(45% 0.02 250)' }">Contribuição Mensal: <span :style="{ fontWeight: 600, color: 'oklch(20% 0.05 250)' }">{{ fundo.valorAtribuido || '-' }}</span> <span :style="{ color: 'oklch(55% 0.02 250)' }">({{ fundo.percentual }}%)</span></span>
                      <span :style="{ color: 'oklch(45% 0.02 250)' }">Aporte Inicial: <span :style="{ fontWeight: 600, color: 'oklch(20% 0.05 250)' }">{{ fundo.valorAporte || '-' }}</span><span v-if="fundo.percentualAporte && fundo.percentualAporte !== '0'" :style="{ color: 'oklch(55% 0.02 250)' }"> ({{ fundo.percentualAporte }}%)</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Seguro de Vida -->
          <template v-else>
            <!-- Nova estrutura seguroVida -->
            <template v-if="plano.seguroVida">
              <!-- Produto Recomendado -->
              <div v-if="plano.produtoRecomendado" :style="{ marginBottom: '10px' }">
                <label :style="{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(40% 0.05 250)', marginBottom: '6px' }">Produto Recomendado</label>
                <div :style="{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '8px', border: '1px solid oklch(20% 0.05 250)', background: 'rgba(30,64,175,0.04)' }">
                  <div>
                    <p :style="{ fontSize: '13px', fontWeight: 700, color: 'oklch(20% 0.05 250)', margin: 0 }">{{ plano.produtoRecomendado }}</p>
                    <p v-if="plano.produtoRecomendado === 'Horizonte'" :style="{ fontSize: '12px', color: 'oklch(55% 0.02 250)', marginTop: '4px', lineHeight: 1.5 }">O Horizonte é o seguro de vida que oferece a combinação perfeita entre proteção e a possibilidade de formação de reserva, de forma temporária ou durante toda a vida.</p>
                  </div>
                </div>
              </div>
              <!-- Preferência do Proponente -->
              <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px', background: 'oklch(97.5% 0.002 260)' }">
                <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(40% 0.05 250)', marginBottom: '8px' }">Preferência do Proponente</p>
                <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px' }">
                  <div><span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)' }">Vigência: </span><span :style="{ fontSize: '11px', fontWeight: 600, color: 'oklch(25% 0.05 250)' }">{{ plano.seguroVida.vigenciaGlobal || '—' }}</span></div>
                  <div><span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)' }">Tempo de Contribuição: </span><span :style="{ fontSize: '11px', fontWeight: 600, color: 'oklch(25% 0.05 250)' }">{{ plano.seguroVida.prazoPagamentoGlobal || '—' }}</span></div>
                </div>
              </div>
              <!-- Tabela de coberturas ativas -->
              <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }">
                <table :style="{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', tableLayout: 'fixed' }">
                  <colgroup>
                    <col style="width: 55%" />
                    <col style="width: 22%" />
                    <col style="width: 23%" />
                  </colgroup>
                  <thead>
                    <tr :style="{ background: 'oklch(95% 0.005 260)', borderBottom: '1px solid oklch(90% 0.005 260)' }">
                      <th :style="{ textAlign: 'left', padding: '7px 12px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)' }">Cobertura</th>
                      <th :style="{ textAlign: 'center', padding: '7px 8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Capital Segurado</th>
                      <th :style="{ textAlign: 'right', padding: '7px 12px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? 'Contribuição Anual' : 'Contribuição Mensal' }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr :style="{ borderBottom: '1px solid oklch(93% 0.003 260)' }">
                      <td :style="{ padding: '8px 12px', color: 'oklch(25% 0.05 250)', fontWeight: 600, fontSize: '11px' }">
                        <span>Morte Natural ou Acidental + Adiantamento por Doença Terminal</span>
                        <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '3px 0 0 0', lineHeight: 1.5, fontStyle: 'italic', fontWeight: 400 }">Seus beneficiários receberão o valor integral da indenização em caso de morte natural ou acidental. Caso seja constatado estado terminal da doença, você poderá optar por receber, antecipadamente, o valor integral da sua indenização por morte da cobertura básica.</p>
                      </td>
                      <td :style="{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', color: 'oklch(35% 0.05 250)', fontWeight: 500 }">{{ plano.seguroVida.morte.capitalSegurado || '—' }}</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600 }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? plano.seguroVida.morte.contribuicaoAnual : plano.seguroVida.morte.contribuicaoMensal || '—' }}</td>
                    </tr>
                    <tr v-if="plano.seguroVida.morteTemp.ativo" :style="{ borderBottom: '1px solid oklch(93% 0.003 260)' }">
                      <td :style="{ padding: '8px 12px', color: 'oklch(30% 0.05 250)', fontSize: '11px' }">
                        <span :style="{ fontWeight: 600 }">Morte Natural ou Acidental (Vigência Temporária)</span>
                        <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '3px 0 0 0', lineHeight: 1.5, fontStyle: 'italic' }">Seus beneficiários receberão o valor integral da indenização em caso de morte natural ou acidental.</p>
                      </td>
                      <td :style="{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', color: 'oklch(35% 0.05 250)', fontWeight: 500 }">{{ plano.seguroVida.morteTemp.capitalSegurado || '—' }}</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600 }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? plano.seguroVida.morteTemp.contribuicaoAnual : plano.seguroVida.morteTemp.contribuicaoMensal || '—' }}</td>
                    </tr>
                    <tr v-if="plano.seguroVida.iea.ativo" :style="{ borderBottom: '1px solid oklch(93% 0.003 260)' }">
                      <td :style="{ padding: '8px 12px', color: 'oklch(30% 0.05 250)', fontSize: '11px' }">
                        <span :style="{ fontWeight: 600 }">Indenização Especial de Morte por Acidente (IEA)</span>
                        <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '3px 0 0 0', lineHeight: 1.5, fontStyle: 'italic' }">Seus beneficiários receberão uma indenização extra em caso de morte exclusivamente acidental.</p>
                      </td>
                      <td :style="{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', color: 'oklch(35% 0.05 250)', fontWeight: 500 }">{{ plano.seguroVida.iea.capitalSegurado || '—' }}</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600 }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? plano.seguroVida.iea.contribuicaoAnual : plano.seguroVida.iea.contribuicaoMensal || '—' }}</td>
                    </tr>
                    <tr v-if="plano.seguroVida.ipa.ativo" :style="{ borderBottom: '1px solid oklch(93% 0.003 260)' }">
                      <td :style="{ padding: '8px 12px', color: 'oklch(30% 0.05 250)', fontSize: '11px' }">
                        <span :style="{ fontWeight: 600 }">Invalidez Permanente Total ou Parcial por Acidente (IPA)</span>
                        <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '3px 0 0 0', lineHeight: 1.5, fontStyle: 'italic' }">Você poderá receber a indenização total ou um percentual do valor, de acordo com o grau da invalidez.</p>
                      </td>
                      <td :style="{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', color: 'oklch(35% 0.05 250)', fontWeight: 500 }">{{ plano.seguroVida.ipa.capitalSegurado || '—' }}</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600 }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? plano.seguroVida.ipa.contribuicaoAnual : plano.seguroVida.ipa.contribuicaoMensal || '—' }}</td>
                    </tr>
                    <tr v-if="plano.seguroVida.ied.ativo" :style="{ borderBottom: '1px solid oklch(93% 0.003 260)' }">
                      <td :style="{ padding: '8px 12px', color: 'oklch(30% 0.05 250)', fontSize: '11px' }">
                        <span :style="{ fontWeight: 600 }">Indenização Especial de Invalidez por Doença (IED)</span>
                        <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '3px 0 0 0', lineHeight: 1.5, fontStyle: 'italic' }">Você poderá receber indenização em caso de perda de forma total e permanente, em decorrência por doença, da capacidade de exercer qualquer atividade que lhe garanta subsistência.</p>
                      </td>
                      <td :style="{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', color: 'oklch(35% 0.05 250)', fontWeight: 500 }">{{ plano.seguroVida.ied.capitalSegurado || '—' }}</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600 }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? plano.seguroVida.ied.contribuicaoAnual : plano.seguroVida.ied.contribuicaoMensal || '—' }}</td>
                    </tr>
                    <tr v-if="plano.seguroVida.dg.ativo" :style="{ borderBottom: '1px solid oklch(93% 0.003 260)' }">
                      <td :style="{ padding: '8px 12px', color: 'oklch(30% 0.05 250)', fontSize: '11px' }">
                        <span :style="{ fontWeight: 600 }">Doenças Graves (DG)</span>
                        <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '3px 0 0 0', lineHeight: 1.5, fontStyle: 'italic' }">Você poderá receber indenização em caso de diagnóstico de doenças graves como câncer, infarto, AVC, Alzheimer, Parkinson, ELA, insuficiência renal crônica, entre outras.</p>
                      </td>
                      <td :style="{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', color: 'oklch(35% 0.05 250)', fontWeight: 500 }">{{ plano.seguroVida.dg.capitalSegurado || '—' }}</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600 }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? plano.seguroVida.dg.contribuicaoAnual : plano.seguroVida.dg.contribuicaoMensal || '—' }}</td>
                    </tr>
                    <tr v-if="plano.seguroVida.dih.ativo" :style="{ borderBottom: '1px solid oklch(93% 0.003 260)' }">
                      <td :style="{ padding: '8px 12px', color: 'oklch(30% 0.05 250)', fontSize: '11px' }">
                        <span :style="{ fontWeight: 600 }">Diária de Internação Hospitalar (DIH){{ plano.seguroVida.dih.dihUTI === 'Sim' ? ' + UTI' : '' }}</span>
                        <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '3px 0 0 0', lineHeight: 1.5, fontStyle: 'italic' }">Você poderá receber a indenização total ou um percentual do valor por dia de internação hospitalar, a partir do primeiro dia, seja por doença ou acidente.</p>
                      </td>
                      <td :style="{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', color: 'oklch(35% 0.05 250)', fontWeight: 500 }">{{ plano.seguroVida.dih.capitalSegurado || '—' }}</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600 }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? plano.seguroVida.dih.contribuicaoAnual : plano.seguroVida.dih.contribuicaoMensal || '—' }}</td>
                    </tr>
                    <tr v-if="plano.seguroVida.dit.ativo" :style="{ borderBottom: '1px solid oklch(93% 0.003 260)' }">
                      <td :style="{ padding: '8px 12px', color: 'oklch(30% 0.05 250)', fontSize: '11px' }">
                        <span :style="{ fontWeight: 600 }">Diária de Incapacidade Temporária (DIT){{ plano.seguroVida.dit.franquiaReduzida === 'Sim' ? ` – Franquia ${plano.seguroVida.dit.quantidadeDias}` : '' }}{{ plano.seguroVida.dit.lerDortLtc === 'Sim' ? ' c/ LER/DORT' : '' }}</span>
                        <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '3px 0 0 0', lineHeight: 1.5, fontStyle: 'italic' }">Você poderá receber a indenização diária caso fique impossibilitado de exercer suas atividades profissionais por mais de 15 dias consecutivos, em decorrência de doença ou acidente.</p>
                      </td>
                      <td :style="{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', color: 'oklch(35% 0.05 250)', fontWeight: 500 }">{{ plano.seguroVida.dit.capitalSegurado || '—' }}</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600 }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? plano.seguroVida.dit.contribuicaoAnual : plano.seguroVida.dit.contribuicaoMensal || '—' }}</td>
                    </tr>
                    <tr v-if="plano.seguroVida.saf.ativo">
                      <td :style="{ padding: '8px 12px', color: 'oklch(30% 0.05 250)', fontSize: '11px' }">
                        <span :style="{ fontWeight: 600 }">Serviço de Assistência Funeral (SAF {{ plano.seguroVida.saf.tipoSAF || 'Individual' }})</span>
                        <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '3px 0 0 0', lineHeight: 1.5, fontStyle: 'italic' }">Nossa empresa parceira irá providenciar e custear todos os serviços que envolvem o funeral. Se acharem melhor, faremos o reembolso das despesas, respeitado o limite de valor da sua escolha: R$ 12.000,00.</p>
                      </td>
                      <td :style="{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', color: 'oklch(35% 0.05 250)', fontWeight: 500 }">R$ 12.000,00</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600 }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? plano.seguroVida.saf.contribuicaoAnual : plano.seguroVida.saf.contribuicaoMensal || '—' }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr :style="{ background: 'oklch(95% 0.005 260)', borderTop: '2px solid oklch(88% 0.005 260)' }">
                      <td colspan="2" :style="{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'oklch(30% 0.05 250)', textAlign: 'right' }">{{ plano.seguroVida.tipoContribuicao === 'anual' ? 'Total Anual' : 'Total Mensal' }}</td>
                      <td :style="{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'oklch(20% 0.1 145)' }">
                        {{ (() => {
                          const sv = plano.seguroVida as SeguroVidaData
                          const keys = ['morte','morteTemp','iea','ipa','ied','dg','dih','dit','saf'] as const
                          let total = 0
                          for (const k of keys) {
                            const c = sv[k] as any
                            if (c.ativo !== false) {
                              const val = sv.tipoContribuicao === 'anual' ? c.contribuicaoAnual : c.contribuicaoMensal
                              if (val) total += parseFloat(val.replace(/[R$\s.]/g,'').replace(',','.'))||0
                            }
                          }
                          return total > 0 ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'
                        })() }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            </template>
            <!-- Fallback: tabela antiga -->
            <template v-else-if="plano.coberturas.length > 0">
              <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', overflow: 'hidden' }">
                <table :style="{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', tableLayout: 'fixed' }">
                  <colgroup><col style="width: auto" /><col style="width: 148px" /><col style="width: 120px" /><col style="width: 138px" /><col style="width: 138px" /></colgroup>
                  <thead><tr :style="{ background: 'oklch(95% 0.005 260)', borderBottom: '1px solid oklch(90% 0.005 260)' }">
                    <th :style="{ textAlign: 'left', padding: '7px 16px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Cobertura</th>
                    <th :style="{ textAlign: 'center', padding: '7px 6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Vigência</th>
                    <th :style="{ textAlign: 'center', padding: '7px 6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Tempo de Contribuição</th>
                    <th :style="{ textAlign: 'right', padding: '7px 6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Capital Segurado</th>
                    <th :style="{ textAlign: 'right', padding: '7px 16px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">Contribuição Mensal</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="(cob, ci) in plano.coberturas" :key="ci" :style="{ borderBottom: ci < plano.coberturas.length - 1 ? '1px solid oklch(93% 0.003 260)' : 'none' }">
                      <td :style="{ padding: '10px 10px', color: 'oklch(30% 0.05 250)', fontWeight: ci === 0 ? 600 : 400, fontSize: '11px', whiteSpace: 'normal', wordBreak: 'break-word' }">{{ cob.nome }}</td>
                      <td :style="{ padding: '10px 6px', textAlign: 'center', fontSize: '11px', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">{{ cob.vigencia || '—' }}</td>
                      <td :style="{ padding: '10px 6px', textAlign: 'center', fontSize: '11px', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap' }">{{ cob.prazoPagamento || '—' }}</td>
                      <td :style="{ padding: '10px 6px', textAlign: 'right', fontSize: '11px', color: 'oklch(30% 0.05 250)', fontWeight: 500, whiteSpace: 'nowrap' }">{{ cob.capitalSegurado || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cs || calcCapitalSegurado(cob) || '—' }}</td>
                      <td :style="{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', color: 'oklch(20% 0.1 145)', fontWeight: 600, whiteSpace: 'nowrap' }">{{ cob.contribuicaoMensal || (HORIZONTE_VALORES as any)[cob.nome]?.[cob.vigencia]?.cm || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- Assistências & Benefícios (Seguro de Vida) -->
            <template v-if="plano.seguroVida">
              <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '12px 16px', marginTop: '10px', background: 'oklch(98.5% 0.002 260)' }">
                <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(40% 0.05 250)', marginBottom: '10px', marginTop: 0 }">Benefícios deste produto</p>
                <div :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">
                  <!-- Assistência Domiciliar -->
                  <div>
                    <p :style="{ fontSize: '11px', fontWeight: 700, color: 'oklch(25% 0.05 250)', margin: '0 0 3px 0' }">Assistência Domiciliar</p>
                    <p :style="{ fontSize: '11px', color: 'oklch(40% 0.02 250)', margin: 0, lineHeight: 1.55 }">Com o envio de profissionais para reparos domésticos e proteção (encanador, eletricista, chaveiro, vigilante), além de despesas com restaurante, lavanderia e veículo de mudança caso a residência esteja inabitável.</p>
                  </div>
                  <!-- Seguro Viagem -->
                  <div>
                    <p :style="{ fontSize: '11px', fontWeight: 700, color: 'oklch(25% 0.05 250)', margin: '0 0 3px 0' }">Seguro Viagem</p>
                    <p :style="{ fontSize: '11px', color: 'oklch(40% 0.02 250)', margin: '0 0 6px 0', lineHeight: 1.55 }">São coberturas como despesas médico-hospitalares e odontológicas em viagem ao exterior, traslado médico e acompanhante em caso de hospitalização, além de serviços como localização de bagagem e orientação em caso de perda de documentos entre outros.</p>
                    <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '0 0 2px 0', lineHeight: 1.5 }">Este Seguro Viagem é garantido pela HERO Corretora de Seguros LTDA – Código SUSEP: 212116101.</p>
                    <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: '0 0 2px 0', lineHeight: 1.5 }">Representante de Seguro: HERO MGA SERVIÇOS LTDA – CNPJ: 45.385.865/0001-51.</p>
                    <p :style="{ fontSize: '10px', color: 'oklch(50% 0.02 250)', margin: 0, lineHeight: 1.5 }">Seguradora GENERALI BRASIL SEGUROS S.A. – CNPJ: 33.072.307/0001-57 – Código SUSEP: 0590-8, processo SUSEP 15414.648189/2023-26.</p>
                  </div>
                </div>
                <!-- Características do seu seguro -->
                <div :style="{ borderTop: '1px solid oklch(90% 0.005 260)', marginTop: '14px', paddingTop: '14px' }">
                  <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(40% 0.05 250)', marginBottom: '10px', marginTop: 0 }">Características do seu seguro</p>
                  <div :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">
                    <div>
                      <p :style="{ fontSize: '11px', fontWeight: 700, color: 'oklch(25% 0.05 250)', margin: '0 0 3px 0' }">Entenda a evolução do Valor de Resgate</p>
                      <p :style="{ fontSize: '11px', color: 'oklch(40% 0.02 250)', margin: '0 0 4px 0', lineHeight: 1.55 }">Quanto maior o tempo de permanência no plano, maior é o percentual disponível para resgate em caso de imprevistos financeiros.</p>
                      <p :style="{ fontSize: '11px', color: 'oklch(40% 0.02 250)', margin: '0 0 4px 0', lineHeight: 1.55 }">Funciona assim: em caso de cancelamento do seguro, você passa a ter acesso ao valor total de resgate constituído. Se houver uma redução no capital segurado, você terá acesso à parte desse valor. Consulte as Condições do Seguro de Vida para mais informações.</p>
                      <p :style="{ fontSize: '11px', color: 'oklch(40% 0.02 250)', margin: 0, lineHeight: 1.55 }">O valor de resgate não corresponde à devolução dos pagamentos realizados.</p>
                    </div>
                    <div>
                      <p :style="{ fontSize: '11px', fontWeight: 700, color: 'oklch(25% 0.05 250)', margin: '0 0 3px 0' }">Entenda como funciona o Saldamento</p>
                      <p :style="{ fontSize: '11px', color: 'oklch(40% 0.02 250)', margin: 0, lineHeight: 1.55 }">Se você ficar impossibilitado de pagar as suas parcelas, tem a opção de usar o valor de resgate para saldar, antecipadamente, a cobertura básica do seguro. A partir disso, a sua indenização será reduzida proporcionalmente, sem possibilidade de voltar ao valor original. Este recurso permite que você fique isento dos pagamentos e continue protegido pela vigência que contratou. As coberturas adicionais que não estiverem quitadas serão canceladas, mas as assistências continuarão inalteradas.</p>
                    </div>
                  </div>
                </div>
                <!-- Assistências marcadas -->
                <template v-if="plano.assistencias && Object.values(plano.assistencias).some(v => v)">
                  <div :style="{ borderTop: '1px solid oklch(90% 0.005 260)', marginTop: '10px', paddingTop: '10px' }">
                    <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'oklch(40% 0.05 250)', margin: '0 0 6px 0' }">Assistências Selecionadas</p>
                    <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }">
                      <template v-for="(item) in [
                        { key: 'funeralFamiliar', label: 'Assistência Funeral Familiar' },
                        { key: 'seguroViagem', label: 'Seguro Viagem' },
                        { key: 'assistenciaDomiciliar', label: 'Assistência Domiciliar' },
                        { key: 'telemedicina', label: 'Telemedicina' },
                        { key: 'descontoFarmacia', label: 'Desconto em Farmácia' },
                      ]" :key="item.key">
                        <span v-if="(plano.assistencias as Assistencias)[item.key as keyof Assistencias]" :style="{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'oklch(25% 0.05 250)', fontWeight: 500 }">
                          <span :style="{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', borderRadius: '3px', background: '#1e40af', flexShrink: 0 }">
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                          </span>
                          {{ item.label }}
                        </span>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </template>
        </div>
      </template>



      <!-- Validade do estudo + Disclaimers -->
      <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '10px 16px', background: '#f8fafc', marginTop: '8px', marginBottom: '4px' }">
        <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', fontStyle: 'italic', margin: '0 0 4px 0', textAlign: 'left' }">
          Estudo com validade de 7 dias úteis a partir da data {{ new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) }}.
        </p>
        <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', fontStyle: 'italic', margin: '0 0 10px 0', textAlign: 'left', lineHeight: 1.5 }">
          Esta simulação é um exemplo e não representa garantia dos dados apresentados ou dos resultados obtidos.
        </p>
        <template v-if="resumoData.produtoSelecionado !== 'seguro'">
          <div :style="{ borderTop: '1px solid oklch(90% 0.005 260)', marginTop: '6px', paddingTop: '10px', marginBottom: '8px' }">
            <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'oklch(40% 0.05 250)', margin: '0 0 8px 0' }">Observações Gerais - Previdência</p>
          </div>
          <p :style="{ fontSize: '11px', color: 'oklch(50% 0.02 250)', margin: '0 0 6px 0', textAlign: 'left', lineHeight: 1.5 }">
            Os Planos que possuem o termo Qualificado em sua denominação são destinados exclusivamente aos proponentes qualificados que atendem ao critério para investidor qualificado, nos termos da instrução CVM que regulamenta especificamente o assunto. São considerados proponentes qualificados aqueles que possuem investimentos financeiros com valor igual ou maior do que R$1.000.000,00 e atestem por escrito suas condições e/ou foram aprovados em exames de qualificação técnica relacionados ao mercado financeiro e/ou possuem certificação aprovada pela CVM para atuação profissional nesse segmento.
          </p>
          <p :style="{ fontSize: '11px', color: 'oklch(50% 0.02 250)', margin: 0, textAlign: 'left', lineHeight: 1.5 }">
            Os planos são administrados pela Icatu Seguros S.A., inscrita no CNPJ/MF sob o nº 42.283.770/0001-39. A Icatu Seguros não promete rentabilidade e/ou resultados financeiros durante os períodos de diferimento e de pagamento do benefício sob a forma de renda, com base no desempenho do respectivo fundo de investimento, no desempenho alheio ou no de quaisquer ativos financeiros e/ou modalidades operacionais disponíveis no âmbito do mercado financeiro.
          </p>
        </template>
        <!-- Observações Gerais Seguro de Vida -->
        <template v-if="detalhamentoData.planos.some(p => p.seguroVida) || resumoData.produtoSelecionado === 'seguro' || resumoData.produtoSelecionado === 'ambos'">
          <div :style="{ borderTop: '1px solid oklch(90% 0.005 260)', marginTop: '10px', paddingTop: '10px' }">
            <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'oklch(40% 0.05 250)', margin: '0 0 8px 0' }">Observações Gerais - Seguro de Vida</p>
            <ul :style="{ fontSize: '11px', color: 'oklch(50% 0.02 250)', margin: 0, paddingLeft: '0', listStyle: 'none', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '5px' }">
              <li :style="{ display: 'flex', gap: '6px' }"><span>•</span><span>Os valores da indenização e do pagamento serão atualizados anualmente apenas pelo IPCA.</span></li>
              <li :style="{ display: 'flex', gap: '6px' }"><span>•</span><span>A reserva será atualizada, atuarialmente, baseada na taxa de juros de 3% a.a. e, mensalmente, pelo IPCA. Os cálculos atuariais consideram fatores como probabilidade de morte, idade, sexo, indenização e vigência do seguro.</span></li>
              <li :style="{ display: 'flex', gap: '6px' }"><span>•</span><span>Na ocasião de saldamento, a indenização mínima passa a ser R$ 30.000,00. A indenização máxima é de {{ (() => { const sv = detalhamentoData.planos.find(p => p.seguroVida)?.seguroVida; return sv?.morte?.capitalSegurado || '—'; })() }}.</span></li>
              <li :style="{ display: 'flex', gap: '6px' }"><span>•</span><span>Atenção: O Seguro Viagem não é Seguro Saúde! Leia atentamente as condições contratuais, observando seus direitos e obrigações, bem como o limite do capital segurado contratado para cada cobertura. As coberturas do Seguro Viagem estão contempladas em um Seguro não contributário garantido pela Chubb Seguros Brasil S.A., CNPJ: 03.502.099/0001-18, e estipulado pelo Clube de Seguros Icatu, CNPJ: 03.859.987/0001-92. Processo SUSEP 15414.900438/2015-90. Ouvidoria Chubb: 0800 722 5059.</span></li>
              <li :style="{ display: 'flex', gap: '6px' }"><span>•</span><span>O pagamento dos tributos que incidam ou venham a incidir sobre as parcelas, indenizações e resgate deverá ser efetuado conforme a legislação vigente.</span></li>
              <li :style="{ display: 'flex', gap: '6px' }"><span>•</span><span>A aceitação do seguro estará sujeita à análise de risco.</span></li>
              <li :style="{ display: 'flex', gap: '6px' }"><span>•</span><span>As informações contidas neste material são resumidas. Para total conhecimento das características deste seguro, consulte sua proposta de contratação, condições gerais e condições especiais.</span></li>
            </ul>
          </div>
        </template>
      </div>
    </div>

    <!-- Navigation -->
    <div :style="{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', paddingBottom: '16px' }">
      <button @click="handleSalvar()" :disabled="isGenerating"
        :style="{ background: isGenerating ? 'oklch(55% 0.02 250)' : 'oklch(20% 0.05 250)', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer' }">
        {{ isGenerating ? 'Salvando...' : 'Salvar Estudo' }}
      </button>
    </div>
  </div>
</template>
