import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  allCharacters,
  allEpics,
  allUpgrades,
  contentVersion,
  gameConstants,
  teamPoints,
  validateTeam,
  type Faction,
  type TeamList,
} from '@astrum/game'

function ctx() {
  return {
    constants: gameConstants,
    characters: new Map(allCharacters.map((c) => [c.id, c])),
    upgrades: new Map(allUpgrades.map((u) => [u.id, u])),
    epics: new Map(allEpics.map((e) => [e.id, e])),
  }
}

export const useTeamBuilderStore = defineStore('teamBuilder', () => {
  const name = ref('My Squad')
  const faction = ref<Faction>('heroes')
  const units = ref<{ characterId: string; upgradeIds: string[] }[]>([])
  const epicIds = ref<string[]>([])

  const list = computed<TeamList>(() => ({
    name: name.value,
    faction: faction.value,
    units: units.value,
    epicIds: epicIds.value,
    contentVersion: contentVersion.version,
  }))

  const points = computed(() => teamPoints(list.value, ctx()))
  const issues = computed(() => validateTeam(list.value, ctx()))
  const errors = computed(() => issues.value.filter((i) => i.level === 'error'))
  const isValid = computed(() => errors.value.length === 0)

  function setFaction(f: Faction) {
    faction.value = f
    units.value = []
    epicIds.value = []
  }

  function addUnit(characterId: string) {
    const c = allCharacters.find((x) => x.id === characterId)
    if (!c || c.faction !== faction.value) return
    const count = units.value.filter((u) => u.characterId === characterId).length
    if (count >= (c.copies ?? 1)) return
    units.value.push({ characterId, upgradeIds: [] })
  }

  function removeUnit(index: number) {
    units.value.splice(index, 1)
  }

  function setUpgrades(index: number, upgradeIds: string[]) {
    if (!units.value[index]) return
    units.value[index].upgradeIds = upgradeIds
  }

  function toggleEpic(id: string) {
    const i = epicIds.value.indexOf(id)
    if (i >= 0) epicIds.value.splice(i, 1)
    else if (epicIds.value.length < gameConstants.epicDeckSize) epicIds.value.push(id)
  }

  function loadList(l: TeamList) {
    name.value = l.name
    faction.value = l.faction
    units.value = l.units.map((u) => ({ ...u, upgradeIds: [...u.upgradeIds] }))
    epicIds.value = [...l.epicIds]
  }

  function reset() {
    name.value = 'My Squad'
    units.value = []
    epicIds.value = []
  }

  return {
    name,
    faction,
    units,
    epicIds,
    list,
    points,
    issues,
    errors,
    isValid,
    setFaction,
    addUnit,
    removeUnit,
    setUpgrades,
    toggleEpic,
    loadList,
    reset,
  }
})
