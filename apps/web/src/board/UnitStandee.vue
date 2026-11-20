<script setup lang="ts">
import { computed } from 'vue'
import { Billboard } from '@tresjs/cientos'
import { getCharacter, type UnitState } from '@astrum/game'

const props = defineProps<{
  unit: UnitState
  selected?: boolean
}>()

const emit = defineEmits<{
  select: []
  move: [x: number, y: number]
}>()

const character = computed(() => getCharacter(props.unit.characterId))
const color = computed(() =>
  character.value?.faction === 'heroes' ? '#4aa3c7' : '#c45a5a',
)
</script>

<template>
  <TresGroup
    :position="[unit.pos.x, unit.pos.elev ?? 0, unit.pos.y]"
    @click.stop="emit('select')"
  >
    <!-- base -->
    <TresMesh :position="[0, 0.05, 0]" cast-shadow>
      <TresCylinderGeometry :args="[0.35, 0.4, 0.1, 16]" />
      <TresMeshStandardMaterial :color="color" :emissive="selected ? color : '#000'" :emissive-intensity="selected ? 0.35 : 0" />
    </TresMesh>

    <!-- selection ring -->
    <TresMesh v-if="selected" :position="[0, 0.08, 0]" :rotation-x="-Math.PI / 2">
      <TresRingGeometry :args="[0.45, 0.55, 24]" />
      <TresMeshBasicMaterial color="#7dcbc4" />
    </TresMesh>

    <!-- comic standee card -->
    <Billboard :position="[0, 0.95, 0]">
      <TresMesh>
        <TresPlaneGeometry :args="[0.7, 1.1]" />
        <TresMeshStandardMaterial :color="unit.downed ? '#444' : '#f4f0e8'" />
      </TresMesh>
      <TresMesh :position="[0, 0, 0.01]">
        <TresPlaneGeometry :args="[0.55, 0.55]" />
        <TresMeshStandardMaterial :color="color" />
      </TresMesh>
    </Billboard>

    <!-- status dots -->
    <TresGroup v-if="Object.keys(unit.statuses).length" :position="[0, 1.7, 0]">
      <TresMesh
        v-for="(s, i) in Object.keys(unit.statuses)"
        :key="s"
        :position="[(i - 0.5) * 0.2, 0, 0]"
      >
        <TresSphereGeometry :args="[0.07, 8, 8]" />
        <TresMeshBasicMaterial :color="s === 'bleed' ? '#c45a5a' : s === 'shield' ? '#7dcbc4' : '#e8b84a'" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
