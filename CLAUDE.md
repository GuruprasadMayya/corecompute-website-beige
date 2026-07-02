# CoreCompute — Beige/Elegant Light Variant

Static marketing site for **CoreCompute FZE**, a deep-technology infrastructure
company that designs, deploys and operates AI data centres and GPU
infrastructure. Positioned alongside Nscale, Core42, NVIDIA Enterprise, OCI
and Dell in tone: engineering authority over sales pitch.

This is the **light/elegant** design variant — same content and page
structure as the dark variant at `../CoreComputeWebsite/`, different theme.
Read that folder's `CLAUDE.md` first; this file only documents what's
*different* here.

## Stack

Identical to the dark variant: plain HTML/CSS/vanilla JS, no build step, no
framework. Same 4 pages, same `assets/js/main.js` interactivity layer, a
separate `assets/css/style.css` with a different token set.

## What's different from the dark variant

### Palette: beige / navy / gold

```css
--bg-base: #f8f3e6;      /* warm cream, NOT pure white */
--bg-card: #fdfbf6;      /* near-white, cards pop against the cream base */
--blue-bright: #2f5c86;  /* muted "elegant" navy, not electric blue */
--accent-amber: #b08d57; /* warm gold/bronze complementary accent */
--text-primary: #23303d; /* dark navy-charcoal, NOT white */
```

Text/surface roles are **inverted** relative to the dark variant (dark text
on light surfaces vs. light text on dark surfaces) — don't copy a CSS rule
from one variant into the other without checking which direction its colors
need to go.

Beige was deliberately kept **light** (`--bg-base: #f8f3e6`), not
off-white/gray — an earlier pass used `#f1e9d8` which read as "slightly
dirty," per explicit client feedback. If asked to adjust brightness again,
move `--bg-base`/`--bg-raised`/`--bg-card` together, and re-check the two
places listed below that hardcode a matching gradient stop instead of using
the variable.

### The hero (and Services page-header) stay dark — on purpose

Even though the rest of this variant is light-themed, the hero photo
section and the Services page-header (`.page-header--cabling`) are
deliberately kept as **dark, full-bleed photo sections** — same treatment,
same images, same `initBrainFlowCanvas()` animation as the dark variant.
This is an intentional "signature moment" pattern (the same idea as the CTA
band below), not an inconsistency.

Because of this, three things needed **scoped overrides** that don't exist
in the dark variant at all — if you touch the hero/page-header/CTA-band,
check these three blocks are still in sync:

1. **Hero text** (`.hero-kicker`, `.hero h1`, `.hero-sub`,
   `.hero-meta-item .num/.label`, `.hero .btn-secondary`) — forced to
   light/cream colors, since the base rule for these elements assumes a
   light page background.
2. **Nav links, when transparent over a dark hero** — `index.html` and
   `services.html` have `<body class="has-dark-header">`; CSS rules scoped
   to `.has-dark-header .navbar:not(.is-scrolled) ...` force the nav text
   light until the navbar scrolls solid. `about.html`/`contact.html` do
   **not** have this class (their page-headers are the normal light
   beige) — don't add it there, it would make the nav invisible.
3. **CTA band** (`.cta-band`) — already dark navy in this variant by
   design (visible on Home/Services/About-Vision), so its buttons and
   eyebrow also have scoped overrides (`.cta-band .btn-primary` → gold,
   `.cta-band .btn-secondary` → light-bordered ghost, `.cta-band .eyebrow`
   → gold). This predates the hero change and was a real contrast bug
   caught via screenshot (navy-on-navy button was nearly invisible) —
   don't revert to the base `.btn-primary`/`.btn-secondary` colors here.

If you add a fourth dark-on-light-site element, follow the same pattern:
scope a light-text override rather than flipping the global tokens.

### Logo: the real corecompute.ae logo, not the SVG mark

Unlike the dark variant (which uses an original hand-drawn SVG "circuit-C"
mark), this variant uses the **actual scraped corecompute.ae logo**
(`assets/images/logo.png`, plus `logo-source.jpeg`) — per explicit
instruction to use their real logo here. It sits in a small white card
(`.brand-mark`) in the nav/footer since the source image has a white
background baked in as a raster JPEG-derived PNG; the card gives it a
clean edge against the cream page rather than an odd rectangular seam.

`assets/images/favicon.png` is still an original procedurally-generated
mark (small circuit-ring glyph, navy/gold), not derived from the real
logo — consistent with the dark variant's approach; favicons are a
different, lower-stakes asset than the primary lockup.

## Copy rules

Identical to the dark variant — see that `CLAUDE.md`: exactly one
"CoreCompute FZE" (About page's Company section only, and it **does**
appear there in this variant too, same as the dark one), zero "EMEA",
same canonical company/footer sentence.

## Validation: `test-links.py`

Identical script, copied from the dark variant. Run from this directory:

```bash
python3 test-links.py
```

See the dark variant's `CLAUDE.md` for what it checks. Both variants should
stay green independently — they are separate repos with separate asset
copies, not symlinks, so a fix in one does not propagate to the other.

## Local preview

```bash
python3 -m http.server 8766   # different port than the dark variant, so both can run at once
open http://localhost:8766/index.html
```

## Deployment

Separate GitHub repo from the dark variant (`corecompute-website-beige`),
pushed and Pages-enabled the same way. Live at
`https://<owner>.github.io/corecompute-website-beige/`.
