"""Write rules markdown and content JSON/YAML from extracted PDF text."""
from __future__ import annotations

import json
from pathlib import Path

CONTENT = Path(__file__).resolve().parents[1] / "content"
RULES = CONTENT / "rules"


def fm(meta: dict) -> str:
    lines = ["---"]
    for k, v in meta.items():
        lines.append(f"{k}: {v}")
    lines.append("---")
    lines.append("")
    return "\n".join(lines)


SECTIONS: list[tuple[str, dict, str]] = [
    (
        "01-how-to-play.md",
        {"id": "how-to-play", "title": "How to Play", "order": 1},
        """# How to Play

Astrum Conflict is a skirmish game for 2 players. Each player builds a team of heroes or villains to compete for objectives. Units move, attack, and score to claim victory.

## Components

Astrum Conflict requires the following components to play:

- D6 Dice (Only 1 is needed but more is better)
- Map Tiles (An even grid of squares. The standard tiles are 8×8 squares and tiles are assembled in a 3×3 grid)
- Character Tokens (Each character has a unique token to represent them)
- Character Cards
- Upgrade Cards
- Buildings
- Terrain
""",
    ),
    (
        "02-game-setup.md",
        {"id": "game-setup", "title": "Game Setup", "order": 2},
        """# Game Setup

1. Each player rolls a die. The player with the higher roll is **Player A**, the other is **Player B**.
2. Player A chooses whether to play Heroes or Villains.
3. Build teams (see [Building Teams](03-building-teams.md)).
4. Select Epic cards (see [Epic Cards](05-epic-cards.md)).
5. Place the Map Tiles in a 3×3 grid.
6. Starting with Player A, take turns placing Buildings.
7. Starting with Player A, take turns placing Terrain.
8. Player B selects a Scenario (see [Scenarios](18-scenarios.md)).
9. Follow the setup instructions of the chosen Scenario.
10. Play begins with the starting player of the chosen Scenario.
""",
    ),
    (
        "03-building-teams.md",
        {"id": "building-teams", "title": "Building Teams", "order": 3},
        """# Building Teams

- Maximum team size = **700 points**.
- Build teams in the following order:
  1. Select units.
  2. Select Upgrades.

You can only have **1** of each unit on your team. If a unit has **Copies:X**, you may have up to **X** copies of the unit on your team at once.

## Upgrades

Each unit can equip upgrades in their Upgrade Slots. Each upgrade has a slot type and a point cost. Upgrade points count towards your team point total.

Some upgrades have faction, character, or keyword restrictions. The unit must satisfy at least **1** of the restrictions to equip the upgrade. A unit cannot have **2** of the same upgrade.
""",
    ),
    (
        "04-play-area.md",
        {"id": "play-area", "title": "Play Area", "order": 4},
        """# Play Area

- The battlefield is a **24 × 24** grid of 1-inch tiles. Each tile is **8×8**.
- Starting Zones are located in the four corners (see below).

## Starting Zones

- Each Starting Zone is a **3 × 3** square located in each map corner.
- Once a player places a unit in a zone, that zone cannot be used by the opponent.
""",
    ),
    (
        "05-epic-cards.md",
        {"id": "epic-cards", "title": "Epic Cards", "order": 5},
        """# Epic Cards

Epic cards are powerful abilities to help boost your team.

## Setup

On setup, each player builds a deck of **5 Epic Cards**. The players shuffle their decks and place them facedown in their play area. There are generic and unit specific Epic Cards. You must have a unit on your team to have their Epic Card in your deck.

## When to Draw

When an ally unit is **Downed** (see [Downed Units](14-downed.md)), the player who controls that unit draws an Epic Card from the top of their deck and places it in their Hand.

If the unit the card applies to has already been Downed when the card is drawn, you may place it on the bottom of your deck and draw a new card.

## How to Use

An Epic Card may be played at the start of your turn, before activating a unit. Epic Cards affect a specific unit. If there is no unit name on the card, you may select any unit on your team; otherwise it must affect the specified unit.

When an Epic Card is played, the selected unit:

- Is unactivated, if they have already been activated.
- All their exhausted abilities refresh.
- They gain their max Energy.
- Then apply the written effect on the card.

After an Epic Card is played, it is discarded.
""",
    ),
    (
        "06-winning.md",
        {"id": "winning", "title": "Winning the Game", "order": 6},
        """# Winning the Game

The game ends after **8 rounds**, or immediately if one team has all units Downed.

- If all units on a team are Downed, the other team wins.
- Otherwise, the winner is the player with the highest **Score**:

**Score** = Objective Points + Point Value of Eliminated Enemy Units + Upgrades
""",
    ),
    (
        "07-gameplay-overview.md",
        {"id": "gameplay-overview", "title": "Gameplay Overview", "order": 7},
        """# Gameplay Overview

The game proceeds in **Rounds**, with players alternating who starts each round. Each round follows this order:

## Action Phase

- Players take turns activating units, one at a time.
- During an activation:
  1. **Free Movement** — The unit may move up to 2 spaces for no Energy cost. (see [Movement](10-movement.md))
  2. **Actions** — The unit may spend Energy to perform actions (see [Unit Actions](08-unit-actions.md))

## Recovery Phase

1. Unexhaust all cards.
2. Replenish each unit's max Energy.
3. Resolve status token effects (see [Status Effects](16-status-effects.md)).
4. Remove **1** of each type of status token from each unit.
""",
    ),
    (
        "08-unit-actions.md",
        {"id": "unit-actions", "title": "Unit Actions", "order": 8},
        """# Unit Actions

Units may perform the following actions during their activation:

## Combat Actions

Combat is resolved in the following order:

1. Declare Target within Range (see [Measuring Distance](12-measuring.md))
2. Roll Attack Dice (see [Combat](11-combat.md))
3. Resolve Damage

Healing actions are considered Combat Actions for mechanical purposes (see [Healing](13-healing.md)).

## Movement Actions

Not including Free Movement, a unit may move **1 space per 1 Energy** spent. (see [Movement](10-movement.md))

## Objective Actions

Units may perform objective actions in certain Scenarios (see [Scenarios](18-scenarios.md)).

- Costs **2 Energy** to perform.
- The unit must be within **Range 1** of the objective unless otherwise stated.
- If an objective is claimed by a unit, it is dropped in Range 1 of the unit when that unit is Downed. The player of that unit chooses the location to place a dropped objective token.

## Defensive Action

A unit may spend **2 Energy** to gain **1 SHIELD**. This immediately ends the unit's turn.
""",
    ),
    (
        "09-buildings-terrain.md",
        {"id": "buildings-terrain", "title": "Buildings & Terrain", "order": 9},
        """# Buildings & Terrain

- Buildings and Terrain cannot be placed within **2 spaces** of a starting zone, the map edge, or the side of a Building with an Entrance.
- Terrain may be placed adjacent to other Terrain.
- Terrain may not be placed inside Buildings.
- Once placed, Terrain and Buildings block both movement and Line of Sight unless otherwise specified.
- Buildings have one or more Entrances. Units may move and attack through Entrances.
""",
    ),
    (
        "10-movement.md",
        {"id": "movement", "title": "Movement", "order": 10},
        """# Movement

- Each unit may move **2 spaces** for **0 Energy** at the start of its activation as part of the Free Movement step.
- Any bonus movement from abilities (e.g., “+X Movement”) applies only to the Free Movement step.
- Additional movement during the Action step costs **1 Energy per square**.
- A unit may move any time during their activation.

## Movement Restrictions

A unit must have the **FLIGHT** keyword to:

- Move through Terrain.
- Move to higher elevation terrain.
- End their turn on top of Terrain.

- Units cannot occupy the same square.
- Units cannot move through a square occupied by enemies, but may move through squares occupied by allies.

See [Measuring Distance](12-measuring.md).
""",
    ),
    (
        "11-combat.md",
        {"id": "combat", "title": "Combat", "order": 11},
        """# Combat

- Attacks are resolved by rolling D6 dice equal to the attack value.
- Apply any **+** / **–** modifiers to each die result.
- **Damage** = number of dice results greater than the defender's Defense value.
- A **6** rolled before modifiers is a **CRIT** and always succeeds, regardless of Defense.

## Target

- You cannot target a unit that is out of range of the attack. See [Measuring Distance](12-measuring.md) for range rules.
- You may target ally or enemy units for any ability unless otherwise stated.
- The attacking unit may not target itself unless otherwise stated.
- Melee attacks cannot target units on different elevations.

### Multi-target

Some attacks target multiple units. Unless otherwise stated, a single attack roll is made. Each unit is affected by the attack based on their own defense score.

### Line of Sight

An enemy can only be targeted if you have **Line of Sight**. To calculate Line of Sight, a straight line must be able to be drawn between the base of the Attacker and the base of the Target, without passing through Terrain, Building walls, or other units.

## Reroll

After an attack roll is made, the Attacker may reroll any number of dice by spending **1 energy per die**.
""",
    ),
    (
        "12-measuring.md",
        {"id": "measuring", "title": "Measuring Distance", "order": 12},
        """# Measuring Distance

- Each square = **1 distance unit**.
- Diagonal movement alternates cost:
  - 1st diagonal = **1 unit**
  - 2nd diagonal = **2 units**
  - 3rd diagonal = **1 unit**, and so on.
""",
    ),
    (
        "13-healing.md",
        {"id": "healing", "title": "Healing", "order": 13},
        """# Healing

- Healing is resolved by rolling D6 dice. (e.g., “H:2” = roll 2 dice)
- Each die result greater than **2** heals **1 HP**.
- Units cannot heal above their maximum HP.
""",
    ),
    (
        "14-downed.md",
        {"id": "downed", "title": "Downed Units", "order": 14},
        """# Downed Units

When a unit reaches **0 HP**, they are **Downed**.

When a unit is Downed, their character tokens stay on the board. Flip the Hero Card for that unit to the backside.
""",
    ),
    (
        "15-keywords.md",
        {"id": "keywords", "title": "Keywords", "order": 15},
        """# Keywords

- **Counter** — After being attacked, make a basic attack against the Attacker.
  - If the Attacker is outside the Defender's basic attack range, the attack cannot be made.
  - Counter attacks do not trigger Counter.
- **Armor:X** — Reduce incoming damage by **X**. This does not apply to damage from Status Effects.
- **Flight** — Can move through Terrain. May change elevation.
- **Immune:_** — Cannot be affected by the listed condition.
- **Breakable:X** — Requires **X** damage to destroy. Breakable objects have **Defense: 4**.
- **Usage:X** — Ability may be used **X** times; discard after.
- **Range:X** — “**X**” = from range 1 up to range **X**. “**X–X**” = within that range.
- **Copies:X** — You may include up to **X** copies of this unit on a team.
""",
    ),
    (
        "16-status-effects.md",
        {"id": "status-effects", "title": "Status Effects", "order": 16},
        """# Status Effects

Status effects can only be applied to units on a successful attack, unless otherwise stated.

- **Bleed** — At the start of the Refresh Phase, take **1 damage**.
- **Slow** — Cannot take free movement.
- **Stunned** — Remove all Energy. Cannot gain Energy. A unit cannot gain Stunned if already Stunned.
- **Shield** — Unit can spend this when declared the target of attack. The unit gains **+1 Defense** for this attack. Shield tokens are not removed during the Refresh Phase. A unit cannot have more than **1** Shield token at a time.
- **Stealth** — Unit cannot be targeted by attacks. When this unit makes an attack, remove this token. A unit cannot have more than **1** Stealth token at a time.
""",
    ),
    (
        "17-tokens.md",
        {"id": "tokens", "title": "Tokens", "order": 17},
        """# Tokens

There are three types of tokens:

## Character tokens

- Character tokens correspond to the character icon on the Hero Card.
- Character tokens take the place of a unit on the game board.

## Status Effect tokens

- Status Effect tokens are placed on a Hero Card when an effect is applied.

## Tracker tokens

- Tracker tokens are used to track unit HP and Energy.
""",
    ),
    (
        "18-scenarios.md",
        {"id": "scenarios", "title": "Scenarios", "order": 18},
        """# Scenarios

## Control Point

**Setup:** Starting with Player B, players take turns placing an objective token in the center space of a building. Stop once **3** tokens have been placed.

**Gameplay:** At the end of each Refresh Phase, each player gains an objective token for each building they control. A player controls a building if they have a unit inside and no enemy units are in the building.

**Scoring:** Each objective token is worth **50 points**.

**Starting Player:** Player A

## Bomb Threat

**Setup:** The Villain player places **1** objective token in each building.

**Gameplay:** The objective tokens can be claimed with an objective action.

**Scoring:** After the game ends, the Hero player gains **100 points** for each objective token outside of a building. The Villain player gains **100 points** for each objective token inside a building.

**Starting Player:** Villains

## Special Target

**Setup:** Each player places **1** objective token on one of their own units.

**Gameplay:** When a unit with an objective token is Downed, the other player claims the token.

**Scoring:** Each objective token is worth **300 points**.

**Starting Player:** Player A
""",
    ),
]


