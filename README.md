# Echoes of Alder — Phaser RPG vertical slice

A structured Phaser 3 + TypeScript RPG prototype built around the user-provided **The Fan-tasy Tileset (Free) 1.5.7** assets. The goal is a Pokémon-style exploration loop without copying proprietary Pokémon code or assets: top-down exploration, NPC interaction, quest state, random encounters, turn-based combat, capture/vínculo, XP/levels, puzzles and a dungeon boss.

## What is actually implemented

- Original `Beginning Fields` map rendered at 2× pixel scale.
- Player idle/walk animation in four directions from the supplied character sheets.
- Tiled-derived collision data. The current generated data contains **529** collision rectangles sourced from the `.tmx/.tsx` collider definitions.
- **169** Tiled world objects read from the supplied map. Houses, trees, rocks, props and campfires are re-instantiated as depth-sorted sprites so the player can visually pass in front of or behind scenery.
- NPC dialogue and quest state.
- Rune puzzle: **SOL → RÍO → RAÍZ**.
- Route encounter zones and random encounters while walking.
- Turn-based battle with HP, stamina, basic attack, technique, recovery, capture/vínculo, escape and simple enemy AI.
- Player XP/level progression and up to six unique captured creatures.
- Separate sanctuary/dungeon scene with a second sequence puzzle and a boss encounter.
- `localStorage` save state.
- `F2` collision overlay in the overworld for auditing.
- GitHub Pages workflow included.

> The supplied pack does not contain dedicated monster sprites. The current creatures deliberately use pack elements (bush, rock and campfire) as **placeholder combat art**. The battle architecture is data-driven so replacing them with a real bestiary later does not require rewriting the battle engine.

## Controls

| Action | Key |
|---|---|
| Move | WASD / arrow keys |
| Interact / advance dialogue | E |
| Practice battle near Kael | B |
| Toggle collision debug | F2 |
| Battle actions | 1–5 or mouse |

## Run locally

Requirements: Node.js 20+ (22 recommended).

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Production check:

```bash
npm run build
npm run preview
```

Repository sanity check:

```bash
python tools/validate_repo.py
```


## Upload to GitHub

1. Create an empty GitHub repository.
2. Upload the contents of this folder (do not upload the outer ZIP as the only repository file).
3. Commit/push to `main`.
4. In **Settings → Pages**, choose **GitHub Actions** as the source if GitHub does not select it automatically.
5. The included `.github/workflows/deploy-pages.yml` installs dependencies, validates TypeScript, builds Vite and publishes `dist/`.

Because `vite.config.ts` uses `base: './'`, the same build works from a project subpath on GitHub Pages.

## Project layout

```text
src/
  config/        paths and world constants
  data/          creatures, NPCs, encounters and object asset registry
  entities/      player movement/controller
  scenes/        boot, title, overworld, battle and dungeon
  state/         persistent game state
  systems/       battle formulas
  ui/            dialogue and HUD
public/
  assets/fantasy original supplied art + Tiled sources
  data/          generated collision/object metadata
tools/
  generate_world_data.py
.github/workflows/
  deploy-pages.yml
```

## Editing the Tiled map

The source is kept at:

`public/assets/fantasy/Tiled/Tilemaps/Beginning Fields.tmx`

After editing the map or its TSX collision shapes, regenerate the Phaser metadata:

```bash
python tools/generate_world_data.py
```

The script uses only Python's standard library and rewrites:

- `public/data/beginning-fields-collisions.json`
- `public/data/beginning-fields-objects.json`

If you add a **new image asset** to the Tiled object layer, also register/preload that image in `src/data/objectAssets.ts` or regenerate that registry as part of your content pipeline.

## Architecture notes

The prototype intentionally keeps content data separate from scene logic. Creature stats live in `src/data/creatures.ts`; NPCs, runes and route zones live in `src/data/world.ts`; persistent flags live in `GameState`; battle math lives in `BattleEngine`. This makes it practical to add more maps, quests, moves, status effects and creatures without turning scenes into monolithic files.

For a production game, the next engineering steps should be: a proper map-export pipeline from Tiled, typed quest/event scripting, multiple party members in battle, move definitions/status effects, inventory/items, audio manager, save slots, scene transitions, controller/mobile input, and dedicated creature/NPC art.

## Third-party assets

See `LICENSE_NOTES.md` and the original PDF documentation in `public/assets/fantasy/` before publishing or redistributing the asset pack.
