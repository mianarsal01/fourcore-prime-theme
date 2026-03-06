(() => {
  const THEME = window.FourCoreTheme || {};
  const utils = THEME.utils || {};

  if (!utils.formatMoney || !utils.escapeHtml || !utils.withWidth || !utils.debounce) {
    return;
  }

  const RECENTLY_VIEWED_KEY = 'fourcore_recently_viewed';
  const { formatMoney, escapeHtml, withWidth, debounce } = utils;

  const setupPredictiveSearch = () => {
    document.querySelectorAll('[data-predictive-search-form]').forEach((container) => {
      if (container.dataset.bound === 'true') return;

      const input = container.querySelector('[data-predictive-input]');
      const resultsNode = container.querySelector('[data-predictive-results]');
      if (!input || !resultsNode) return;

      const closeResults = () => {
        resultsNode.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        resultsNode.innerHTML = '';
      };

      const renderResults = (data) => {
        const products = data?.resources?.results?.products || [];
        const pages = data?.resources?.results?.pages || [];
        const articles = data?.resources?.results?.articles || [];

        if (products.length + pages.length + articles.length === 0) {
          resultsNode.innerHTML = '<p class="predictive-search__empty">No results found.</p>';
          resultsNode.hidden = false;
          input.setAttribute('aria-expanded', 'true');
          return;
        }

        const productMarkup = products
          .map(
            (product) => `
              <a class="predictive-search__item" href="${product.url}">
                ${
                  product.featured_image?.url
                    ? `<img src="${withWidth(product.featured_image.url, 120)}" width="60" height="60" loading="lazy" alt="${escapeHtml(product.title)}">`
                    : ''
                }
                <span>
                  <strong>${escapeHtml(product.title)}</strong>
                  <small>${formatMoney(product.price_min)}</small>
                </span>
              </a>
            `
          )
          .join('');

        const pageMarkup = pages
          .map(
            (page) => `
              <a class="predictive-search__item" href="${page.url}">
                <span><strong>${escapeHtml(page.title)}</strong><small>Page</small></span>
              </a>
            `
          )
          .join('');

        const articleMarkup = articles
          .map(
            (article) => `
              <a class="predictive-search__item" href="${article.url}">
                <span><strong>${escapeHtml(article.title)}</strong><small>Article</small></span>
              </a>
            `
          )
          .join('');

        resultsNode.innerHTML = `
          <div class="predictive-search__group">
            <h3>Products</h3>
            ${productMarkup || '<p class="predictive-search__empty">No products found.</p>'}
          </div>
          ${pageMarkup ? `<div class="predictive-search__group"><h3>Pages</h3>${pageMarkup}</div>` : ''}
          ${articleMarkup ? `<div class="predictive-search__group"><h3>Articles</h3>${articleMarkup}</div>` : ''}
        `;

        resultsNode.hidden = false;
        input.setAttribute('aria-expanded', 'true');
      };

      const search = debounce(async () => {
        const query = input.value.trim();
        if (!query) {
          closeResults();
          return;
        }

        const limit = Number(container.dataset.limit || 6);
        const params = new URLSearchParams({
          q: query,
          'resources[type]': 'product,page,article',
          'resources[limit]': String(limit),
          'resources[options][unavailable_products]': 'hide'
        });

        try {
          const response = await fetch(`/search/suggest.json?${params.toString()}`, {
            headers: { Accept: 'application/json' }
          });
          if (!response.ok) {
            closeResults();
            return;
          }

          const data = await response.json();
          renderResults(data);
        } catch (error) {
          closeResults();
        }
      }, 220);

      input.addEventListener('input', search);
      input.addEventListener('focus', search);
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeResults();
      });

      document.addEventListener('click', (event) => {
        if (!container.contains(event.target)) closeResults();
      });

      container.dataset.bound = 'true';
    });
  };

  const setupSectionReveal = () => {
    if (!document.body.classList.contains('reveal-enabled')) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.shopify-section').forEach((section) => observer.observe(section));
  };

  const setupRecentlyViewedTracking = () => {
    const node = document.querySelector('[data-recently-viewed-handle]');
    if (!node) return;

    const handle = node.dataset.recentlyViewedHandle;
    if (!handle) return;

    const current = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]').filter((item) => item !== handle);
    current.unshift(handle);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(current.slice(0, 12)));
  };

  const setupRecentlyViewedRender = () => {
    document.querySelectorAll('[data-recently-viewed]').forEach(async (section) => {
      const grid = section.querySelector('[data-recently-viewed-grid]');
      if (!grid) return;

      const limit = Number(section.dataset.limit || 4);
      const currentHandle = document.querySelector('[data-recently-viewed-handle]')?.dataset.recentlyViewedHandle;
      const handles = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]')
        .filter((handle) => handle !== currentHandle)
        .slice(0, limit);

      if (!handles.length) return;

      try {
        const products = await Promise.all(
          handles.map(async (handle) => {
            const response = await fetch(`/products/${handle}.js`, { headers: { Accept: 'application/json' } });
            if (!response.ok) return null;
            return response.json();
          })
        );

        const validProducts = products.filter(Boolean);
        if (!validProducts.length) return;

        grid.innerHTML = validProducts
          .map((product) => {
            const variant = product.variants?.[0];
            return `
              <article class="card" aria-label="${escapeHtml(product.title)}">
                <a href="${product.url}" class="card__media">
                  ${
                    product.featured_image
                      ? `<img src="${withWidth(product.featured_image, 720)}" loading="lazy" alt="${escapeHtml(product.title)}">`
                      : ''
                  }
                </a>
                <div class="card__content">
                  <a href="${product.url}" class="card__title">${escapeHtml(product.title)}</a>
                  <span>${variant ? formatMoney(variant.price) : ''}</span>
                </div>
              </article>
            `;
          })
          .join('');
      } catch (error) {
        return;
      }
    });
  };

  const setupProductRecommendations = () => {
    document.querySelectorAll('[data-product-recommendations]').forEach(async (section) => {
      const url = section.dataset.url;
      if (!url) return;

      try {
        const response = await fetch(url);
        if (!response.ok) return;

        const html = await response.text();
        const parser = new DOMParser();
        const documentNode = parser.parseFromString(html, 'text/html');
        const renderedSection = documentNode.querySelector('[data-product-recommendations]');

        if (!renderedSection) return;

        const hasCards = renderedSection.querySelector('.card');
        if (!hasCards) {
          section.remove();
          return;
        }

        section.innerHTML = renderedSection.innerHTML;
      } catch (error) {
        return;
      }
    });
  };

  const setupCollectionViewToggle = () => {
    const productsGrid = document.querySelector('[data-collection-products]');
    if (!productsGrid) return;

    document.querySelectorAll('[data-view-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        const mode = button.dataset.viewMode;
        productsGrid.classList.toggle('is-list-view', mode === 'list');

        document.querySelectorAll('[data-view-mode]').forEach((btn) => {
          btn.classList.toggle('is-active', btn === button);
        });
      });
    });
  };

  const setupBeforeAfter = () => {
    document.querySelectorAll('[data-before-after]').forEach((root) => {
      const range = root.querySelector('[data-before-after-range]');
      const overlay = root.querySelector('[data-before-after-overlay]');

      if (!range || !overlay) return;

      const update = () => {
        overlay.style.width = `${range.value}%`;
      };

      range.addEventListener('input', update);
      update();
    });
  };

  const setupCountdowns = () => {
    document.querySelectorAll('[data-countdown]').forEach((section) => {
      const endDate = section.dataset.endDate;
      if (!endDate) return;

      const daysNode = section.querySelector('[data-days]');
      const hoursNode = section.querySelector('[data-hours]');
      const minutesNode = section.querySelector('[data-minutes]');
      const secondsNode = section.querySelector('[data-seconds]');
      if (!daysNode || !hoursNode || !minutesNode || !secondsNode) return;

      const end = new Date(endDate).getTime();
      if (Number.isNaN(end)) return;

      const tick = () => {
        const now = Date.now();
        const delta = Math.max(0, end - now);

        const days = Math.floor(delta / (1000 * 60 * 60 * 24));
        const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((delta / (1000 * 60)) % 60);
        const seconds = Math.floor((delta / 1000) % 60);

        daysNode.textContent = String(days).padStart(2, '0');
        hoursNode.textContent = String(hours).padStart(2, '0');
        minutesNode.textContent = String(minutes).padStart(2, '0');
        secondsNode.textContent = String(seconds).padStart(2, '0');
      };

      tick();
      setInterval(tick, 1000);
    });
  };

  const setupHotspots = () => {
    document.querySelectorAll('.image-hotspots__canvas').forEach((canvas) => {
      const toggles = [...canvas.querySelectorAll('[data-hotspot-toggle]')];
      const cards = [...canvas.querySelectorAll('[data-hotspot-card]')];

      toggles.forEach((toggle, index) => {
        toggle.addEventListener('click', () => {
          const card = cards[index];
          if (!card) return;

          const expanded = toggle.getAttribute('aria-expanded') === 'true';

          toggles.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
          cards.forEach((item) => {
            item.hidden = true;
          });

          toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          card.hidden = expanded;
        });
      });
    });
  };

  setupPredictiveSearch();
  setupSectionReveal();
  setupRecentlyViewedTracking();
  setupRecentlyViewedRender();
  setupProductRecommendations();
  setupCollectionViewToggle();
  setupBeforeAfter();
  setupCountdowns();
  setupHotspots();
})();
