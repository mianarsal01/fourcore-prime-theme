document.documentElement.classList.remove('no-js');

window.FourCoreTheme = window.FourCoreTheme || {};

const THEME = window.FourCoreTheme;

const formatMoney = (amount) => {
  if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
    return window.Shopify.formatMoney(amount);
  }

  const currency = document.documentElement.dataset.currency || 'USD';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount || 0) / 100);
};

const debounce = (callback, wait = 220) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), wait);
  };
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const withWidth = (url, width) => `${url}${url.includes('?') ? '&' : '?'}width=${width}`;

THEME.utils = { formatMoney, debounce, escapeHtml, withWidth };

const stickyHeaderState = {
  header: null,
  target: null,
  onScroll: null,
  observer: null
};

const getStickyTarget = (header) => {
  if (!header) return null;
  const sectionWrapper = header.closest('[id^="shopify-section-"]');

  if (sectionWrapper) {
    sectionWrapper.classList.add('fourcore-sticky-target');
    return sectionWrapper;
  }

  return header;
};

const toggleStickyClass = (target, className, force) => {
  if (!target) return;
  target.classList.toggle(className, force);
};

const resetStickyHeaderClasses = (target) => {
  if (!target) return;
  target.classList.remove('is-sticky-active', 'is-sticky-hidden');
};

const teardownStickyHeader = () => {
  if (stickyHeaderState.onScroll) {
    window.removeEventListener('scroll', stickyHeaderState.onScroll);
    stickyHeaderState.onScroll = null;
  }

  if (stickyHeaderState.observer) {
    stickyHeaderState.observer.disconnect();
    stickyHeaderState.observer = null;
  }
};

const setupStickyHeader = () => {
  const header = document.querySelector('[data-header]');
  teardownStickyHeader();

  if (!header) {
    stickyHeaderState.header = null;
    stickyHeaderState.target = null;
    return;
  }

  const target = getStickyTarget(header);

  if (stickyHeaderState.target && stickyHeaderState.target !== target) {
    resetStickyHeaderClasses(stickyHeaderState.target);
  }

  stickyHeaderState.header = header;
  stickyHeaderState.target = target;
  resetStickyHeaderClasses(target);

  const mode = (header.dataset.stickyMode || 'on_scroll_up').toLowerCase();
  if (mode === 'disabled' || mode === 'none') return;

  if (mode === 'always') {
    const onScrollAlways = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const headerHeight = target ? target.offsetHeight : header.offsetHeight;

      if (currentScroll > headerHeight + 1) {
        toggleStickyClass(target, 'is-sticky-active', true);
        toggleStickyClass(target, 'is-sticky-hidden', true);
      }

      if (currentScroll > headerHeight + 2) {
        toggleStickyClass(target, 'is-sticky-hidden', false);
      }

      if (currentScroll < headerHeight) {
        resetStickyHeaderClasses(target);
      }
    };

    window.addEventListener('scroll', onScrollAlways, { passive: true });
    stickyHeaderState.onScroll = onScrollAlways;
    onScrollAlways();
    return;
  }

  let currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  let headerBounds = {
    top: 0,
    bottom: target ? target.offsetHeight : header.offsetHeight
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (!entry) return;

      if (entry.intersectionRect && entry.intersectionRect.height > 0) {
        headerBounds = {
          top: entry.intersectionRect.top,
          bottom: entry.intersectionRect.bottom
        };
      }
    });

    observer.observe(target || header);
    stickyHeaderState.observer = observer;
  }

  const onScrollReveal = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetHeight = target ? target.offsetHeight : header.offsetHeight;
    const hideThreshold = Math.max(headerBounds.bottom, targetHeight);

    if (scrollTop > currentScrollTop && scrollTop > hideThreshold + 2) {
      toggleStickyClass(target, 'is-sticky-active', true);
      toggleStickyClass(target, 'is-sticky-hidden', true);
    } else if (scrollTop < currentScrollTop && scrollTop > hideThreshold + 2) {
      toggleStickyClass(target, 'is-sticky-active', true);
      toggleStickyClass(target, 'is-sticky-hidden', false);
    } else if (scrollTop <= headerBounds.top + 1) {
      resetStickyHeaderClasses(target);
    }

    currentScrollTop = scrollTop;
  };

  window.addEventListener('scroll', onScrollReveal, { passive: true });
  stickyHeaderState.onScroll = onScrollReveal;
  onScrollReveal();
};

