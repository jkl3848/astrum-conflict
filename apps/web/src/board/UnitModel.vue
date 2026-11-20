<script setup lang="ts">
/**
 * Swap point for future GLB models. Today UnitStandee is used;
 * later: load GLTF by characterId and render here.
 */
import type { UnitState } from '@astrum/game'
import UnitStandee from './UnitStandee.vue'

defineProps<{ unit: UnitState; selected?: boolean }>()
defineEmits<{ select: []; move: [x: number, y: number] }>()
</script>

<template>
  <UnitStandee
    :unit="unit"
    :selected="selected"
    @select="$emit('select')"
    @move="(x, y) => $emit('move', x, y)"
  />
</template>
