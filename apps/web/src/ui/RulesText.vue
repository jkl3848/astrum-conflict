<script setup lang="ts">
import { computed } from 'vue'
import { glossary } from '../content/rules'
import KeywordTip from './KeywordTip.vue'

const props = defineProps<{ text: string }>()

type Part = { type: 'text'; value: string } | { type: 'term'; value: string }

const parts = computed<Part[]>(() => {
  const text = props.text
  const terms = glossary
    .flatMap((g) => [g.term, ...(g.aliases ?? [])])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!terms.length) return [{ type: 'text', value: text }]
  const re = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi')
  const out: Part[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index) })
    out.push({ type: 'term', value: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) })
  return out
})
</script>

<template>
  <span class="rules-text">
    <template v-for="(p, i) in parts" :key="i">
      <KeywordTip v-if="p.type === 'term'" :term="p.value">{{ p.value }}</KeywordTip>
      <template v-else>{{ p.value }}</template>
    </template>
  </span>
</template>
