# Evidence: Y11S3.1 content hotfix (Operation Split Fire)

This branch holds only screenshots and the verification report for the Y11S3.1 content pull request (`claude/y11s31-content-hotfix`). It is not meant to be merged. It contains no PDFs and no workbook source: the paid workbook stays outside this public repository.

Source for every changed value: [Ubisoft Y11S3.1 patch notes](https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/3WMly2DNZqv1GpUK9GNGm5/y11s31-patch-notes) (September 22, 2026).

## Website

**Before:** `website/before-production/`
- Captured from https://r6coaching.com/beginner-guide on September 25, 2026.
- Production still shows **"UPCOMING · NOT LIVE — Ubisoft launches Operation Split Fire on September 1, 2026 … while Y11S2.2 remains live."**
- Split Fire has been live since September 1.

**After:** `website/after/`
- Captured from the hotfix branch head `ef6c7d7` (Vite dev server).
- Pages covered:
  - `beginner-guide-season`: "Live season · Y11S3.1 — Operation Split Fire is live." The panel summarizes the retuned operators, the M1014 and SPAS-15 change and the Noor fixes, and links the official notes.
  - `beginner-guide-rank-ladder-date`: the rank ladder keeps its real verification date (August 23, 2026). The Y11S3.1 notes do not touch Ranked.
  - `operator-<name>-y11s31`: the new "Y11S3.1 update (September 22, 2026)" callout on the nine affected operator pages (Ace, Buck, Castle, Caveira, Maestro, Pulse, Sledge, Thermite, Thunderbird).
  - `operator-castle-kit`: the gadget label now reads "Armor Panel".
  - `operator-castle-counter`: "As of Y11S3.1 an Armor Panel takes 10 melee hits to destroy (was 9)".
  - `operator-sledge-gadget`: "Each swing takes 0.8 seconds as of Y11S3.1 (was 1 second)".
- `captured-text.json` holds the rendered text of every crop.
- The capture checked horizontal overflow, and none was found.

**Capture method:**
- Headless Microsoft Edge over the DevTools protocol.
- Desktop 1366×900 at 1.5×; phone 390×844 with 2× device emulation and touch.
- Production API, analytics and Stripe hosts were mapped to 127.0.0.1, so nothing was sent anywhere.

## Workbook (Siege Starter Field Workbook)

Renders are in `workbook/pages/`. "build228" is the edition currently sold; "y11s31" is the regenerated edition.

| Page | What changed |
|---|---|
| 2 | Review line: "reviewed on September 22, 2026 (Y11S3.1)". Edition row: "Operation Split Fire • Y11S3.1". |
| 29 | Labels only. "Ranked snapshot"; "Verified August 23, 2026 (Y11S2.2). The Y11S3.1 notes announce no map-pool change."; the "Season status" callout. The 14-map list is unchanged. |
| 39 | Only "August 23 edition" → "September 22 edition". The 40 divisions and the Legend Division facts are unchanged. |
| 64 | Review line, plus two new official source rows: the Split Fire season page and the Y11S3.1 patch notes. |

`fillable-p02-*` shows that the form fields on page 2 are unchanged.

`workbook/report.md` and `workbook/report.json` hold the full verification:
- Pixel diffs: only pages 2, 29, 39 and 64 changed in the interior, fillable and print editions; the free sample changed only its copies of those pages.
- Field checks: 357 fields as before (259 text, 98 checkbox), none moved or retyped, appearance streams present, fill round-trip passed.
- ZIP layout and SHA-256 checksums of every artifact.

The workbook contains none of the eight changed values and no Noor content, so the workbook edition changes are wording-only.
