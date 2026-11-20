import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Faction, TeamList } from '@astrum/game'

const STORAGE_KEY = 'astrum-saved-lists'

export interface SavedTeam extends TeamList {
  id: string
  savedAt: number
}

function uid() {
  return `team-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function normalize(raw: unknown): SavedTeam | null {
  if (!raw || typeof raw !== 'object') return null
  const t = raw as Partial<SavedTeam>
  if (!t.name || !t.faction || !Array.isArray(t.units) || !Array.isArray(t.epicIds)) return null
  return {
    id: t.id || uid(),
    name: t.name,
    faction: t.faction,
    units: t.units.map((u) => ({
      characterId: u.characterId,
      upgradeIds: [...(u.upgradeIds ?? [])],
    })),
    epicIds: [...t.epicIds],
    contentVersion: t.contentVersion,
    savedAt: t.savedAt ?? Date.now(),
  }
}

function readStorage(): SavedTeam[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalize).filter((t): t is SavedTeam => t !== null)
  } catch {
    return []
  }
}

export const useSavedTeamsStore = defineStore('savedTeams', () => {
  const teams = ref<SavedTeam[]>(typeof localStorage === 'undefined' ? [] : readStorage())

  watch(
    teams,
    (list) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    },
    { deep: true },
  )

  const byFaction = computed(() => {
    return (faction: Faction) => teams.value.filter((t) => t.faction === faction)
  })

  function save(list: TeamList): SavedTeam {
    const existing = teams.value.find(
      (t) => t.name === list.name && t.faction === list.faction,
    )
    const next: SavedTeam = {
      ...list,
      units: list.units.map((u) => ({ characterId: u.characterId, upgradeIds: [...u.upgradeIds] })),
      epicIds: [...list.epicIds],
      id: existing?.id ?? uid(),
      savedAt: Date.now(),
    }
    if (existing) {
      const i = teams.value.findIndex((t) => t.id === existing.id)
      teams.value[i] = next
    } else {
      teams.value.push(next)
    }
    return next
  }

  function remove(id: string) {
    teams.value = teams.value.filter((t) => t.id !== id)
  }

  return { teams, byFaction, save, remove }
})