const darkMode = {
  storageKey: '_color_schema',
  mediaQuery: null,
  initialized: false
};

const getStoredScheme = () => {
  try {
    const value = localStorage.getItem(darkMode.storageKey);
    return value === 'dark' || value === 'light' || value === 'auto' ? value : null;
  } catch (error) {
    return null;
  }
};

const getLegacyStoredScheme = () => {
  try {
    const legacy = localStorage.getItem('fourcore_dark_mode');
    if (legacy === 'true') return 'dark';
    if (legacy === 'false') return 'light';
    return null;
  } catch (error) {
    return null;
  }
};

const setStoredScheme = (value) => {
  try {
    localStorage.setItem(darkMode.storageKey, value);
  } catch (error) {
    return;
  }
};

const resolveDarkScheme = (scheme) => {
  if (scheme === 'dark') return true;
  if (scheme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getCurrentScheme = () => document.documentElement.getAttribute('data-scheme') || 'auto';

const syncDarkModeToggles = () => {
  const scheme = getCurrentScheme();
  const isDark = resolveDarkScheme(scheme);

  document.querySelectorAll('[data-dark-mode-toggle]').forEach((toggle) => {
    toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toggle.classList.toggle('is-active', isDark);

    const label = toggle.querySelector('[data-dark-mode-label]');
    if (label) label.textContent = isDark ? 'On' : 'Off';
  });
};

const applyDarkScheme = (scheme, persist = false) => {
  const root = document.documentElement;
  const normalizedScheme = scheme === 'dark' || scheme === 'light' || scheme === 'auto' ? scheme : 'auto';
  const isDark = resolveDarkScheme(normalizedScheme);

  root.classList.add('scheme-toggled');
  root.setAttribute('data-scheme', normalizedScheme);
  root.classList.toggle('theme-dark', isDark);
  window.setTimeout(() => root.classList.remove('scheme-toggled'), 100);

  if (persist) setStoredScheme(normalizedScheme);

  syncDarkModeToggles();
};

const setupDarkModeToggle = () => {
  const defaultScheme = getCurrentScheme();
  const initialScheme = getStoredScheme() || getLegacyStoredScheme() || defaultScheme;
  applyDarkScheme(initialScheme, false);

  if (!darkMode.initialized) {
    darkMode.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemSchemeChange = () => {
      if (getCurrentScheme() === 'auto') applyDarkScheme('auto', false);
    };

    if (typeof darkMode.mediaQuery.addEventListener === 'function') {
      darkMode.mediaQuery.addEventListener('change', handleSystemSchemeChange);
    } else if (typeof darkMode.mediaQuery.addListener === 'function') {
      darkMode.mediaQuery.addListener(handleSystemSchemeChange);
    }

    darkMode.initialized = true;
  }

  document.querySelectorAll('[data-dark-mode-toggle]').forEach((toggle) => {
    if (toggle.dataset.bound === 'true') return;

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const currentScheme = getCurrentScheme();
      const isDark = resolveDarkScheme(currentScheme);
      const nextScheme = isDark ? 'light' : 'dark';
      applyDarkScheme(nextScheme, true);

      toggle.classList.remove('is-animating');
      // Restart the pulse animation for each state change.
      void toggle.offsetWidth;
      toggle.classList.add('is-animating');
    });

    toggle.dataset.bound = 'true';
  });
};

