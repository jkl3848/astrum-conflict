<script setup lang="ts">
import { computed } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { useGameStore } from '../stores/game'
import BoardGrid from './BoardGrid.vue'
import BoardControls from './BoardControls.vue'
import UnitStandee from './UnitStandee.vue'
import BuildingMesh from './BuildingMesh.vue'
import { BOARD_CENTER, MAP_BUILDINGS, MAP_SIZE } from './layout'

const store = useGameStore()
const units = computed(() => store.game?.units ?? [])
const reachable = computed(() => [...store.reachableKeys])

function onCell(x: number, y: number) {
  if (!store.selectedUnitId) return
  store.moveSelectedTo(x, y)
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
  <div class="board-stage relative h-full min-h-[28rem] w-full overflow-hidden rounded-none border-4 border-black bg-[#9aa7b3]">
    <TresCanvas clear-color="#9aa7b3" shadows>
      <TresPerspectiveCamera :position="camPos" :look-at="[BOARD_CENTER, 0, BOARD_CENTER]" :fov="40" />
      <BoardControls />
      <TresAmbientLight :intensity="1.35" />
      <TresHemisphereLight color="#f2efe6" ground-color="#7a8894" :intensity="0.9" />
      <TresDirectionalLight :position="[18, 28, 12]" :intensity="1.45" cast-shadow />

      <BoardGrid @cell="onCell" />
      <BuildingMesh v-for="(b, i) in MAP_BUILDINGS" :key="i" :x="b.x" :y="b.y" :w="b.w" :h="b.h" />
      <UnitStandee
        v-for="u in units"
        :key="u.id"
        :unit="u"
        :selected="u.id === store.selectedUnitId"
        @select="store.selectUnit(u.id)"
      />
    </TresCanvas>
    <p class="pointer-events-none absolute bottom-2 left-3 rounded bg-black/55 px-2 py-1 text-[11px] uppercase tracking-wide text-white/90">
      {{ MAP_SIZE }}×{{ MAP_SIZE }} · {{ reachable.length }} move squares · WASD pan · Q/E rotate · +/− zoom · Home reset
    </p>
  </div>
</template>
