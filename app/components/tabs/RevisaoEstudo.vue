<script setup lang="ts">
import { ref, computed } from 'vue'
import { useJornadaStore } from '~/stores/jornada'
import { HORIZONTE_VALORES } from '~/data/fundosData'
import { ALIA_LOGO_BASE64 } from '~/data/aliaLogoBase64'
import type { Plano, Cobertura, FundoSelecionado } from '~/stores/jornada'

const emit = defineEmits<{ back: [] }>()
const store = useJornadaStore()
const isGenerating = ref(false)

const resumoData = computed(() => store.resumoData)
const detalhamentoData = computed(() => store.detalhamentoData)
const proponente = computed(() => store.detalhamentoData.proponente)

// ── PDF group refs ─────────────────────────────────────────────────────────────
const pdfGroup1Ref = ref<HTMLDivElement | null>(null)
const pdfGroup2Ref = ref<HTMLDivElement | null>(null)
const pdfGroup3Ref = ref<HTMLDivElement | null>(null)
const pdfGroup4Ref = ref<HTMLDivElement | null>(null)

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
  const renda = parseBRL(proponente.value.rendaMensal)
  if (!renda) return 0
  return Math.round((totalInvestimento.value / renda) * 100)
})

function visaoLongoPrazo(): string {
  const last = resumoData.value.timeline[resumoData.value.timeline.length - 1]
  return last?.descricao || ''
}

// ── PDF generation ─────────────────────────────────────────────────────────────
async function handleSalvar() {
  isGenerating.value = true
  try {
    const { toPng } = await import('html-to-image')
    const CAPTURE_WIDTH_PX = 800

    // Capturar todos os grupos em uma única imagem longa
    const allGroups = [
      pdfGroup1Ref.value,
      pdfGroup2Ref.value,
      pdfGroup3Ref.value,
      pdfGroup4Ref.value,
    ].filter(Boolean) as HTMLElement[]

    // Criar container temporário para capturar tudo junto
    const container = document.createElement('div')
    container.style.cssText = [
      `width:${CAPTURE_WIDTH_PX}px`,
      'background:#f8fafc',
      'padding:24px',
      'font-family:Inter,sans-serif',
      'display:flex',
      'flex-direction:column',
      'gap:16px',
    ].join(';')

    // Cabeçalho com logo
    const header = document.createElement('div')
    header.style.cssText = 'display:flex;justify-content:flex-end;padding-bottom:12px;border-bottom:2px solid #e2e8f0;margin-bottom:4px'
    const logoImg = document.createElement('img')
    logoImg.src = `data:image/png;base64,${ALIA_LOGO_BASE64}`
    logoImg.alt = 'ALIA'
    logoImg.style.cssText = 'height:32px;width:auto;object-fit:contain'
    header.appendChild(logoImg)
    container.appendChild(header)

    // Clonar cada grupo
    for (const group of allGroups) {
      const clone = group.cloneNode(true) as HTMLElement
      clone.style.width = `${CAPTURE_WIDTH_PX - 48}px`
      clone.style.background = '#ffffff'
      clone.style.borderRadius = '8px'
      clone.style.padding = '16px'
      clone.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
      container.appendChild(clone)
    }

    document.body.appendChild(container)
    const dataUrl = await toPng(container, {
      pixelRatio: 2,
      backgroundColor: '#f8fafc',
      width: CAPTURE_WIDTH_PX,
      skipFonts: true,
      cacheBust: true,
    })
    document.body.removeChild(container)

    // Fazer download do backup como PNG
    const now = new Date()
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const aa = String(now.getFullYear()).slice(-2)
    const nomeArquivo = `Estudo_${proponente.value.nomeCompleto || 'Proponente'}_${dd}${mm}${aa}.png`
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = nomeArquivo
    link.click()

    // Aguardar um momento e redirecionar para a página de estudos gerados
    await new Promise(resolve => setTimeout(resolve, 800))
    window.open('https://moniquearka.github.io/nura-app/estudos-gerados', '_blank')
  } catch (err) {
    console.error('Erro ao salvar estudo:', err)
    alert('Erro ao salvar o estudo. Verifique o console para detalhes.')
  } finally {
    isGenerating.value = false
  }
}

