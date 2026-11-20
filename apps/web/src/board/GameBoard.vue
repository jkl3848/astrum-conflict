<script setup lang="ts">
import { computed } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { useGameStore } from '../stores/game'
import BoardGrid from './BoardGrid.vue'
import BoardControls from './BoardControls.vue'
import UnitStandee from './UnitStandee.vue'
import BuildingMesh from './BuildingMesh.vue'
import { getCharacter } from '@astrum/game'
import { BOARD_CENTER, MAP_SIZE } from './layout'

const store = useGameStore()
const units = computed(() => store.game?.units ?? [])
const buildings = computed(() => store.game?.buildings ?? [])
const reachable = computed(() => store.reachCells)
const selectedUnit = computed(() => store.selectedUnit)
const setup = computed(() => store.game?.status === 'setup')

const hint = computed(() => {
  const g = store.game
  if (!g) return ''
  if (g.status === 'setup') {
    return store.selectedBuildingId
      ? 'Click empty board to place it · click another building to switch · click it again to deselect'
      : 'Click a building to select it, then click empty board to place it'
  }
  if (g.status !== 'playing') return `${MAP_SIZE}×${MAP_SIZE}`
  const seatName = g.players[g.activeSeat].name || `Player ${g.activeSeat}`
  if (store.activatingUnitId) {
    const acting = g.units.find((u) => u.id === store.activatingUnitId)
    const name = acting ? (getCharacter(acting.characterId)?.name ?? 'this unit') : 'this unit'
    return `Activating ${name} · Range from start · Green = free · Gold chip = energy cost`
  }
  if (!selectedUnit.value) return `${seatName}'s turn · Choose one unactivated character`
  if (selectedUnit.value.seat !== g.activeSeat) {
    return `It is ${seatName}'s turn · Select one of their unactivated characters`
  }
  if (selectedUnit.value.activated) return 'That unit already activated this round · Pick another'
  if (reachable.value.length) {
    return 'Range is from this unit\'s start · Green = free · Gold chip = energy cost'
  }
  return 'This character cannot move further · Use an ability or end activation'
})

function onCell(x: number, y: number) {
  const g = store.game
  if (!g) return
  if (g.status === 'setup') {
    const hit = g.buildings.find((item) => x >= item.x && x < item.x + item.w && y >= item.y && y < item.y + item.h)
    if (hit) {
      store.selectBuilding(hit.id)
      return
    }
    const b = g.buildings.find((item) => item.id === store.selectedBuildingId)
    if (!b) return
    store.moveBuildingTo(x - Math.floor(b.w / 2), y - Math.floor(b.h / 2))
    return
  }
  if (g.status !== 'playing') return
  if (!store.selectedUnitId) return
  store.moveSelectedTo(x, y)
}

function onBuilding(id: string) {
  if (store.game?.status === 'setup') store.selectBuilding(id)
}

const camDist = 22
const camPolar = 0.88
const camAzimuth = Math.PI / 4
const camPos: [number, number, number] = [
  BOARD_CENTER + camDist * Math.sin(camPolar) * Math.sin(camAzimuth),
  camDist * Math.cos(camPolar),
  BOARD_CENTER + camDist * Math.sin(camPolar) * Math.cos(camAzimuth),
]
</script>

<template>
  <div
    class="board-stage relative h-full min-h-[28rem] w-full overflow-hidden rounded-none border-4 border-black bg-[#9aa7b3]"
    :class="reachable.length || setup ? 'cursor-pointer' : 'cursor-grab'"
  >
    <TresCanvas clear-color="#9aa7b3" shadows>
      <TresPerspectiveCamera :position="camPos" :look-at="[BOARD_CENTER, 0, BOARD_CENTER]" :fov="40" />
      <BoardControls />
      <TresAmbientLight :intensity="1.35" />
      <TresHemisphereLight color="#f2efe6" ground-color="#7a8894" :intensity="0.9" />
      <TresDirectionalLight :position="[18, 28, 12]" :intensity="1.45" cast-shadow />

      <BoardGrid @cell="onCell" />
      <BuildingMesh
        v-for="b in buildings"
        :key="b.id"
        :x="b.x"
        :y="b.y"
        :w="b.w"
        :h="b.h"
        :entrance="b.entrance"
        :selected="b.id === store.selectedBuildingId"
        @select="onBuilding(b.id)"
      />
      <UnitStandee
        v-for="u in units"
        :key="u.id"
        :unit="u"
        :selected="u.id === store.selectedUnitId"
        @select="store.selectUnit(u.id)"
      />
    </TresCanvas>
    <p class="pointer-events-none absolute bottom-2 left-3 right-3 rounded bg-black/70 px-2 py-1 text-[11px] uppercase tracking-wide text-white/90">
      {{ hint }}
      <span class="mt-0.5 block normal-case tracking-normal text-white/70">
        Right-drag or Q/E to look around · WASD pan · +/− zoom · Home reset
      </span>
    </p>
  </div>
</template>
