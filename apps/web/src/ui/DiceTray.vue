<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const roll = computed(() => store.game?.lastRoll ?? null)
const modifier = computed(() => roll.value?.modifier ?? 0)
</script>

<template>
  <div class="ink-panel p-3">
    <h3 class="comic-title text-lg">Dice</h3>
    <div v-if="roll" class="mt-3">
      <p class="text-sm font-bold uppercase tracking-wide text-[var(--color-banner)]">
        {{ roll.abilityName }}
        <span class="text-white">{{ roll.formula }}</span>
      </p>
      <p v-if="modifier" class="mt-1 text-xs text-white/70">
        Each die {{ modifier > 0 ? '+' : '' }}{{ modifier }}
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <div
          v-for="(f, i) in roll.faces"
          :key="i"
          class="relative flex h-14 w-14 flex-col items-center justify-center border-4 border-black bg-[var(--color-paper)] font-bold text-black"
          :class="roll.crits.includes(i) ? 'bg-[var(--color-banner)]' : ''"
        >
          <span class="text-xl leading-none">{{ f }}</span>
          <span v-if="modifier" class="text-[10px] font-bold leading-none text-black/70">
            {{ modifier > 0 ? '+' : '' }}{{ modifier }} → {{ roll.modified[i] }}
          </span>
          <span
            v-if="roll.crits.includes(i)"
            class="absolute -right-2 -top-2 comic-title text-[10px] text-[var(--color-villain-red)]"
          >POW</span>
        </div>
      </div>
      <p v-if="roll.energySpent || roll.kind === 'heal'" class="mt-2 text-sm text-white/80">
        <span v-if="roll.kind === 'heal'">Heal successes: {{ roll.hits }}</span>
        <span v-if="roll.energySpent">{{ roll.kind === 'heal' ? ' · ' : '' }}−{{ roll.energySpent }} EN</span>
      </p>
    </div>
    <p v-else class="mt-2 text-xs text-white/50">Click an ability to roll its dice.</p>
  </div>
</template>
