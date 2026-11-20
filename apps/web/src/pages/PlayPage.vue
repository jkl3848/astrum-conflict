<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCharacter, type StatusId } from '@astrum/game'
import { useGameStore } from '../stores/game'
import { useRulesDrawer } from '../stores/rulesDrawer'
import GameBoard from '../board/GameBoard.vue'
import RulesDrawer from '../ui/RulesDrawer.vue'
import DiceTray from '../ui/DiceTray.vue'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
const drawer = useRulesDrawer()
const displayName = ref('Player')
const shareNote = ref('')
const statusKeys: StatusId[] = ['bleed', 'slow', 'stunned', 'shield', 'stealth']

const code = computed(() => String(route.params.code || store.game?.code || ''))

onMounted(() => {
  if (!store.game) {
    if (route.params.code) {
      store.createLocal('Host')
      store.game!.code = String(route.params.code).toUpperCase()
    } else {
      const c = store.createLocal(displayName.value)
      router.replace(`/play/${c}`)
    }
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault()
      drawer.toggle()
    }
  }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})

watch(
  () => route.params.code,
  (c) => {
    if (c && store.game && store.game.code !== String(c).toUpperCase()) {
      store.createLocal('Host')
      store.game!.code = String(c).toUpperCase()
    }
  },
)

async function share() {
  const url = `${location.origin}/play/${store.game?.code}`
  try {
    if (navigator.share) await navigator.share({ title: 'Astrum Conflict', url })
    else {
      await navigator.clipboard.writeText(url)
      shareNote.value = 'Link copied!'
      setTimeout(() => (shareNote.value = ''), 2000)
    }
  } catch {
    shareNote.value = url
  }
}

function joinAsB() {
  if (!store.game) return
  store.joinLocal(store.game.code, displayName.value || 'Guest')
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-3 py-4">
    <RulesDrawer />

    <div v-if="store.game?.status === 'lobby'" class="ink-panel mx-auto max-w-xl p-6">
      <h1 class="comic-title text-3xl">Lobby · {{ store.game.code }}</h1>
      <p class="mt-2 text-sm text-white/70">Share this link so a friend can jump in.</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="comic-btn" @click="share">Share Link</button>
        <button type="button" class="comic-btn secondary" @click="joinAsB">Sit as Player B (local)</button>
        <button type="button" class="comic-btn" @click="store.quickStart()">Quick Setup & Play</button>
      </div>
      <p v-if="shareNote" class="mt-2 text-xs text-[var(--color-teal)]">{{ shareNote }}</p>
      <div class="mt-6 grid gap-3 sm:grid-cols-2">
        <div class="rounded border-2 border-black bg-black/30 p-3">
          <div class="text-xs uppercase text-white/50">Player A</div>
          <div class="font-bold">{{ store.game.players.A.name || '—' }}</div>
          <div class="text-sm">{{ store.game.players.A.faction }}</div>
        </div>
        <div class="rounded border-2 border-black bg-black/30 p-3">
          <div class="text-xs uppercase text-white/50">Player B</div>
          <div class="font-bold">{{ store.game.players.B.name || 'Waiting…' }}</div>
          <div class="text-sm">{{ store.game.players.B.faction || '—' }}</div>
        </div>
      </div>
      <label class="mt-4 block text-sm">
        Your name
        <input v-model="displayName" class="ml-2 border-b border-white/40 bg-transparent outline-none" />
      </label>
    </div>

    <template v-else-if="store.game">
      <header class="mb-3 flex flex-wrap items-center gap-3">
        <div class="comic-title text-2xl">Round {{ store.game.round }}</div>
        <div class="rounded border-2 border-black bg-black/40 px-2 py-1 text-sm">
          {{ store.game.phase }} · Seat {{ store.game.activeSeat }}
        </div>
        <div class="text-sm">A {{ store.game.scores.A }} — {{ store.game.scores.B }} B</div>
        <div class="ml-auto flex gap-2">
          <button type="button" class="comic-btn secondary !py-1 !px-3 text-sm" @click="drawer.open()">Rules (?)</button>
          <button type="button" class="comic-btn secondary !py-1 !px-3 text-sm" @click="share">Share</button>
        </div>
      </header>

      <div class="grid gap-4 lg:grid-cols-[240px_1fr_260px]">
        <aside class="space-y-2 max-h-[70vh] overflow-y-auto">
          <div
            v-for="u in store.game.units.filter(x => x.seat === (store.mySeat || 'A'))"
            :key="u.id"
            class="ink-panel cursor-pointer p-2"
            :class="u.id === store.selectedUnitId ? 'ring-2 ring-[var(--color-teal)]' : ''"
            @click="store.selectUnit(u.id)"
          >
            <div class="flex justify-between text-sm font-bold">
              <span>{{ getCharacter(u.characterId)?.name }}</span>
              <span v-if="u.downed" class="text-[var(--color-villain-red)]">DOWN</span>
            </div>
            <div class="mt-1 flex items-center gap-2 text-xs">
              <button type="button" @click.stop="store.adjustStat(u.id, 'hp', -1)">−</button>
              <span class="text-[var(--color-hp)]">HP {{ u.hp }}/{{ u.maxHp }}</span>
              <button type="button" @click.stop="store.adjustStat(u.id, 'hp', 1)">+</button>
              <button type="button" @click.stop="store.adjustStat(u.id, 'energy', -1)">−</button>
              <span class="text-[var(--color-energy)]">EN {{ u.energy }}/{{ u.maxEnergy }}</span>
              <button type="button" @click.stop="store.adjustStat(u.id, 'energy', 1)">+</button>
            </div>
            <div class="mt-1 flex flex-wrap gap-1">
              <button
                v-for="s in statusKeys"
                :key="s"
                type="button"
                class="rounded border border-white/20 px-1 text-[10px] uppercase"
                :class="u.statuses[s] ? 'bg-[var(--color-banner)] text-black' : ''"
                @click.stop="store.toggleStatus(u.id, s)"
              >{{ s }}</button>
            </div>
          </div>
        </aside>

        <div>
          <GameBoard />
          <div v-if="store.selectedUnit" class="ink-panel mt-3 flex flex-wrap items-center gap-2 p-3">
            <div class="comic-title text-lg">{{ getCharacter(store.selectedUnit.characterId)?.name }}</div>
            <button type="button" class="comic-btn !py-1 !px-3 text-sm" @click="store.rollAttackOnline(2)">Roll Attack (2d6)</button>
            <button type="button" class="comic-btn secondary !py-1 !px-3 text-sm" @click="store.endActivation()">End Activation</button>
            <span class="text-xs text-white/60">Click a standee, then click empty ground via orbit — use End Activation when done. Free move left: {{ store.selectedUnit.freeMoveRemaining }}</span>
          </div>
        </div>

        <aside class="space-y-3">
          <DiceTray />
          <div class="ink-panel p-3 max-h-64 overflow-y-auto">
            <h3 class="comic-title text-lg">Log</h3>
            <ul class="mt-2 space-y-1 text-xs text-white/80">
              <li v-for="l in store.game.log" :key="l.id">{{ l.text }}</li>
            </ul>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