const countryCodeToFlag = (countryCode = '') => {
  const normalized = String(countryCode || '')
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalized)) return normalized;

  return [...normalized].map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join('');
};

const setupLocalizationDisclosures = (scope = document) => {
  scope.querySelectorAll('[data-country-iso]').forEach((node) => {
    if (node.dataset.flagBound === 'true') return;
    const iso = String(node.dataset.countryIso || '')
      .trim()
      .toUpperCase();

    node.textContent = countryCodeToFlag(iso);

    node.dataset.flagBound = 'true';
  });

  const disclosures = [...scope.querySelectorAll('[data-localization-disclosure]')];
  disclosures.forEach((disclosure) => {
    if (disclosure.dataset.bound === 'true') return;

    const trigger = disclosure.querySelector('summary');
    trigger?.addEventListener('click', () => {
      document.querySelectorAll('[data-localization-disclosure][open]').forEach((openDisclosure) => {
        if (openDisclosure !== disclosure) openDisclosure.removeAttribute('open');
      });
    });

    disclosure.querySelectorAll('button[type="submit"]').forEach((button) => {
      button.addEventListener('click', () => {
        disclosure.removeAttribute('open');
      });
    });

    disclosure.dataset.bound = 'true';
  });

  if (document.body.dataset.localizationDisclosuresBound !== 'true') {
    document.addEventListener('click', (event) => {
      document.querySelectorAll('[data-localization-disclosure][open]').forEach((disclosure) => {
        if (!disclosure.contains(event.target)) disclosure.removeAttribute('open');
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      document.querySelectorAll('[data-localization-disclosure][open]').forEach((disclosure) => {
        disclosure.removeAttribute('open');
      });
    });

    document.body.dataset.localizationDisclosuresBound = 'true';
  }
};

const closeShopDropdown = (dropdown) => {
  if (!dropdown) return;
  dropdown.removeAttribute('open');
  const toggle = dropdown.querySelector('[data-shop-dropdown-toggle]');
  dropdown.classList.remove('is-open');
  toggle?.setAttribute('aria-expanded', 'false');
};

const closeAllShopDropdowns = (except = null) => {
  document.querySelectorAll('[data-shop-dropdown][open], [data-shop-dropdown].is-open').forEach((dropdown) => {
    if (except && dropdown === except) return;
    closeShopDropdown(dropdown);
  });
};

const syncShopDropdownState = (dropdown) => {
  if (!dropdown) return;
  const toggle = dropdown.querySelector('[data-shop-dropdown-toggle]');
  const isOpen = dropdown.hasAttribute('open') || dropdown.classList.contains('is-open');
  dropdown.classList.toggle('is-open', isOpen);
  toggle?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
};

const setupHeaderShopDropdown = (scope = document) => {
  scope.querySelectorAll('[data-shop-dropdown]').forEach((dropdown) => {
    if (dropdown.dataset.bound === 'true') return;

    const toggle = dropdown.querySelector('[data-shop-dropdown-toggle]');
    const panel = dropdown.querySelector('[data-shop-dropdown-panel]');
    if (!toggle || !panel) {
      closeShopDropdown(dropdown);
      return;
    }

    if (dropdown.tagName === 'DETAILS') {
      toggle.addEventListener('click', () => {
        if (!dropdown.hasAttribute('open')) closeAllShopDropdowns(dropdown);
      });

      dropdown.addEventListener('toggle', () => {
        syncShopDropdownState(dropdown);
        if (dropdown.hasAttribute('open')) closeAllShopDropdowns(dropdown);
      });
    } else {
      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const willOpen = !dropdown.classList.contains('is-open');
        closeAllShopDropdowns(willOpen ? dropdown : null);

        if (willOpen) {
          dropdown.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
        } else {
          closeShopDropdown(dropdown);
        }
      });
    }

    dropdown.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeShopDropdown(dropdown);
      if (event.target.closest('[data-shop-dropdown-panel]')) {
        event.preventDefault();
        toggle.focus();
      }
    });

    panel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeShopDropdown(dropdown);
      });
    });

    syncShopDropdownState(dropdown);
    dropdown.dataset.bound = 'true';
  });

  if (document.body.dataset.shopDropdownGlobalBound === 'true') return;

  document.addEventListener('click', (event) => {
    document.querySelectorAll('[data-shop-dropdown][open], [data-shop-dropdown].is-open').forEach((dropdown) => {
      if (dropdown.contains(event.target)) return;
      closeShopDropdown(dropdown);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeAllShopDropdowns();
  });

  document.body.dataset.shopDropdownGlobalBound = 'true';
};

const setupMobileDrawer = () => {
  const button = document.querySelector('[data-mobile-nav-toggle]');
  const drawer = document.querySelector('[data-mobile-nav-drawer]');
  const close = document.querySelector('[data-mobile-nav-close]');

  if (!button || !drawer || !close || drawer.dataset.bound === 'true') return;

  const openDrawer = () => drawer.classList.add('is-open');
  const closeDrawer = () => drawer.classList.remove('is-open');

  button.addEventListener('click', openDrawer);
  close.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
  });

  drawer.dataset.bound = 'true';
};

