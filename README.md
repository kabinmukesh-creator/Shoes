# Rowan & Field — shoe shop showcase

A single-page storefront for an independent footwear shop: hero, scrolling
marquees, a filterable shop floor, a drag-scroll window display, a repairs
section, opening hours and a reserve-for-collection bag.

No framework, no build step, no dependencies. Open `index.html` and it runs.

```
index.html          markup — all copy and the five editorial photographs
css/styles.css      one stylesheet, custom properties at the top
js/app.js           stock data, rendering, bag, filters, rail
js/motion.js        GSAP layer — scroll choreography, marquees, water tap
assets/vendor/      GSAP + ScrollTrigger + Lenis, vendored (no CDN)
scripts/fetch-images.sh   mirror the photography locally (optional)
```

## Running it

```bash
python3 -m http.server 8000   # or: npx http-server -p 8000
```

Then open <http://localhost:8000>. Opening the file directly works too;
a server is only nicer for caching.

## Photography

The site pulls real photographs from the Unsplash CDN at request time — no
generated imagery anywhere. Each slot carries **two** photo ids: if the first
does not resolve, the browser silently tries the spare, and only if both are
gone does it draw a neutral plate with the product name. You should never see
a broken image.

Photo ids live in one place per file: `data-spare` / `photo-…` in
`index.html`, and the `img` / `spare` fields of `STOCK` and `WALL` in
`js/app.js`. To swap a photo, paste a different Unsplash id.

To check them or go fully offline:

```bash
./scripts/fetch-images.sh --check   # report which ids still resolve
./scripts/fetch-images.sh           # download into assets/img/ and switch over
```

The download run rewrites `index.html` to point at `assets/img/` and adds
`data-local-photos` to `<html>`, which flips `js/app.js` to local paths as
well. Commit `assets/img/` if you want that to stick.

## Editing the shop

**Stock** — `STOCK` in `js/app.js`. Each entry:

```js
{ id:'ch70', cat:'sneaker', brand:'Converse', name:'Chuck 70 Hi', price:85,
  img:'<unsplash-id>', spare:'<unsplash-id>',
  meta:'Egret canvas · vintage rubber',
  sizes:[5,6,7,8,9,10,11], out:[],       // out = sizes shown struck through
  flag:'Back in' }                        // corner label, '' for none
```

`cat` must match a `data-filter` on one of the chips in `index.html`; update
the counts in those chips when you add stock. `WALL` drives the window
display the same way.

**Colours, spacing, type** — the `:root` block at the top of `css/styles.css`.

**Copy, hours, address, staff, repair prices** — plain markup in
`index.html`.

## Motion

`js/motion.js` layers GSAP over the base site. It is strictly additive: if the
libraries fail to load, or the visitor asks for reduced motion, the file exits
at its first line and `js/app.js`'s own IntersectionObserver reveals carry the
page unchanged. Nothing in the shop depends on it.

- **Hero** — the headline's three lines wipe up on load, then the whole block
  drifts and fades against a slowly scaling photograph on `scrub: 1`.
- **Headings** rise word by word; each word is wrapped at runtime by a small
  splitter in `motion.js`, so the markup stays plain text.
- **Photographs are uncovered, not faded.** The frame opens from the bottom via
  `clip-path` while the picture inside settles back from a 1.22 over-scale.
  Cards go through `ScrollTrigger.batch` so twelve of them cost one pass.
- **Marquees** carry a resting drift, lean into your scroll direction and
  speed up with it, then settle. **Tap a band and it reverses and races** at 9x
  before easing back — the flowing text responds to touch.
- **Tap anywhere for the water.** The shop waterproofs boots, so the page acts
  like a waxed upper: the strike flattens, beads back up, and the droplets
  scatter, roll and evaporate rather than soaking in. Canvas 2D, DPR-capped,
  and the loop stops dead when the last bead is gone.

### Libraries

GSAP 3.15.0, ScrollTrigger and Lenis 1.3.26 are **vendored** into
`assets/vendor/` rather than pulled from a CDN — the site then works offline,
behind a strict CSP, and on a venue's hostile wifi. 135 KB total. Licenses sit
beside them. To update: `npm i gsap lenis` and copy `dist/gsap.min.js`,
`dist/ScrollTrigger.min.js` and `dist/lenis.min.js` across.

Note for anyone following older Lenis guides: `smoothTouch` was a Lenis 0.x
option and does nothing in 1.x. The current names are `syncTouch`,
`syncTouchLerp` and `touchInertiaMultiplier`, which is what `motion.js` uses.

## Behaviour notes

- Reveals, marquees, parallax and the water all sit behind
  `prefers-reduced-motion`, which switches the page to a static layout.
- Device tier is probed from `hardwareConcurrency` / `deviceMemory`, not screen
  width. Thin hardware gets fewer droplets, a capped pixel ratio and no Lenis
  smoothing; it does not get a shrunken version of the same workload.
- Lenis and ScrollTrigger share one RAF loop (`gsap.ticker` drives Lenis with
  `autoRaf: false`) so the two never fight over scroll position — the usual
  cause of "smooth on desktop, laggy on phone".
- Parallax is skipped entirely on coarse pointers; touch keeps native
  momentum scrolling on the window-display rail rather than fighting it with
  a custom drag.
- Marquees and parallax share one `requestAnimationFrame` loop and pause when
  off-screen; scroll listeners are passive.
- Photographs below the fold are `loading="lazy"` with `srcset`/`sizes`, so a
  phone fetches roughly a quarter of the pixels a desktop does.
- The bag persists in `localStorage` under `rf.bag.v1`, in a try/catch — a
  browser with site data blocked just gets an empty bag.
- Everything except the bag, the filters and the rail arrows works with
  JavaScript disabled.

## About the shop

Rowan & Field is fictional, written to give the layout something real to hold:
a shop with an address, four staff, a repair price list and stock it can
actually justify. The phone number and email are not live and nothing on the
page takes payment.
