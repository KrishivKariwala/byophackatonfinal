# SAVE A PLATE — supplied font asset manifest

This manifest records the font files supplied by the owner in the ChatGPT conversation. **The font binaries are not included in this handoff ZIP.** Attach the files separately to Claude Code or copy them into the application project before implementing local font loading.

## The Seasons

| Supplied filename | Internal style | CSS weight | CSS style | Suggested project filename |
|---|---|---:|---|---|
| `Fontspring-DEMO-theseasons-lt.otf` | Light | 300 | normal | `the-seasons-light.otf` |
| `Fontspring-DEMO-theseasons-reg.otf` | Regular | 400 | normal | `the-seasons-regular.otf` |
| `Fontspring-DEMO-theseasons-bd.otf` | Bold | 700 | normal | `the-seasons-bold.otf` |
| `Fontspring-DEMO-theseasons-ltit.otf` | Light Italic | 300 | italic | `the-seasons-light-italic.otf` |
| `Fontspring-DEMO-theseasons-it.otf` | Italic | 400 | italic | `the-seasons-italic.otf` |
| `Fontspring-DEMO-theseasons-bdit.otf` | Bold Italic | 700 | italic | `the-seasons-bold-italic.otf` |

## Chunko Bold

| Supplied filename | Internal family/style | Recommendation | Suggested project filename |
|---|---|---|---|
| `Chunko Bold Demo.otf` | Chunko Bold Demo / Regular | Preferred OTF | `chunko-bold.otf` |
| `Chunko Bold Demo(1).ttf` | Chunko Bold Demo / Regular | Alternate TTF; do not load alongside OTF | `chunko-bold.ttf` |

The Chunko font is designed as the bold display face even though its internal style metadata reports `Regular`. Do not create two separate CSS families for the OTF and TTF versions.

## Inter

Inter is named in the mood board but was not among the uploaded font files. Use the exact Inter family via the build's supported font-loading method (for example, `next/font/google` if the build environment can fetch it), or ask the owner for local Inter files. Do not label a system fallback as Inter.

## Example CSS

After placing the fonts in `public/fonts/` under the suggested names, use declarations equivalent to the example in [`font-face.css.example`](font-face.css.example).

## Licensing reminder

The supplied filenames include `DEMO`. Treat these as prototype/demo assets until the owner verifies the Fontspring licence permits the intended web and commercial use. Do not claim production licensing has been confirmed. Before public launch, obtain and install appropriately licensed webfont files if required.
