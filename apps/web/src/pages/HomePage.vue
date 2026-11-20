<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { contentVersion } from '@astrum/game'
import GameLogo from '../ui/GameLogo.vue'
</script>

<template>
  <section class="relative overflow-hidden">
    <div class="starfield absolute inset-0" />
    <div class="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center">
      <p class="mb-3 text-xs uppercase tracking-[0.35em] text-[var(--color-teal)]">Online skirmish</p>
      <GameLogo :to="undefined" max-height-class="max-h-32 md:max-h-44" priority="eager" />
      <p class="mt-6 max-w-xl text-base text-white/80 md:text-lg">
        Build your squad. Share a link. Roll dice with friends on a comic-book battlefield.
      </p>
      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <RouterLink class="comic-btn" to="/play">Create Game</RouterLink>
        <RouterLink class="comic-btn secondary" to="/join">Join with Code</RouterLink>
        <RouterLink class="comic-btn secondary" to="/build">Build a Team</RouterLink>
        <RouterLink class="comic-btn secondary" to="/rules">Rules</RouterLink>
      </div>
      <RouterLink to="/changelog" class="mt-8 text-sm text-[var(--color-teal)] underline">
        v{{ contentVersion.version }} · What's New
      </RouterLink>
    </div>
  </section>
</template>
