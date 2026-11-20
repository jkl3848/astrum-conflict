<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { contentVersion } from '@astrum/game'
import { changelog } from '../content/rules'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()
const open = ref(false)
const KEY = 'astrum-last-seen-version'

const latest = changelog[0]

onMounted(() => {
  const seen = localStorage.getItem(KEY)
  if (seen !== contentVersion.version && latest) open.value = true
})

function dismiss() {
  localStorage.setItem(KEY, contentVersion.version)
  open.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open && latest" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button class="absolute inset-0 bg-black/70" type="button" @click="dismiss" />
      <div class="ink-panel relative z-10 max-w-lg w-full p-5 starfield overflow-hidden">
        <div class="absolute -right-2 -top-2 rotate-12 bg-[var(--color-villain-red)] border-2 border-black px-3 py-1 comic-title text-sm">
          NEW ISSUE!
        </div>
        <h2 class="comic-title text-3xl text-[var(--color-teal)]">What's New</h2>
        <p class="mt-1 text-sm text-white/70">v{{ latest.version }} · {{ latest.date }}</p>
        <p class="mt-3 comic-title text-xl">{{ latest.headline }}</p>
        <div class="mt-3 text-sm leading-relaxed" v-html="md.render(latest.body)" />
        <button type="button" class="comic-btn mt-5 w-full" @click="dismiss">Got it</button>
      </div>
    </div>
  </Teleport>
</template>
