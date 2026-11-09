# Website Audit Report: Restaurant Porto Adria (portoadria.de)

**Audit date:** 2026-11-09
**Scope:** Entire repository at commit `1dc3ec2` (branch `master`) plus the live deployment's HTTP behaviour
**Mode:** Audit only. No project files were modified. This report is the only file added.

**Method**
- Every source file in the repo was read. `js/all.js` and `js/modernizer.js` were broken down by the libraries they bundle.
- The site was served locally and loaded in headless Chrome 1440×900 over the DevTools Protocol. This captured:
  - console errors and failed requests
  - runtime library presence
  - image natural and rendered sizes
  - baseline screenshots at three viewports and in interactive states
- The live site was checked for headers, redirects and 404s using `curl -I`.

---

## 1. Executive Summary

### Overall condition
The site is a single static page built from a purchased ThemeForest template ("Landigoo" by MelodyThemes). It is hosted on GitHub Pages with a custom domain, and it looks polished. Under the surface it carries a lot of unused template code, and that code causes **a JavaScript crash on every page load**. There are also **three real functional bugs in the gallery**, and the page is **far heavier than it needs to be** (about 9.1 MB, of which about 8 MB is images).

For a German business there are also **legal compliance gaps** (no Impressum, no privacy policy, Google Analytics and Google Fonts loaded without consent). These carry more real-world risk than any of the technical issues.

### Strengths
- Simple, robust hosting: static files on GitHub Pages. HTTPS works, and `http://` and `www.` both 301-redirect correctly to `https://portoadria.de/`.
- There is no server, database, form back-end or user input, so the attack surface is minimal.
- Navigation, smooth scrolling, scrollspy, the sticky header, the mobile menu, WOW fade-ins, the "typer" headline and the gallery modals work. They all run *before* the crash point (see F-01).
- `lang="de"`, a meta description, a canonical link, `robots.txt` and `sitemap.xml` are present.
- Phone and email are real `tel:` and `mailto:` links.

### Main weaknesses
1. **JS crash on load.** It disables everything after line 146 of `js/custom.js` (F-01).
2. **Gallery bugs:**
   - one broken modal image (F-02)
   - three thumbnails that open the wrong photo (F-03)
3. **Page weight.**
   - Gallery thumbnails rendered at about 366×350 px are served at 1536×2048 px.
   - Several photos are stored as 600–900 KB PNGs.
   - About 560 KB of unused JavaScript is loaded (P-01, P-02).
4. **Legal and privacy issues:**
   - No Impressum or Datenschutzerklärung.
   - GA4 fires before any consent is given.
   - Google Fonts are hot-linked (S-01, S-02).
5. **Local SEO opportunities are missing:**
   - no `Restaurant` structured data
   - weak title tag
   - misleading keywords
   - broken web manifest and favicon paths (SEO-01 to SEO-06)

### Most important opportunities
| # | Opportunity | Visual impact |
|---|---|---|
| 1 | Fix the gallery modal bugs (F-02, F-03) | Only the intended image appears in the modal |
| 2 | Stop the JS crash *without* activating dormant template features (F-01) | None, if done as described |
| 3 | Resize and recompress gallery images, and lazy-load them (P-01, P-03) | None to Low (verify by pixel diff) |
| 4 | Remove the unused JS libraries (P-02) | None |
| 5 | Add `Restaurant` JSON-LD, fix the title and description, canonical, manifest and favicon (SEO) | None |
| 6 | Self-host the fonts and resolve analytics consent; add Impressum and Datenschutz (S-01, S-02) | Self-hosting: none. Consent banner and legal links: potential visual change, needs client approval |

---

## 2. Technology Stack & Architecture

### Stack (verified at runtime)
| Layer | Technology | Where | Actually used by the page? |
|---|---|---|---|
| Markup | One `index.html` (782 lines) with an XHTML 1.0 Transitional doctype | `index.html` | Yes |
| CSS framework | Bootstrap 3.3.7 | `css/bootstrap.min.css` (145 KB) | Yes (grid, navbar, modal) |
| Theme CSS | Landigoo `style.css`, which `@import`s 9 more files and 2 Google Fonts | `css/style.css`, `css/responsive.css`, `css/colors/orange.css` | Partly (see A-03) |
| JS bundle | `all.js` (423 KB) | `js/all.js` | See below |
| | Typer (headline animation) | `js/all.js:17-130` | **Used** |
| | jQuery 2.1.3 | `js/all.js:10` | **Used** |
| | Owl Carousel | `js/all.js:~150` | Not used (no `#owl-demo`) |
| | Slick 1.5.9 | `js/all.js:~1440` | Not used (no `.slider-*`) |
| | Masonry 4.2.0, Outlayer, EvEmitter, Fizzy UI utils | `js/all.js:1460-3950` | Not used |
| | imagesLoaded 4.1.4 | `js/all.js:4067` | Not used |
| | WOW 1.1.3 | `js/all.js:4447` | **Used** (fade-ins) |
| | bootstrap-datetimepicker 4.15.35 | `js/all.js:4474` | Not used, and **throws on load** |
| | mCustomScrollbar, jquery-mousewheel, bootstrap-select | `js/all.js:6940+` | Never initialised (the bundle aborts before reaching them) |
| Bootstrap JS | Bootstrap 3.3.7 | `js/bootstrap.min.js` | **Used** (collapse, modal, scrollspy) |
| "Modernizer" | Modernizr 2.7.2 **plus Moment.js 2.20.1** (140 KB) | `js/modernizer.js` | Not used. No CSS depends on Modernizr classes, and nothing needs Moment except the unused date picker. |
| Site JS | Template init script | `js/custom.js` | Partly (see F-01) |
| Fonts | Google Fonts Roboto (5 weights) and Paprika; self-hosted Nautilus, FontAwesome 4, Glyphicons, Flaticon | `css/style.css:38-39,59-63` | Roboto, Nautilus, FontAwesome and Glyphicons are used. **Paprika and Flaticon are never used.** |
| Analytics | Google Analytics 4 (`gtag.js`, 177 KB) | `index.html:53-60` | Yes |
| Hosting | GitHub Pages with a custom domain | `CNAME` | Yes. `Cache-Control: max-age=600`; you cannot set your own headers. |
| Build, tests, linting | **None** | (none) | (none) |

### Architecture
- **Routing:** a single page using in-page anchors (`#banner`, `#about`, `#menu`, `#gallery`, `#footer`). The menu is a PDF download (`images/Menu.pdf`).
- **Data:** everything is hardcoded in `index.html`: opening hours, address, phone, gallery list and alt texts. There are no API calls, forms or authentication.
- **Components:** none. Repetition is done by copy-paste. Each of the 22 gallery items carries its own full Bootstrap modal (`index.html:218-655`, about 440 lines).
- **Environment and config:** no env vars and no secrets. The GA measurement ID is public by design. `.vscode/settings.json` only sets a Live Server port.

### Implementation assessment
**Works well:**
- No build step, so there is nothing to break at deploy time.
- Bootstrap 3 behaviour is stable.
- The visual layer (CSS) is consistent.

**Weaknesses:**
- About 70% of the shipped JS and a large share of the CSS belong to template sections that were removed from the HTML: team, blog, pricing, reservations, color switcher, carousel and tabbed menu.
- That dead code is what causes the crash.
- Copy-pasted modals caused the ID bugs.

---

## 3. Findings by Category

Finding IDs:
- **F** = functionality
- **P** = performance
- **SEO** = SEO
- **A** = architecture / maintainability
- **AC** = accessibility
- **S** = security / privacy / legal

