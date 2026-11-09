# Restaurant Porto Adria – Website

Static one-page website for Restaurant Porto Adria (Waabs), live at <https://portoadria.de>.
Based on the "Landigoo" template (MelodyThemes), trimmed to what the page actually uses.

## Run locally

No build step. Serve the folder with any static server, for example:

```sh
python -m http.server 8765
# open http://127.0.0.1:8765/
```

## Deploy

GitHub Pages serves the `master` branch; the custom domain is set in `CNAME`.
**Every push to `master` goes live immediately.** Work on a branch and merge when it's verified.

## Structure

| Path | What |
|---|---|
| `index.html` | The whole page: header, banner, about, menu, gallery, footer, SEO metadata (Open Graph, JSON-LD) |
| `css/` | Bootstrap 3.3.7, Font Awesome 4, normalize, animate.css, `fonts.css` (self-hosted Roboto), `style.css`, `responsive.css`, `colors/orange.css`. The order of the `<link>` tags in `index.html` matters. |
| `js/all.js` | jQuery 3.7.1 + Typer (headline animation) + WOW 1.1.3 (fade-ins) |
| `js/bootstrap.min.js` | Bootstrap 3.4.1 JS (navbar collapse, modal, scrollspy) |
| `js/custom.js` | Smooth scroll, scrollspy, sticky header, nav state, gallery image warm-up, WOW init |
| `fonts/` | Nautilus (headings), Roboto (body), Font Awesome, Glyphicons (gallery zoom icon) |
| `images/` | Full-size photos (used in the gallery pop-ups) |
| `images/thumbs/` | 760 px wide versions for the gallery grid and the about image |
| `images/Menu.pdf` | The menu ("Speisekarte Download") |
| `tools/visual-regression/` | Screenshot capture and pixel-diff scripts (dev only) |

## Common tasks

### Add a gallery photo
1. Put the full-size JPEG (about 1500 px wide is plenty) in `images/`.
2. Create a 760 px wide copy with the same aspect ratio in `images/thumbs/` (same base name, `.jpg`).
3. Copy an existing `gal-item` block in `index.html` and give it the **next unique** `gal-N` id (both `data-target="#gal-N"` and `id="gal-N"`).
4. Set `src`/`srcset` (the `1536w` value is the full image's real pixel width) and a German `alt` text.

### Change opening hours
The hours appear in the footer of `index.html` **and** on the poster image `images/1.jpeg` (about section).
Keep them consistent. Once they're settled, add `openingHoursSpecification` to the JSON-LD block in `<head>`.

### Update the menu
Replace `images/Menu.pdf` (keep the file name). Keep it small: export or compress it for screen use (well under 1 MB).

## Open items (as of 2026-11-09)

1. **Opening hours conflict, left as is for now.** The footer says *Nebensaison: Tue–Sun 12:00–14:30 and 17:00–22:00*,
   but the poster `images/1.jpeg` says *außer Saison: Mon–Thu closed, Fri–Sun 17:00–22:00*.
   Once the owner confirms the correct hours:
   - update the footer and/or the poster
   - add `openingHoursSpecification` to the JSON-LD in `<head>`
2. The poster shows the email as "porto.adria.de"; the correct address is `porto.adria@mail.de`.
3. **Legal (Germany):**
   - Impressum and Datenschutzerklärung are missing.
   - Google Analytics (`G-PEY0WJDTB4`) loads without consent.
   - See `WEBSITE_AUDIT_REPORT.md`, finding S-01.
4. "Developed by: D.P" in the footer links to `#` (no target yet).

## Visual regression check (before merging any change)

The design is approved and must not change. To compare against `master`:

```sh
# 1. serve the current master in one folder (e.g. a git worktree) on port 8766, your branch on 8765
node tools/visual-regression/capture.mjs ./vr-before http://127.0.0.1:8766/
node tools/visual-regression/capture.mjs ./vr-after  http://127.0.0.1:8765/
python tools/visual-regression/diff.py ./vr-before ./vr-after ./vr-diff   # needs Pillow
```

The capture freezes the typed headline, shows WOW elements, loads all lazy images, and shoots 5 widths plus
the sticky header, gallery hover, three pop-ups and the mobile menu. Code-only changes should report `IDENTICAL`.
Image re-encoding shows small (about 1%) differences inside photos only.
