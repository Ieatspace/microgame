Procedural sprites are the default.

To opt into PNG overrides after running `npm run generate:assets`, set either:

- `NEXT_PUBLIC_MICRO_DEFENSE_ASSET_MODE=image` before starting Next.js
- `localStorage.setItem("micro-defense-asset-mode", "image")` in the browser

Expected optional override files:

- `wizard.png`
- `knight.png`
- `archer.png`
- `catapult.png`
- `boss.png`
