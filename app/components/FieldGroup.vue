<template>
  <div class="field-group">
    <slot />
  </div>
</template>

<style scoped>
.field-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}
</style>
