<template>
  <div class="field-item">
    <span class="field-item__label">{{ label }}</span>
    <span class="field-item__value">{{ value || '—' }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value?: string
}>()
</script>

<style scoped>
.field-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-item__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-label);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.field-item__value {
  font-size: 14px;
  color: var(--text-primary);
}
</style>
