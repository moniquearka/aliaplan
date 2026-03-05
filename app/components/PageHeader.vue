<template>
  <div class="page-header">
    <div class="page-header__left">
      <span v-if="$slots.icon" class="page-header__icon">
        <slot name="icon" />
      </span>
      <h1 class="page-header__title">{{ title }}</h1>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.page-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-header__icon {
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.page-header__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
