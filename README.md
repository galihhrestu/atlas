# ATLAS Webmap + SIGMA Dashboard

ATLAS is the OneMap Phase 1 landing page and live Leaflet webmap. SIGMA is integrated into the same Vite + React project as the operational monitoring workspace.

## Integrated routes

| Route | Function |
|---|---|
| `/` | ATLAS landing page and webmap |
| `/sigma/login` | SIGMA access selection |
| `/sigma/dashboard` | SIGMA operational dashboard |
| `/sigma/patrols` | Patrol monitoring |
| `/sigma/assets` | Asset monitoring |
| `/sigma/visibility` | Visibility monitoring |
| `/sigma/risk` | Risk and hotspot monitoring |
| `/sigma/findings` | Findings and follow-up |
| `/sigma/performance` | Performance monitoring |
| `/sigma/reports` | PDF and Excel reports |
| `/sigma/admin/*` | SIGMA administrator workspace |

The **SIGMA** card on the ATLAS landing page opens `/sigma/dashboard`. The SIGMA top bar and login page include a link back to ATLAS.

## Local development

Requirements:

- Node.js 18.18 or newer
- npm 9 or newer
- Browser network access for OpenStreetMap and Satellite demo tiles

Run from the project root:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The Sigma dashboard can also be opened directly at `http://localhost:5173/sigma/login`.

For a local production preview:

```bash
npm run build
npm start
```

Windows shortcuts:

- `start-local.bat` — development server
- `start-production.bat` — production build and preview server

## ATLAS map data and asset slots

The supplied SHP data remains at `public/assets/data/DataSHP.zip`:

- `Sepaku Admin.shp` → Sepaku Admin
- `IHM Sepaku HTI-per kompartemen.shp` → HTI Compartments
- `Jalan_Sepaku.shp` → Jalan Sepaku

Owner-provided image and icon slots remain under `public/assets/`. Replace the existing placeholder PNG files while keeping their filenames. The ATLAS logo slot is `1024 × 1024 px`.

## SIGMA data mode

SIGMA defaults to browser-local demo data. It does not require Firebase to run locally. Firebase scaffolding and rules are retained under `docs/sigma/` for the later data integration stage.

Set `VITE_DATA_MODE=firebase` and provide the Firebase variables only after the Firebase project is configured. Do not commit `.env.local` or any credential file.

## Deploy from a GitHub repository

The repository is prepared for GitHub Pages through `.github/workflows/deploy-pages.yml`.

1. Create a GitHub repository and push this project to the `main` branch.
2. In GitHub, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` or run the workflow manually from the **Actions** tab.

The workflow sets `VITE_BASE_PATH` from the repository name, builds ATLAS and SIGMA together, creates the SPA `404.html` fallback for deep routes, and publishes `dist/`.

For another hosting platform, run `npm run build` and publish the generated `dist/` directory. Set `VITE_BASE_PATH` to the hosting subpath when the application is not served from the domain root; use `/` for a root deployment.

## Project structure

```text
src/App.tsx                 ATLAS landing page and Leaflet webmap
src/SigmaRoot.tsx           SIGMA route entry and providers
src/sigma/                  Integrated SIGMA dashboard source
src/runtime.ts              Shared asset and route path helpers
public/assets/              ATLAS owner-provided asset slots and SHP data
public/sigma-mark.svg       SIGMA brand asset from the supplied dashboard
docs/sigma/                 SIGMA data model and Firebase preparation notes
.github/workflows/          GitHub Pages deployment workflow
```

No Site publication or cloud deployment is performed by this package.
