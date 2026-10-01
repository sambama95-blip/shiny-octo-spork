# Field Map

**The future of conversions.**

One bot / one app: map payroll HCM **extract shapes** (CSV files) into **UKG Pro Launch** People Profiles load files.

Sources are file layouts—not live vendor APIs: **SAP | ADP | UKG | Smaller shop / Other**.

## 5-minute client path

1. Open the app (see [Open the app](#open-the-app) below).
2. **Pick source** — choose the extract shape that matches your CSV headers.
3. **Load** — click **Load demo for selected source**, or drop your own CSV.
4. **Fix map** — review the source → Launch field map; change any dropdown.
5. **Download** three files:
   - `field_map.csv` — the mapping
   - `01_People_Profiles.csv` — Launch column order
   - `exceptions.csv` — rows that cannot load cleanly

### Hard rule (tax)

Field Map **never invents** Work-In or Resident SIT tax codes. If work or resident state is missing / unmapped, that employee is **BLOCKED** in `exceptions.csv` and the SIT code cells stay blank.

Each shipped demo includes at least one BLOCKED row so implementers can see the law.

## Open the app

### GitHub Pages (preferred once enabled)

After this branch is merged (or Pages is pointed at `main` / `docs` / workflow):

**https://sambama95-blip.github.io/shiny-octo-spork/**

Enable Pages (one-time, repo Settings → Pages):

1. Open [Settings → Pages](https://github.com/sambama95-blip/shiny-octo-spork/settings/pages).
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Merge the PR that includes `.github/workflows/pages.yml` (or run the workflow from the Actions tab).
4. Wait for the **Deploy Field Map to GitHub Pages** workflow to finish; open the URL above.

### Local (no deploy)

```bash
# from repo root
python3 -m http.server 8080
# open http://localhost:8080
```

Or open `index.html` via any static file server. Demo fetch works over `http://`; embedded demos also load if fetch fails.

### Repo

https://github.com/sambama95-blip/shiny-octo-spork

## What’s in the box

| Path | Role |
|------|------|
| `index.html` | UI — brand-first hero, 4-step workflow |
| `app.js` | CSV parse, auto-map aliases, SIT BLOCKED law, downloads |
| `styles.css` | Charcoal `#0e0f12` + soft teal `#5b9a9a` |
| `demos/*.csv` | Four source demos (each with a BLOCKED row) |
| `.github/workflows/pages.yml` | GitHub Pages deploy |

## Launch targets (People Profiles)

Includes Launch-style headers such as Source Company Code, Source Employee Number, UP Company Code, UP Employee Number, name/SSN/DOB, pay & org fields, address, federal filing, **Work-In SIT** / **Resident SIT** codes & filing fields, and Work Email Address.

**Keys:** Source Company Code + Source Employee Number; also UP Company / Employee when mapped.

## Source aliases (auto-map)

- **ADP:** File #, Assoc ID, Company Code, Last/First, SSN, Birth Date, Rate, Annual Salary, Job Code, Pay Group, Worked In / Lived In State, address & federal fields…
- **SAP flat:** Personnel Number (PERNR), Last Name (NACHN), First Name (VORNA), Birth Date (GBDAT), Personnel Area (WERKS) as work-in *hints only when present*, Personnel Subarea (BTRTL), etc. Never invent SIT codes.
- **UKG:** Near-passthrough / rename into Launch headers.
- **Smaller shop / Other:** Employee ID, Company Code, First/Last, SSN, Work State, Home State, rates, Job Code, Pay Group…

## License

MIT — see `LICENSE`.
