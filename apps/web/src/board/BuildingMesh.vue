<script setup lang="ts">
import { computed } from 'vue'
import type { EntranceDir } from './layout'

const props = defineProps<{
  x: number
  y: number
  w: number
  h: number
  entrance?: EntranceDir
  selected?: boolean
}>()

const emit = defineEmits<{ select: [] }>()

const T = 0.1
const H = 1.35
const gap = 0.7
const color = computed(() => (props.selected ? '#8d7aad' : '#6d5c86'))

const walls = computed(() => {
  const e = props.entrance ?? 'S'
  const w = props.w
  const h = props.h
  const cx = 0
  const cz = 0
  const halfW = w / 2
  const halfH = h / 2
  const items: { key: string; pos: [number, number, number]; args: [number, number, number] }[] = []

  function add(key: string, x: number, z: number, sx: number, sz: number) {
    items.push({ key, pos: [x, H / 2, z], args: [sx, H, sz] })
  }

  // North / South walls (along X)
  if (e === 'N') {
    const side = (w - gap) / 2
    add('n-l', cx - (gap / 2 + side / 2), cz - halfH + T / 2, side, T)
    add('n-r', cx + (gap / 2 + side / 2), cz - halfH + T / 2, side, T)
  } else {
    add('n', cx, cz - halfH + T / 2, w, T)
  }
  if (e === 'S') {
    const side = (w - gap) / 2
    add('s-l', cx - (gap / 2 + side / 2), cz + halfH - T / 2, side, T)
    add('s-r', cx + (gap / 2 + side / 2), cz + halfH - T / 2, side, T)
  } else {
    add('s', cx, cz + halfH - T / 2, w, T)
  }
  // West / East walls (along Z)
  if (e === 'W') {
    const side = (h - gap) / 2
    add('w-l', cx - halfW + T / 2, cz - (gap / 2 + side / 2), T, side)
    add('w-r', cx - halfW + T / 2, cz + (gap / 2 + side / 2), T, side)
  } else {
    add('w', cx - halfW + T / 2, cz, T, h)
  }
  if (e === 'E') {
    const side = (h - gap) / 2
    add('e-l', cx + halfW - T / 2, cz - (gap / 2 + side / 2), T, side)
    add('e-r', cx + halfW - T / 2, cz + (gap / 2 + side / 2), T, side)
  } else {
    add('e', cx + halfW - T / 2, cz, T, h)
  }
  return items
})
</script>

<template>
  <TresGroup
    :position="[x + w / 2 - 0.5, 0, y + h / 2 - 0.5]"
    @click.stop="emit('select')"
  >
    <TresMesh
      v-for="wall in walls"
      :key="wall.key"
      :position="wall.pos"
      cast-shadow
      receive-shadow
    >
      <TresBoxGeometry :args="wall.args" />
      <TresMeshStandardMaterial :color="color" :roughness="0.65" :emissive="selected ? '#7dcbc4' : '#000'" :emissive-intensity="selected ? 0.2 : 0" />
    </TresMesh>
  </TresGroup>
</template>
