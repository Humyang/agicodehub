<script setup lang="ts">
import { toRefs } from 'vue'

// Add version prop
const props = defineProps<{ version?: string }>()

const { version } = toRefs(props)
</script>

<template>
  <div class="changelog">
    <header>
      <IconNewspaperVariant />
      <h2>{{ version ? `${version} Changelog` : 'Changelog' }}</h2>
    </header>
    <div v-if="$slots.default">
      <slot />
    </div>
  </div>
</template>

<style lang="stylus">
.changelog {
  display: block
  border: 1px solid var(--vp-c-bg-soft)
  border-radius: 12px
  background-color: var(--vp-c-bg-soft)
  transition: border-color 0.25s, background-color 0.25s
  padding: 24px
  height: 100%
  margin: 1.5em auto 0.5em

  header {
    display: flex
    justify-content: center
    align-items: baseline
    margin: 0 0 1rem
  }

  svg {
    font-size: 1.2em
    margin-right: 0.5rem
    vertical-align: middle
  }

  h2 {
    font-size: 1.5rem
    margin: 0
    padding: 0
    color: var(--vp-c-text-1)
    border: none
    display: flex
    align-items: center
    gap: 0.5em
    font-weight: bold
  }

  .changelog-version {
    font-size: 1rem
    color: var(--vp-c-text-2)
    font-weight: 500
    margin-left: 0
    margin-right: 0.5em
  }

  div > p {
    margin: 0 0 1rem
    color: var(--vp-c-text-2)
    font-size: 0.9rem
  }

  table {
    border-radius: 8px
    border-collapse: collapse
    border: 1px solid var(--vp-c-divider)

    tr,
    th,
    td {
      border: none
      width: 100%
    }

    tbody tr {
      border-top: 1px solid var(--vp-c-divider)
    }

    tr > td {
      &:first-child {
        color: var(--vp-c-text-2)
      }

      &:last-child {
        font-family: var(--vp-font-family-mono)
        font-size: var(--vp-code-font-size)
      }
    }
  }
}

.fullChangelog {
  margin: 0 0 1rem
  color: var(--vp-c-text-2)
  font-size: 0.9rem
}
</style>
