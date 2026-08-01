# Design

## Color Strategy

**Committed.** One saturated brand red (from the existing Styliqa hanger logo, sampled directly from the source file) carries real surface area — dark hero/footer bookends plus every CTA and accent — bracketing restrained warm-neutral content sections. The cream is the studio's own real paper/Etsy-template tone (sampled from their live Instagram grid), used as a section surface, not the whole-page default, so it reads as an owned material rather than an AI-cream reflex.

## Palette (OKLCH)

| Token | OKLCH | Hex (ref) | Role |
|---|---|---|---|
| `--ink` | oklch(0.229 0.017 31.4) | #241A18 | body text on cream |
| `--void` | oklch(0.193 0.014 1.8) | #1A1214 | hero/footer dark surface |
| `--paper` | oklch(0.953 0.019 75.3) | #F7EEE2 | warm content-section surface (brand's own cream) |
| `--paper-high` | oklch(0.993 0.005 67.8) | #FFFCF9 | cards / raised surface on paper |
| `--cream-ink` | oklch(0.993 0.005 67.8) | #FFFCF9 | text on dark surfaces |
| `--brand` | oklch(0.497 0.183 22.2) | #B31D2E | primary red — CTAs, links, logo, accents |
| `--brand-deep` | oklch(0.419 0.154 22.4) | #8E1522 | hover/pressed red, dark-surface accents |
| `--terracotta` | oklch(0.659 0.108 42.9) | #C97B5B | secondary warm accent — tags, dividers, small highlights |
| `--muted` | oklch(0.229 0.017 31.4 / 0.6) | — | secondary text on paper (still ≥4.5:1 at body size) |
| `--muted-on-dark` | oklch(0.993 0.005 67.8 / 0.62) | — | secondary text on void (checked ≥4.5:1) |
| `--line` | oklch(0.229 0.017 31.4 / 0.12) | — | hairline borders on paper |
| `--line-on-dark` | oklch(0.993 0.005 67.8 / 0.14) | — | hairline borders on void |

Contrast checked: `--ink` on `--paper` ≈ 13:1. `--cream-ink` on `--void` ≈ 17:1. `--brand` on `--paper` ≈ 5.3:1 (safe for text, not just fill). White text on `--brand` ≈ 5.6:1.

## Typography

- **Display / headings:** Fraunces (variable, optical size "soft" for large sizes) — a fashion-editorial serif with real character, distinct from the Playfair/Cormorant default. Italic weight used sparingly for one accent word per hero/section, never gradient text.
- **Body / UI:** Inter — geometric-humanist sans, high legibility at small sizes, wide weight range for hierarchy without extra families.
- Contrast axis: serif display vs. sans body — no second sans anywhere.
- Hero clamp: `clamp(2.75rem, 6vw, 5.5rem)`, letter-spacing ≥ -0.03em, `text-wrap: balance`.
- Body cap: 68ch measure, `text-wrap: pretty` on long paragraphs.
- No uppercase tracked eyebrows as default scaffolding. Section labels (when used) are set as small Fraunces italic phrases, not tracked-caps kickers.

## Layout

- Single scrolling page, generous vertical rhythm (section padding scales 6rem → 10rem desktop, tighter on mobile), alternating `--void` (hero, process, footer) and `--paper` (about, services, portfolio, reviews) surfaces as the primary structural device — replaces numbered eyebrows/section markers.
- Services and portfolio use asymmetric grids (`auto-fit, minmax(...)`), not uniform identical card walls; portfolio grid mixes tile sizes.
- Real 4–5 step process section is the one place a numbered sequence is earned (it's an actual ordered workflow).

## Motion

- Ease-out-expo/quart for all transitions, no bounce/elastic.
- Logo hanger mark line-draws in on load (SVG stroke-dashoffset).
- Scroll reveals: content is visible by default in markup; reveal only adds a refined transform/opacity-in-view enhancement (no visibility gating).
- Subtle parallax drift on hero background motifs; portfolio tiles get a gentle tilt/scale on hover, not a spin.
- Marquee strip for client/service tags at a slow, steady linear speed.
- Full `prefers-reduced-motion: reduce` fallback: instant/crossfade, parallax and marquee disabled.

## Components

- **Nav:** fixed, transparent-over-hero → solid `--void` with blur on scroll; logo mark + wordmark, right-aligned links, red "Book a Consultation" pill CTA.
- **Buttons:** solid `--brand` primary (cream text), outline/ghost secondary on both surfaces; no side-stripe accents anywhere.
- **Cards:** used only for service/portfolio/testimonial content where a bounded surface genuinely helps scanning; never nested.
- **Stats row:** inline set (4.8★ · 1,400+ reviews · est. 2019 · clients across 6+ countries) — earned real numbers, not a generic hero-metric block.
