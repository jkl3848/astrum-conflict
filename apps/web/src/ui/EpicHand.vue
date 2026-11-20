<script setup lang="ts">
import { computed } from 'vue'
import { getEpic } from '@astrum/game'
import { useGameStore } from '../stores/game'
import EpicCard from './cards/EpicCard.vue'

const props = defineProps<{
  seat: 'A' | 'B'
}>()

const store = useGameStore()
const zone = computed(() => store.game?.epics?.[props.seat])
const mine = computed(() => store.canSeeEpicHand(props.seat))
const name = computed(() => store.game?.players[props.seat].name || `Player ${props.seat}`)
const cards = computed(() => (zone.value?.hand ?? []).map((id) => getEpic(id)).filter((c): c is NonNullable<typeof c> => Boolean(c)))
const canPlay = computed(() => mine.value && store.canPlayEpicNow() && store.game?.activeSeat === props.seat)
</script>

<template>
  <section v-if="zone" class="ink-panel p-3">
    <div class="flex items-baseline justify-between gap-2">
      <h3 class="comic-title text-lg">Epics · {{ name }}</h3>
      <span class="text-[10px] uppercase tracking-wide text-white/55">
        <template v-if="mine">Hand {{ zone.hand.length }} · Deck {{ zone.deck.length }}</template>
        <template v-else>Hand {{ zone.hand.length }}</template>
      </span>
    </div>

    <div v-if="mine" class="mt-2 space-y-2">
      <p v-if="!cards.length" class="text-xs text-white/55">No Epic Cards in hand. Draw when an ally is downed.</p>
      <article v-for="card in cards" :key="card.id" class="space-y-1">
        <EpicCard :epic="card" />
        <button
          v-if="canPlay"
          type="button"
          class="comic-btn !py-1 !px-3 text-xs"
          @click="store.playEpic(card.id)"
        >Play at start of turn</button>
      </article>
      <p v-if="canPlay && cards.length" class="text-[11px] text-white/55">
        Play before you activate a unit. Character cards need that unit; generic cards use your selected ally.
      </p>
    </div>
    <div v-else class="mt-3 flex flex-wrap gap-1">
      <div
        v-for="n in zone.hand.length"
        :key="n"
        class="flex h-14 w-10 items-center justify-center rounded-sm border-2 border-black bg-[var(--color-plum)] text-[10px] font-bold uppercase text-white/80"
      >Epic</div>
      <p v-if="!zone.hand.length" class="text-xs text-white/55">Empty hand.</p>
    </div>
  </section>
</template>
