<template>
  <div class="flex flex-col gap-3 pb-3">
    <div
      class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
      :style="{ backgroundImage: `url('${category.image}')` }"
    ></div>
    <div>
      <p class="text-white text-base font-medium leading-normal">
        {{ category.name }}
      </p>
      <p class="text-[#92b7c9] text-sm font-normal leading-normal">
        {{ category.description }}
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  category: {
    type: Object,
    required: true,
  },
});
</script>