---

### Functionality & UX

#### F-01: Script-loading order throws an exception on every page load and silently disables the second half of `custom.js`
- **Category:** Functionality / Reliability
- **Current implementation:**
  1. `js/all.js` contains bootstrap-datetimepicker. When it evaluates (`js/all.js:4494-4496`) it executes `throw 'bootstrap-datetimepicker requires Moment.js to be loaded first'`.
  2. Moment.js is bundled inside `js/modernizer.js`, which `index.html:779` loads *last*.
  3. The throw aborts the rest of `all.js`, so mCustomScrollbar and bootstrap-select are never registered.
  4. `custom.js:146` then calls `$('#date-picker').datetimepicker(...)`, which throws `TypeError: $(...).datetimepicker is not a function`.
  5. That aborts the rest of `custom.js`.
- **Verified in Chrome:** two uncaught exceptions on load. The runtime check showed `jQuery.fn.datetimepicker === undefined`, `jQuery.fn.parallax === undefined`, and that the `.scrollup` button stays `display:none` after scrolling 1200 px.
- **Code in `custom.js` that never runs:**
  - lines 158–308: selectpicker, the preloader hook, the **scroll-to-top button** (176–187), the color switcher, the **banner parallax** (219–271) and the template contact-form handler
- **Code that does run (lines 1–145):**
  - smooth scroll, scrollspy, sticky header, nav active state, WOW
- **Problem:**
  - Any real JS error from future code is buried among these errors.
  - Anyone who "fixes" the load order will **switch on two visual features the client has never seen**:
    - a scroll-to-top arrow (`.scrollup`, `css/style.css:245-259`)
    - a JS parallax shift of the banner background
- **Important:** the approved design is the version in which the scroll-up button and the JS parallax are **inactive**.
- **Recommended solution:** delete the dead initialisers instead of fixing the load order. Specifically:
  - Remove the datetimepicker, selectpicker, owl, slick, preloader, color-panel, color-switcher, scrollup, parallax and contact-form blocks from `custom.js`.
  - Keep smooth scroll, scrollspy, sticky header, nav active state and WOW unchanged.
  - Also remove `<a href="#" class="scrollup">` (`index.html:770`). It is `display:none` today and will stay invisible.
  - If the client *wants* the scroll-up arrow or parallax, treat that as a separate, approved design change.
- **Affected files:** `js/custom.js` (lines 58–308), `js/all.js`, `js/modernizer.js`, `index.html:770,774-779`
- **Expected benefit:** a clean console, no wasted execution, and real errors become visible.
- **Visual impact:** **None** if done as described. **Potential visual change** if fixed by reordering scripts.
- **Complexity:** Low

#### F-02: "Cevapi" gallery modal shows a broken image (404)
- **Category:** Functionality
- **Current implementation:**
  - Thumbnail: `index.html:277` uses `images/cevapi.jpg`.
  - Modal: `index.html:285` uses `images/portoGallery3.png`, which **does not exist** in the repo. A 404 was observed in Chrome.
- **Problem:** clicking the cevapi photo opens an empty or broken-image modal.
- **Recommended solution:** change the modal `src` to `images/cevapi.jpg`, the same photo as the thumbnail.
- **Affected files:** `index.html:285`
- **Expected benefit:** the modal works, and one 404 request disappears.
- **Visual impact:** Low risk. The modal now shows the intended photo. Confirm with the client that this is the intended image.
- **Complexity:** Low

#### F-03: Four gallery modals share `id="24"`, so three garden photos open the wrong image
- **Category:** Functionality
- **Current implementation:** the triggers at `index.html:585, 603, 621, 639` all use `data-target="#24"`, and the modals at `index.html:588, 606, 624, 642` all have `id="24"`.
- **Verified in Chrome:** clicking the `portoGarden2.png` thumbnail opened the `portoGarden.png` modal.
- **Problem:**
  - The thumbnails `portoGarden1.png`, `portoGarden2.png` and `portoGarden3.jpeg` always show `portoGarden.png`.
  - The HTML is invalid because the IDs are duplicated.
- **Recommended solution:** give each modal a unique ID (for example 25, 26, 27, or better, descriptive IDs like `gal-garden-2`) and update each `data-target`.
- **Affected files:** `index.html:583-654`
- **Expected benefit:** correct photos in the modals, and valid HTML.
- **Visual impact:** None to the page. Each modal now shows the clicked photo.
- **Complexity:** Low

#### F-04: "Developed by: D.P" link opens a duplicate tab of the site
- **Category:** UX
- **Current implementation:** `index.html:755-756` is `<a href="#" target="_blank">`.
- **Problem:** clicking it opens the same page in a new tab.
- **Recommended solution:** either point it at the developer's real URL, or drop `target="_blank"` so the click does nothing harmful. Keep the `<a>` element and its `href`; removing `href` could change hover/link styling.
- **Affected files:** `index.html:755-756`
- **Visual impact:** None
- **Complexity:** Low

#### F-05: Menu PDF is forced to download under an extension-less name and is 2.3 MB
- **Category:** UX / Performance
- **Current implementation:** `index.html:193` is `<a href="images/Menu.pdf" download="Menü">`. `images/Menu.pdf` is 2,314,787 bytes.
- **Problem:**
  - On mobile, a forced download is worse than opening the PDF in the browser's viewer.
  - The suggested filename has no `.pdf` extension. Browsers usually infer it, but not all download managers do.
  - 2.3 MB on mobile data is heavy for a text menu.
- **Recommended solution:**
  - Use `download="Speisekarte-Porto-Adria.pdf"`.
  - Recompress the PDF by downsampling embedded images (for example with Ghostscript `/ebook`). It should usually land well under 1 MB.
  - Optionally drop `download` so the PDF opens in the viewer. That is a behaviour change, so ask the client.
- **Affected files:** `index.html:193`, `images/Menu.pdf`
- **Visual impact:** None on the page.
- **Complexity:** Low

#### F-06: Typos in visible copy and in the displayed phone number
- **Category:** Content (requires client approval; listed only)
- **Problems:**
  - `index.html:114`: the typer word is `Kolegen` (should be `Kollegen`). It is visible as the headline cycles.
  - `index.html:706`: the phone number is displayed as `+4943 529549029`. The digits are correct (Waabs area code 04352), but the grouping is misleading. The correct grouping is `+49 4352 9549029`. The `tel:` link itself is correct.
  - Non-visible alt texts also contain typos (see SEO-05).
- **Visual impact:** Potential visual change (the text changes). Needs approval.
- **Complexity:** Low

---

### Performance

Baseline measured locally:
- 58 requests
- about **9.1 MB transferred** (uncompressed; GitHub Pages gzips text)
- Images: 8.06 MB
- JS: 786 KB, including gtag at 177 KB
- CSS: 311 KB
- Fonts: 154 KB

#### P-01: Gallery images are 4–30× larger than displayed; photos stored as PNG
- **Category:** Performance (LCP, bandwidth, mobile data)
- **Current implementation:**
  - Thumbnails render at 366×350 px (or 738×350 px for the two wide tiles) on desktop.
  - Sources are 1536×2048 JPEGs (about 150–270 KB each).
  - Several photos are **PNG files of camera photos**:
    - `portoGalerry.png` 695 KB
    - `portoGallery2.png` 803 KB
    - `portoGallery4.png` 617 KB
    - `portoGarden.png` 865 KB
    - `portoGarden1.png` 710 KB
    - `portoGarden2.png` 344 KB
  - The about image `1.jpeg` is 1145×1374 at 218 KB and renders at 350×416.