GLOSSARY = """entries:
  - id: energy
    term: Energy
    aliases: []
    short: Spendable resource used for actions, movement beyond free movement, defense, objectives, and rerolls. Replenished to max during the Recovery Phase.
    section: gameplay-overview
  - id: hp
    term: HP
    aliases: [Health, Hit Points]
    short: Unit health. At 0 HP the unit is Downed.
    section: downed
  - id: defense
    term: Defense
    aliases: []
    short: Attack dice must exceed this value to deal damage (except a natural 6 CRIT).
    section: combat
  - id: armor
    term: Armor
    aliases: [Armor:X]
    short: Keyword that reduces incoming damage by X. Does not apply to damage from Status Effects.
    section: keywords
  - id: flight
    term: Flight
    aliases: [FLIGHT]
    short: Keyword allowing movement through Terrain, changing elevation, and ending on Terrain.
    section: movement
  - id: counter
    term: Counter
    aliases: []
    short: After being attacked, make a basic attack against the Attacker (if in basic attack range). Counter attacks do not trigger Counter.
    section: keywords
  - id: bleed
    term: Bleed
    aliases: []
    short: At the start of the Refresh Phase, take 1 damage.
    section: status-effects
  - id: slow
    term: Slow
    aliases: []
    short: Cannot take free movement.
    section: status-effects
  - id: stunned
    term: Stunned
    aliases: []
    short: Remove all Energy. Cannot gain Energy. Cannot gain Stunned if already Stunned.
    section: status-effects
  - id: shield
    term: Shield
    aliases: [SHIELD]
    short: Spend when declared the target of an attack for +1 Defense for that attack. Max 1; not removed during the Refresh Phase. Defensive Action grants 1 SHIELD for 2 Energy.
    section: status-effects
  - id: stealth
    term: Stealth
    aliases: []
    short: Cannot be targeted by attacks. Removed when this unit makes an attack. Max 1.
    section: status-effects
  - id: heat
    term: Heat
    aliases: []
    short: Status token used on some cards; not listed in Section 17 Status Effects—resolve per the applying card.
    section: status-effects
  - id: range
    term: Range
    aliases: [Range:X]
    short: Distance in squares (each square = 1 unit). Range:X is from range 1 up to X unless stated otherwise on the card.
    section: measuring
  - id: target
    term: Target
    aliases: []
    short: Must be in range, obey Line of Sight rules for enemies, and follow ability-specific targeting limits.
    section: combat
  - id: crit
    term: Crit
    aliases: [CRIT]
    short: A natural 6 on an attack die before modifiers always succeeds.
    section: combat
  - id: downed
    term: Downed
    aliases: []
    short: At 0 HP. Token stays on the board; flip the unit's Hero Card to the back.
    section: downed
  - id: free-movement
    term: Free Movement
    aliases: []
    short: Up to 2 spaces at the start of activation with no Energy cost (bonus movement from abilities applies here only).
    section: movement
  - id: recovery-phase
    term: Recovery Phase
    aliases: [Refresh Phase]
    short: End of each round—unexhaust cards, refill Energy, resolve status effects, remove 1 of each status token type per unit.
    section: gameplay-overview
  - id: line-of-sight
    term: Line of Sight
    aliases: [LOS]
    short: Straight line from attacker base to target base without passing through Terrain, Building walls, or other units (required to target enemies).
    section: combat
  - id: upgrade
    term: Upgrade
    aliases: [Upgrade Card]
    short: Equipped in Upgrade Slots; has slot type, point cost, and restrictions. Counts toward the 700-point team cap.
    section: building-teams
  - id: epic-card
    term: Epic Card
    aliases: [Epic]
    short: Powerful card in a 5-card facedown deck; drawn when an ally is Downed; played at the start of your turn before activating a unit.
    section: epic-cards
  - id: objective
    term: Objective
    aliases: [Objective token]
    short: Scenario-specific tokens placed, claimed, and scored per the active Scenario rules.
    section: scenarios
  - id: activation
    term: Activation
    aliases: []
    short: A unit's turn in the Action Phase—Free Movement then Actions using Energy.
    section: gameplay-overview
  - id: gear
    term: Gear
    aliases: []
    short: Upgrade slot type listed on upgrade cards; each unit has Upgrade Slots of specific types.
    section: building-teams
  - id: trait
    term: Trait
    aliases: []
    short: Upgrade slot type listed on upgrade cards; each unit has Upgrade Slots of specific types.
    section: building-teams
  - id: usage
    term: Usage
    aliases: [Usage:X]
    short: Keyword—ability may be used X times; discard after.
    section: keywords
  - id: copies
    term: Copies
    aliases: [Copies:X]
    short: Keyword allowing up to X copies of that unit on a team.
    section: keywords
  - id: breakable
    term: Breakable
    aliases: [Breakable:X]
    short: Keyword requiring X damage to destroy; Breakable objects have Defense 4.
    section: keywords
  - id: immune
    term: Immune
    aliases: [Immune:_]
    short: Keyword—cannot be affected by the listed condition.
    section: keywords
  - id: melee
    term: Melee
    aliases: []
    short: Melee attacks cannot target units on different elevations.
    section: combat
  - id: ranged
    term: Ranged
    aliases: []
    short: Attacks with range above melee use Range and Line of Sight rules (see Measuring Distance and Combat).
    section: combat
"""


