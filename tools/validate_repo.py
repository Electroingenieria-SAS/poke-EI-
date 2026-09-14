#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [
    "package.json", "index.html", "src/main.ts",
    "src/scenes/BootScene.ts", "src/scenes/WorldScene.ts",
    "src/scenes/BattleScene.ts", "src/scenes/DungeonScene.ts",
    "src/state/GameState.ts", "tools/install_assets.py",
    "tools/generate_world_data.py",
]
missing = [p for p in required if not (ROOT / p).exists()]
if missing:
    raise SystemExit("Faltan archivos: " + ", ".join(missing))

collisions_path = ROOT / "public/data/beginning-fields-collisions.json"
objects_path = ROOT / "public/data/beginning-fields-objects.json"
if collisions_path.exists() and objects_path.exists():
    collisions = json.loads(collisions_path.read_text(encoding="utf-8"))
    objects = json.loads(objects_path.read_text(encoding="utf-8"))
    if len(collisions) < 100 or len(objects) < 50:
        raise SystemExit("Datos de mundo inválidos")
    print(f"Colliders: {len(collisions)}")
    print(f"Objetos Tiled: {len(objects)}")
else:
    print("Datos Tiled: pendientes de generar con tools/install_assets.py")

asset_dir = ROOT / "public/assets/fantasy"
print("Assets locales:", "instalados" if asset_dir.exists() else "no instalados (esperado en el repo público)")
print("Repo OK")
