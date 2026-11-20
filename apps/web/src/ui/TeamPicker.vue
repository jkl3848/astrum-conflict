<script setup lang="ts">
import { computed, ref } from 'vue'
import { getCharacter, type Faction, type TeamList } from '@astrum/game'
import { useSavedTeamsStore } from '../stores/savedTeams'
import { useTeamBuilderStore } from '../stores/teamBuilder'
import TeamBuilderForm from './TeamBuilderForm.vue'

const props = defineProps<{
  seat: 'A' | 'B'
  faction: Faction | null
  selected: TeamList | null
}>()

const emit = defineEmits<{
  pick: [list: TeamList]
  clear: []
}>()

const saved = useSavedTeamsStore()
const builder = useTeamBuilderStore()
const drafting = ref(false)

const lists = computed(() => {
  if (!props.faction) return saved.teams
  return saved.teams.filter((t) => t.faction === props.faction)
})

function startDraft() {
  builder.reset()
  if (props.faction) builder.setFaction(props.faction)
  drafting.value = true
}

function confirmDraft() {
  if (!builder.units.length) return
  const list = saved.save(builder.list)
  emit('pick', list)
  drafting.value = false
}
</script>

<template>
  <div class="ink-panel p-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="comic-title text-xl">Player {{ seat }}</h3>
      <span class="text-xs uppercase tracking-wide text-white/60">{{ faction || 'pick a faction' }}</span>
    </div>

    <div v-if="selected" class="mt-3 rounded border-2 border-[var(--color-teal)] bg-black/30 p-3">
      <div class="font-bold">{{ selected.name }}</div>
      <ul class="mt-1 text-sm text-white/80">
        <li v-for="(u, i) in selected.units" :key="i">{{ getCharacter(u.characterId)?.name }}</li>
      </ul>
      <button type="button" class="mt-2 text-xs underline text-white/70" @click="emit('clear')">Change list</button>
    </div>

    <template v-else>
      <p v-if="!lists.length" class="mt-3 text-sm text-white/70">No saved {{ faction ?? '' }} lists yet.</p>
      <ul class="mt-3 space-y-2">
        <li v-for="t in lists" :key="t.id">
          <button
            type="button"
            class="w-full rounded border-2 border-black/60 bg-black/30 px-3 py-2 text-left hover:border-[var(--color-teal)]"
            @click="emit('pick', t)"
          >
            <div class="font-bold">{{ t.name }}</div>
            <div class="text-xs text-white/60">{{ t.units.length }} units · {{ t.epicIds.length }} epics</div>
          </button>
        </li>
      </ul>
      <button type="button" class="comic-btn mt-4 !py-1 !px-3 text-sm" @click="startDraft">Draft a team</button>
    </template>

    <Teleport to="body">
      <div
        v-if="drafting"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-3 md:p-6"
      >
        <div class="ink-panel flex h-full max-h-[min(52rem,100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden p-4 md:p-5">
          <div class="mb-3 flex shrink-0 items-center justify-between gap-3">
            <h2 class="comic-title text-2xl">Draft · Player {{ seat }}</h2>
            <button type="button" class="comic-btn secondary !py-1 !px-3 text-sm" @click="drafting = false">Cancel</button>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
            <TeamBuilderForm :lock-faction="Boolean(faction)" compact>
              <template #actions>
                <button
                  type="button"
                  class="comic-btn"
                  :disabled="!builder.units.length"
                  @click="confirmDraft"
                >Use this team</button>
              </template>
            </TeamBuilderForm>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
