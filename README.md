# Rowan & Field — shoe shop showcase

A single-page storefront for an independent footwear shop: hero, scrolling
marquees, a filterable shop floor, a drag-scroll window display, a repairs
section, opening hours and a reserve-for-collection bag.

No framework, no build step, no dependencies. Open `index.html` and it runs.

```
index.html          markup — all copy and the five editorial photographs
css/styles.css      one stylesheet, custom properties at the top
js/app.js           stock data, rendering, scroll behaviour, bag
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

## Behaviour notes

- Reveals, marquees and parallax all sit behind `prefers-reduced-motion`,
  which switches the page to a static layout.
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
