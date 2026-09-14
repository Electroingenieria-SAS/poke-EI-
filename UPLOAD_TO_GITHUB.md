# Subir este proyecto a GitHub

1. Descomprime el ZIP.
2. Crea un repositorio vacío en GitHub (preferiblemente **privado** hasta verificar las condiciones de redistribución del tileset).
3. Sube **el contenido de esta carpeta**: `package.json`, `src`, `public`, `.github`, etc.
4. Haz commit en la rama `main`.
5. En GitHub: **Settings → Pages → Source: GitHub Actions**.
6. La acción incluida construirá y publicará el juego automáticamente.

Para desarrollo local:

```bash
npm install
npm run dev
```

Antes de subir cambios importantes:

```bash
python tools/validate_repo.py
npm run build
```
