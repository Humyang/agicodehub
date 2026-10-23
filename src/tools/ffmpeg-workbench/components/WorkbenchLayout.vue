<script setup lang="ts">
import { computed, useSlots } from 'vue';

defineProps<{ title: string }>();

const slots = useSlots();
const hasAside = computed(() => Boolean(slots.aside));
</script>

<template>
  <div class="wb" :class="{ 'wb--with-aside': hasAside }">
    <n-card size="small" :title="title" :bordered="false" class="wb__card">
      <slot name="params" />
    </n-card>

    <div v-if="hasAside" class="wb__aside">
      <slot name="aside" />
    </div>

    <div class="wb__output">
      <div class="wb__sticky">
        <slot name="output" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wb {
  display: grid;
  gap: 16px;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.wb--with-aside {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr) minmax(0, 1fr);
}

.wb__card {
  --n-padding-left: 16px;
}

.wb__sticky {
  position: sticky;
  top: 16px;
}

@media (max-width: 1200px) {
  .wb,
  .wb--with-aside {
    grid-template-columns: minmax(0, 1fr);
  }

  .wb__sticky {
    position: static;
  }
}
</style>
