<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import { rulesSections } from '../content/rules'

const md = new MarkdownIt()
const query = ref('')
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return rulesSections
  return rulesSections.filter(
    (s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
    <aside class="ink-panel h-fit p-3 sticky top-20">
      <input
        v-model="query"
        class="mb-3 w-full rounded border-2 border-black bg-black/40 px-2 py-1 text-sm"
        placeholder="Search rules…"
      />
      <nav class="flex flex-col gap-1 text-sm">
        <a
          v-for="s in filtered"
          :key="s.id"
          :href="`#${s.id}`"
          class="rounded px-2 py-1 hover:bg-white/10 hover:text-[var(--color-teal)]"
        >{{ s.title }}</a>
      </nav>
    </aside>
    <div class="space-y-8">
      <header>
        <h1 class="comic-title text-4xl">Rulebook</h1>
        <p class="mt-2 text-white/70">Official Astrum Conflict rules — searchable, always up to date with the content version.</p>
      </header>
      <section v-for="s in filtered" :id="s.id" :key="s.id" class="ink-panel p-5">
        <h2 class="comic-title text-2xl text-[var(--color-teal)]">{{ s.title }}</h2>
        <div class="prose-comic mt-3 text-sm leading-relaxed" v-html="md.render(s.body)" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.prose-comic :deep(h1),
.prose-comic :deep(h2),
.prose-comic :deep(h3) {
  font-family: var(--font-display);
  margin: 0.6em 0 0.3em;
}
.prose-comic :deep(ul) {
  padding-left: 1.2rem;
  list-style: disc;
}
.prose-comic :deep(strong) {
  color: var(--color-teal-bright);
}
</style>