- **Problem:** about 7 MB of image data loads to show tiles that are about 0.35 MP each.
- **Recommended solution:**
  1. Re-encode the PNG photos as high-quality JPEG (q≈82) or WebP at the same pixel dimensions. Keep the same filenames, or update the `src`.
  2. Create thumbnail variants at about 2× display size (for example 760×700 px, and 1480×700 for the wide tiles) for the grid `<img>`.
  3. Keep larger versions (for example a 1600 px long edge) for the modal `<img>`.
  4. Use `srcset`/`sizes` on the grid images so phones get smaller files.
- **Why the look is unchanged:**
  - `object-fit: cover` (`css/style.css:961-966`) crops to the same box regardless of source size.
  - The aspect ratios stay the same, so the crop is identical.
- **Affected files:** `index.html:218-655` (grid and modal `<img>`), `images/portoGa*`, `images/portoGarden*`, `images/1.jpeg`, `images/dno.jpg`, `images/cevapi.jpg`
- **Expected benefit:** page weight drops by roughly 5–6 MB, with much faster load on mobile.
- **Visual impact:** Low risk. Lossy re-encoding can shift fine detail slightly. Verify with a pixel-diff at a tolerance of about 1–2% and an eyeball check at 2× DPR. **Never change aspect ratio or crop.**
- **Complexity:** Medium (one-off asset work)

#### P-02: About 560 KB of unused JavaScript is shipped and parsed
- **Category:** Performance / Maintainability
- **Current implementation:**
  - `all.js` (423 KB) bundles owl, slick, masonry/outlayer, imagesLoaded, datetimepicker, mCustomScrollbar, mousewheel and bootstrap-select. None are used.
  - `modernizer.js` (140 KB) is Modernizr plus Moment. Neither is used: no CSS selector depends on Modernizr classes, and Moment only serves the unused date picker.
- **Problem:** download, parse and execution cost on every visit, plus the F-01 crash.
- **Recommended solution:**
  - Replace `all.js` with only what is used: jQuery, the Typer snippet (`all.js:17-130`) and WOW 1.1.3.
  - Keep `bootstrap.min.js`.
  - Drop the `modernizer.js` `<script>`.
  - Optionally upgrade jQuery to 3.7.x in the same phase. If so, quote the selector at `custom.js:16`: `a[href*="#"]:not([href="#"])`. The unquoted form is invalid in jQuery ≥ 1.12/3 and would throw.
  - Bootstrap 3.3.7 JS requires jQuery < 4. jQuery 3.7 is supported.
- **Affected files:** `js/all.js`, `js/modernizer.js`, `js/custom.js:16`, `index.html:774-779`
- **Expected benefit:** about 560 KB less JS, faster time-to-interactive, and fewer vulnerable library versions (S-03).
- **Visual impact:** None. Typer, WOW, the modals, collapse and scrollspy stay identical. Verify the typer cadence and WOW fade-ins.
- **Complexity:** Low–Medium

#### P-03: All 22 gallery images load eagerly; images have no intrinsic dimensions
- **Category:** Performance (LCP, CLS)
- **Current implementation:**
  - No `loading="lazy"` anywhere.
  - No `width`/`height` attributes on gallery images. The `.box` has a fixed 350 px height, so the layout does not shift.
- **Problem:** about 7 MB of below-the-fold images compete with the banner and fonts on first load.
- **Recommended solution:**
  - Add `loading="lazy"` and `decoding="async"` to every gallery `<img>` (grid and modal) and to the about image.
  - Keep the header logo eager.
- **Affected files:** `index.html:168, 222-648`
- **Visual impact:** None once loaded. Tiles show the light-grey section background until their image arrives, the same as on a slow connection today.
- **Complexity:** Low

#### P-04: Render-blocking CSS waterfall through `@import`
- **Category:** Performance (FCP)
- **Current implementation:**
  - `style.css:38-54` `@import`s two Google Fonts stylesheets and nine local CSS files.
  - The browser discovers them only after `style.css` downloads, which creates a sequential waterfall before first paint.
- **Recommended solution:**
  - Concatenate the imported files into `style.css`, or into one prebuilt CSS file, **in exactly the current order**. Order matters: `normalize.css` is imported after Bootstrap and overrides it, and `animate.min.css` drives the WOW fade-ins.
  - Remove the unused **Paprika** font import (`style.css:38`). No `font-family` uses it.
- **Affected files:** `css/style.css:38-54` and the imported CSS files
- **Visual impact:** None if the order is preserved. **Do not drop `normalize.css`**: it changes base styles after Bootstrap.
- **Complexity:** Low

#### P-05: Fonts: no `font-display`, unused fonts, legacy formats
- **Category:** Performance
- **Current implementation:**
  - Roboto is loaded in 5 weights from Google with no `&display=` parameter, so the browser default (block) applies.
  - Flaticon is declared but never used: the "unloaded" status was observed at runtime, and the HTML has no `flaticon-*` classes.
  - FontAwesome/Glyphicons ship EOT, SVG and TTF fallbacks. Browsers only fetch WOFF/WOFF2, so those files cost nothing at runtime but bloat the repo.
- **Recommended solution:**
  - Self-host Roboto (see S-02) and preload the two most important WOFF2 files: Roboto 400 and Nautilus.
  - Remove the Flaticon `@import` (`style.css:49`).
  - Check which Roboto weights are really used. The runtime showed 400, 500 and 700 loading, with 300 and 900 unused above the fold. Do not remove a weight without a full-page visual diff.
- **Visual impact:**
  - Self-hosting with the same files: None.
  - Adding `font-display: swap`: **potential visual change during loading only** (a brief fallback-font flash). Leave the current blocking behaviour unless the client approves.
- **Complexity:** Low

#### P-06: Scroll handlers run jQuery work on every scroll event
- **Category:** Performance (INP / jank on low-end mobile)
- **Current implementation:**
  - `custom.js:38-44` calls `addClass`/`removeClass` on every scroll event.
  - WOW and scrollspy also listen to scroll.
- **Recommended solution:** toggle the class only when the state changes, and use a passive listener. The behaviour stays identical.
- **Affected files:** `js/custom.js:38-44`
- **Visual impact:** None
- **Complexity:** Low

#### P-07: Banner uses `background-attachment: fixed`
- **Category:** Performance (flagged only, not recommended to change)
- **Current implementation:** `css/style.css:399`
- **Problem:**
  - Fixed backgrounds force a repaint on scroll on many mobile browsers.
  - iOS Safari ignores the rule entirely, so mobile already differs from desktop.
- **Recommendation:** **Do not change.** Any alternative changes the visual scroll behaviour. This is listed for awareness only.
- **Visual impact:** Potential visual change if touched.

#### P-08: Preload the LCP image
- **Category:** Performance
- **Current implementation:** the banner (`images/banner.jpg`, 136 KB) is a CSS background. The browser discovers it only after `style.css` is parsed.
- **Recommended solution:** add `<link rel="preload" as="image" href="images/banner.jpg">` in `<head>`.
- **Visual impact:** None
- **Complexity:** Low

---

### SEO

#### SEO-01: No `Restaurant` structured data
- **Category:** SEO (local)
- **Current implementation:** none.
- **Recommended solution:** add one `<script type="application/ld+json">` block. Use only data already published on the page:
  - `@type: Restaurant`
  - `name`
  - `address`: Dorfstraße 21, 24369 Waabs, DE
  - `telephone`: +49 4352 9549029
  - `email`
  - `servesCuisine`: Balkan
  - `hasMenu`: the PDF URL
  - `image`
  - `url`
  - `sameAs`: the Instagram URL
  - `openingHoursSpecification` for the off-season and main-season hours
