<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { contentVersion } from '@astrum/game'
import { useAuthStore } from '../stores/auth'
import GameLogo from './GameLogo.vue'

const auth = useAuthStore()
const route = useRoute()
const isPlay = computed(() => route.name === 'play')
onMounted(() => auth.init())

const primaryLinks = [
  { to: '/play', label: 'Create Game' },
  { to: '/join', label: 'Join' },
  { to: '/build', label: 'Build Team' },
  { to: '/rules', label: 'Rules' },
] as const
</script>

<template>
  <div class="flex min-h-dvh flex-col" :class="isPlay ? 'h-dvh overflow-hidden' : 'min-h-screen'">
    <header class="sticky top-0 z-40 border-b-4 border-black bg-[rgba(11,11,12,0.92)] backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 md:gap-4">
        <GameLogo max-height-class="max-h-10 md:max-h-12" priority="eager" />
        <nav class="flex flex-wrap items-center justify-end gap-x-1 gap-y-1 text-xs sm:text-sm md:gap-x-3">
          <RouterLink
            v-for="item in primaryLinks"
            :key="item.to"
            class="rounded px-2 py-1 hover:bg-white/10 hover:text-[var(--color-teal)]"
            :to="item.to"
          >
            {{ item.label }}
          </RouterLink>
          <RouterLink
            to="/changelog"
            class="rounded-full border-2 border-[var(--color-teal)] px-2 py-0.5 text-xs text-[var(--color-teal)] hover:bg-[var(--color-teal)]/10"
            title="What's new"
          >
            v{{ contentVersion.version }}
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="flex min-h-0 flex-1 flex-col">
      <slot />
    </main>
    <footer v-if="!isPlay" class="border-t border-[var(--color-plum)] px-4 py-4 text-center text-xs text-white/50">
      Astrum Conflict · Print-friendly minis, now online · Art stays off GitHub
    </footer>
  </div>
</template>