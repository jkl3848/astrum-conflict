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
import EpicHand from '../ui/EpicHand.vue'

const route = useRoute()
const router = useRouter()
const store = useGameStore()
const drawer = useRulesDrawer()
const displayName = ref('Player')
const shareNote = ref('')
const statusKeys: StatusId[] = ['bleed', 'slow', 'stunned', 'shield', 'stealth']

const bothTeamsReady = computed(() => store.canStart())
const playMode = computed(() => store.game?.playMode ?? 'local')
const isLocal = computed(() => playMode.value === 'local')
const selectedBuilding = computed(() =>
  store.game?.buildings.find((b) => b.id === store.selectedBuildingId) ?? null,
)
const activeName = computed(() => {
  const g = store.game
  if (!g) return ''
  return g.players[g.activeSeat].name || `Player ${g.activeSeat}`
})
const turnBanner = computed(() => {
  const g = store.game
  if (!g) return ''
  if (g.status === 'setup') return 'Setup — place buildings'
  return `${activeName.value}'s turn`
})

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
          Choose local hotseat or an online room, then load a saved list or draft.
        </p>

        <div class="mt-4">
          <p class="text-xs uppercase tracking-wide text-white/50">Match type</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="comic-btn"
              :class="isLocal ? '' : 'secondary'"
              @click="store.setPlayMode('local')"
            >Local</button>
            <button
              type="button"
              class="comic-btn"
              :class="isLocal ? 'secondary' : ''"
              @click="store.setPlayMode('online')"
            >Online</button>
          </div>
          <p class="mt-2 text-sm text-white/70">
            <template v-if="isLocal">Hotseat on this device — pick both teams.</template>
            <template v-else>Pick only your team. Share the link so Player B can pick theirs.</template>
          </p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="comic-btn" @click="share">Share Link</button>
        </div>
        <p v-if="shareNote" class="mt-2 text-xs text-[var(--color-teal)]">{{ shareNote }}</p>
        <label class="mt-4 block text-sm">
          Your name
          <input v-model="displayName" class="ml-2 border-b border-white/40 bg-transparent outline-none" />
        </label>
      </div>

      <div class="mt-4 ink-panel p-4">
        <h2 class="comic-title text-xl">{{ isLocal ? 'Player A faction' : 'Your faction' }}</h2>
        <p class="mt-1 text-sm text-white/70">
          Player A chooses Heroes or Villains. Player B takes the other side.
        </p>
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
          v-if="store.canEditSeat('A')"
          seat="A"
          :faction="store.game.players.A.faction"
          :selected="store.game.lists.A"
          @pick="pickTeam('A', $event)"
          @clear="store.clearTeam('A')"
        />
        <div v-else class="ink-panel p-4">
          <h3 class="comic-title text-xl">Player A</h3>
          <p class="mt-2 text-sm text-white/70">Waiting for Player A to pick a team.</p>
        </div>
        <TeamPicker
          v-if="store.canEditSeat('B')"
          seat="B"
          :faction="store.game.players.B.faction"
          :selected="store.game.lists.B"
          @pick="pickTeam('B', $event)"
          @clear="store.clearTeam('B')"
        />
        <div v-else class="ink-panel p-4">
          <h3 class="comic-title text-xl">Player B</h3>
          <p class="mt-2 text-sm text-white/70">
            {{ store.game.lists.B ? 'Team locked in.' : 'Waiting for Player B to join and pick a team.' }}
          </p>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="comic-btn"
          :disabled="!bothTeamsReady"
          @click="store.startMatch()"
        >Start Match</button>
        <span class="text-sm text-white/60">
          {{ isLocal ? 'Both seats need a team.' : 'Both players need a team before you can start.' }}
        </span>
        <button type="button" class="ml-auto text-xs underline text-white/50" @click="store.quickStart()">
          Practice with sample squads
        </button>
      </div>
    </div>

    <template v-else-if="store.game">
      <header class="flex flex-wrap items-center gap-3 border-b-2 border-black bg-black/40 px-3 py-2">
        <div
          class="comic-title rounded border-2 border-black px-3 py-1 text-xl md:text-2xl"
          :class="store.game.status === 'setup'
            ? 'bg-[var(--color-banner)] text-black'
            : store.game.activeSeat === 'A'
              ? 'bg-[var(--color-teal)] text-black'
              : 'bg-[var(--color-villain-red)] text-white'"
        >
          {{ turnBanner }}
        </div>
        <div class="rounded border-2 border-black bg-black/40 px-2 py-1 text-sm">
          Round {{ store.game.round }} · {{ store.game.phase }}
        </div>
        <div class="rounded border-2 border-black bg-black/40 px-2 py-1 text-sm font-bold">
          {{ store.game.players.A.name || 'A' }}
          <span class="text-[var(--color-teal)]">{{ store.game.scores.A }} pts</span>
          —
          <span class="text-[var(--color-villain-red)]">{{ store.game.scores.B }} pts</span>
          {{ store.game.players.B.name || 'B' }}
        </div>
        <div class="ml-auto flex gap-2">
          <button type="button" class="comic-btn secondary !py-1 !px-3 text-sm" @click="drawer.open()">Rules (?)</button>
          <button type="button" class="comic-btn secondary !py-1 !px-3 text-sm" @click="share">Share</button>
        </div>
      </header>

      <div class="grid min-h-0 flex-1 lg:grid-cols-[13rem_minmax(0,1fr)_22rem]">
        <aside class="max-h-[calc(100dvh-8rem)] space-y-2 overflow-y-auto border-r border-black/40 p-2">
          <div
            v-if="store.game.status === 'setup'"
            class="rounded border-2 border-black/50 bg-black/35 p-2 text-xs text-white/80"
          >
            Buildings are walls with a doorway. Click one to select, click it again to deselect, or pick a different building.
          </div>
          <button
            v-for="b in store.game.buildings"
            v-show="store.game.status === 'setup'"
            :key="b.id"
            type="button"
            class="w-full rounded border-2 border-black/50 bg-black/35 p-2 text-left text-sm"
            :class="b.id === store.selectedBuildingId ? 'ring-2 ring-[var(--color-banner)]' : ''"
            @click="store.selectBuilding(b.id)"
          >
            Building {{ b.id }} · {{ b.w }}×{{ b.h }} · door {{ b.entrance }}
          </button>
          <div
            v-for="u in store.game.units"
            :key="u.id"
            class="w-full cursor-pointer rounded border-2 border-black/50 bg-black/35 p-2 text-left"
            :class="{
              'ring-2 ring-[var(--color-teal)]': u.id === store.selectedUnitId,
              'opacity-50': u.activated && u.id !== store.selectedUnitId,
            }"
            @click="store.selectUnit(u.id)"
          >
            <div class="flex justify-between text-sm font-bold">
              <span>{{ getCharacter(u.characterId)?.name }}</span>
              <span class="text-[10px] uppercase text-white/50">
                {{ u.seat }}
                <template v-if="u.activated"> · done</template>
                <template v-else-if="u.id === store.activatingUnitId"> · acting</template>
              </span>
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
          <div v-if="store.game.status === 'setup'" class="ink-panel p-4">
            <h3 class="comic-title text-lg">Building setup</h3>
            <p class="mt-1 text-sm text-white/70">
              Open walls, no roof. Keep them 2 squares from the map edge and starting zones.
            </p>
            <p v-if="selectedBuilding" class="mt-2 text-sm">
              Selected {{ selectedBuilding.id }} at {{ selectedBuilding.x }},{{ selectedBuilding.y }} · door {{ selectedBuilding.entrance }}
            </p>
            <p v-else class="mt-2 text-sm text-white/60">No building selected.</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                class="comic-btn secondary !py-1 !px-3 text-sm"
                :disabled="!selectedBuilding"
                @click="store.rotateBuildingEntrance()"
              >Rotate entrance</button>
              <button
                type="button"
                class="comic-btn secondary !py-1 !px-3 text-sm"
                :disabled="!selectedBuilding"
                @click="store.clearBuildingSelection()"
              >Deselect</button>
              <button type="button" class="comic-btn !py-1 !px-3 text-sm" @click="store.confirmSetup()">
                Lock buildings & begin
              </button>
            </div>
          </div>
          <UnitInspector v-if="store.selectedUnit" :unit="store.selectedUnit" />
          <div v-else class="ink-panel p-4 text-sm text-white/70">
            {{ store.game.status === 'setup' ? 'Place buildings, then begin the match.' : 'Choose one unactivated character. Green squares are free; gold costs energy.' }}
          </div>
          <div v-if="store.selectedUnit && store.game.status === 'playing'" class="flex flex-wrap gap-2 px-1">
            <button type="button" class="comic-btn !py-1 !px-3 text-sm" @click="store.endActivation()">End Activation</button>
          </div>
          <EpicHand v-if="store.game.status === 'playing'" seat="A" />
          <EpicHand v-if="store.game.status === 'playing'" seat="B" />
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
