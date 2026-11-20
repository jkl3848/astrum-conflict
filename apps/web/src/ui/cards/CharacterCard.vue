<script setup lang="ts">
import type { Character } from '@astrum/game'
import RulesText from '../RulesText.vue'

defineProps<{
  character: Character
  selected?: boolean
  compact?: boolean
}>()
</script>

<template>
  <article
    class="ink-panel relative overflow-hidden text-left transition"
    :class="[
      character.faction === 'heroes' ? 'bg-[rgba(74,163,199,0.15)]' : 'bg-[rgba(196,90,90,0.15)]',
      selected ? 'ring-4 ring-[var(--color-teal)]' : '',
      compact ? 'p-2' : 'p-3',
    ]"
  >
    <div class="halftone absolute inset-0 opacity-40 pointer-events-none" />
    <header class="relative flex items-start justify-between gap-2">
      <h3 class="comic-title text-xl md:text-2xl">{{ character.name }}</h3>
      <div
        class="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-black bg-[#9aa3ad] font-bold text-black"
        title="Defense"
      >
        {{ character.defense }}
      </div>
    </header>

    <div class="relative mt-2 flex gap-3">
      <div class="flex flex-col items-center text-[10px] text-[var(--color-hp)]">
        <span class="font-bold">HP</span>
        <span class="text-lg font-bold">{{ character.hp }}</span>
      </div>
      <div class="flex-1 space-y-2">
        <div
          v-for="ab in character.abilities"
          :key="ab.id"
          class="border-2 border-black bg-[rgba(232,184,74,0.9)] px-2 py-1 text-black"
          style="transform: skewX(-3deg)"
        >
          <div class="flex flex-wrap items-center justify-between gap-1 font-bold uppercase text-sm">
            <span>{{ ab.name }}</span>
            <span class="text-xs">
              {{ ab.kind }} · d{{ ab.dice }} · E{{ ab.energy }} · R{{ ab.range.min }}-{{ ab.range.max }}
              <template v-if="ab.modifier"> · {{ ab.modifier > 0 ? '+' : '' }}{{ ab.modifier }}</template>
            </span>
          </div>
          <p v-if="ab.text && !compact" class="mt-1 text-xs leading-snug normal-case" style="transform: skewX(3deg)">
            <RulesText :text="ab.text" />
          </p>
        </div>
        <p v-if="character.passive && !compact" class="text-xs leading-snug text-white/90">
          <RulesText :text="character.passive" />
        </p>
      </div>
      <div class="flex flex-col items-center text-[10px] text-[var(--color-energy)]">
        <span class="font-bold">EN</span>
        <span class="text-lg font-bold">{{ character.energy }}</span>
      </div>
    </div>

    <footer class="relative mt-3 flex flex-wrap items-center justify-between gap-2 border-t-2 border-black/40 pt-2 text-xs">
      <span class="font-bold">P: {{ character.points }}</span>
      <span class="uppercase tracking-wide text-white/80">{{ character.keywords.join(', ') }}</span>
      <span class="text-white/70">G{{ character.slots.gear }} T{{ character.slots.trait }}</span>
    </footer>
  </article>
</template>
