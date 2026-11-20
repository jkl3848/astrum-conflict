<script setup lang="ts">
defineProps<{ x: number; y: number; w: number; h: number }>()
</script>

<template>
  <TresGroup :position="[x + w / 2 - 0.5, 0.6, y + h / 2 - 0.5]">
    <TresMesh cast-shadow receive-shadow>
      <TresBoxGeometry :args="[w - 0.15, 1.2, h - 0.15]" />
      <TresMeshToonMaterial color="#3a2a4e" />
    </TresMesh>
    <!-- entrance notch -->
    <TresMesh :position="[0, -0.2, h / 2 - 0.05]">
      <TresBoxGeometry :args="[0.6, 0.8, 0.2]" />
      <TresMeshToonMaterial color="#1a1520" />
    </TresMesh>
  </TresGroup>
</template>
