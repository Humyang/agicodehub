<template>
  <div class="custom-component">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
// import UICard from './components/UICard.vue';
</script>

<style scoped>
.custom-component {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background: var(--vp-c-bg-soft);
}

.custom-component h3 {
  color: var(--vp-c-brand);
  margin-top: 0;
}
</style>