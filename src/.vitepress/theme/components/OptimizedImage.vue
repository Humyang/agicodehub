<template>
  <picture>
    <!-- 超小屏幕 (xs) -->
    <!-- <source
      media="(max-width: 640px)"
      :srcset="assetPrefix + '/' + variants[0]?.path"
      type="image/webp"
    /> -->

    <!-- 小屏幕 (sm) -->
    <!-- <source
      media="(max-width: 768px)"
      :srcset="assetPrefix + '/' + variants[1]?.path"
      type="image/webp"
    /> -->

    <!-- 中等屏幕 (md) -->
    <!-- <source
      media="(max-width: 1024px)"
      :srcset="assetPrefix + '/' + variants[2]?.path"
      type="image/webp"
    /> -->

    <!-- 大屏幕 (lg) -->
    <!-- <source
      media="(max-width: 1366px)"
      :srcset="assetPrefix + '/' + variants[3]?.path"
      type="image/webp"
    /> -->

    <!-- 超大屏幕 (xl) -->
    <source
      media="(max-width: 1080px)"
      :srcset="assetPrefix + variants[4]?.path"
      type="image/webp"
    />

    <!-- 超超大屏幕 (xxl) -->
    <source
      media="(max-width: 1620px)"
      :srcset="assetPrefix + variants[5]?.path"
      type="image/webp"
    />

    <!-- 最大屏幕 (xxxl) - 默认 -->
    <source :srcset="assetPrefix + variants[6]?.path" type="image/webp" />

    <!-- 回退图片 -->
    <img :src="assetPrefix + variants[0]?.path" :alt="alt" v-bind="props" />
  </picture>
</template>

<script>
import imageMap from "/image-map.json";

export default {
  name: "OptimizedImage",
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    // 修正路径查找逻辑
    const imageInfo = imageMap[props.src] || imageMap[`images/${props.src}`];

    if (!imageInfo) {
      console.warn(`未找到优化图片: ${props.src}`);
      return {
        assetPrefix: import.meta.env.BASE_URL || "",
        variants: [{ path: `images/${props.src}` }],
      };
    }

    // 获取变体并按宽度排序
    const variants = imageInfo.variants.sort((a, b) => a.width - b.width);

    // 使用Vite环境变量获取资产前缀
    const assetPrefix = import.meta.env.BASE_URL || "";

    return {
      assetPrefix,
      variants,
    };
  },
};
</script>