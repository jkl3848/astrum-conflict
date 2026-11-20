<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const code = ref('')
const router = useRouter()

function join() {
  const c = code.value.trim().toUpperCase()
  if (!c) return
  router.push(`/play/${c}`)
}
</script>

<template>
  <div class="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
    <h1 class="comic-title text-4xl">Join Game</h1>
    <p class="mt-2 text-white/70">Enter the room code from your friend.</p>
    <input
      v-model="code"
      class="mt-6 w-full rounded border-4 border-black bg-black/50 px-4 py-3 text-center text-2xl tracking-[0.3em] uppercase"
      maxlength="6"
      placeholder="ABC123"
      @keyup.enter="join"
    />
    <button type="button" class="comic-btn mt-4 w-full" @click="join">Jump In</button>
  </div>
</template>
