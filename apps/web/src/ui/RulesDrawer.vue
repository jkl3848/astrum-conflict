<script setup lang="ts">
import { computed, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import { useRulesDrawer } from '../stores/rulesDrawer'
import { rulesSections } from '../content/rules'

const md = new MarkdownIt({ html: false, linkify: true })
const drawer = useRulesDrawer()

const filtered = computed(() => {
  const q = drawer.query.trim().toLowerCase()
  if (!q) return rulesSections
  return rulesSections.filter(
    (s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q),
  )
})

watch(
  () => drawer.sectionId,
  (id) => {
    if (!id || !drawer.isOpen) return
    requestAnimationFrame(() => {
      document.getElementById(`rule-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="drawer.isOpen" class="fixed inset-0 z-50 flex justify-end">
      <button class="absolute inset-0 bg-black/60" type="button" aria-label="Close" @click="drawer.close()" />
      <aside class="relative z-10 flex h-full w-full max-w-lg flex-col border-l-4 border-black bg-[var(--color-space-2)] shadow-2xl">
        <header class="flex items-center gap-3 border-b-4 border-black p-4">
          <h2 class="comic-title text-2xl">Rules</h2>
          <input
            v-model="drawer.query"
            class="ml-auto w-40 rounded border-2 border-black bg-black/40 px-2 py-1 text-sm"
            placeholder="Search…"
          />
          <button type="button" class="comic-btn secondary !px-3 !py-1 text-sm" @click="drawer.close()">Close</button>
        </header>
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <section v-for="s in filtered" :id="`rule-${s.id}`" :key="s.id">
            <h3 class="comic-title text-xl text-[var(--color-teal)]">{{ s.title }}</h3>
            <div class="prose-comic mt-2 text-sm leading-relaxed" v-html="md.render(s.body)" />
          </section>
        </div>
      </aside>
    </div>
  </Teleport>
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
.prose-comic :deep(p) {
  margin: 0.4em 0;
}
.prose-comic :deep(strong) {
  color: var(--color-teal-bright);
}
</style>
