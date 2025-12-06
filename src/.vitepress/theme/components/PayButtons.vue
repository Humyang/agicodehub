<script setup lang="ts">
/// <reference types="@types/gtag.js" />
</script>

<template>
  <div>
    <div class="pay-buttons">
      <a
        class="pay-button primary"
        href="https://fajarrahmadjaya.gumroad.com/l/agicodehub-pro/agicodehubPro25"
      >
        <IconDownload />
        <span class="text">Get agicodehub Pro</span>
      </a>
    </div>
    <span class="price">
      Limited <strong>25% Off</strong> for 10 customer.
    </span>
  </div>
</template>

<style lang="stylus">
.pay-buttons {
  display: flex;
  gap: 0.75em;
  justify-content: center;
  align-items: center;
  margin: 0.75em auto;
}

.pay-button {
  display: inline-block;
  border: 1px solid transparent;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 20px;
  padding: 0 20px;
  line-height: 38px;
  font-size: 14px;

  &:hover {
    text-decoration: none !important;
  }

  &.primary {
    border-color: var(--vp-button-brand-border);
    color: var(--vp-button-brand-text);
    background-color: var(--vp-button-brand-bg);

    &:hover {
      border-color: var(--vp-button-brand-hover-border);
      color: var(--vp-button-brand-hover-text);
      background-color: var(--vp-button-brand-hover-bg);
    }

    &:active {
      border-color: var(--vp-button-brand-active-border);
      color: var(--vp-button-brand-active-text);
      background-color: var(--vp-button-brand-active-bg);
    }
  }

  &.secondary {
    border-color: var(--vp-button-alt-border);
    color: var(--vp-button-alt-text);
    background-color: var(--vp-button-alt-bg);

    &:hover {
      border-color: var(--vp-button-alt-hover-border);
      color: var(--vp-button-alt-hover-text);
      background-color: var(--vp-button-alt-hover-bg);
    }

    &:active {
      border-color: var(--vp-button-alt-active-border);
      color: var(--vp-button-alt-active-text);
      background-color: var(--vp-button-alt-active-bg);
    }
  }

  svg {
    display: inline-block;
    vertical-align: middle;
    margin-right: 0.5em;
    font-size: 1.25em;
  }

  .text {
    margin-right: 10px;
  }

  .version {
    font-size: 0.8em;
  }
}

.price {
  display: block;
  text-align: center;
  margin: 0.75em auto;
  font-size: 0.75rem;
}
</style>