const setupQuantity = (scope = document) => {
  scope.querySelectorAll('[data-quantity]').forEach((wrapper) => {
    if (wrapper.dataset.bound === 'true') return;

    const input = wrapper.querySelector('input');
    const [decrease, increase] = wrapper.querySelectorAll('button');

    if (!input || !decrease || !increase) return;

    decrease.addEventListener('click', () => {
      const value = Math.max(1, Number(input.value || 1) - 1);
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    increase.addEventListener('click', () => {
      const value = Number(input.value || 1) + 1;
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    wrapper.dataset.bound = 'true';
  });
};

const cartDrawer = {
  drawer: null,
  items: null,
  subtotal: null,
  countNodes: [],
  progressFill: null,
  progressMessage: null,
  noteField: null,
  noteButton: null,
  threshold: 0
};

const renderCartProgress = (cart) => {
  if (!cartDrawer.progressFill || !cartDrawer.progressMessage) return;

  if (cartDrawer.threshold <= 0) {
    cartDrawer.progressFill.style.width = '100%';
    cartDrawer.progressMessage.textContent = 'Free shipping is enabled.';
    return;
  }

  const ratio = Math.min(1, cart.total_price / cartDrawer.threshold);
  cartDrawer.progressFill.style.width = `${Math.round(ratio * 100)}%`;

  if (cart.total_price >= cartDrawer.threshold) {
    cartDrawer.progressMessage.textContent = 'You unlocked free shipping.';
  } else {
    cartDrawer.progressMessage.textContent = `${formatMoney(cartDrawer.threshold - cart.total_price)} away from free shipping.`;
  }
};

const renderCartItems = (cart) => {
  if (!cartDrawer.items) return;

  if (!cart.items.length) {
    cartDrawer.items.innerHTML = '<p data-cart-empty-message>Your cart is empty.</p>';
    return;
  }

  cartDrawer.items.innerHTML = cart.items
    .map(
      (item, index) => `
        <article class="cart-drawer__item" data-line="${index + 1}">
          <a href="${item.url}" class="cart-drawer__item-media" tabindex="-1">
            ${
              item.image
                ? `<img src="${withWidth(item.image, 180)}" width="90" height="90" loading="lazy" alt="${escapeHtml(item.product_title)}">`
                : ''
            }
          </a>
          <div>
            <a href="${item.url}">${escapeHtml(item.product_title)}</a>
            ${item.variant_title && !item.variant_title.includes('Default Title') ? `<p>${escapeHtml(item.variant_title)}</p>` : ''}
            <p>${formatMoney(item.final_line_price)}</p>
            <div class="quantity" data-cart-line-quantity>
              <button type="button" data-cart-quantity-change="-1" aria-label="Decrease quantity">-</button>
              <input type="number" value="${item.quantity}" min="0" readonly>
              <button type="button" data-cart-quantity-change="1" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-drawer__remove" data-cart-remove>Remove</button>
          </div>
        </article>
      `
    )
    .join('');
};

const updateCartUi = (cart) => {
  if (cartDrawer.subtotal) cartDrawer.subtotal.textContent = formatMoney(cart.total_price);

  cartDrawer.countNodes.forEach((node) => {
    node.textContent = String(cart.item_count);
  });

  if (cartDrawer.noteField) {
    cartDrawer.noteField.value = cart.note || '';
  }

  renderCartItems(cart);
  renderCartProgress(cart);
};

const fetchCart = async () => {
  const response = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Unable to fetch cart');
  return response.json();
};

const refreshCart = async () => {
  const cart = await fetchCart();
  updateCartUi(cart);
  return cart;
};

const openCartDrawer = () => {
  if (!cartDrawer.drawer) return;
  cartDrawer.drawer.classList.add('is-open');
  cartDrawer.drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-drawer-open');
};

const closeCartDrawer = () => {
  if (!cartDrawer.drawer) return;
  cartDrawer.drawer.classList.remove('is-open');
  cartDrawer.drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-drawer-open');
};

const setupCartDrawer = () => {
  cartDrawer.drawer = document.querySelector('[data-cart-drawer]');
  if (!cartDrawer.drawer || cartDrawer.drawer.dataset.bound === 'true') return;

  cartDrawer.items = cartDrawer.drawer.querySelector('[data-cart-drawer-items]');
  cartDrawer.subtotal = cartDrawer.drawer.querySelector('[data-cart-subtotal]');
  cartDrawer.countNodes = [...document.querySelectorAll('[data-cart-count]')];
  cartDrawer.progressFill = cartDrawer.drawer.querySelector('[data-cart-progress-fill]');
  cartDrawer.progressMessage = cartDrawer.drawer.querySelector('[data-cart-progress-message]');
  cartDrawer.noteField = cartDrawer.drawer.querySelector('[data-cart-note]');
  cartDrawer.noteButton = cartDrawer.drawer.querySelector('[data-cart-note-save]');
  cartDrawer.threshold = Number(cartDrawer.drawer.dataset.freeShippingThreshold || 0);

  document.querySelectorAll('[data-cart-drawer-open]').forEach((trigger) => {
    trigger.addEventListener('click', async (event) => {
      if (event.currentTarget.tagName === 'A') event.preventDefault();

      try {
        await refreshCart();
        openCartDrawer();
      } catch (error) {
        return;
      }
    });
  });

  cartDrawer.drawer.querySelectorAll('[data-cart-drawer-close]').forEach((button) => {
    button.addEventListener('click', closeCartDrawer);
  });

  cartDrawer.drawer.addEventListener('click', async (event) => {
    const lineRoot = event.target.closest('[data-line]');
    if (!lineRoot) return;

    const line = Number(lineRoot.dataset.line);
    if (!line) return;

    if (event.target.matches('[data-cart-remove]')) {
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line, quantity: 0 })
      });
      await refreshCart();
      return;
    }

    if (event.target.matches('[data-cart-quantity-change]')) {
      const delta = Number(event.target.dataset.cartQuantityChange || 0);
      const input = lineRoot.querySelector('input');
      const current = Number(input?.value || 0);
      const next = Math.max(0, current + delta);

      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line, quantity: next })
      });
      await refreshCart();
    }
  });

  if (cartDrawer.noteButton && cartDrawer.noteField) {
    cartDrawer.noteButton.addEventListener('click', async () => {
      await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ note: cartDrawer.noteField.value })
      });
      await refreshCart();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCartDrawer();
  });

  cartDrawer.drawer.dataset.bound = 'true';
};