- **Note:** the hours exist in two places (HTML and JSON-LD). Keep them in sync whenever the hours change.
- **Affected files:** `index.html` `<head>`
- **Expected benefit:** eligibility for rich results and better matching for "restaurant Waabs"-type local queries.
- **Visual impact:** None
- **Complexity:** Low

#### SEO-02: Title and meta description are generic and lack location; the keywords meta is misleading
- **Category:** SEO
- **Current implementation:**
  - `<title>Restaurant Porto Adria</title>` (`index.html:16`).
  - The description (`index.html:20-22`) is about 290 characters long, so it is truncated in search results, and it has no location.
  - `meta keywords` (`index.html:17-18`) lists "mexican restaurants, italian restaurants", which do not apply.
- **Recommended solution:**
  - Title, for example: "Restaurant Porto Adria in Waabs – Balkanküche, Steaks & Fisch".
  - Description: about 150 characters, including Waabs and the cuisine.
  - Remove `meta keywords`. Google ignores it, and the current values are wrong.
- **Visual impact:** None on the page (only the browser tab and search snippet). Copy needs client approval.
- **Complexity:** Low

#### SEO-03: Canonical URL and sitemap disagree; sitemap is stale; robots lacks the sitemap
- **Category:** SEO
- **Current implementation:**
  - The canonical is `https://portoadria.de/index.html` (`index.html:25`).
  - The sitemap lists `https://portoadria.de/` with `lastmod` 2024-05-03.
  - `robots.txt` has no `Sitemap:` line.
- **Recommended solution:**
  - Set the canonical to `https://portoadria.de/`.
  - Update `lastmod` on each content change.
  - Add `Sitemap: https://portoadria.de/sitemap.xml` to `robots.txt`.
  - The header logo link (`index.html:80`, `href="index.html"`) can point to `./` so internal links match the canonical.
- **Visual impact:** None
- **Complexity:** Low

#### SEO-04: No Open Graph or Twitter metadata
- **Category:** SEO / social sharing
- **Problem:** links shared on WhatsApp, Facebook or Instagram get no image or title preview. That matters for a restaurant.
- **Recommended solution:** add `og:title`, `og:description`, `og:image` (for example `banner.jpg` or a 1200×630 crop), `og:url`, `og:type=restaurant.restaurant`, `og:locale=de_DE` and `twitter:card=summary_large_image`.
- **Visual impact:** None
- **Complexity:** Low

#### SEO-05: Alt text quality
- **Category:** SEO / Accessibility
- **Problems:**
  - `index.html:81` uses `alt="Logo"`. It should be `Porto Adria`.
  - `index.html:168` uses `alt="About Main Image"`, which is English and meaningless.
  - `index.html:222,231` reads "geggtilltem" (should be "gegrilltem").
  - Lower-case nouns: "soßen", "zwiebel", "pommes".
  - `index.html:568-648`: "Restaurant garden" in English, repeated four times, on a German page.
  - The footer logo uses `alt="logo"`.
- **Recommended solution:** write specific German alt texts, for example "Terrasse des Restaurants Porto Adria am Abend".
- **Visual impact:** None
- **Complexity:** Low

#### SEO-06: Broken web manifest and root favicon
- **Category:** SEO / PWA hygiene
- **Current implementation:**
  - `images/site.webmanifest` has empty `name`/`short_name`, and icon paths `/android-chrome-*.png`. The icons actually live in `/images/`; **404 confirmed on the live site**.
  - `https://portoadria.de/favicon.ico` returns **404 on the live site**. Browsers and Google request it.
  - `images/favicon.ico` and `images/favico.ico` exist but are not referenced.
- **Recommended solution:**
  - Fix the manifest paths to `/images/android-chrome-*.png` and fill in `name`: "Restaurant Porto Adria".
  - Add `<link rel="icon" href="images/favicon.ico" sizes="any">`, or copy `favicon.ico` to the root.
  - Make the apple-touch-icon path consistent. It is absolute at `index.html:28`; the others are relative.
- **Visual impact:** None on the page.
- **Complexity:** Low

#### SEO-07: Heading hierarchy
- **Category:** SEO / Accessibility
- **Current implementation:**
  - H1 (with the animated typer), then H2 "Genuss aus dem Balkan", then section H2s, the H3 "PORTO ADRIA", footer H3s, and an **H6 for the copyright**.
  - The hierarchy is acceptable overall. The H6 copyright is semantically wrong.
- **Recommendation:** leave it. Changing the tag would change styles that target `h6`/`.copy-title`.
- **Visual impact:** Potential visual change if changed. **Not recommended.**

---

### Accessibility

