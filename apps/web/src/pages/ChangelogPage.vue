<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { changelog } from '../content/rules'

const md = new MarkdownIt()
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="comic-title text-4xl">Changelog</h1>
    <p class="mt-2 text-white/70">Every rules and card update, newest first.</p>
    <article v-for="c in changelog" :key="c.version" class="ink-panel mt-6 p-5">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="comic-title text-2xl text-[var(--color-teal)]">v{{ c.version }}</h2>
        <span class="text-xs text-white/50">{{ c.date }}</span>
      </div>
      <p class="mt-2 comic-title text-lg">{{ c.headline }}</p>
      <div class="mt-3 text-sm leading-relaxed" v-html="md.render(c.body)" />
    </article>
  </div>
</template>
