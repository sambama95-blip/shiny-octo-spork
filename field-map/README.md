# Field Map

Payroll extract → load-ready CSV mapper.

Drop a payroll extract, map source columns to a load template (SAP, ADP, UKG, or smaller-shop CSV), and download a load-ready file. Tax / wage / setup codes are pass-through only — Field Map never invents them.

Recovered into this repo from the live soft-gated preview at `https://6s7i3xid.hostthis.dev` plus Field Map product notes from Outlook / AgentMail.

## Quick start

```bash
cd field-map
npm install
npm run dev
```

Open the printed local URL. Soft-gate password is in `docs/ACCESS.txt`.

## Scripts

- `npm run dev` — local Vite preview
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build

## Notes

- Files stay in-browser (Papa Parse, no upload server).
- Soft gate is client-side preview access control, not account login.
- `paidUnlockPassword` in `src/access-config.ts` is intentionally empty until PayPal is live.
- Contact: DM on X [@SamE1311025](https://x.com/SamE1311025)
