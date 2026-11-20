<script setup lang="ts">
import { computed } from 'vue'
import { deriveUnitStats, getCharacter, getUpgrade, type Ability, type UnitState } from '@astrum/game'
import { useGameStore } from '../stores/game'
import RulesText from './RulesText.vue'

const props = defineProps<{
  unit: UnitState
}>()

const store = useGameStore()
const character = computed(() => getCharacter(props.unit.characterId))
const upgrades = computed(() =>
  props.unit.upgradeIds.map((id) => getUpgrade(id)).filter((u): u is NonNullable<typeof u> => Boolean(u)),
)
const derived = computed(() =>
  character.value ? deriveUnitStats(character.value, upgrades.value) : null,
)

function rollAbility(ab: Ability) {
  if (ab.kind === 'heal' || ab.kind === 'special') {
    store.rollAttackOnline(ab.dice, ab.modifier ?? 0)
    return
  }
  store.rollAttackOnline(ab.dice, ab.modifier ?? 0)
}
</script>

<template>
  <section v-if="character" class="ink-panel flex h-full flex-col overflow-hidden p-3">
    <header class="border-b-2 border-black/40 pb-2">
      <div class="flex items-start justify-between gap-2">
        <div>
          <h2 class="comic-title text-2xl">{{ character.name }}</h2>
          <p class="text-xs uppercase tracking-wide text-white/60">
            {{ character.faction }} · {{ character.keywords.join(' · ') }}
          </p>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-black bg-[#c5ccd4] font-bold text-black"
          title="Defense"
        >
          {{ unit.defense }}
        </div>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div class="rounded bg-black/30 px-2 py-1">
          <div class="text-[10px] uppercase text-[var(--color-hp)]">HP</div>
          <div class="flex items-center gap-2 font-bold">
            <button type="button" @click="store.adjustStat(unit.id, 'hp', -1)">−</button>
            {{ unit.hp }}/{{ unit.maxHp }}
            <button type="button" @click="store.adjustStat(unit.id, 'hp', 1)">+</button>
          </div>
        </div>
        <div class="rounded bg-black/30 px-2 py-1">
          <div class="text-[10px] uppercase text-[var(--color-energy)]">Energy</div>
          <div class="flex items-center gap-2 font-bold">
            <button type="button" @click="store.adjustStat(unit.id, 'energy', -1)">−</button>
            {{ unit.energy }}/{{ unit.maxEnergy }}
            <button type="button" @click="store.adjustStat(unit.id, 'energy', 1)">+</button>
          </div>
        </div>
      </div>
      <p class="mt-2 text-xs text-white/70">
        Free move {{ unit.freeMoveRemaining }} · {{ unit.activated ? 'Activated' : 'Ready' }}
        <span v-if="unit.downed" class="text-[var(--color-villain-red)]"> · DOWNED</span>
      </p>
    </header>

    <div class="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      <p v-if="character.passive" class="text-sm leading-snug text-white/90">
        <span class="font-bold uppercase text-[var(--color-teal)]">Passive · </span>
        <RulesText :text="character.passive" />
      </p>

      <div>
        <h3 class="comic-title text-sm text-[var(--color-banner)]">Abilities</h3>
        <button
          v-for="ab in (derived?.abilities ?? character.abilities)"
          :key="ab.id"
          type="button"
          class="mt-2 w-full border-2 border-black bg-[rgba(232,184,74,0.92)] px-2 py-2 text-left text-black"
          @click="rollAbility(ab)"
        >
          <div class="flex flex-wrap items-center justify-between gap-1 font-bold uppercase text-sm">
            <span>{{ ab.name }}</span>
            <span class="text-xs">
              {{ ab.kind }} · {{ ab.dice }}d6 · E{{ ab.energy }} · R{{ ab.range.min }}–{{ ab.range.max }}
              <template v-if="ab.modifier"> · {{ ab.modifier > 0 ? '+' : '' }}{{ ab.modifier }}</template>
            </span>
          </div>
          <p v-if="ab.text" class="mt-1 text-xs font-normal normal-case leading-snug">
            <RulesText :text="ab.text" />
          </p>
        </button>
      </div>

      <div v-if="upgrades.length">
        <h3 class="comic-title text-sm text-[var(--color-teal)]">Upgrades</h3>
        <article v-for="up in upgrades" :key="up.id" class="mt-2 rounded border-2 border-black/50 bg-black/25 p-2">
          <div class="flex justify-between text-xs uppercase text-white/60">
            <span class="font-bold text-white">{{ up.name }}</span>
            <span>{{ up.slot }} · P-{{ up.points }}</span>
          </div>
          <p class="mt-1 text-xs leading-snug"><RulesText :text="up.text" /></p>
        </article>
      </div>
    </div>
  </section>
</template>
