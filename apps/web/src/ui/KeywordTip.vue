<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/vue'
import { glossary } from '../content/rules'
import { useRulesDrawer } from '../stores/rulesDrawer'

const props = defineProps<{ term: string }>()
const open = ref(false)
const reference = ref<HTMLElement | null>(null)
const floating = ref<HTMLElement | null>(null)
const drawer = useRulesDrawer()

const entry = computed(() => {
  const t = props.term.toLowerCase()
  return glossary.find((g) => {
    const names = [g.term, ...(g.aliases ?? [])].map((x) => x.toLowerCase())
    return names.some((n) => t === n || t.startsWith(n.replace(/:$/, '')))
  })
})

const { floatingStyles } = useFloating(reference, floating, {
  whileElementsMounted: autoUpdate,
  middleware: [offset(8), flip(), shift({ padding: 8 })],
  placement: 'top',
})

function openFull() {
  if (entry.value?.section) drawer.open(entry.value.section)
  open.value = false
}
</script>

<template>
  <span
    ref="reference"
    class="keyword-chip"
    tabindex="0"
    @mouseenter="open = true"
    @mouseleave="open = false"
    @focus="open = true"
    @blur="open = false"
    @click.stop="open = !open"
  >
    <slot>{{ term }}</slot>
  </span>
  <Teleport to="body">
    <div
      v-if="open && entry"
      ref="floating"
      class="speech-bubble"
      :style="floatingStyles"
      @mouseenter="open = true"
      @mouseleave="open = false"
    >
      <div class="font-bold uppercase tracking-wide">{{ entry.term }}</div>
      <p class="mt-1 leading-snug">{{ entry.short }}</p>
      <button
        v-if="entry.section"
        type="button"
        class="mt-2 text-xs font-semibold text-[var(--color-magenta)] underline"
        @click="openFull"
      >
        Full rule
      </button>
    </div>
  </Teleport>
</template>
