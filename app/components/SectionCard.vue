<template>
  <div class="section-card">
    <div class="section-card__header">
      <div class="section-card__title-row">
        <span v-if="$slots.icon" class="section-card__icon">
          <slot name="icon" />
        </span>
        <h3 class="section-card__title">{{ title }}</h3>
      </div>
      <div v-if="$slots.actions" class="section-card__actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="section-card__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.section-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin-bottom: 16px;
  overflow: hidden;
}

.section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
}

.section-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-card__icon {
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.section-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.section-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-card__body {
  padding: 16px 18px;
}
</style>