#### AC-01: Zoom is disabled
- **Current implementation:** `index.html:13` sets `maximum-scale=1, user-scalable=0`. This fails WCAG 1.4.4.
- **Recommended solution:** `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- **Visual impact:** None at default zoom (layout width and initial scale are unchanged). Users can pinch-zoom.
- **Complexity:** Low

#### AC-02: Icon-only and empty links have no accessible name
- **Current implementation:**
  - The Instagram link (`index.html:685-688`) contains only an `<i>` icon.
  - The scroll-hint link (`index.html:117-119`) contains only an empty `<div class="mouse">`.
  - The gallery trigger links rely on the image alt, which is fine.
- **Recommended solution:**
  - Add `aria-label="Porto Adria auf Instagram"` and `rel="noopener noreferrer"` to the Instagram link, and `aria-hidden="true"` to its icon.
  - Add `aria-label="Weiter zu Über uns"` to the scroll-hint link.
- **Visual impact:** None
- **Complexity:** Low

#### AC-03: Focus indicators are removed
- **Current implementation:** `outline: none` at `css/style.css:77, 156, 162, 972, 1025` (including the gallery links and the modal close button).
- **Problem:** keyboard users cannot see where focus is (WCAG 2.4.7).
- **Recommended solution:** add a `:focus-visible` outline. It appears only for keyboard focus, never for mouse or touch.
- **Visual impact:** **Potential visual change** (keyboard focus only). Needs client sign-off on the outline style.
- **Complexity:** Low

#### AC-04: Gallery modals lack labelling; the close label is in English
- **Current implementation:** `role="dialog"` with no `aria-labelledby`/`aria-label`, and `aria-label="Close"` on a German page.
- **Recommended solution:**
  - Add `aria-label` (the image description) to each `.modal`.
  - Change the close button to `aria-label="Schließen"`.
  - Bootstrap 3 already traps focus reasonably and returns it on close.
- **Visual impact:** None
- **Complexity:** Low (trivial once the modals are consolidated, A-01)

#### AC-05: Auto-cycling headline
- **Current implementation:** the typer in the H1 (`index.html:113-115`) cycles forever.
- **Problems:**
  - Screen readers may read partial words.
  - WCAG 2.2.2 (Pause, Stop, Hide) applies to auto-updating content.
- **Recommended solution:**
  - Add a visually hidden full sentence for assistive technology, and `aria-hidden="true"` on the animated spans.
  - Optionally stop the animation under `prefers-reduced-motion: reduce`. That changes the visual for those users only, so it needs approval.
- **Visual impact:** None for the first part.
- **Complexity:** Low

#### AC-06: Menu download link gives no file information
- **Recommended solution:** add `aria-label="Speisekarte herunterladen (PDF)"`.
- **Visual impact:** None

---

### Security, Privacy & Legal

#### S-01: No Impressum or Datenschutzerklärung; Google Analytics loads without consent
- **Category:** Legal / Privacy (P0 business risk)
- **Current implementation:**
  - `index.html:53-60` loads GA4 immediately, which sets cookies and sends the IP to Google.
  - There is no consent mechanism.
  - The site has no Impressum and no privacy policy (`/impressum.html` returns 404; no links on the page).
- **Problem:** a commercial German website generally needs:
  - an Impressum (§ 5 DDG)
  - a privacy policy (GDPR Art. 13)
  - consent before non-essential cookies or tracking (§ 25 TDDDG)

  Missing these creates warning-letter (*Abmahnung*) risk. This is not legal advice; the client should confirm with a lawyer or a generator service.
- **Recommended solution (choose with the client):**
  - **Option A, no visual change:** remove GA, or switch to a cookieless, consent-free analytics tool. Then publish Impressum and Datenschutz as separate pages, linked from the footer.
  - **Option B:** keep GA behind a consent banner.
- **Affected files:** `index.html:53-60`, the footer (`index.html:751-763`), new pages
- **Visual impact:**
  - Removing GA: none.
  - Footer links and a consent banner: **potential visual change**. The design must be approved. One way to minimise the impact is to add the links inside the existing copyright line, in its existing style.
- **Complexity:** Low–Medium

#### S-02: Google Fonts hot-linked from Google's servers
- **Category:** Privacy / Performance
- **Current implementation:** `css/style.css:38-39` loads Google Fonts, which transmits visitor IPs to Google. LG München I (20.01.2022, 3 O 17493/20) found this to be a GDPR violation.
- **Recommended solution:**
  - Self-host the exact Roboto WOFF2 files and weights in `/fonts` with an equivalent `@font-face` (same family name, weights and unicode ranges).
  - Remove Paprika entirely, since it is unused.
- **Visual impact:** None if the same font files are used. Verify glyph rendering with a pixel diff.
- **Complexity:** Low

#### S-03: Outdated client libraries with published CVEs
- **Category:** Security (dependency hygiene)
- **Libraries:**
  - jQuery 2.1.3: CVE-2015-9251, CVE-2019-11358, CVE-2020-11022, CVE-2020-11023
  - Bootstrap 3.3.7: CVE-2018-14040/14041/14042 and CVE-2019-8331 (data-attribute XSS)
  - Moment 2.20.1: CVE-2022-31129 (ReDoS)
- **Exploitability here:** **low**. The site has no user input, no URL-driven rendering, and no attacker-controlled `data-*` attributes. These still show up in every automated scan and pentest report, and they lock the project into old APIs.
- **Recommended solution:**
  - Remove Moment and the unused plugins (P-02).
  - Upgrade jQuery to 3.7.x after quoting the selector at `custom.js:16`.
  - Bootstrap 3.4.1 fixes the Bootstrap 3 XSS CVEs and is a drop-in replacement. Its CSS changed slightly, so **if upgrading Bootstrap CSS, run a full visual diff**. Upgrading only the JS is lower risk.
- **Affected files:** `js/all.js`, `js/bootstrap.min.js`, `js/modernizer.js`, `css/bootstrap.min.css`
- **Visual impact:**
  - jQuery or JS-only upgrades: None.
  - Bootstrap CSS upgrade: Low risk (verify).
- **Complexity:** Low–Medium

#### S-04: Dead code with an injection sink, and requests to a dead CDN
- **Current implementation:**
  - `custom.js:277-305` (the template contact form) writes a server response into `innerHTML`. It is never reached and there is no form, but it is a latent sink for future copy-paste.
  - `index.html:44-47` references `oss.maxcdn.com` (shut down) inside IE<9 conditional comments.
- **Recommended solution:** delete both.
- **Visual impact:** None
- **Complexity:** Low

#### S-05: No Content-Security-Policy; GitHub Pages cannot set headers
- **Current implementation:** the live response headers show no CSP, `X-Content-Type-Options` or `Referrer-Policy`.
- **Recommendation:**
  - Optionally add `<meta http-equiv="Content-Security-Policy">` once the inline gtag script is gone or hashed, and `<meta name="referrer" content="strict-origin-when-cross-origin">`.
  - Low priority for a static brochure site.
  - If header control becomes important, host on Netlify or Cloudflare Pages. That is not required now.
- **Visual impact:** None
- **Complexity:** Low

#### S-06: Email address in plain text
- `porto.adria@mail.de` (`index.html:711`) is harvestable by spam bots. This is optional and minor; obfuscation adds complexity. **No change recommended** unless spam becomes a problem.

No secrets, keys or credentials were found in the repository. The GA measurement ID is public by design.

---

### Architecture & Maintainability

#### A-01: 22 copy-pasted modals (about 440 lines)
- **Current implementation:** each gallery item contains its own full `.modal` with the image `src` repeated. This copy-paste caused F-02 and F-03.
- **Recommended solution, in two steps:**
  1. **Minimum, lowest risk:** fix the IDs (F-03) and keep the structure.
  2. **Better:** keep the grid markup and add **one** modal per gallery. Populate its `<img src/alt>` from the clicked thumbnail with about 10 lines of jQuery on Bootstrap's `show.bs.modal` event. The modal must remain *inside* `.gal-item`/`.gal-container`, because the CSS selectors `.modal-open .gal-item button.close` and `.gal-container .modal.fade .modal-dialog` (`style.css:998-1075`) depend on that ancestry. Keep the modal inside a `.gal-item` wrapper, or duplicate the selectors under the new ancestor.
- **Expected benefit:** about 400 fewer lines, smaller DOM, and adding a photo becomes a single `<div>`.
- **Visual impact:** Low risk. The modal zoom animation and close-button position depend on the CSS ancestry described above. Verify the open, close and animation states.
- **Complexity:** Medium

#### A-02: Template dead weight in the repository
- **Unused images (not referenced anywhere):**
  - `newImage.jpg`
  - `sos.jpg`
  - `special-menu.jpeg`
  - `portoGallery1.png` (949 KB)
  - `portoadria-qr-code.png` (presumably printed material; keep the source somewhere)
  - `favico.ico`
- `special-menu.jpg` is referenced only in commented-out HTML.
- **Unused CSS files:** `css/colors/strong-blue.css`, `moderate-green.css`, `vivid-yellow.css`, `owl.*.css`, `slick.css`, `bootstrap-datetimepicker.css`, `bootstrap-select.min.css`, `flaticon.css`, and the matching fonts.
- **Images referenced only by unused CSS:** `full-bg.png`, and `team_bg.jpg`, `blog_bg.jpg`, `newsletter-bg.jpg`, `loader-animation.gif`, which do not exist (they are referenced by dead CSS at `style.css:235, 808, 1085, 1362`).
- **Unused JS:** see P-02.
- **Recommended solution:** remove these after confirming with the client that the QR code and special-menu images aren't needed. Move the QR source out of the deployed folder if it is still needed.
- **Visual impact:** None for the files. Removing CSS imports is covered by P-04 and A-03.
- **Complexity:** Low

#### A-03: About half of `style.css` styles template sections that no longer exist
- **Current implementation:** the TEAM (804–936), BLOG (1081–1209), PRICING (1210–1341) and COLOR SWITCHER (1629+) areas, the reservations styles, and the `#mhead`/`#loader` rules.
- **Recommended solution:**
  - Remove dead rule blocks only with evidence: use Chrome DevTools *Coverage* on all viewports and states, followed by a screenshot diff.
  - Also fix the broken URL `url(..images/footer_background.jpg)` at `style.css:1470`. It is a `-moz-` prefixed duplicate that is overridden anyway; delete that line.
