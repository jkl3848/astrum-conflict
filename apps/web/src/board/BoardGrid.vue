<script setup lang="ts">
import { gameConstants } from '@astrum/game'

const emit = defineEmits<{ cell: [x: number, y: number] }>()

const size = gameConstants.mapSize
const tile = gameConstants.tileSize
const zone = gameConstants.startingZoneSize

const cells = Array.from({ length: size * size }, (_, i) => {
  const x = i % size
  const y = Math.floor(i / size)
  return { i, x, y }
})

function isZone(x: number, y: number) {
  const corners = [
    [0, 0],
    [size - zone, 0],
    [0, size - zone],
    [size - zone, size - zone],
  ]
  return corners.some(([cx, cy]) => x >= cx && x < cx + zone && y >= cy && y < cy + zone)
}

function isTileSeam(x: number, y: number) {
  return x % tile === 0 || y % tile === 0
}

function colorFor(x: number, y: number) {
  if (isZone(x, y)) return '#2a4a55'
  if (isTileSeam(x, y)) return '#1c1828'
  return '#161320'
}
</script>

<template>
  <TresGroup>
    <TresMesh :rotation-x="-Math.PI / 2" :position="[size / 2 - 0.5, -0.02, size / 2 - 0.5]" receive-shadow>
      <TresPlaneGeometry :args="[size + 2, size + 2]" />
      <TresMeshStandardMaterial color="#12101a" />
    </TresMesh>

    <TresMesh
      v-for="c in cells"
      :key="c.i"
      :position="[c.x, 0, c.y]"
      :rotation-x="-Math.PI / 2"
      receive-shadow
      @click.stop="emit('cell', c.x, c.y)"
    >
      <TresPlaneGeometry :args="[0.96, 0.96]" />
      <TresMeshStandardMaterial :color="colorFor(c.x, c.y)" />
    </TresMesh>
  </TresGroup>
</template>
