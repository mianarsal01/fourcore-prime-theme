# Shopify Theme Store Submission Checklist (2026)

Last reviewed: March 5, 2026

## 1. Starter and Originality

- [x] Built from original codebase (not Horizon/Dawn derivative).
  Evidence: `layout/theme.liquid`, `sections/*`, `assets/*`
- [x] Theme Store packaging works.
  Evidence: `FourCore Prime-0.1.0.zip`

## 2. OS 2.0 Architecture

- [x] Required directories in place.
  Evidence: `assets/`, `blocks/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`
- [x] JSON templates implemented for major page types.
  Evidence: `templates/index.json`, `templates/product.json`, `templates/collection.json`, `templates/cart.json`, `templates/search.json`, `templates/blog.json`, `templates/article.json`, `templates/page.json`, `templates/password.json`, `templates/404.json`, `templates/customers/*.json`
- [x] Section groups implemented for header/footer.
  Evidence: `sections/header-group.json`, `sections/footer-group.json`
- [x] App block compatibility in product section.
  Evidence: `sections/main-product.liquid` (`"type": "@app"` block)

## 3. Required Merchandising and Commerce Baseline

- [x] Product variants + swatches + sticky ATC + quick buy + trust/shipping + size chart + recommendations + recently viewed.
  Evidence: `sections/main-product.liquid`, `sections/product-recommendations.liquid`, `sections/recently-viewed-products.liquid`
- [x] Collection filtering/sorting.
  Evidence: `sections/main-collection-product-grid.liquid`
- [x] Mega menu + predictive search + sticky header + mobile drawer + breadcrumbs + announcement bar.
  Evidence: `sections/header.liquid`, `sections/announcement-bar.liquid`, `snippets/breadcrumbs.liquid`
- [x] Slide cart with notes + free shipping progress + quantity controls + checkout CTA.
  Evidence: `snippets/cart-drawer.liquid`, `assets/theme.js`

## 4. Section Library

- [x] Large reusable section library.
  Evidence: `sections/` currently contains 40+ section files including `promo-grid`, `video-banner`, `comparison-table`, `before-after-slider`, `image-hotspots`, `scrolling-marquee`, `brand-timeline`, `stats-bar`, `testimonials`, `faq`.

## 5. Performance and Delivery

- [x] Critical CSS strategy implemented.
  Evidence: `assets/critical.css`, `layout/theme.liquid`
- [x] JS split between core and deferred enhancements.
  Evidence: `assets/theme.js`, `assets/theme-enhancements.js`
- [x] Image loading policy applied (eager for LCP, lazy for non-critical).
  Evidence: `sections/hero-banner.liquid`, `sections/main-product.liquid`, `snippets/product-card.liquid`
- [x] Theme Check pass.
  Evidence: local run `shopify theme check --fail-level suggestion`

## 6. Accessibility and Responsive UX

- [x] Skip link present.
  Evidence: `layout/theme.liquid`
- [x] Mobile navigation and drawer behavior implemented.
  Evidence: `sections/header.liquid`, `assets/theme.js`, `assets/theme.css`
- [x] Responsive layout across major sections and product/collection/cart contexts.
  Evidence: `assets/theme.css` media-query coverage
- [ ] Full keyboard traversal audit in browser on all templates.
  Next: run manual QA on desktop/mobile emulation + screen reader spot-check.

## 7. Compliance and Review Safety

- [x] Avoided app-replacement engines (reviews/subscriptions/AI search/bundle backend).
  Evidence: architecture limited to theme UI + Shopify native APIs.
- [x] Used conservative compatibility language intention.
  Next: ensure theme listing copy says "Compatible with most Shopify apps".

## 8. Submission Operations (Pending Project Tasks)

- [ ] Documentation site URL and support form URL must be real (not placeholders).
  Current placeholders: `config/settings_schema.json`
- [ ] Demo store data and presets should fully showcase all key sections.
- [ ] Release notes/versioning workflow for updates.
- [ ] Lighthouse/accessibility benchmarks and issue log before submission.

## 9. Immediate Next QA Pass

1. Validate first-run editor behavior on Home template and Product template.
2. Validate quick view add-to-cart flow on mobile and desktop.
3. Measure Lighthouse (home, collection, product, cart) and optimize highest-impact regressions.
