<script setup lang="ts">
defineProps<{ x: number; y: number; w: number; h: number }>()
</script>

<template>
  <TresGroup :position="[x + w / 2 - 0.5, 0.6, y + h / 2 - 0.5]">
    <TresMesh cast-shadow receive-shadow>
      <TresBoxGeometry :args="[w - 0.15, 1.2, h - 0.15]" />
      <TresMeshStandardMaterial color="#6d5c86" :roughness="0.7" />
    </TresMesh>
    <!-- entrance notch -->
    <TresMesh :position="[0, -0.2, h / 2 - 0.05]">
      <TresBoxGeometry :args="[0.6, 0.8, 0.2]" />
      <TresMeshStandardMaterial color="#4a3f58" />
    </TresMesh>
  </TresGroup>
</template>