const setupAjaxAddToCart = () => {
  if (document.body.dataset.ajaxBound === 'true') return;

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-product-form]');
    if (!form) return;

    const submitter = event.submitter;
    if (submitter && !submitter.matches('[data-add-to-cart]')) return;

    event.preventDefault();

    const payload = new FormData(form);
    const button = submitter || form.querySelector('[data-add-to-cart]');
    const previousLabel = button ? button.textContent : null;

    if (button) {
      button.disabled = true;
      button.textContent = 'Adding...';
    }

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: payload
      });

      if (!response.ok) throw new Error('Unable to add item to cart');

      await refreshCart();
      openCartDrawer();
    } catch (error) {
      if (button) button.textContent = 'Unavailable';
    } finally {
      if (button) {
        button.disabled = false;
        if (previousLabel) button.textContent = previousLabel;
      }
    }
  });

  document.body.dataset.ajaxBound = 'true';
};

const initProductRoot = (root) => {
  if (!root || root.dataset.variantBound === 'true') return;

  const form = root.querySelector('[data-product-form]');
  const variantInput = form?.querySelector('[name="id"]');
  const variantDataNode = form?.querySelector('[data-variant-json]');
  const priceNode = root.querySelector('[data-product-price]');
  const compareNode = root.querySelector('[data-product-compare-price]');
  const inventoryNode = root.querySelector('[data-product-inventory]');
  const addButton = form?.querySelector('[data-add-to-cart]');
  const stickyAtc = root.querySelector('[data-sticky-atc]');
  const stickyPrice = root.querySelector('[data-sticky-atc-price]');
  const stickyButton = root.querySelector('[data-sticky-atc-submit]');
  const mediaList = root.querySelector('[data-product-gallery]');

  if (!form || !variantInput || !variantDataNode) return;

  let variants = [];
  try {
    variants = JSON.parse(variantDataNode.textContent);
  } catch (error) {
    return;
  }

  const optionGroups = [...root.querySelectorAll('[data-option-group]')];

  optionGroups.forEach((group) => {
    const radios = group.querySelectorAll('input[type="radio"]');
    const select = group.querySelector('[data-option-select]');

    radios.forEach((radio) => {
      radio.addEventListener('change', () => {
        if (select) select.value = radio.value;
        syncVariant();
      });
    });

    if (select) {
      select.addEventListener('change', () => {
        group.querySelectorAll('input[type="radio"]').forEach((radio) => {
          radio.checked = radio.value === select.value;
        });
        syncVariant();
      });
    }
  });

  const getSelectedOptions = () =>
    optionGroups.map((group) => {
      const checked = group.querySelector('input[type="radio"]:checked');
      if (checked) return checked.value;

      const select = group.querySelector('[data-option-select]');
      return select ? select.value : '';
    });

  const setAddState = (available) => {
    const label = available ? 'Add to cart' : 'Sold out';

    if (addButton) {
      addButton.disabled = !available;
      addButton.textContent = label;
    }

    if (stickyButton) {
      stickyButton.disabled = !available;
      stickyButton.textContent = label;
    }
  };

  const syncVariant = () => {
    const selected = getSelectedOptions();
    const match = variants.find((variant) =>
      variant.options.every((option, index) => option === selected[index])
    );

    if (!match) return;

    variantInput.value = match.id;

    if (priceNode) priceNode.textContent = formatMoney(match.price);
    if (stickyPrice) stickyPrice.textContent = formatMoney(match.price);

    if (compareNode) {
      if (match.compare_at_price && match.compare_at_price > match.price) {
        compareNode.hidden = false;
        compareNode.innerHTML = `<s>${formatMoney(match.compare_at_price)}</s>`;
      } else {
        compareNode.hidden = true;
        compareNode.innerHTML = '';
      }
    }

    if (inventoryNode) {
      const threshold = Number(inventoryNode.dataset.lowStockThreshold || 6);
      if (!match.available) {
        inventoryNode.textContent = 'Out of stock';
      } else if (typeof match.inventory_quantity === 'number') {
        inventoryNode.textContent =
          match.inventory_quantity <= threshold
            ? `Only ${match.inventory_quantity} left in stock`
            : `${match.inventory_quantity} in stock`;
      } else {
        inventoryNode.textContent = 'In stock';
      }
    }

    setAddState(match.available);

    if (match.featured_media && mediaList) {
      const mediaNode = mediaList.querySelector(`[data-media-id="${match.featured_media.id}"]`);
      if (mediaNode) {
        mediaList.querySelectorAll('.product__media-item').forEach((item) => item.classList.remove('is-active'));
        mediaNode.classList.add('is-active');
        mediaNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  if (stickyAtc && stickyButton && form.dataset.stickyBound !== 'true') {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        stickyAtc.hidden = entry.isIntersecting;
      },
      { threshold: 0.3 }
    );

    observer.observe(form);

    stickyButton.addEventListener('click', () => {
      const button = form.querySelector('[data-add-to-cart]');
      if (!button) return;

      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit(button);
      } else {
        button.click();
      }
    });

    form.dataset.stickyBound = 'true';
  }

  syncVariant();
  root.dataset.variantBound = 'true';
};

