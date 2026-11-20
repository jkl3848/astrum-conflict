/**
 * Browser-safe content accessors. Vite/bundlers resolve these JSON imports.
 * Node scripts should prefer ./loader.ts which also reads Markdown/YAML from disk.
 */
import version from '../../content/version.json'
import constants from '../../content/constants.json'
import characters from '../../content/cards/characters.json'
import upgrades from '../../content/cards/upgrades.json'
import epics from '../../content/cards/epics.json'
import statuses from '../../content/cards/statuses.json'
import scenarios from '../../content/cards/scenarios.json'
import type {
  Character,
  ContentVersion,
  EpicCard,
  GameConstants,
  Scenario,
  StatusDef,
  Upgrade,
} from '../types.js'

export const contentVersion = version as ContentVersion
export const gameConstants = constants as GameConstants
export const allCharacters = characters as Character[]
export const allUpgrades = upgrades as Upgrade[]
export const allEpics = epics as EpicCard[]
export const allStatuses = statuses as StatusDef[]
export const allScenarios = scenarios as Scenario[]

export function getCharacter(id: string): Character | undefined {
  return allCharacters.find((c) => c.id === id)
}

export function getUpgrade(id: string): Upgrade | undefined {
  return allUpgrades.find((u) => u.id === id)
}

export function getEpic(id: string): EpicCard | undefined {
  return allEpics.find((e) => e.id === id)
}

export function isTeamDraftable(character: Character): boolean {
  return character.draftable !== false
}

export function charactersByFaction(faction: 'heroes' | 'villains'): Character[] {
  return allCharacters.filter((c) => c.faction === faction && isTeamDraftable(c))
}
