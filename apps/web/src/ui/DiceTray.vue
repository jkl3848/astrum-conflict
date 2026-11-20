<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()
</script>

<template>
  <div class="ink-panel p-3">
    <h3 class="comic-title text-lg">Dice</h3>
    <div v-if="store.game?.lastRoll" class="mt-3">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(f, i) in store.game.lastRoll.faces"
          :key="i"
          class="relative flex h-12 w-12 items-center justify-center border-4 border-black bg-[var(--color-paper)] text-xl font-bold text-black"
          :class="store.game.lastRoll.crits.includes(i) ? 'bg-[var(--color-banner)]' : ''"
        >
          {{ f }}
          <span
            v-if="store.game.lastRoll.crits.includes(i)"
            class="absolute -right-2 -top-2 comic-title text-[10px] text-[var(--color-villain-red)]"
          >POW</span>
        </div>
      </div>
      <p class="mt-2 text-sm">
        Hits: <strong>{{ store.game.lastRoll.hits }}</strong>
        · Suggested dmg: <strong>{{ store.game.lastRoll.damage }}</strong>
      </p>
    </div>
    <p v-else class="mt-2 text-xs text-white/50">No rolls yet.</p>
  </div>
</template>
