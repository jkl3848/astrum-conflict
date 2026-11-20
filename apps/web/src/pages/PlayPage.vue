<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCharacter, type Faction, type StatusId, type TeamList } from '@astrum/game'
import { useGameStore } from '../stores/game'
import { useRulesDrawer } from '../stores/rulesDrawer'
import GameBoard from '../board/GameBoard.vue'
import RulesDrawer from '../ui/RulesDrawer.vue'
import DiceTray from '../ui/DiceTray.vue'
import TeamPicker from '../ui/TeamPicker.vue'
import UnitInspector from '../ui/UnitInspector.vue'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
const drawer = useRulesDrawer()
const displayName = ref('Player')
const shareNote = ref('')
const statusKeys: StatusId[] = ['bleed', 'slow', 'stunned', 'shield', 'stealth']

const code = computed(() => String(route.params.code || store.game?.code || ''))
const bothTeamsReady = computed(() => store.canStart())

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

function pickFaction(faction: Faction) {
  store.setFaction('A', faction)
}

function pickTeam(seat: 'A' | 'B', list: TeamList) {
  store.assignTeam(seat, list)
}
</script>

<template>
  <div
    class="play-shell flex min-h-0 flex-1 flex-col"
    :class="store.game?.status === 'lobby' ? 'overflow-auto' : 'h-full overflow-hidden'"
  >
    <RulesDrawer />

    <div v-if="store.game?.status === 'lobby'" class="mx-auto w-full max-w-5xl px-3 py-6">
      <div class="ink-panel p-6">
        <h1 class="comic-title text-3xl">Lobby · {{ store.game.code }}</h1>
        <p class="mt-2 text-sm text-white/70">
          Share a link, pick factions, then load a saved list or draft before the match starts.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="comic-btn" @click="share">Share Link</button>
          <button type="button" class="comic-btn secondary" @click="joinAsB">Sit as Player B (local)</button>
        </div>
        <p v-if="shareNote" class="mt-2 text-xs text-[var(--color-teal)]">{{ shareNote }}</p>
        <label class="mt-4 block text-sm">
          Your name
          <input v-model="displayName" class="ml-2 border-b border-white/40 bg-transparent outline-none" />
        </label>
      </div>

      <div class="mt-4 ink-panel p-4">
        <h2 class="comic-title text-xl">Player A faction</h2>
        <p class="mt-1 text-sm text-white/70">Player A chooses Heroes or Villains. Player B takes the other side.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="comic-btn"
            :class="store.game.players.A.faction === 'heroes' ? '' : 'secondary'"
            @click="pickFaction('heroes')"
          >Heroes</button>
          <button
            type="button"
            class="comic-btn"
            :class="store.game.players.A.faction === 'villains' ? '' : 'secondary'"
            @click="pickFaction('villains')"
          >Villains</button>
        </div>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <TeamPicker
          seat="A"
          :faction="store.game.players.A.faction"
          :selected="store.game.lists.A"
          @pick="pickTeam('A', $event)"
          @clear="store.clearTeam('A')"
        />
        <TeamPicker
          seat="B"
          :faction="store.game.players.B.faction"
          :selected="store.game.lists.B"
          @pick="pickTeam('B', $event)"
          @clear="store.clearTeam('B')"
        />
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="comic-btn"
          :disabled="!bothTeamsReady"
          @click="store.startMatch()"
        >Start Match</button>
        <span class="text-sm text-white/60">Both players need a team with at least one unit.</span>
        <button type="button" class="ml-auto text-xs underline text-white/50" @click="store.quickStart()">
          Practice with sample squads
        </button>
      </div>
    </div>

    <template v-else-if="store.game">
      <header class="flex flex-wrap items-center gap-3 border-b-2 border-black bg-black/40 px-3 py-2">
        <div class="comic-title text-xl md:text-2xl">Round {{ store.game.round }}</div>
        <div class="rounded border-2 border-black bg-black/40 px-2 py-1 text-sm">
          {{ store.game.phase }} · Seat {{ store.game.activeSeat }}
        </div>
        <div class="text-sm">A {{ store.game.scores.A }} — {{ store.game.scores.B }} B</div>
        <div class="ml-auto flex gap-2">
          <button type="button" class="comic-btn secondary !py-1 !px-3 text-sm" @click="drawer.open()">Rules (?)</button>
          <button type="button" class="comic-btn secondary !py-1 !px-3 text-sm" @click="share">Share</button>
        </div>
      </header>

      <div class="grid min-h-0 flex-1 lg:grid-cols-[13rem_minmax(0,1fr)_22rem]">
        <aside class="max-h-[calc(100dvh-8rem)] space-y-2 overflow-y-auto border-r border-black/40 p-2">
          <div
            v-for="u in store.game.units"
            :key="u.id"
            class="w-full cursor-pointer rounded border-2 border-black/50 bg-black/35 p-2 text-left"
            :class="u.id === store.selectedUnitId ? 'ring-2 ring-[var(--color-teal)]' : ''"
            @click="store.selectUnit(u.id)"
          >
            <div class="flex justify-between text-sm font-bold">
              <span>{{ getCharacter(u.characterId)?.name }}</span>
              <span class="text-[10px] uppercase text-white/50">{{ u.seat }}</span>
            </div>
            <div class="mt-1 text-xs">
              <span class="text-[var(--color-hp)]">{{ u.hp }}/{{ u.maxHp }}</span>
              ·
              <span class="text-[var(--color-energy)]">{{ u.energy }}/{{ u.maxEnergy }}</span>
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

        <div class="relative min-h-[28rem]">
          <GameBoard />
        </div>

        <aside class="flex min-h-0 flex-col gap-2 overflow-y-auto border-l border-black/40 p-2">
          <UnitInspector v-if="store.selectedUnit" :unit="store.selectedUnit" />
          <div v-else class="ink-panel p-4 text-sm text-white/70">Click a unit on the board to see stats and abilities.</div>
          <div v-if="store.selectedUnit" class="flex flex-wrap gap-2 px-1">
            <button type="button" class="comic-btn !py-1 !px-3 text-sm" @click="store.endActivation()">End Activation</button>
          </div>
          <DiceTray />
          <div class="ink-panel max-h-40 overflow-y-auto p-3">
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