def main() -> None:
    RULES.mkdir(parents=True, exist_ok=True)
    (CONTENT / "changelog").mkdir(parents=True, exist_ok=True)

    for filename, meta, body in SECTIONS:
        (RULES / filename).write_text(fm(meta) + body, encoding="utf-8")

    (CONTENT / "version.json").write_text(
        json.dumps({"version": "0.1.0", "date": "2026-01-13"}, indent=2) + "\n",
        encoding="utf-8",
    )

    constants = {
        "teamPointCap": 700,
        "freeMovement": 2,
        "maxRounds": 8,
        "epicDeckSize": 5,
        "defendEnergyCost": 2,
        "objectiveActionCost": 2,
        "mapSize": 24,
        "tileSize": 8,
        "startingZoneSize": 3,
        "healThreshold": 2,
        "rerollEnergyCost": 1,
        "diagonalAlternating": True,
    }
    (CONTENT / "constants.json").write_text(
        json.dumps(constants, indent=2) + "\n", encoding="utf-8"
    )

    (CONTENT / "glossary.yaml").write_text(GLOSSARY, encoding="utf-8")

    changelog = """---
version: 0.1.0
date: 2026-01-13
headline: Initial release
---

# v0.1.0

First public rules release for Astrum Conflict (01/13/2026).
"""
    (CONTENT / "changelog" / "0.1.0.md").write_text(changelog, encoding="utf-8")

    debug = CONTENT / "_extract_debug.txt"
    if debug.exists():
        debug.unlink()

    print(f"Wrote {len(SECTIONS)} rule files to {RULES}")


if __name__ == "__main__":
    main()