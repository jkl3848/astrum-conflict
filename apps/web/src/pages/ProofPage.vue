<script setup lang="ts">
import { allCharacters, allUpgrades, allEpics } from '@astrum/game'
import CharacterCard from '../ui/cards/CharacterCard.vue'
import UpgradeCard from '../ui/cards/UpgradeCard.vue'
import EpicCard from '../ui/cards/EpicCard.vue'
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="comic-title text-4xl">Card Proof</h1>
    <p class="mt-2 text-white/70">Dev page — compare web cards to the printed originals while transcribing.</p>

    <h2 class="comic-title mt-10 text-2xl">Characters ({{ allCharacters.length }})</h2>
    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CharacterCard v-for="c in allCharacters" :key="c.id" :character="c" />
    </div>

    <h2 class="comic-title mt-10 text-2xl">Upgrades ({{ allUpgrades.length }})</h2>
    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UpgradeCard v-for="u in allUpgrades" :key="u.id" :upgrade="u" />
    </div>

    <h2 class="comic-title mt-10 text-2xl">Epics ({{ allEpics.length }})</h2>
    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <EpicCard v-for="e in allEpics" :key="e.id" :epic="e" />
    </div>
  </div>
</template>
