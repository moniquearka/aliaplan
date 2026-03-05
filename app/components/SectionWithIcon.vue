<template>
  <div class="section-card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid oklch(90% 0.005 260)">
      <div style="width:32px;height:32px;border-radius:8px;background:oklch(95% 0.005 260);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:oklch(45% 0.02 250)">
        <slot name="icon" />
      </div>
      <h3 style="font-size:15px;font-weight:600;color:oklch(20% 0.05 250);margin:0">{{ title }}</h3>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
