# Auditoría técnica v1 — vertical slice

## Estado

La build de `main` del 14-09-2026 queda **rechazada para presentación**. El trabajo de rescate se realiza en `audit/rebuild-v1` y solo se fusionará después de QA.

## Hallazgos confirmados

1. **Sprites del protagonista/NPC con render defectuoso en Pages.** La captura de producción muestra rectángulos negros de exactamente el tamaño escalado de los frames 32×48. Como mitigación inicial, las hojas del protagonista se reexportarán a PNG RGBA truecolor y se validará alpha en CI.
2. **Mapa de animaciones horizontal invertido.** La hoja real está organizada por filas `left`, `right`, `up`, `down`; la build publicada asignaba la primera fila a `right` y la segunda a `left`.
3. **Falta de preflight de assets.** TypeScript/build podían pasar aunque una hoja gráfica estuviera mal codificada o sin alpha.
4. **HUD sobredimensionado para un viewport 960×540.** Debe reducirse y verificarse sobre el mapa real.
5. **NPCs reutilizan el sprite del protagonista.** Es admisible solo como placeholder interno y no como build de presentación.
6. **Dungeon/creatures todavía dependen de texturas generadas de soporte.** No se consideran arte final.
7. **No existe QA visual automatizado.** Se añadirá como siguiente fase después de estabilizar render y navegación.

## Criterios de salida de esta rama

- Protagonista y NPCs sin rectángulos/artefactos.
- Orientación de las cuatro direcciones correcta.
- HUD no bloquea puntos importantes de navegación.
- Spawn/NPC/runas/entrada verificados contra colisiones.
- World → Battle → Dungeon → World probado.
- Persistencia probada.
- `npm run qa` verde.
- Revisión visual de Pages antes de merge.
