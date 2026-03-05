<template>
  <div class="nav-footer">
    <button v-if="showCancel" class="nav-footer__cancel" @click="$emit('cancel')">
      Voltar
    </button>
    <button class="nav-footer__confirm" @click="$emit('confirm')">
      {{ confirmLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  confirmLabel?: string
  showCancel?: boolean
}>(), {
  confirmLabel: 'Continuar',
  showCancel: false,
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.nav-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  margin-top: 8px;
}

.nav-footer__cancel {
  padding: 9px 20px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  font-family: var(--font-sans);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.nav-footer__cancel:hover {
  background: var(--bg-tab-active);
  color: var(--text-primary);
}

.nav-footer__confirm {
  padding: 9px 20px;
  border: none;
  border-radius: 6px;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-color);
  font-size: 13px;
  font-family: var(--font-sans);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.nav-footer__confirm:hover {
  opacity: 0.85;
}
</style>
