<script setup lang="ts">
import type { Upgrade } from '@astrum/game'
import RulesText from '../RulesText.vue'

defineProps<{ upgrade: Upgrade; selected?: boolean }>()
</script>

<template>
  <article
    class="ink-panel p-3 text-left"
    :class="selected ? 'ring-4 ring-[var(--color-teal)]' : ''"
  >
    <header class="border-b-4 border-black pb-2">
      <h3 class="comic-title text-lg">{{ upgrade.name }}</h3>
      <div class="mt-1 flex justify-between text-xs uppercase tracking-wide text-white/70">
        <span>P-{{ upgrade.points }}</span>
        <span>{{ upgrade.slot }}</span>
        <span v-if="upgrade.restrictions?.characters?.length">
          {{ upgrade.restrictions.characters.join(', ') }}
        </span>
      </div>
    </header>
    <p class="mt-3 text-sm leading-snug">
      <RulesText :text="upgrade.text" />
    </p>
  </article>
</template>
