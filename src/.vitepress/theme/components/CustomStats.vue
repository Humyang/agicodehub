<template>
  <div class="grid-container">
    <slot name="card1" />
    <slot name="card2" />
    <slot name="card3" />
  </div>
</template>

<style scoped>
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  width: 100%;
  margin: 1.5rem auto;
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}
</style>
