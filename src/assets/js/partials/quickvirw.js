import { quickView, getCachedProductDetails } from '../utils';

class QuickView {
  constructor() {
    this.drawer = document.querySelector('.quick-view');
    this.overlay = document.querySelector('.quick-view-overlay');
    this.closeBtn = this.drawer?.querySelector('.quick-view-close');
    this.optionsObserver = null;

    this.init();
  }

  init() {
    quickView.onOpen((product) => this.open(product));
    quickView.onClose(() => this.close());

    this.overlay?.addEventListener('click', () => quickView.close());
    this.closeBtn?.addEventListener('click', () => quickView.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') quickView.close();
    });

    this.drawer
      ?.querySelector('.qv-buy-now')
      ?.addEventListener('click', () => this.buyNow());
  }

  async open(product) {
    this.product = product;

    document.body.classList.add('overflow-hidden');
    this.toggleDrawer(true);
    this.toggleLoading(true);

    if (!product.images?.length || !product.options) {
      try {
        const details = await getCachedProductDetails(product.id);
        this.product = { ...product, ...details };
      } catch (e) {
        console.error('QuickView: failed to load product details', e);
      }
    }

    this.render();
    this.toggleLoading(false);
  }

  close() {
    document.body.classList.remove('overflow-hidden');
    this.toggleDrawer(false);
    this.optionsObserver?.disconnect();
  }

  toggleDrawer(open) {
    this.overlay.classList.toggle('opacity-0', !open);
    this.overlay.classList.toggle('invisible', !open);
    this.drawer.classList.toggle('translate-x-full', !open);
  }

  toggleLoading(state) {
    const el = this.drawer.querySelector('.qv-loading');
    el?.classList.toggle('hidden', !state);
    el?.classList.toggle('flex', state);
  }

  // ---------- Gallery (Swiper via salla-slider) ----------
  renderGallery() {
    const wrapper = this.drawer.querySelector('.qv-slider-wrapper');
    const images = this.product.images?.length
      ? this.product.images
      : [{ url: this.product.image?.url }];

    const slides = images
      .map(
        (img, i) => `
        <div class="w-full h-full">
          <img src="${img.url}" alt="${img.alt || this.product.name}"
            class="w-full h-full object-cover" loading="${i === 0 ? 'eager' : 'lazy'}" />
        </div>`
      )
      .join('');

    wrapper.innerHTML = `
      <salla-slider
        id="qv-slider"
        type="default"
        show-controls="true"
        class="w-full h-full block"
        slider-config='{
          "slidesPerView": 1.2,
          "spaceBetween": 16,
          "navigation": true,
          "pagination": { "type": "fraction" }
        }'
      >
        <div slot="items">${slides}</div>
      </salla-slider>
    `;
  }

  // ---------- Price ----------
  renderPrice() {
    const p = this.product;
    const wrapper = this.drawer.querySelector('.qv-price-wrapper');

    if (p.is_on_sale) {
      wrapper.innerHTML = `
        <span class="text-font font-bold text-xl">${salla.money(p.sale_price)}</span>
        <span class="text-gray-400 line-through text-base">${salla.money(p.regular_price)}</span>
      `;
    } else if (p.starting_price) {
      wrapper.innerHTML = `
        <span class="text-gray-500 text-sm">${salla.lang.get('pages.products.starting_price')}</span>
        <span class="font-bold text-xl">${salla.money(p.starting_price)}</span>
      `;
    } else {
      wrapper.innerHTML = `<span class="font-bold text-xl">${salla.money(p.price)}</span>`;
    }
  }

  // ---------- Stock ----------
  renderStock() {
      const p = this.product;
      const el = this.drawer.querySelector('.qv-stock');

      const isAr = document.documentElement.lang.startsWith('ar');

      const t = {
          inStock: isAr ? 'متوفر' : 'In Stock',
          outOfStock: isAr ? 'نفدت الكمية' : 'Out of Stock',
          remained: isAr ? 'متبقي' : 'left',
      };

      if (p.is_out_of_stock) {
          el.innerHTML = `
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span class="text-red-600">${t.outOfStock}</span>
          `;
          return;
      }

      if (p.unlimited_quantity || !p.quantity) {
          el.innerHTML = `
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              <span class="text-green-600">${t.inStock}</span>
          `;
          return;
      }

      el.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          <span class="text-green-600">
              ${salla.helpers.number(p.quantity)} ${t.remained}
          </span>
      `;
  }

  // ---------- Options (salla-product-options + تحويل لـ pills) ----------
  renderOptions() {
    const wrapper = this.drawer.querySelector('.qv-options');
    wrapper.innerHTML = '';

    if (!this.product.options?.length) return;

    // ⚠️ تأكد من الصيغة الصح اللي الكومبوننت محتاجها فعليًا
    const safeOptions = JSON.stringify(this.product.options).replace(/"/g, '&quot;');

    wrapper.innerHTML = `
      <salla-product-options
        options="${safeOptions}"
        product-id="${this.product.id}">
      </salla-product-options>
    `;

    this.watchAndConvertOptions(wrapper);
  }

  watchAndConvertOptions(container) {
    this.optionsObserver?.disconnect();

    this.optionsObserver = new MutationObserver(() => {
      if (container.querySelector('.s-product-options-option-content select')) {
        this.convertSelectsToPills(container);
      }
    });
    this.optionsObserver.observe(container, { childList: true, subtree: true });

    setTimeout(() => this.convertSelectsToPills(container), 200);
  }

  convertSelectsToPills(container) {
    container.querySelectorAll('.s-product-options-option-content select').forEach((select) => {
      if (select.dataset.converted) return;
      select.dataset.converted = 'true';

      const name = select.getAttribute('name');
      const optionWrapper = select.closest('.s-product-options-option');
      const titleEl = optionWrapper?.querySelector('.s-product-options-option-label');
      if (titleEl) titleEl.classList.add('font-semibold', 'text-sm');

      const grid = document.createElement('div');
      grid.className = 'flex flex-wrap gap-2 mt-2';

      select.querySelectorAll('option').forEach((opt) => {
        if (!opt.value) return;

        const id = `qv-${name}-${opt.value}`;
        const pill = document.createElement('label');
        pill.setAttribute('for', id);
        pill.className = `cursor-pointer px-4 py-2 rounded-full border text-sm transition select-none
          ${opt.selected ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:border-black'}`;

        pill.innerHTML = `
          <input type="radio" id="${id}" name="dummy_${name}" value="${opt.value}" class="hidden" ${opt.selected ? 'checked' : ''} />
          ${opt.textContent.trim()}
        `;

        pill.querySelector('input').addEventListener('change', () => {
          select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));

          grid.querySelectorAll('label').forEach((l) =>
            l.classList.remove('bg-black', 'text-white', 'border-black')
          );
          grid.querySelectorAll('label').forEach((l) =>
            l.classList.add('border-gray-300', 'text-gray-700')
          );
          pill.classList.add('bg-black', 'text-white', 'border-black');
          pill.classList.remove('border-gray-300', 'text-gray-700');
        });

        grid.appendChild(pill);
      });

      select.insertAdjacentElement('afterend', grid);
      select.classList.add('hidden');
      select.style.display = 'none';
    });
  }

  // ---------- Add to cart button ----------
  bindAddButton() {
    const btn = this.drawer.querySelector('.qv-add-btn');
    btn.setAttribute('product-id', this.product.id);
    btn.setAttribute('product-status', this.product.status);
    btn.setAttribute('product-type', this.product.type);

    const idInput = this.drawer.querySelector('.qv-product-id');
    if (idInput) {
      idInput.value = this.product.id;
    }
  }

  // ---------- Buy Now ----------
  buyNow() {
    const addBtn = this.drawer.querySelector('.qv-add-btn');
    if (!addBtn) return;
    
    const handleAdd = () => {
      salla.cart.submit();
      cleanup();
    };
    
    const cleanup = () => {
      window.removeEventListener('salla:cart:itemAdded', handleAdd);
      document.removeEventListener('cart::item.added', handleAdd);
    };

    window.addEventListener('salla:cart:itemAdded', handleAdd, { once: true });
    document.addEventListener('cart::item.added', handleAdd, { once: true });
    
    // Fallback cleanup in case of validation failure or API error
    setTimeout(cleanup, 5000);

    addBtn.click();
  }

  render() {
    this.renderGallery();
    this.drawer.querySelector('.qv-title').textContent = this.product.name;
    this.renderPrice();
    this.renderStock();
    this.drawer.querySelector('.qv-description').textContent = this.product.description || '';
    this.renderOptions();
    this.bindAddButton();

    const link = this.drawer.querySelector('.qv-full-details');
    if (link) link.href = this.product.url || '#';
  }
}

export default new QuickView();