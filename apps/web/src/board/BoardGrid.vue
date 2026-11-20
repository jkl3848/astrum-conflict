<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { MAP_SIZE, TILE_SIZE, cellKey, isMapTileSeam, isStartingZone } from './layout'

const emit = defineEmits<{ cell: [x: number, y: number] }>()
const store = useGameStore()

const BOARD_MID = MAP_SIZE / 2 - 0.5

const cells = computed(() => {
  const reach = store.reachableKeys
  return Array.from({ length: MAP_SIZE * MAP_SIZE }, (_, i) => {
    const x = i % MAP_SIZE
    const y = Math.floor(i / MAP_SIZE)
    const reachable = reach.has(cellKey(x, y))
    let color = (x + y) % 2 === 0 ? '#efe8dc' : '#c5d0d8'
    if (isMapTileSeam(x, y)) color = (x + y) % 2 === 0 ? '#d5dbe3' : '#b7c2cc'
    if (isStartingZone(x, y, 'A')) color = '#2f9d98'
    if (isStartingZone(x, y, 'B')) color = '#d15a5a'
    if (reachable) color = '#f0b429'
    return { i, x, y, reachable, color }
  })
})

const tileLines = computed(() => {
  const lines: { key: string; position: [number, number, number]; args: [number, number, number] }[] = []
  for (let t = 0; t <= MAP_SIZE; t += TILE_SIZE) {
    lines.push({
      key: `v-${t}`,
      position: [t - 0.5, 0.04, BOARD_MID],
      args: [0.07, 0.03, MAP_SIZE],
    })
    lines.push({
      key: `h-${t}`,
      position: [BOARD_MID, 0.04, t - 0.5],
      args: [MAP_SIZE, 0.03, 0.07],
    })
  }
  return lines
})
</script>

<template>
  <TresGroup>
    <TresMesh :rotation-x="-Math.PI / 2" :position="[BOARD_MID, -0.04, BOARD_MID]" receive-shadow>
      <TresPlaneGeometry :args="[MAP_SIZE + 0.2, MAP_SIZE + 0.2]" />
      <TresMeshBasicMaterial color="#5f6a76" />
    </TresMesh>

    <TresMesh
      v-for="c in cells"
      :key="`${c.i}-${c.color}`"
      :position="[c.x, c.reachable ? 0.02 : 0, c.y]"
      :rotation-x="-Math.PI / 2"
      receive-shadow
      @click.stop="emit('cell', c.x, c.y)"
    >
      <TresPlaneGeometry :args="[0.94, 0.94]" />
      <TresMeshBasicMaterial :color="c.color" />
    </TresMesh>

    <TresMesh
      v-for="line in tileLines"
      :key="line.key"
      :position="line.position"
    >
      <TresBoxGeometry :args="line.args" />
      <TresMeshBasicMaterial color="#2c333c" />
    </TresMesh>
  </TresGroup>
</template>
