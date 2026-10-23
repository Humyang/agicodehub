<script setup lang="ts">
import { IconDragDrop, IconHeart } from '@tabler/icons-vue';
import { useHead } from '@vueuse/head';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import Draggable from 'vuedraggable';
import ColoredCard from '../components/ColoredCard.vue';
import ToolCard from '../components/ToolCard.vue';
import { useToolStore } from '@/tools/tools.store';
import { config } from '@/config';

const toolStore = useToolStore();

useHead({ title: 'AGI Code Hub - 免费在线开发者工具箱' });
const { t } = useI18n();

const favoriteTools = computed(() => toolStore.favoriteTools);

// Update favorite tools order when drag is finished
function onUpdateFavoriteTools() {
  toolStore.updateFavoriteTools(favoriteTools.value); // Update the store with the new order
}
</script>

<template>
  <div class="pt-50px">
    <div class="grid-wrapper">
      <!-- REA 环境服务入口（跳 /service） -->
      <RouterLink to="/service" class="service-banner">
        <span class="service-banner__badge">{{ $t('home.serviceBanner.tag') }}</span>
        <span class="service-banner__text">
          <span class="service-banner__title">{{ $t('home.serviceBanner.title') }}</span>
          <span class="service-banner__desc">{{ $t('home.serviceBanner.desc') }}</span>
        </span>
        <span class="service-banner__cta">{{ $t('home.serviceBanner.cta') }}</span>
      </RouterLink>

      <div class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
        <ColoredCard v-if="config.showBanner" :title="$t('home.follow.title')" :icon="IconHeart">
          {{ $t('home.follow.p1') }}
          <a
            href="https://github.com/CorentinTh/it-tools"
            rel="noopener"
            target="_blank"
            :aria-label="$t('home.follow.githubRepository')"
          >GitHub</a>
          {{ $t('home.follow.p2') }}
          <a
            href="https://x.com/ittoolsdottech"
            rel="noopener"
            target="_blank"
            :aria-label="$t('home.follow.twitterXAccount')"
          >X</a>.
          {{ $t('home.follow.thankYou') }}
          <n-icon :component="IconHeart" />
        </ColoredCard>
      </div>

      <transition name="height">
        <div v-if="toolStore.favoriteTools.length > 0">
          <h3 class="mb-5px mt-25px text-neutral-400 font-500">
            {{ $t('home.categories.favoriteTools') }}
            <c-tooltip :tooltip="$t('home.categories.favoritesDndToolTip')">
              <n-icon :component="IconDragDrop" size="18" />
            </c-tooltip>
          </h3>
          <Draggable
            :list="favoriteTools"
            class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4"
            ghost-class="ghost-favorites-draggable"
            item-key="name"
            @end="onUpdateFavoriteTools"
          >
            <template #item="{ element: tool }">
              <ToolCard :tool="tool" />
            </template>
          </Draggable>
        </div>
      </transition>

      <div v-if="toolStore.newTools.length > 0">
        <h3 class="mb-5px mt-25px text-neutral-400 font-500">
          {{ t('home.categories.newestTools') }}
        </h3>
        <div class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
          <ToolCard v-for="tool in toolStore.newTools" :key="tool.name" :tool="tool" />
        </div>
      </div>

      <h3 class="mb-5px mt-25px text-neutral-400 font-500">
        {{ $t('home.categories.allTools') }}
      </h3>
      <div class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
        <ToolCard v-for="tool in toolStore.tools" :key="tool.name" :tool="tool" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
/* ---------- REA 环境服务入口横幅 ---------- */
.service-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
  padding: 18px 22px;
  border-radius: 12px;
  background: linear-gradient(48deg, rgba(37, 99, 108, 1) 0%, rgba(59, 149, 111, 1) 60%, rgba(20, 160, 88, 1) 100%);
  color: #fff;
  text-decoration: none;
  box-shadow: 0 6px 20px rgba(20, 160, 88, 0.22);
  transition: transform ease 0.18s, box-shadow ease 0.18s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(20, 160, 88, 0.32);
    color: #fff;
  }

  &__badge {
    flex: 0 0 auto;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
  }

  &__desc {
    margin-top: 3px;
    font-size: 13px;
    line-height: 1.5;
    opacity: 0.85;
  }

  &__cta {
    flex: 0 0 auto;
    padding: 7px 14px;
    border-radius: 8px;
    background: #fff;
    color: #14603c;
    font-size: 13.5px;
    font-weight: 700;
    white-space: nowrap;
  }
}

@media (max-width: 700px) {
  .service-banner {
    flex-wrap: wrap;
    gap: 10px;
    padding: 16px 18px;

    &__text {
      order: 3;
      flex-basis: 100%;
    }

    &__cta {
      margin-left: auto;
    }

    &__desc {
      font-size: 12.5px;
    }
  }
}

.height-enter-active,
.height-leave-active {
  transition: all 0.5s ease-in-out;
  overflow: hidden;
  max-height: 500px;
}

.height-enter-from,
.height-leave-to {
  max-height: 42px;
  overflow: hidden;
  opacity: 0;
  margin-bottom: 0;
}

.ghost-favorites-draggable {
  opacity: 0.4;
  background-color: #ccc;
  border: 2px dashed #666;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
  animation: ghost-favorites-draggable-animation 0.2s ease-out;
}

@keyframes ghost-favorites-draggable-animation {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 0.4;
    transform: scale(1.0);
  }
}
</style>
