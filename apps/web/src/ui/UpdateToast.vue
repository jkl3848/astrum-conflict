<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { contentVersion } from '@astrum/game'

const show = ref(false)
let timer: number | undefined

async function check() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return
    const data = (await res.json()) as { version: string }
    if (data.version && data.version !== contentVersion.version) show.value = true
  } catch {
    /* offline / local */
  }
}

function refresh() {
  window.location.reload()
}

onMounted(() => {
  timer = window.setInterval(check, 60_000)
  check()
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 ink-panel flex items-center gap-3 px-4 py-3"
    >
      <span class="text-sm">A new version is available.</span>
      <button type="button" class="comic-btn !py-1 !px-3 text-sm" @click="refresh">Refresh</button>
    </div>
  </Teleport>
</template>
