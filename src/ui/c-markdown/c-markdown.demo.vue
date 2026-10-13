<script setup lang="ts">
const md = `
# AGI Code Hub

## About
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl quis
mollis blandit, nunc nisl aliquam nunc, vitae aliquam nisl nunc vitae nisl.

- Lorem ipsum dolor sit amet, consectetur adipiscing elit.
- Sed euismod, nisl quis mollis blandit, nunc nisl aliquam nunc, vitae aliquam nisl nunc vitae nisl.

[AGI Code Hub](https://agicodehub.com)
`;
</script>

<template>
  <c-markdown :markdown="md" />
</template>