const setupVariantSelection = (scope = document) => {
  scope.querySelectorAll('[data-product-root]').forEach((root) => initProductRoot(root));
};

const setupQuickView = () => {
  const modal = document.querySelector('[data-quick-view-modal]');
  const content = modal?.querySelector('[data-quick-view-content]');
  if (!modal || !content || modal.dataset.bound === 'true') return;

  let triggerElement = null;

  const closeModal = () => {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('quick-view-open');
    content.innerHTML = '<p>Loading...</p>';

    if (triggerElement) {
      triggerElement.focus();
      triggerElement = null;
    }
  };

  const openModal = async (handle) => {
    if (!handle) return;

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('quick-view-open');
    content.innerHTML = '<p>Loading...</p>';

    try {
      const response = await fetch(`/products/${handle}?view=quick-view`, {
        headers: { Accept: 'text/html' }
      });
      if (!response.ok) throw new Error('Unable to load product quick view');

      content.innerHTML = await response.text();
      setupQuantity(content);
      setupVariantSelection(content);
    } catch (error) {
      content.innerHTML = '<p>Unable to load quick view right now.</p>';
    }
  };

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-quick-view-open]');
    if (opener) {
      event.preventDefault();
      triggerElement = opener;
      openModal(opener.dataset.productHandle);
      return;
    }

    const closer = event.target.closest('[data-quick-view-close]');
    if (closer) {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  modal.dataset.bound = 'true';
};

