# How to open Field Map

1. From the repo root: `cd field-map && npm install && npm run dev`
2. Open the local URL Vite prints (usually `http://localhost:5173`).
3. Enter the soft-gate password from `docs/ACCESS.txt`.
4. Choose a load target, load a demo extract or drop your own CSV, map fields, download.

Production-style static pack:

```bash
cd field-map
npm run build
# open dist/index.html via any static host, or: npm run preview
```

## Trial peek

Unpaid / trial customer uploads are intended to keep only `trialPeekRows` (default **3**) data rows for mapping samples. See `docs/TRIAL-LIMITS.md` and `src/access-config.ts`.
