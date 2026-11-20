<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  allEpics,
  allUpgrades,
  charactersByFaction,
  gameConstants,
  getCharacter,
  getUpgrade,
} from '@astrum/game'
import { useTeamBuilderStore } from '../stores/teamBuilder'
import CharacterCard from './cards/CharacterCard.vue'
import UpgradeCard from './cards/UpgradeCard.vue'
import EpicCard from './cards/EpicCard.vue'

const props = withDefaults(
  defineProps<{
    lockFaction?: boolean
    compact?: boolean
  }>(),
  { lockFaction: false, compact: false },
)

const store = useTeamBuilderStore()
const tab = ref<'units' | 'upgrades' | 'epics'>('units')
const selectedUnit = ref(0)

const roster = computed(() => charactersByFaction(store.faction))
const availableEpics = computed(() =>
  allEpics.filter((e) => !e.characterId || store.units.some((u) => u.characterId === e.characterId)),
)

const currentUnit = computed(() => store.units[selectedUnit.value])
const currentChar = computed(() =>
  currentUnit.value ? getCharacter(currentUnit.value.characterId) : undefined,
)

const equipableUpgrades = computed(() => {
  const c = currentChar.value
  if (!c) return []
  return allUpgrades.filter((u) => {
    const r = u.restrictions
    if (!r) return true
    const checks: boolean[] = []
    if (r.factions?.length) checks.push(r.factions.includes(c.faction))
    if (r.characters?.length) checks.push(r.characters.includes(c.id))
    if (r.keywords?.length) {
      checks.push(r.keywords.some((k) => c.keywords.map((x) => x.toLowerCase()).includes(k.toLowerCase())))
    }
    return checks.length === 0 || checks.some(Boolean)
  })
})

function toggleUpgrade(id: string) {
  if (!currentUnit.value || !currentChar.value) return
  const u = getUpgrade(id)
  if (!u) return
  const ids = [...currentUnit.value.upgradeIds]
  const idx = ids.indexOf(id)
  if (idx >= 0) {
    ids.splice(idx, 1)
  } else {
    const slotCount = ids.filter((x) => getUpgrade(x)?.slot === u.slot).length
    const max = u.slot === 'gear' ? currentChar.value.slots.gear : currentChar.value.slots.trait
    if (slotCount >= max) return
    ids.push(id)
  }
  store.setUpgrades(selectedUnit.value, ids)
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <input
          v-model="store.name"
          class="border-b-2 border-[var(--color-teal)] bg-transparent text-lg outline-none"
        />
      </div>
      <div class="ink-panel px-4 py-3 text-center">
        <div
          class="comic-title text-3xl"
          :class="store.points > gameConstants.teamPointCap ? 'text-[var(--color-villain-red)]' : 'text-[var(--color-teal)]'"
        >
          {{ store.points }} / {{ gameConstants.teamPointCap }}
        </div>
        <div class="text-xs uppercase tracking-wide text-white/60">points</div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="comic-btn"
        :class="store.faction === 'heroes' ? '' : 'secondary'"
        :disabled="lockFaction"
        @click="store.setFaction('heroes')"
      >Heroes</button>
      <button
        type="button"
        class="comic-btn"
        :class="store.faction === 'villains' ? '' : 'secondary'"
        :disabled="lockFaction"
        @click="store.setFaction('villains')"
      >Villains</button>
      <slot name="actions" />
    </div>

    <div v-if="store.errors.length" class="speech-bubble mt-4 !max-w-xl">
      <ul class="list-disc pl-4 text-sm">
        <li v-for="(e, i) in store.errors" :key="i">{{ e.message }}</li>
      </ul>
    </div>

    <div class="mt-6 flex gap-2">
      <button type="button" class="comic-btn !py-1 text-sm" :class="tab==='units'?'':'secondary'" @click="tab='units'">Units</button>
      <button type="button" class="comic-btn !py-1 text-sm" :class="tab==='upgrades'?'':'secondary'" @click="tab='upgrades'">Upgrades</button>
      <button type="button" class="comic-btn !py-1 text-sm" :class="tab==='epics'?'':'secondary'" @click="tab='epics'">
        Epics ({{ store.epicIds.length }}/{{ gameConstants.epicDeckSize }})
      </button>
    </div>

    <div class="mt-6 grid gap-6" :class="compact ? 'lg:grid-cols-[minmax(0,1fr)_16rem]' : 'lg:grid-cols-[1fr_320px]'">
      <div class="min-w-0">
        <div v-if="tab==='units'" class="grid gap-4 sm:grid-cols-2">
          <button
            v-for="c in roster"
            :key="c.id"
            type="button"
            class="text-left"
            @click="store.addUnit(c.id)"
          >
            <CharacterCard :character="c" compact />
          </button>
        </div>

        <div v-else-if="tab==='upgrades'">
          <p v-if="!currentChar" class="text-white/60">Add a unit, then select them on the right to equip upgrades.</p>
          <div v-else class="grid gap-4 sm:grid-cols-2">
            <button
              v-for="u in equipableUpgrades"
              :key="u.id"
              type="button"
              class="text-left"
              @click="toggleUpgrade(u.id)"
            >
              <UpgradeCard :upgrade="u" :selected="currentUnit?.upgradeIds.includes(u.id)" />
            </button>
          </div>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2">
          <button
            v-for="e in availableEpics"
            :key="e.id"
            type="button"
            class="text-left"
            @click="store.toggleEpic(e.id)"
          >
            <EpicCard :epic="e" :selected="store.epicIds.includes(e.id)" />
          </button>
        </div>
      </div>

      <aside class="ink-panel h-fit p-4 lg:sticky lg:top-0">
        <h2 class="comic-title text-xl">Your Squad</h2>
        <ul class="mt-3 space-y-2">
          <li
            v-for="(u, i) in store.units"
            :key="i"
            class="flex items-start justify-between gap-2 rounded border-2 border-black/50 bg-black/30 p-2 cursor-pointer"
            :class="selectedUnit===i ? 'ring-2 ring-[var(--color-teal)]' : ''"
            @click="selectedUnit = i; tab='upgrades'"
          >
            <div>
              <div class="font-bold">{{ getCharacter(u.characterId)?.name }}</div>
              <div class="text-xs text-white/60">
                {{ u.upgradeIds.map(id => getUpgrade(id)?.name).filter(Boolean).join(', ') || 'No upgrades' }}
              </div>
            </div>
            <button type="button" class="text-xs text-[var(--color-villain-red)]" @click.stop="store.removeUnit(i)">✕</button>
          </li>
        </ul>
        <div class="mt-4 text-xs text-white/60">
          Epics: {{ store.epicIds.join(', ') || 'none' }}
        </div>
      </aside>
    </div>
  </div>
</template>
