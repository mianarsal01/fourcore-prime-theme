# Performance and Image Policy

Last updated: March 5, 2026

## Core Strategy

1. Critical CSS first paint
- `assets/critical.css` is loaded synchronously in `layout/theme.liquid`.
- It includes only first-render layout primitives (typography, page width, header shell, hero shell, grid shell).

2. Full CSS non-blocking
- `assets/theme.css` is preloaded and then applied asynchronously using `media="print"` + `onload` swap.
- `noscript` fallback keeps CSS available when JS is disabled.

3. JavaScript split loading
- `assets/theme.js` (core path): navigation drawer, cart drawer, AJAX add-to-cart, variant logic, quick view modal.
- `assets/theme-enhancements.js` (deferred path): predictive search, reveal animations, recommendations, recently viewed, collection view toggle, countdown, hotspots.
- Deferred script loads via `requestIdleCallback` (or `window.load` fallback).

## Image Policy

1. LCP image priority
- Hero image uses `loading: eager` and `fetchpriority: high`.
- First PDP image uses `loading: eager` and `fetchpriority: high`.

2. Non-LCP image lazy loading
- Product cards, recommendations, collection cards, promo tiles, and auxiliary media use `loading: lazy`.

3. Responsive sources
- Use `image_url` + `image_tag` with explicit `widths` and `sizes` for all major section images.

4. CLS safety
- Prefer `image_tag` output (includes intrinsic dimensions).
- Avoid CSS that forces unknown-height media containers without ratio controls.

## Ongoing Rules for New Sections

1. Always provide `widths` and `sizes` on section images.
2. Do not mark more than one major above-the-fold image as eager.
3. Keep JS feature modules independent and load non-critical code in `theme-enhancements.js`.
4. Prefer native platform APIs (`search/suggest.json`, `product_recommendations_url`, `/cart.js`) over heavy client libraries.
