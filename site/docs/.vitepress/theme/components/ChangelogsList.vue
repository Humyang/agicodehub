<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { data as changelogs } from "../data/changelogs.data";

const md = new MarkdownIt();

function renderMarkdown(string: string | null | undefined) {
  const body = string ?? "No changelog provided.";
  const changelogMatch = body.match(/## Changelog[\s\S]*?(?:\n\n|$)/);
  let changelogSection = changelogMatch
    ? changelogMatch[0].replace(/> \[!IMPORTANT\][\s\S]*$/m, "").trim()
    : "No changelog provided.";

  changelogSection = changelogSection
    .replace(/## Next Update Plan[\s\S]*/, "")
    .replace(/^## Changelog/, "### Changelog");

  const flavoredString = changelogSection
    .replace(/(?<=\(|(, ))@(.*?)(?=\)|(, ))/g, "[@$2](https://github.com/$2)")
    .replace(
      /#(\d+)/g,
      "[#$1](https://github.com/Humyang/agicodehub/issues/$1)"
    )
    .replace(/^Check out the .*past release notes.* if you're.*$/m, "")
    .replace(
      /https:\/\/github.com\/Humyang\/agicodehub\/releases\/tag\/(.*)/g,
      "#$1"
    )
    .trim();

  return md.render(flavoredString);
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});
</script>

<template>
  <div v-for="(release, index) of changelogs" :key="release.tag_name">
    <h2 :id="index === 0 ? 'latest' : release.tag_name">
      <a :href="release.html_url" target="_blank">
        {{ release.tag_name.substring(1) }}
      </a>
      <Badge v-if="index === 0" type="tip" text="Latest" />
      <a
        class="header-anchor"
        :href="index === 0 ? '#latest' : `#${release.tag_name}`"
        :aria-label="`Permalink to &quot;${release.tag_name}&quot;`"
      />
    </h2>
    <time :datetime="release.published_at!">
      {{ dateFormatter.format(new Date(release.published_at!)) }}
    </time>
    <div v-html="renderMarkdown(release.body)" />
  </div>
</template>

<style lang="stylus" scoped>
h2 {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

time {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}
</style>