- **Visual impact:** Low risk. Unused selectors can't render, but shared selectors such as `.block-title` and `.title-caption` may live inside those sections. **Diff required.**
- **Complexity:** Medium

#### A-04: Invalid or dead class `co-xs-12` on gallery items
- **Current implementation:** every `.gal-item` has `co-xs-12`, a typo for `col-xs-12`, so the class does nothing.
- **Recommendation:** **do not "fix" this to `col-xs-12`.** That would add `float:left; width:100%` on phones and could change the mobile gallery layout that the client approved. Optionally delete the meaningless class.
- **Visual impact:** Potential visual change if corrected to `col-xs-12`. None if deleted.

#### A-05: XHTML 1.0 Transitional doctype
- **Current implementation:** `index.html:1-4`. A Transitional doctype with a system identifier puts browsers in **"almost standards" mode**, not full standards mode.
- **Problem:** the markup is HTML5 in practice, and validators flag it.
- **Recommendation:** switching to `<!DOCTYPE html>` changes the rendering mode. The main difference is how images inside table cells size line boxes, and `.banner-text` uses `display: table`. **Treat this as a potential visual change.** Do it only with a full visual diff at all viewports, or leave it.
- **Visual impact:** Potential visual change
- **Complexity:** Low (but verification is required)

#### A-06: No project documentation, `.gitignore` or regression safety net
- **Recommended solution:**
  - Add a short `README.md` covering how to run the site locally, how to deploy (push to `master`, GitHub Pages), where the opening hours live (HTML and JSON-LD), and how to add a gallery photo.
  - Add a `.gitignore`.
  - Add a minimal visual-regression script in a dev-only folder that is not deployed (Playwright with `toHaveScreenshot`), driven by the checklist in section 7.
- **Visual impact:** None
- **Complexity:** Low

---

## 4. Priority Classification

| Priority | ID | Finding | Effort | Benefit |
|---|---|---|---|---|
| **P0** | S-01 | Impressum, Datenschutz and analytics consent (legal) | Low–Med | Very high (legal risk) |
| **P0** | F-03 | Three garden thumbnails open the wrong photo | Low | High |
| **P0** | F-02 | Cevapi modal shows a broken image | Low | High |
| **P0** | F-01 | JS crash on every load (fix by deleting dead code, **not** by reordering scripts) | Low | High |
| **P1** | P-01 | Oversized and PNG gallery images (about 5–6 MB savings) | Medium | Very high |
| **P1** | P-02 | Remove about 560 KB of unused JS | Low–Med | High |
| **P1** | S-02 | Self-host Google Fonts (GDPR) | Low | High |
| **P1** | P-03 | Lazy-load gallery images | Low | High |
| **P1** | SEO-01 | Restaurant JSON-LD | Low | High |
| **P1** | SEO-02 | Title and description with location; remove misleading keywords | Low | High |
| **P1** | AC-01 | Re-enable pinch zoom | Low | Medium |
| **P2** | S-03 | Upgrade jQuery and Bootstrap JS; remove Moment | Low–Med | Medium |
| **P2** | SEO-03/04/06 | Canonical, robots, sitemap, Open Graph, manifest and favicon | Low | Medium |
| **P2** | P-04/P-05/P-08 | CSS `@import` waterfall, unused fonts, LCP preload | Low | Medium |
| **P2** | F-05 | Menu PDF size and filename | Low | Medium |
| **P2** | A-01 | Consolidate the modals | Medium | Medium |
| **P2** | AC-02/04/05/06 | Accessible names, modal labels, typer for screen readers | Low | Medium |
| **P2** | SEO-05 | Alt text quality | Low | Medium |
| **P3** | A-02/A-03 | Remove dead assets and CSS | Low–Med | Low–Med |
| **P3** | F-04, S-04, S-05, P-06 | Credit link, dead sinks, CSP/referrer meta, scroll handler | Low | Low |
| **P3** | AC-03 | Focus-visible styles (needs design approval) | Low | Medium (a11y) |
| **P3** | A-06 | README, `.gitignore`, visual-regression script | Low | Medium (long-term) |
| Approval needed | F-06, A-05 | Copy typos, phone grouping, doctype switch | Low | Low |
| **Do not change** | P-07, A-04, SEO-07 | Fixed banner background, `co-xs-12` → `col-xs-12`, H6 copyright | (none) | (none) |

---

## 5. Quick Wins
All of these are low effort, have a real benefit, and have **no visual impact**:

1. Fix the cevapi modal `src` (`index.html:285`) and make the four `id="24"` modals unique (`index.html:583-654`).
2. Delete the dead initialisers in `custom.js` (lines 58–135 and 140–308, keeping the WOW init) and the `.scrollup` anchor. The console becomes clean and nothing visible changes.
3. Add `loading="lazy" decoding="async"` to the gallery and about images.
4. Remove the unused Paprika (`style.css:38`) and Flaticon (`style.css:49`) imports.
5. Add `Restaurant` JSON-LD and Open Graph tags.
6. Fix the canonical (`/`), add `Sitemap:` to `robots.txt`, and update `lastmod`.
7. Fix the manifest icon paths and name, and add a favicon `<link>`.
8. Remove `meta keywords`.
9. Viewport meta: allow zoom.
10. Add `aria-label`s (Instagram, scroll hint, modals, PDF link) and use `Schließen` instead of `Close`.
11. Add `rel="noopener noreferrer"` to the Instagram link, and remove `target="_blank"` from the `href="#"` credit link.
12. Delete the IE conditional-comment scripts (`index.html:44-47`).
13. Add `<link rel="preload" as="image" href="images/banner.jpg">`.

---

## 6. Recommended Implementation Roadmap

### Phase 0: Safety net (do first)
- **What:**
  1. Recreate the baseline screenshots (section 7) as a repeatable script.
  2. Add `README.md` and `.gitignore`.
  3. Work on a feature branch, not directly on `master`, because GitHub Pages deploys `master` immediately.
- **Files:** new dev-only files (for example `tools/visual-baseline.mjs`). They must not be referenced by `index.html`.
- **Dependencies:** none.
- **Verification:** the script produces stable screenshots across two runs. Disable or await WOW and the typer by waiting for a fixed time, or mask the typer region.

### Phase 1: Functional fixes and dead-code removal
- **What:**
  - F-02, F-03, F-04
  - F-01: delete dead `custom.js` blocks and the `.scrollup` anchor
  - S-04
- **Files:** `index.html`, `js/custom.js`
- **Depends on:** Phase 0
- **Tests:**
  - Zero console errors.
  - All 22 thumbnails open their own image.
  - Nav links scroll smoothly and the active state follows (scrollspy).
  - Header becomes fixed after 50 px.
  - Mobile menu toggles.
  - WOW fade-ins still occur.
  - Typer cycles Freunde → Familie → Kolegen.
- **Visual verification:** a full-page and interactive-state diff against the baseline must be 0 px different outside the typer and WOW regions. Confirm that **no scroll-up arrow appears** and the banner background does not move differently on scroll.

### Phase 2: JavaScript slimming and library upgrades
- **What:**
  - P-02: build a minimal `all.js` (jQuery + Typer + WOW) and drop `modernizer.js`.
  - Optionally upgrade jQuery 3.7.x (quote the selector at `custom.js:16`) and Bootstrap JS 3.4.1.
  - P-06
