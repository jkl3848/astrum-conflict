<script setup lang="ts">
import { computed } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import { useGameStore } from '../stores/game'
import BoardGrid from './BoardGrid.vue'
import UnitStandee from './UnitStandee.vue'
import BuildingMesh from './BuildingMesh.vue'

const store = useGameStore()
const units = computed(() => store.game?.units ?? [])

const quickBuildings = [
  { x: 8, y: 8, w: 3, h: 3 },
  { x: 13, y: 8, w: 3, h: 3 },
  { x: 8, y: 13, w: 3, h: 3 },
  { x: 13, y: 13, w: 3, h: 3 },
]

function onCell(x: number, y: number) {
  if (!store.selectedUnitId) return
  store.moveSelectedTo(x, y)
}
</script>

<template>
  <div class="h-[min(70vh,640px)] w-full overflow-hidden rounded border-4 border-black bg-[#0a0c12]">
    <TresCanvas clear-color="#0a0c12" shadows>
      <TresPerspectiveCamera :position="[18, 22, 18]" :look-at="[12, 0, 12]" />
      <OrbitControls :target="[12, 0, 12]" :max-polar-angle="Math.PI / 2.1" :min-distance="8" :max-distance="48" />
      <TresAmbientLight :intensity="0.85" />
      <TresDirectionalLight :position="[20, 30, 10]" :intensity="1.1" cast-shadow />

      <BoardGrid @cell="onCell" />
      <BuildingMesh v-for="(b, i) in quickBuildings" :key="i" :x="b.x" :y="b.y" :w="b.w" :h="b.h" />
      <UnitStandee
        v-for="u in units"
        :key="u.id"
        :unit="u"
        :selected="u.id === store.selectedUnitId"
        @select="store.selectUnit(u.id)"
      />
    </TresCanvas>
  </div>
</template>