function calcCapitalSegurado(cob: Cobertura): string {
  if (cob.capitalSegurado) return cob.capitalSegurado
  const min = parseBRL(cob.valorMin)
  const max = parseBRL(cob.valorMax)
  if (!min || !max) return ''
  const avg = (min + max) / 2
  return `R$ ${avg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}
</script>

<template>
  <div>
    <!-- Header -->
    <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }">
      <div :style="{ display: 'flex', alignItems: 'center', gap: '12px' }">
        <div :style="{ width: '36px', height: '36px', borderRadius: '50%', background: 'oklch(95% 0.005 260)', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <svg class="h-4 w-4" :style="{ color: 'oklch(45% 0.02 250)' }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h1 :style="{ fontSize: '20px', fontWeight: 600, color: 'oklch(20% 0.05 250)' }">Revisão do Estudo</h1>
      </div>
    </div>

    <!-- PDF content (visible on screen) -->
    <div>
      <!-- GROUP 1: Resumo Jornada de Vida -->
      <div ref="pdfGroup1Ref" :style="{ padding: '16px 0', background: '#ffffff' }">
        <!-- Section Divider -->
        <div :style="{ background: 'rgba(241,245,249,0.5)', borderRadius: '8px', padding: '5px 12px', border: '1px solid oklch(90% 0.005 260)', marginBottom: '12px', marginTop: '8px' }">
          <p :style="{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'oklch(45% 0.02 250)', margin: 0 }">Resumo Jornada de Vida</p>
        </div>

        <!-- Dados do Proponente -->
        <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '24px', marginBottom: '12px' }">
          <h3 :style="{ fontSize: '15px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Dados do Proponente</h3>
          <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }">
            <div v-for="item in [
              { label: 'Nome Completo', value: proponente.nomeCompleto },
              { label: 'CPF', value: proponente.cpf },
              { label: 'Data de Nascimento', value: proponente.dataNascimento },
              { label: 'Profissão', value: proponente.profissao },
              { label: 'Renda Mensal', value: proponente.rendaMensal },
              { label: 'Estado Civil', value: proponente.estadoCivil },
            ]" :key="item.label">
              <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">{{ item.label }}</span>
              <p :style="{ fontSize: '14px', color: 'oklch(20% 0.05 250)', margin: 0 }">{{ item.value || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Perfil de Personalidade -->
        <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '24px', marginBottom: '12px' }">
          <h3 :style="{ fontSize: '15px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Perfil de Personalidade</h3>
          <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }">
            <div v-for="item in [
              { label: 'Perfil', value: resumoData.perfil.tipo },
              { label: 'Tolerância ao Risco', value: resumoData.perfil.toleranciaRisco },
              { label: 'Horizonte de Investimento', value: resumoData.perfil.horizonte },
            ]" :key="item.label">
              <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">{{ item.label }}</span>
              <p :style="{ fontSize: '14px', color: 'oklch(20% 0.05 250)', margin: 0 }">{{ item.value || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Cenários de Risco Atual -->
        <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '24px', marginBottom: '12px' }">
          <h3 :style="{ fontSize: '15px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Cenários de Risco Atual</h3>
          <div :style="{ background: 'oklch(97% 0.01 25)', border: '1px solid oklch(88% 0.05 25)', borderRadius: '8px', padding: '14px 16px' }">
            <p :style="{ fontSize: '13px', fontWeight: 600, color: '#1e40af', marginBottom: '8px' }">{{ resumoData.cenario.titulo }}</p>
            <ul :style="{ display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', padding: 0, margin: 0 }">
              <li v-for="(item, i) in resumoData.cenario.itens" :key="i" :style="{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#1e40af' }">
                <span :style="{ marginTop: '6px', width: '6px', height: '6px', borderRadius: '50%', background: '#1e40af', flexShrink: 0, display: 'inline-block' }"></span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Vulnerabilidades Identificadas -->
        <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '24px', marginBottom: '12px' }">
          <h3 :style="{ fontSize: '15px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Vulnerabilidades Identificadas</h3>
          <div :style="{ display: 'flex', flexDirection: 'column', gap: '8px' }">
            <div v-for="(vuln, i) in resumoData.vulnerabilidades" :key="i" :style="{ background: '#f8fafc', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '12px' }">
              <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 2px 0' }">{{ vuln.titulo }}</p>
              <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', margin: '0 0 4px 0' }">{{ vuln.descricao }}</p>
              <p :style="{ fontSize: '12px', color: '#1e40af', fontWeight: 500, margin: 0 }">Solução: {{ vuln.solucao }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- GROUP 2: Planejamento de Longo Prazo -->
      <div ref="pdfGroup2Ref" :style="{ padding: '16px 0', background: '#ffffff' }">
        <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '24px', marginBottom: '12px' }">
          <h3 :style="{ fontSize: '15px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Planejamento de Longo Prazo</h3>
          <div :style="{ display: 'flex', flexDirection: 'column', gap: '10px' }">
            <div v-for="(item, i) in resumoData.timeline" :key="i" :style="{ background: '#f8fafc', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '12px 16px' }">
              <div :style="{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }">
                <span :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1e40af', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }">{{ item.periodo }}</span>
                <span :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)' }">{{ item.titulo }}</span>
              </div>
              <p :style="{ fontSize: '13px', color: 'oklch(45% 0.02 250)', marginBottom: '8px' }">{{ item.descricao }}</p>
              <div v-if="item.riscos.length > 0">
                <p :style="{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1e40af', marginBottom: '4px' }">{{ item.riscoLabel }}</p>
                <ul :style="{ display: 'flex', flexDirection: 'column', gap: '2px', listStyle: 'none', padding: 0, margin: 0 }">
                  <li v-for="(r, ri) in item.riscos" :key="ri" :style="{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: 'oklch(45% 0.02 250)' }">
                    <span :style="{ marginTop: '5px', width: '5px', height: '5px', borderRadius: '50%', background: 'oklch(55% 0.02 250)', flexShrink: 0, display: 'inline-block' }"></span>
                    {{ r }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div v-if="visaoLongoPrazo()" :style="{ marginTop: '12px', padding: '10px 14px', background: 'oklch(97% 0.003 260)', borderRadius: '8px', borderLeft: '3px solid oklch(75% 0.03 250)' }">
            <p :style="{ fontSize: '12px', fontWeight: 600, color: 'oklch(45% 0.02 250)', marginBottom: '4px' }">Visão de Longo Prazo:</p>
            <p :style="{ fontSize: '13px', color: 'oklch(35% 0.03 250)', lineHeight: 1.6 }">{{ visaoLongoPrazo() }}</p>
          </div>
        </div>
      </div>

      <!-- GROUP 3: O que você protege/garante + Dados Proponente + Plano 1 -->
      <div ref="pdfGroup3Ref" :style="{ padding: '16px 0', background: '#ffffff' }">
        <!-- O que você protege/garante -->
        <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '24px', marginBottom: '12px' }">
          <h3 :style="{ fontSize: '15px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid oklch(90% 0.005 260)' }">O que você protege/garante</h3>
          <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }">
            <div v-for="item in [
              { label: 'Patrimônio', value: resumoData.protege.patrimonio },
              { label: 'Família', value: resumoData.protege.familia },
              { label: 'Renda', value: resumoData.protege.renda },
            ]" :key="item.label">
              <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">{{ item.label }}</span>
              <p :style="{ fontSize: '14px', color: 'oklch(20% 0.05 250)', margin: 0 }">{{ item.value || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Section Divider -->
        <div :style="{ background: 'rgba(241,245,249,0.5)', borderRadius: '8px', padding: '5px 12px', border: '1px solid oklch(90% 0.005 260)', marginBottom: '12px', marginTop: '8px' }">
          <p :style="{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'oklch(45% 0.02 250)', margin: 0 }">Detalhamento do Plano</p>
        </div>

        <!-- Plano 1 -->
        <template v-if="detalhamentoData.planos.length > 0">
          <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '24px', marginBottom: '12px' }">
            <h3 :style="{ fontSize: '15px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Dados do Plano 1</h3>
            <template v-if="detalhamentoData.planos[0].tipo === 'previdencia'">
              <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }">
                <div>
                  <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">Tipo de Investimento</span>
                  <p :style="{ fontSize: '14px', color: 'oklch(20% 0.05 250)', margin: 0 }">Previdência</p>
                </div>
                <div>
                  <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">Idade de Aposentadoria</span>
                  <p :style="{ fontSize: '14px', color: 'oklch(20% 0.05 250)', margin: 0 }">{{ detalhamentoData.planos[0].idadeAposentadoria || '—' }}</p>
                </div>
              </div>
              <div v-for="(sub, si) in detalhamentoData.planos[0].subPlanos" :key="sub.id" :style="{ border: '1px solid oklch(92% 0.004 260)', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: 'oklch(98.5% 0.002 260)' }">
                <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }">
                  <div v-for="item in [{ label: 'Contribuição Mensal', value: sub.contribuicaoMensal }, { label: 'Aporte Inicial', value: sub.aporteInicial }, { label: 'Tipo de Plano', value: sub.tipoPlano }]" :key="item.label">
                    <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">{{ item.label }}</span>
                    <p :style="{ fontSize: '13px', color: 'oklch(20% 0.05 250)', margin: 0 }">{{ item.value || '—' }}</p>
                  </div>
                </div>
                <!-- Fundos -->
                <div v-if="sub.fundos.length > 0">
                  <p :style="{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(45% 0.02 250)', marginBottom: '8px' }">Fundos Selecionados</p>
                  <div v-for="fundo in sub.fundos" :key="fundo.cnpj" :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '10px 14px', background: '#fff', marginBottom: '8px' }">
                    <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 4px 0' }">{{ fundo.nome }}</p>
                    <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', margin: '0 0 6px 0' }">{{ fundo.cnpj }}</p>
                    <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '6px' }">
                      <div v-for="item in [{ label: 'Taxa Máx. Adm.', value: (fundo as any).taxaAdmMax || fundo.taxaAdm }, { label: 'Rentabilidade', value: fundo.rentabilidade }, { label: 'Classificação', value: fundo.classificacao }]" :key="item.label" :style="{ display: 'flex', alignItems: 'center', gap: '5px' }">
                        <span :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', whiteSpace: 'nowrap' }">{{ item.label }}:</span>
                        <span :style="{ fontSize: '12px', fontWeight: 500, color: 'oklch(20% 0.05 250)', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '1px 6px', background: 'oklch(97% 0.003 260)', whiteSpace: 'nowrap' }">{{ item.value || '—' }}</span>
                      </div>
                    </div>
                    <div :style="{ display: 'flex', gap: '16px', flexWrap: 'wrap' }">
                      <div>
                        <span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', display: 'block' }">Contribuição Mensal</span>
                        <span :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)' }">{{ fundo.percentual }}%</span>
                        <span :style="{ fontSize: '12px', fontWeight: 500, color: 'oklch(20% 0.05 250)', marginLeft: '6px' }">{{ fundo.valorAtribuido || '—' }}</span>
                      </div>
                      <div>
                        <span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', display: 'block' }">Aporte Inicial</span>
                        <span :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)' }">{{ fundo.percentualAporte }}%</span>
                        <span :style="{ fontSize: '12px', fontWeight: 500, color: 'oklch(20% 0.05 250)', marginLeft: '6px' }">{{ fundo.valorAporte || '—' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <!-- Seguro de Vida Plano 1 -->
              <div :style="{ marginBottom: '12px' }">
                <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">Tipo de Investimento</span>
                <p :style="{ fontSize: '14px', color: 'oklch(20% 0.05 250)', margin: 0 }">Seguro de Vida — Horizonte</p>
              </div>
              <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', overflow: 'hidden' }">
                <table :style="{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', tableLayout: 'fixed' }">
                  <colgroup>
                    <col style="width: auto" />
                    <col style="width: 148px" />
                    <col style="width: 120px" />
                    <col style="width: 138px" />
                    <col style="width: 138px" />
                  </colgroup>
                  <thead>
                    <tr :style="{ background: 'oklch(95% 0.005 260)', borderBottom: '1px solid oklch(90% 0.005 260)' }">
                      <th v-for="h in ['Cobertura', 'Vigência', 'Prazo de Pagamento', 'Capital Segurado', 'Contribuição Mensal']" :key="h" :style="{ padding: '7px 6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap', textAlign: h === 'Cobertura' ? 'left' : h === 'Contribuição Mensal' ? 'right' : 'center' }">{{ h }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(cob, ci) in detalhamentoData.planos[0].coberturas" :key="ci" :style="{ borderBottom: ci < detalhamentoData.planos[0].coberturas.length - 1 ? '1px solid oklch(93% 0.003 260)' : 'none' }">
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
          </div>
        </template>
      </div>

      <!-- GROUP 4: Plano 2 + Investimento Mensal + Validade -->
      <div ref="pdfGroup4Ref" :style="{ padding: '16px 0', background: '#ffffff' }">
        <!-- Plano 2 -->
        <template v-if="detalhamentoData.planos.length > 1">
          <div :style="{ background: '#fff', border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '24px', marginBottom: '12px' }">
            <h3 :style="{ fontSize: '15px', fontWeight: 600, color: 'oklch(20% 0.05 250)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid oklch(90% 0.005 260)' }">Dados do Plano 2</h3>
            <template v-if="detalhamentoData.planos[1].tipo === 'previdencia'">
              <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }">
                <div>
                  <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">Tipo de Investimento</span>
                  <p :style="{ fontSize: '14px', color: 'oklch(20% 0.05 250)', margin: 0 }">Previdência</p>
                </div>
                <div>
                  <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">Idade de Aposentadoria</span>
                  <p :style="{ fontSize: '14px', color: 'oklch(20% 0.05 250)', margin: 0 }">{{ detalhamentoData.planos[1].idadeAposentadoria || '—' }}</p>
                </div>
              </div>
              <div v-for="sub in detalhamentoData.planos[1].subPlanos" :key="sub.id" :style="{ border: '1px solid oklch(92% 0.004 260)', borderRadius: '8px', padding: '16px', marginBottom: '12px', background: 'oklch(98.5% 0.002 260)' }">
                <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }">
                  <div v-for="item in [{ label: 'Contribuição Mensal', value: sub.contribuicaoMensal }, { label: 'Aporte Inicial', value: sub.aporteInicial }, { label: 'Tipo de Plano', value: sub.tipoPlano }]" :key="item.label">
                    <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">{{ item.label }}</span>
                    <p :style="{ fontSize: '13px', color: 'oklch(20% 0.05 250)', margin: 0 }">{{ item.value || '—' }}</p>
                  </div>
                </div>
                <div v-if="sub.fundos.length > 0">
                  <p :style="{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(45% 0.02 250)', marginBottom: '8px' }">Fundos Selecionados</p>
                  <div v-for="fundo in sub.fundos" :key="fundo.cnpj" :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '10px 14px', background: '#fff', marginBottom: '8px' }">
                    <p :style="{ fontSize: '13px', fontWeight: 600, color: 'oklch(20% 0.05 250)', margin: '0 0 4px 0' }">{{ fundo.nome }}</p>
                    <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', margin: '0 0 6px 0' }">{{ fundo.cnpj }}</p>
                    <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '6px' }">
                      <div v-for="item in [{ label: 'Taxa Máx. Adm.', value: (fundo as any).taxaAdmMax || fundo.taxaAdm }, { label: 'Rentabilidade', value: fundo.rentabilidade }, { label: 'Classificação', value: fundo.classificacao }]" :key="item.label" :style="{ display: 'flex', alignItems: 'center', gap: '5px' }">
                        <span :style="{ fontSize: '11px', color: 'oklch(55% 0.02 250)', whiteSpace: 'nowrap' }">{{ item.label }}:</span>
                        <span :style="{ fontSize: '12px', fontWeight: 500, color: 'oklch(20% 0.05 250)', border: '1px solid oklch(90% 0.005 260)', borderRadius: '4px', padding: '1px 6px', background: 'oklch(97% 0.003 260)', whiteSpace: 'nowrap' }">{{ item.value || '—' }}</span>
                      </div>
                    </div>
                    <div :style="{ display: 'flex', gap: '16px', flexWrap: 'wrap' }">
                      <div>
                        <span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', display: 'block' }">Contribuição Mensal</span>
                        <span :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)' }">{{ fundo.percentual }}%</span>
                        <span :style="{ fontSize: '12px', fontWeight: 500, color: 'oklch(20% 0.05 250)', marginLeft: '6px' }">{{ fundo.valorAtribuido || '—' }}</span>
                      </div>
                      <div>
                        <span :style="{ fontSize: '10px', color: 'oklch(55% 0.02 250)', display: 'block' }">Aporte Inicial</span>
                        <span :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)' }">{{ fundo.percentualAporte }}%</span>
                        <span :style="{ fontSize: '12px', fontWeight: 500, color: 'oklch(20% 0.05 250)', marginLeft: '6px' }">{{ fundo.valorAporte || '—' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div :style="{ marginBottom: '12px' }">
                <span :style="{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(55% 0.02 250)', display: 'block', marginBottom: '2px' }">Tipo de Investimento</span>
                <p :style="{ fontSize: '14px', color: 'oklch(20% 0.05 250)', margin: 0 }">Seguro de Vida — Horizonte</p>
              </div>
              <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', overflow: 'hidden' }">
                <table :style="{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', tableLayout: 'fixed' }">
                  <colgroup>
                    <col style="width: auto" />
                    <col style="width: 148px" />
                    <col style="width: 120px" />
                    <col style="width: 138px" />
                    <col style="width: 138px" />
                  </colgroup>
                  <thead>
                    <tr :style="{ background: 'oklch(95% 0.005 260)', borderBottom: '1px solid oklch(90% 0.005 260)' }">
                      <th v-for="h in ['Cobertura', 'Vigência', 'Prazo de Pagamento', 'Capital Segurado', 'Contribuição Mensal']" :key="h" :style="{ padding: '7px 6px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'oklch(45% 0.02 250)', whiteSpace: 'nowrap', textAlign: h === 'Cobertura' ? 'left' : h === 'Contribuição Mensal' ? 'right' : 'center' }">{{ h }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(cob, ci) in detalhamentoData.planos[1].coberturas" :key="ci" :style="{ borderBottom: ci < detalhamentoData.planos[1].coberturas.length - 1 ? '1px solid oklch(93% 0.003 260)' : 'none' }">
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
          </div>
        </template>

        <!-- Investimento Mensal -->
        <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '10px 16px', background: '#f8fafc', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
          <div>
            <p :style="{ fontSize: '13px', color: 'oklch(45% 0.02 250)', margin: '0 0 2px 0' }">Investimento Mensal</p>
            <p :style="{ fontSize: '11px', color: 'oklch(60% 0.02 250)', margin: 0 }">Apenas {{ isNaN(totalPercentual) ? '—' : totalPercentual }}% do seu saldo mensal</p>
          </div>
          <span :style="{ fontSize: '15px', fontWeight: 600, color: 'oklch(20% 0.05 250)' }">R$ {{ totalInvestimento.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}</span>
        </div>

        <!-- Validade do estudo -->
        <div :style="{ border: '1px solid oklch(90% 0.005 260)', borderRadius: '8px', padding: '10px 16px', background: '#f8fafc', marginTop: '8px', marginBottom: '4px' }">
          <p :style="{ fontSize: '12px', color: 'oklch(45% 0.02 250)', fontStyle: 'italic', margin: 0, textAlign: 'left' }">
            Estudo com validade de 7 dias úteis a partir da data {{ new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) }}.
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div :style="{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', paddingBottom: '16px' }">
      <button @click="handleSalvar()" :disabled="isGenerating"
        :style="{ display: 'flex', alignItems: 'center', gap: '8px', background: isGenerating ? 'oklch(55% 0.02 250)' : 'oklch(20% 0.05 250)', color: '#fff', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer' }">
        <svg v-if="isGenerating" class="h-4 w-4" :style="{ animation: 'spin 1s linear infinite' }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
        {{ isGenerating ? 'Salvando...' : 'Salvar Estudo' }}
      </button>
    </div>
  </div>
</template>