- **Files:** `js/all.js`, `js/modernizer.js`, `js/bootstrap.min.js`, `js/custom.js`, `index.html:774-779`
- **Depends on:** Phase 1. Removing the crash first makes regressions obvious.
- **Tests:** the same functional checklist as Phase 1; the modal open/close animation and backdrop; `jQuery.fn.jquery` reports the expected version.
- **Visual verification:** a screenshot diff of all states. The modal zoom animation (`style.css:1057-1075`) is checked mid-transition by capturing at about 150 ms.

### Phase 3: Images and assets
- **What:**
  - P-01: re-encode PNG photos; create grid thumbnails plus `srcset`.
  - P-03, P-08
  - F-05: compress the PDF and fix the filename.
  - A-02: remove unused files after client confirmation.
- **Files:** `images/*`, `index.html` (gallery `<img>`)
- **Depends on:** ideally after A-01 if the modals are consolidated, so the markup is edited only once. It can also be done independently.
- **Tests:**
  - All images load (no 404s in the network panel).
  - Lighthouse mobile performance before and after.
  - Total transfer in DevTools goes from about 9 MB to about 2–3 MB.
- **Visual verification:**
  - Pixel diff with a small tolerance (≤ 2% per tile) at DPR 1 and 2.
  - Manual side-by-side review of each tile, checking that the crop, focal point and colour are unchanged.
  - **Aspect ratios must match the originals exactly.**

### Phase 4: CSS and fonts
- **What:**
  - P-04: inline the `@import`s in the same order.
  - S-02 / P-05: self-host Roboto with the identical files; remove Paprika and Flaticon.
  - A-03: remove dead CSS, coverage-driven.
  - Optionally Bootstrap CSS 3.4.1 (S-03).
- **Files:** `css/style.css`, imported CSS, `fonts/*`
- **Depends on:** Phase 0
- **Tests:** no failed requests; the Network panel shows no `fonts.googleapis.com` or `fonts.gstatic.com`.
- **Visual verification:**
  - A full-page diff at 1440, 768 and 375 must be 0 px different. Text rendering is the most sensitive part.
  - Check the footer gradient, the gallery hover overlay (Glyphicons `\e003`), and the font-awesome footer icons.

### Phase 5: SEO and accessibility metadata
- **What:**
  - SEO-01 to SEO-06
  - AC-01, AC-02, AC-04, AC-05, AC-06
  - S-05 (referrer meta)
- **Files:** `index.html` `<head>` and attributes, `robots.txt`, `sitemap.xml`, `images/site.webmanifest`
- **Depends on:** client approval of the title and description copy.
- **Tests:**
  - Google Rich Results Test (Restaurant)
  - Schema.org validator
  - an Open Graph preview tool (for example the Facebook sharing debugger)
  - Lighthouse SEO and accessibility
  - screen reader smoke test (NVDA or VoiceOver)
  - keyboard Tab through the page
- **Visual verification:** a screenshot diff must be 0 px different. These are attribute and `<head>` changes only.

### Phase 6: Legal and privacy (requires client decision)
- **What:** S-01. Option A (remove or replace GA, plus legal pages) or Option B (consent banner), plus footer links to Impressum and Datenschutz.
- **Files:** `index.html`, new `impressum.html` and `datenschutz.html` (reusing the existing header, footer and styles), `sitemap.xml`
- **Depends on:** the client provides the legal texts.
- **Visual verification:** any footer addition must be explicitly approved as a design change. The rest of the page must diff at 0 px.

### Phase 7 (optional): A-01 modal consolidation
Do this only if the gallery will be edited regularly. Verify modal ancestry and animation as described in A-01.

---

## 7. Visual Preservation Checklist

**Baseline captured during this audit.** Headless Chrome, 2026-11-09, local copy of commit `1dc3ec2`. Stored outside the repo in the session scratchpad, which is temporary: copy it somewhere permanent if needed.
`C:\Users\mita019\AppData\Local\Temp\claude\6a34d40979119d85\134c115e-0902-444f-83ed-304155da18c4\scratchpad\baseline\`
- `desktop-1440-viewport.png`, `desktop-1440-full.jpg`
- `tablet-768-viewport.png`, `tablet-768-full.jpg`
- `mobile-375-viewport.png`, `mobile-375-full.jpg`
- `desktop-scrolled.png` (fixed header state), `desktop-modal.png` (open gallery modal), `mobile-nav-open.png`
- `report.json` (requests, sizes, image natural and rendered dimensions, console errors)

The harness script is `...\scratchpad\audit.mjs` and can be reused. In full-page captures, WOW-animated blocks appear blank because they are revealed only on scroll. For comparison captures, scroll through the page first or force `.wow{visibility:visible!important;animation:none!important}` *in the test only*. **The typer headline must be masked** in diffs because it is time-dependent.

### Per change, verify at 1440×900, 1024×768, 768×1024, 375×812 and 320×568:
**Header**
- [ ] Logo is 300 px wide; nav items are uppercase Roboto; the active underline is orange.
- [ ] After scrolling more than 50 px: dark fixed bar (`#202020`), logo shrinks to 150 px, 0.5 s transition.
- [ ] Mobile: hamburger, dropdown menu, item colours and the active underline (`mobile-nav-open.png`).

**Banner**
- [ ] Full-height background (`banner.jpg`), `background-attachment: fixed` on desktop.
- [ ] H1 Nautilus font; typer word in orange with the `_` cursor; H2 orange.
- [ ] Animated mouse icon.
- [ ] **No scroll-up arrow anywhere, at any scroll position.**
- [ ] The banner background does not shift differently while scrolling (no JS parallax).

**Über uns**
- [ ] Fade-in on scroll (WOW, 1 s).
- [ ] Heading, "PORTO ADRIA" H3 and five paragraphs; image 350 px wide on the right (stacked on mobile).

**Speisekarte**
- [ ] Orange 200×50 button "Speisekarte Download".
- [ ] The PDF still downloads or opens.

**Galerie**
- [ ] 22 tiles, 350 px high; wide tiles in positions 1 and 7 (`col-md-8`); 3 px gutters; light-grey background.
- [ ] Every tile keeps the same crop (`object-fit: cover`). Compare tile by tile.
- [ ] Hover: orange 75% overlay with the Glyphicons zoom icon, 0.5 s fade.
- [ ] Click: dimmed backdrop, zoom-in modal animation (scale 0.1 → 1), round black close button at the top-right corner.
- [ ] Each tile opens **its own** image (after F-02 and F-03).
- [ ] Tablet: two columns. Mobile: one column.

**Footer**
- [ ] Radial dark gradient over `footer_background.jpg`; centred logo.
- [ ] Four columns (2×2 on tablet, stacked on mobile): Über uns + Instagram circle, Kontakt with icons, both opening-hours blocks.
- [ ] Orange copyright bar with "Copyright © 2026. Porto Adria. Developed by: D.P".

**Global**
- [ ] Fonts: Roboto (300/400/500/700), Nautilus for headings, FontAwesome icons. Same rendering, with no fallback-font flash introduced.
- [ ] No horizontal scrollbar at any width.
- [ ] Console has zero errors, and the Network panel has zero 404s.
- [ ] Automated pixel diff: 0 px for code and markup-only phases; ≤ 2% per image tile for the image re-encode phase, plus manual review.

If no screenshot comparison is run for a change, state explicitly in the PR that visual equivalence was **not** independently verified.

---

## 8. Final Assessment

### Fix immediately
- **The gallery bugs (F-02, F-03).** Visitors see broken or wrong images today.
- **The JS crash (F-01).** Fix it by deleting dead code. Do not repair the script order: that would silently add a scroll-up button and parallax that the client never approved.
- **The legal and privacy gaps (S-01, S-02).** These carry real risk of warning letters in Germany. Self-hosting the fonts is invisible; the Impressum, privacy policy and analytics decision need the client.
- **Images (P-01, P-03).** This is the single biggest technical improvement. The site currently costs mobile visitors about 9 MB.

