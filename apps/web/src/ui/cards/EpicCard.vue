<script setup lang="ts">
import type { EpicCard } from '@astrum/game'
import RulesText from '../RulesText.vue'

defineProps<{ epic: EpicCard; selected?: boolean }>()
</script>

<template>
  <article
    class="ink-panel p-3 text-left"
    :class="selected ? 'ring-4 ring-[var(--color-banner)]' : ''"
  >
    <h3 class="comic-title text-lg">{{ epic.name }}</h3>
    <div
      v-if="epic.characterId"
      class="mt-2 bg-black px-2 py-1 text-center text-xs font-bold uppercase tracking-widest text-white"
    >
      {{ epic.characterId }}
    </div>
    <p class="mt-3 text-sm leading-snug">
      <RulesText :text="epic.text" />
    </p>
  </article>
</template>
