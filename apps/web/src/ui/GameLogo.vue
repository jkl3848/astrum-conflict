<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { loadArtUrl } from '../lib/art'

import devLogo from '../../../../.asset-cache/logo/astrum_conflict_logo_color_trans.png?url'

const props = withDefaults(
  defineProps<{
    to?: string
    /** Tailwind max-height class segment, e.g. `max-h-16` */
    maxHeightClass?: string
    priority?: 'eager' | 'lazy'
  }>(),
  {
    to: '/',
    maxHeightClass: 'max-h-20',
    priority: 'lazy',
  },
)

const src = ref(devLogo)

onMounted(async () => {
  const remote = await loadArtUrl('logo/astrum_conflict_logo_color_trans.png')
  if (remote) src.value = remote
})
</script>

<template>
  <component :is="to ? RouterLink : 'div'" :to="to" class="inline-block">
    <img
      :src="src"
      alt="Astrum Conflict"
      class="w-auto drop-shadow-[4px_4px_0_#0d3d5c]"
      :class="maxHeightClass"
      :loading="priority"
      decoding="async"
    />
  </component>
</template>