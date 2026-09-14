# Poke-EI — Phaser RPG vertical slice

Vertical slice de un RPG 2D de exploración y captura de criaturas, construido con **Phaser 3.90**, **TypeScript** y **Vite**. La arquitectura separa escenas, estado, entidades, UI, combate y datos de mundo para poder crecer hacia rutas, pueblos, interiores, mazmorras, entrenadores, inventario y un bestiario propio.

## Qué incluye

- Mundo inicial basado en `Beginning Fields`.
- 529 zonas de colisión generadas desde los colliders de Tiled.
- 169 objetos de mundo con profundidad por coordenada Y.
- Personaje con movimiento top-down y animaciones idle/walk.
- NPCs, diálogos y misión inicial.
- Puzzle de runas `SOL → RÍO → RAÍZ`.
- Zonas de encuentros aleatorios.
- Combate por turnos con HP y stamina.
- Captura/vínculo, experiencia y niveles.
- Escena de santuario/mazmorra, segundo puzzle y jefe.
- Persistencia local mediante `localStorage`.
- `F2` para mostrar/ocultar colliders durante auditoría.

## Assets requeridos

Este repositorio **no redistribuye** los archivos gráficos de The Fan-tasy Tileset. Debes tener una copia obtenida legalmente de la versión gratuita 1.5.7 o compatible.

Instálala localmente con:

```bash
python tools/install_assets.py "C:/ruta/The Fan-tasy Tileset (Free) 1.5.7.zip"
```

El comando crea `public/assets/fantasy/` y regenera automáticamente `public/data/` desde el mapa Tiled. Ambos resultados son derivados locales y están excluidos del control de versiones.

Fuente/licencia oficial: https://ventilatore.itch.io/the-fan-tasy-tileset

## Ejecutar

Requisitos recomendados: Node.js 20+ y Python 3.10+.

```bash
npm install
python tools/install_assets.py "/ruta/al/tileset.zip"
npm run dev
```

Abre la URL que muestre Vite, normalmente `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

El build genera `dist/`. Para una publicación web real, el host también debe disponer de los assets bajo `public/assets/fantasy/`; no se publican automáticamente desde este repositorio.

## Estructura

```text
src/
  config/      rutas de assets y constantes
  data/        criaturas, mundo y catálogo de objetos
  entities/    controlador del jugador
  scenes/      Boot, Title, World, Battle y Dungeon
  state/       estado persistente
  systems/     reglas de combate
  ui/          HUD y diálogos
public/
  data/        generado automáticamente desde Tiled
  assets/      assets locales ignorados por Git
tools/
  install_assets.py
  generate_world_data.py
  validate_repo.py
```

## Controles

- `WASD` / flechas: mover.
- `E`: interactuar/confirmar.
- `F2`: depurar colisiones.
- Combate: interfaz y teclas indicadas en pantalla.

## Próximos pasos de producción

El pack gratuito no incluye un bestiario dedicado, por lo que las criaturas actuales son placeholders de gameplay. La siguiente fase debe incorporar arte propio o con licencia redistribuible para criaturas, UI final, efectos, audio, tiles adicionales e interiores.

## Licencias

El código de este repositorio es trabajo del proyecto. Los assets de terceros conservan sus propias condiciones y no se incluyen aquí. Consulta `LICENSE_NOTES.md`.