THEME.cart = {
  fetchCart,
  refreshCart,
  openCartDrawer,
  closeCartDrawer
};

THEME.reinitialize = (scope = document) => {
  setupQuantity(scope);
  setupVariantSelection(scope);
};

const loadEnhancements = () => {
  const src = THEME.enhancementsUrl;
  if (!src || document.querySelector('[data-theme-enhancements]')) return;

  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  script.dataset.themeEnhancements = 'true';
  document.head.appendChild(script);
};

setupMobileDrawer();
setupStickyHeader();
setupDarkModeToggle();
setupLocalizationDisclosures();
setupHeaderShopDropdown();
setupQuantity();
setupCartDrawer();
setupAjaxAddToCart();
setupVariantSelection();
setupQuickView();

document.addEventListener('shopify:section:load', (event) => {
  const scope = event.target || document;
  setupMobileDrawer();
  setupStickyHeader();
  setupDarkModeToggle();
  setupLocalizationDisclosures(scope);
  setupHeaderShopDropdown(scope);
  setupQuantity(scope);
  setupVariantSelection(scope);
  setupQuickView();
  setupCartDrawer();
});

if ('requestIdleCallback' in window) {
  requestIdleCallback(loadEnhancements, { timeout: 1600 });
} else {
  window.addEventListener('load', loadEnhancements, { once: true });
}
