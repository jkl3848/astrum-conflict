<script setup lang="ts">
import { ref } from 'vue'
import { useTeamBuilderStore } from '../stores/teamBuilder'
import { useSavedTeamsStore } from '../stores/savedTeams'
import TeamBuilderForm from '../ui/TeamBuilderForm.vue'

const store = useTeamBuilderStore()
const saved = useSavedTeamsStore()

const savedNote = ref('')

function saveLocal() {
  saved.save(store.list)
  savedNote.value = 'Saved on this device.'
  setTimeout(() => (savedNote.value = ''), 2000)
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <h1 class="comic-title text-4xl">Team Builder</h1>
    <p class="mt-2 text-sm text-white/70">Save a list, then pick it from the lobby when you create a game.</p>
    <div class="mt-6">
      <TeamBuilderForm>
        <template #actions>
          <button type="button" class="comic-btn secondary" @click="saveLocal">Save Team</button>
          <span v-if="savedNote" class="text-sm text-[var(--color-teal)]">{{ savedNote }}</span>
        </template>
      </TeamBuilderForm>
    </div>
    <section v-if="saved.teams.length" class="mt-10">
      <h2 class="comic-title text-2xl">Saved lists</h2>
      <ul class="mt-3 grid gap-2 sm:grid-cols-2">
        <li
          v-for="t in saved.teams"
          :key="t.id"
          class="ink-panel flex items-center justify-between gap-3 p-3"
        >
          <button type="button" class="text-left" @click="store.loadList(t)">
            <div class="font-bold">{{ t.name }}</div>
            <div class="text-xs uppercase text-white/60">{{ t.faction }} · {{ t.units.length }} units</div>
          </button>
          <button type="button" class="text-xs text-[var(--color-villain-red)]" @click="saved.remove(t.id)">Remove</button>
        </li>
      </ul>
    </section>
  </div>
</template>
