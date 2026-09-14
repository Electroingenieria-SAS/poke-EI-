#!/usr/bin/env python3
"""Install a locally-owned copy of The Fan-tasy Tileset into this project.

This script never downloads or redistributes the asset pack. It only extracts
an archive the developer already owns into public/assets/fantasy/.
"""
from __future__ import annotations

import argparse
import shutil
import tempfile
import zipfile
import subprocess
import sys
from pathlib import Path, PurePosixPath

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEST = PROJECT_ROOT / "public" / "assets" / "fantasy"


def safe_member(name: str) -> bool:
    p = PurePosixPath(name)
    return not p.is_absolute() and ".." not in p.parts


def detect_root(names: list[str]) -> str:
    candidates: set[str] = set()
    for name in names:
        p = PurePosixPath(name)
        parts = p.parts
        if "Art" in parts:
            idx = parts.index("Art")
            candidates.add("/".join(parts[:idx]))
        if "Tiled" in parts:
            idx = parts.index("Tiled")
            candidates.add("/".join(parts[:idx]))
    candidates = {c.rstrip("/") for c in candidates}
    if not candidates:
        raise RuntimeError("No se encontró una carpeta que contenga Art/ o Tiled/ en el ZIP.")
    return sorted(candidates, key=lambda s: (s.count("/"), len(s)))[0]


def install_from_zip(src: Path) -> None:
    with zipfile.ZipFile(src) as zf:
        names = [n for n in zf.namelist() if safe_member(n)]
        root = detect_root(names)
        prefix = f"{root}/" if root else ""
        with tempfile.TemporaryDirectory(prefix="poke-ei-assets-") as td:
            temp = Path(td)
            copied = 0
            for name in names:
                if name.endswith("/") or not name.startswith(prefix):
                    continue
                rel = PurePosixPath(name[len(prefix):])
                if not rel.parts:
                    continue
                if rel.suffix.lower() == ".pdf":
                    continue
                target = temp.joinpath(*rel.parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(name) as source, target.open("wb") as out:
                    shutil.copyfileobj(source, out)
                copied += 1
            if copied == 0:
                raise RuntimeError("El ZIP no contenía archivos utilizables del tileset.")
            if DEST.exists():
                shutil.rmtree(DEST)
            DEST.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(temp, DEST)
            print(f"Assets instalados: {copied} archivos -> {DEST}")


def install_from_folder(src: Path) -> None:
    root = src
    if not (root / "Art").exists() and not (root / "Tiled").exists():
        children = [p for p in root.iterdir() if p.is_dir()]
        match = next((p for p in children if (p / "Art").exists() or (p / "Tiled").exists()), None)
        if match is None:
            raise RuntimeError("La carpeta no contiene Art/ ni Tiled/.")
        root = match
    if DEST.exists():
        shutil.rmtree(DEST)
    shutil.copytree(root, DEST, ignore=shutil.ignore_patterns("*.pdf"))
    print(f"Assets instalados desde carpeta -> {DEST}")


def regenerate_world_data() -> None:
    generator = PROJECT_ROOT / "tools" / "generate_world_data.py"
    subprocess.run([sys.executable, str(generator)], cwd=PROJECT_ROOT, check=True)
    print("Datos de mundo regenerados desde Tiled.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Instala localmente The Fan-tasy Tileset para Poke-EI.")
    parser.add_argument("source", type=Path, help="Ruta al ZIP original o a la carpeta descomprimida")
    args = parser.parse_args()
    src = args.source.expanduser().resolve()
    if not src.exists():
        raise SystemExit(f"No existe: {src}")
    try:
        if src.is_file() and src.suffix.lower() == ".zip":
            install_from_zip(src)
        elif src.is_dir():
            install_from_folder(src)
        else:
            raise RuntimeError("Debes indicar un .zip o una carpeta.")
        regenerate_world_data()
    except Exception as exc:
        raise SystemExit(f"Error instalando assets: {exc}") from exc


if __name__ == "__main__":
    main()