### Can be postponed
- Library upgrades beyond removing unused code (S-03). Exploitability is low on this static site.
- Modal consolidation (A-01), dead-CSS pruning (A-03), CSP (S-05) and the README/regression tooling (A-06).

### Leave as is (works well, or the change risk outweighs the benefit)
- GitHub Pages hosting, the HTTPS/www redirects, and the single-page anchor navigation.
- Bootstrap 3 grid and component behaviour. Do not migrate to Bootstrap 4/5 or a framework; that would be a redesign in disguise.
- `background-attachment: fixed` on the banner (P-07), the `co-xs-12` class (A-04), the H6 copyright (SEO-07), and `normalize.css` after Bootstrap. They look odd, but changing them alters the approved rendering.
- The WOW fade-ins and the typer animation (except for the non-visual screen-reader improvements).

### Improvements that may change the appearance (need explicit approval)
| Item | Risk |
|---|---|
| Reordering scripts to "fix" F-01 instead of deleting dead code | Scroll-up arrow and banner parallax appear |
| Doctype change to `<!DOCTYPE html>` (A-05) | Almost-standards → standards mode can shift table-cell/image line boxes |
| `col-xs-12` correction (A-04) | Mobile gallery float/width behaviour |
| Bootstrap CSS 3.3.7 → 3.4.1 (S-03) | Minor CSS differences |
| `font-display: swap` (P-05) | Fallback-font flash during loading |
| Focus-visible outlines (AC-03) | New outline for keyboard users |
| Reduced-motion handling for the typer and WOW (AC-05) | Static headline for those users |
| Impressum/Datenschutz links, consent banner (S-01) | New footer content and overlay |
| Copy fixes "Kollegen" and phone grouping (F-06) | Text change |
| Image re-encoding (P-01) | Possible tiny compression differences; crop must stay identical |
| Removing dead CSS (A-03) | Shared selectors could be removed by mistake |

**Bottom line:** this site can lose about 70% of its page weight, all of its console errors, its broken gallery links, and its legal exposure, and gain proper local-search metadata. Most of that work is either invisible by construction or verifiable with a pixel diff. The only changes that must touch the approved look are the legal footer links or consent mechanism, which the client needs to decide on.

---

## 9. Implementation Status (2026-11-09, branch `audit-fixes`)

**Verification:**
- Deterministic screenshot capture (`tools/visual-regression/`) at 1440, 1024, 768, 375 and 320 px.
- States captured: sticky header, gallery hover, three pop-ups, mobile menu.
- Pixel diff against the original `master`.

**Result:**
- Header, banner, every text block, the button, layout, footer and the mobile menu are **pixel-identical**.
- The only differences are inside gallery and about photos, caused by thumbnail resampling. The mean channel difference is 2–3 out of 255.
- The cevapi pop-up changed on purpose (bug fix).
- Functional test: 24/24 pop-ups open the correct photo; nav, scrollspy, sticky header, mobile menu, typer and WOW behave as before; 0 console errors; 0 HTTP errors.

**Measured page weight** (excluding Google Analytics):
- Initial load: 8.96 MB / 54 requests → **1.19 MB / 25 requests** (desktop), 1.38 MB (mobile, 3× DPR).
- Full scroll-through: 3.8 MB desktop, 6.5 MB on 3× DPR phones, which receive sharper full-size photos via `srcset`.

| ID | Status | Notes |
|---|---|---|
| F-01 | Done | Dead initialisers removed; scroll-up arrow and parallax stay inactive, as before |
| F-02, F-03 | Done | Unique ids `gal-1` … `gal-24`; cevapi pop-up uses `cevapi.jpg` |
| F-04 | Done | `target="_blank"` removed. The link stays on `#` for now, as decided. |
| F-05 | Done | Download filename and label fixed. `Menu.pdf` shrunk from 2.26 MB to 0.96 MB: embedded fonts were re-subset to the glyphs actually used, with glyph IDs retained; images and text are untouched. MuPDF renders all 8 pages byte-identical at 150 and 300 dpi. Pdfium (Chrome) differs in ≤ 0.001% of pixels, all anti-aliasing. |
| F-06 | Done (approved) | "Kollegen"; phone displayed as `+49 4352 9549029` (the `tel:` link was already correct). Diff: only the 94×10 px phone text changes; no reflow. |
| P-01, P-03, P-08 | Done | PNG photos converted to JPEG at the same dimensions; 760 px thumbnails + `srcset`; lazy loading; banner and font preload; pop-up image warm-up on hover, touch and focus |
| P-02, S-03 | Done | `all.js` = jQuery 3.7.1 + Typer + WOW; Bootstrap JS 3.4.1; Modernizr and Moment removed (hashes verified against official SRI) |
| P-04, P-05, S-02 | Done | `@import` chain replaced by `<link>` tags in the same order; Roboto self-hosted (identical Google files); Paprika and Flaticon removed. Bootstrap **CSS** kept at 3.3.7, and `font-display` kept unchanged (both visual risks). |
| P-06 | Done | Passive scroll listener; the class only toggles on state change |
| P-07, A-04, SEO-07 | Not changed, on purpose | As recommended |
| SEO-01 | Done, without opening hours (kept on hold, as decided; see README "Open items") | **Conflict:** the footer says Tue–Sun 12:00–14:30 / 17:00–22:00, but the poster `images/1.jpeg` says off-season Mon–Thu closed, Fri–Sun 17:00–22:00. Hours will be added to the JSON-LD once confirmed. The poster also shows the email as "porto.adria.de". |
| SEO-02 – SEO-06 | Done | Title, description, canonical, robots `Sitemap:`, sitemap, Open Graph, manifest, favicon link, German alt texts (the poster has a full-text alt) |
| AC-01, 02, 04, 05, 06 | Done | Zoom enabled, `aria-label`s, `Schließen`, screen-reader text for the typer headline |
| AC-03 | Done (approved) | 2 px orange (#e75b1e) outline on `:focus-visible` only, so keyboard users see it and mouse or touch users never do. Gallery tiles draw it inside the image. Verified: Tab shows it; a mouse click doesn't. |
| S-01 | **Not done** | Needs the client: Impressum and Datenschutz texts, plus a decision on Google Analytics (remove, or add a consent banner) |
| S-04, S-05 | Done | Dead `innerHTML` sink and dead CDN removed; referrer meta added. CSP not added: it needs the GA decision first. |
| A-01 | Not done | The fixed ids remove the bug; consolidation is optional and carries modal-CSS risk |
| A-02 | Partly (unreferenced client images kept, as decided) | Template CSS, JS and fonts removed, along with the replaced PNGs. **Kept until confirmed:** `newImage.jpg`, `sos.jpg`, `special-menu.jpg/.jpeg`, `portoGallery1.png`, `portoadria-qr-code.png`, `favico.ico` (unreferenced, so they cost nothing at runtime) |
| A-03 | Done | Team, blog, pricing, color-switcher, preloader and `#mhead` CSS removed; `h6 a` and copyright rules kept |
| A-05 | Tested, **reverted** | HTML5 doctype made the page 5 px taller and moved footer elements at 320, 375 and 1024 px. The doctype stays. |
| A-06 | Done | `README.md`, `.gitignore`, `_config.yml` (keeps README, report and tools off the public site), `tools/visual-regression/` |
