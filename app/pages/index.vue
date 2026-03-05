<script setup lang="ts">
import { ref } from 'vue'

useHead({ title: 'Gerar Estudo - Previdência e Seguro de Vida' })

const activeTab = ref<'resumo' | 'detalhamento' | 'revisao'>('resumo')
const editingTab = ref<'resumo' | 'detalhamento' | 'revisao' | null>(null)
const opacity = ref(1)
const mainRef = ref<HTMLElement | null>(null)

const tabs = [
  { id: 'resumo', label: 'Resumo Jornada de Vida' },
  { id: 'detalhamento', label: 'Detalhamento do Plano' },
  { id: 'revisao', label: 'Revisão do Estudo' },
] as const

const ALIA_LOGO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031821263/MgbGpHqkCRImoSLY.png'

function scrollToTop() {
  if (mainRef.value) {
    mainRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function doSwitch(tab: 'resumo' | 'detalhamento' | 'revisao') {
  if (tab === activeTab.value) return
  opacity.value = 0
  setTimeout(() => {
    activeTab.value = tab
    setTimeout(() => {
      scrollToTop()
      setTimeout(() => { opacity.value = 1 }, 80)
    }, 30)
  }, 180)
}

function switchTab(tab: string) {
  const target = tab as 'resumo' | 'detalhamento' | 'revisao'
  if (target === activeTab.value) return
  if (editingTab.value !== null) {
    alert('Salve as alterações antes de continuar.')
    return
  }
  doSwitch(target)
}

function handleEditingChange(tab: 'resumo' | 'detalhamento' | 'revisao', editing: boolean) {
  editingTab.value = editing ? tab : null
}
</script>

<template>
  <div
    :style="{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'oklch(96% 0.005 260)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }"
  >
    <!-- Sidebar -->
    <aside
      :style="{
        width: '280px',
        minWidth: '280px',
        background: '#ffffff',
        borderRight: '1px solid oklch(90% 0.005 260)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        flexShrink: 0,
        zIndex: 40,
      }"
    >
      <!-- Logo -->
      <div :style="{ padding: '20px 16px 16px', borderBottom: '1px solid oklch(93% 0.003 260)' }">
        <img :src="ALIA_LOGO_URL" alt="ALIA" :style="{ height: '28px', width: 'auto', display: 'block' }" />
      </div>
      <!-- Voltar -->
      <div :style="{ padding: '12px 8px 4px' }">
        <button
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            fontSize: '13px',
            color: 'oklch(45% 0.02 250)',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
          }"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" :style="{ flexShrink: 0 }">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar
        </button>
      </div>
      <!-- Navigation items -->
      <nav :style="{ padding: '4px 8px', flex: 1 }">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="switchTab(tab.id)"
          :style="{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '9px 10px',
            fontSize: '13px',
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? 'oklch(20% 0.05 250)' : 'oklch(45% 0.02 250)',
            background: activeTab === tab.id ? 'oklch(93% 0.005 260)' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '2px',
            lineHeight: 1.4,
            transition: 'background 0.12s, color 0.12s',
          }"
        >
          {{ tab.label }}
        </button>
      </nav>
    </aside>

    <!-- Main content -->
    <main
      ref="mainRef"
      :style="{
        flex: 1,
        minWidth: 0,
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }"
    >
      <div
        :style="{
          width: '100%',
          padding: 'clamp(16px, 3vw, 28px) clamp(16px, 4vw, 40px)',
          flex: 1,
          boxSizing: 'border-box',
          opacity: opacity,
          transition: 'opacity 180ms ease',
        }"
      >
        <TabsResumoJornada
          v-if="activeTab === 'resumo'"
          @next="switchTab('detalhamento')"
          @editing-change="(editing: boolean) => handleEditingChange('resumo', editing)"
        />
        <TabsDetalhamentoPlano
          v-else-if="activeTab === 'detalhamento'"
          @back="switchTab('resumo')"
          @next="switchTab('revisao')"
          @editing-change="(editing: boolean) => handleEditingChange('detalhamento', editing)"
        />
        <TabsRevisaoEstudo
          v-else-if="activeTab === 'revisao'"
          @back="switchTab('detalhamento')"
        />
      </div>
    </main>
  </div>
</template>
