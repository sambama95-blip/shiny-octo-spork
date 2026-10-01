# Trial limits

Field Map preview is soft-gated for private demos.

## Soft gate

Shared password opens the UI (see `docs/ACCESS.txt`). Session flag: `fieldmap_soft_gate_v1` in `sessionStorage`.

## Trial peek rows

`trialPeekRows` (default **3**) in `src/access-config.ts` is the intended unpaid peek size when a customer file is truncated to first N of TOTAL.

The recovered live preview build did not enforce truncation in the browser bundle; the config and docs are restored here so the next paid/trial cutover can wire it without guessing.

## Paid unlock

`paidUnlockPassword` is left empty on purpose until PayPal clears. Production `People_*` extracts stay blocked until that is set.

## Pricing (product notes)

- Sample / trial, then about **$99/mo** or ~**$1k cutover**
- PayPal.Me (product lock): https://www.paypal.me/sabama
