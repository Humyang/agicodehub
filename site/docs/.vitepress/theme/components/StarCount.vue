<script setup>
import { onMounted, ref } from "vue";

const starCount = ref(0);
const isLoading = ref(true);
const error = ref(null);
const growthRate = ref(null);

async function fetchCurrentStars() {
  // const response = await fetch("https://api.github.com/repos/Humyang/agicodehub");
  // const data = await response.json();
  // return data.stargazers_count;
}

async function fetchStarsAtDate(targetDate) {
  return;
  // let page = 1;
  // const per_page = 100;
  // let stars = 0;
  // let found = false;

  // while (!found) {
  //   const response = await fetch(
  //     `https://api.github.com/repos/Humyang/agicodehub/stargazers?per_page=${per_page}&page=${page}`,
  //     {
  //       headers: {
  //         Accept: "application/vnd.github.v3.star+json",
  //       },
  //     }
  //   );
  //   const data = await response.json();
  //   if (!Array.isArray(data) || data.length === 0) break;

  //   for (let i = 0; i < data.length; i++) {
  //     const starred_at = data[i].starred_at.split("T")[0];
  //     if (starred_at > targetDate) {
  //       stars = (page - 1) * per_page + i;
  //       found = true;
  //       break;
  //     }
  //   }
  //   if (!found) page++;
  // }

  // if (!found) {
  //   const response = await fetch("https://api.github.com/repos/Humyang/agicodehub");
  //   const repoData = await response.json();
  //   stars = repoData.stargazers_count;
  // }

  // return stars;
}

onMounted(async () => {
  try {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const isoOneMonthAgo = oneMonthAgo.toISOString().split("T")[0];
    const isoTwoMonthsAgo = twoMonthsAgo.toISOString().split("T")[0];

    const [currentStars, starsOneMonthAgo, starsTwoMonthsAgo] =
      await Promise.all([
        fetchCurrentStars(),
        fetchStarsAtDate(isoOneMonthAgo),
        fetchStarsAtDate(isoTwoMonthsAgo),
      ]);
    starCount.value = currentStars;
    growthRate.value = starsOneMonthAgo - starsTwoMonthsAgo;
    isLoading.value = false;
  } catch (err) {
    error.value = "Failed to load star data";
    isLoading.value = false;
    console.error(err);
  }
});

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
</script>

<template>
  <div class="starcount-card">
    <h2 class="starcount-title">GitHub Stars</h2>

    <div v-if="isLoading" class="starcount-loading">
      <div class="spinner" />
    </div>

    <div v-else-if="error" class="starcount-error">
      {{ error }}
    </div>

    <div v-else class="starcount-content">
      <div class="star-count-display">
        <div class="star-number">
          {{ formatNumber(starCount) }}
        </div>
      </div>

      <div class="star-growth">
        <span class="growth-indicator">+{{ growthRate }}</span>
        <span class="growth-period">Last Month</span>
      </div>

      <a
        href="https://github.com/Humyang/agicodehub"
        target="_blank"
        rel="noopener"
        class="github-link"
      >
        <div class="github-link-content">
          <div class="icon-container">
            <svg viewBox="0 0 24 24" class="source-icon">
              <path
                fill="currentColor"
                d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.56C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z"
              />
            </svg>
          </div>
          <span class="github-text">Give Us Star</span>
        </div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.starcount-card {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--vp-shadow-2);
  width: 100%;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid var(--vp-c-bg-soft);
  overflow: hidden;
  position: relative;
}

.starcount-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--vp-c-text-1);
  border: none;
  padding: 0;
  position: relative;
  background: none;
  text-align: center;
}

.starcount-title::before,
.starcount-title::after {
  display: none !important;
  content: none !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
  height: 0 !important;
  width: 0 !important;
  background: none !important;
}

.starcount-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 2px solid rgba(128, 128, 128, 0.2);
  border-radius: 50%;
  border-top-color: var(--vp-c-brand-1);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.starcount-error {
  color: var(--vp-c-danger);
  padding: 2rem 0;
  font-size: 0.9rem;
}

.starcount-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.star-count-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.star-number {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.star-growth {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.growth-indicator {
  font-weight: 700;
  color: var(--vp-c-green-1);
  font-size: 0.9rem;
}

.growth-period {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
  margin-top: 1.5rem;
  width: 100%;
  position: relative;
}

.github-link-content {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
}

.icon-container {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
}

.github-link:hover {
  background-color: var(--vp-button-alt-bg);
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.source-icon {
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
}

.github-text {
  width: 100%;
  text-align: center;
}
</style>
