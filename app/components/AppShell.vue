<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar__logo">
        <img src="/alia-logo.png" alt="ALIA" class="sidebar__logo-img" />
      </div>
      <nav class="sidebar__nav">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          class="sidebar__tab"
          :class="{ 'sidebar__tab--active': activeTab === index }"
          @click="$emit('tab-change', index)"
        >
          <span class="sidebar__tab-num">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="sidebar__tab-label">{{ tab }}</span>
        </button>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tabs: string[]
  activeTab: number
}>()

defineEmits<{
  'tab-change': [index: number]
}>()
</script>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar__logo {
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar__logo-img {
  height: 28px;
  object-fit: contain;
}

.sidebar__nav {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__tab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  border-radius: 0;
  width: 100%;
}

.sidebar__tab:hover {
  background: var(--bg-tab-active);
}

.sidebar__tab--active {
  background: var(--bg-tab-active);
}

.sidebar__tab-num {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.sidebar__tab--active .sidebar__tab-num {
  color: var(--text-primary);
}

.sidebar__tab-label {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-muted);
  line-height: 1.3;
}

.sidebar__tab--active .sidebar__tab-label {
  font-weight: 600;
  color: var(--text-primary);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-app);
}
</style>
