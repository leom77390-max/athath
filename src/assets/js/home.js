import "lite-youtube-embed";
import BasePage from "./base-page";
import Lightbox from "fslightbox";
window.fslightbox = Lightbox;

class Home extends BasePage {
  onReady() {
    this.initFeaturedTabs();
    this.initFeaturedProducts();
  }

  /**
   * used in views/components/home/featured-products-style*.twig
   */
  initFeaturedTabs() {
    app.all(".tab-trigger", (el) => {
      el.addEventListener("click", ({ currentTarget: btn }) => {
        let id = btn.dataset.componentId;
        // btn.setAttribute('fill', 'solid');
        app
          .toggleClassIf(
            `#${id} .tabs-wrapper>div`,
            "is-active opacity-0 translate-y-3",
            "inactive",
            (tab) => tab.id == btn.dataset.target,
          )
          .toggleClassIf(
            `#${id} .tab-trigger`,
            "is-active",
            "inactive",
            (tabBtn) => tabBtn == btn,
          );

        // fadeIn active tabe
        setTimeout(
          () =>
            app.toggleClassIf(
              `#${id} .tabs-wrapper>div`,
              "opacity-100 translate-y-0",
              "opacity-0 translate-y-3",
              (tab) => tab.id == btn.dataset.target,
            ),
          100,
        );
      });
    });
    document
      .querySelectorAll(".s-block-tabs")
      .forEach((block) => block.classList.add("tabs-initialized"));
  }
  initFeaturedProducts() {
    const section = document.getElementById("featured-products");
    if (!section) return;

Salla.onReady(async () => {
    const section = document.getElementById('featured-products');
    if (!section) return;

    const component = JSON.parse(section.dataset.component || '{}');

    const tabs = component.tabs || [];
    const tabsProducts = component.tabs_products || [];

    const productsIds = [...new Set(tabsProducts.flatMap(item => item.products || []))];

    const productsMap = {};
    await Promise.all(
        productsIds.map(async (id) => {
            try {
                const response = await salla.product.getDetails(id, ['images', 'category']);
                productsMap[id] = response.data || response;
            } catch (err) {
                console.error('Product load failed', id, err);
            }
        })
    );

    const tabsData = tabs.map(tab => {
        const items = tabsProducts
            .filter(i => i.tab_id === tab.tab_id)
            .map(item => ({
                ...item,
                products: (item.products || []).map(pid => productsMap[pid]).filter(Boolean)
            }));
        return { ...tab, items };
    });

    const tabsContainer   = document.getElementById('tabs-container');
    const contentContainer = document.getElementById('tab-content');
    const mobileSelect    = document.getElementById('mobile-tab-select');
    const mobileDesc      = document.getElementById('mobile-tab-desc');

    let activeTabId = tabsData[0]?.tab_id;
    let isAnimating = false;

    /* ── Populate mobile dropdown ── */
    function renderMobileSelect() {
        mobileSelect.innerHTML = tabsData.map(tab =>
            `<option value="${tab.tab_id}">${tab.title}</option>`
        ).join('');
        mobileSelect.value = activeTabId;
        mobileDesc.textContent = tabsData.find(t => t.tab_id === activeTabId)?.description || '';

        mobileSelect.addEventListener('change', () => {
            if (isAnimating || mobileSelect.value === activeTabId) return;
            activeTabId = mobileSelect.value;
            mobileDesc.textContent = tabsData.find(t => t.tab_id === activeTabId)?.description || '';
            renderTabs();
            animateContent();
        });
    }

    /* ── Bind add-to-cart buttons ── */
    function bindCartButtons() {
        contentContainer.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (btn.classList.contains('loading')) return;
                const productId = Number(btn.dataset.productId);
                try {
                    btn.classList.add('loading');
                    btn.disabled = true;
                    await salla.cart.quickAdd(productId);
                    btn.classList.remove('loading');
                    btn.classList.add('success');
                    setTimeout(() => {
                        btn.classList.remove('success');
                        btn.disabled = false;
                    }, 1500);
                } catch (error) {
                    console.error(error);
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            });
        });
    }

    /* ── Build cards HTML ── */
    function buildHTML(active) {
        const pairedCards = active.items.map(item =>
            item.products.map((p) => ({ media: item, product: p }))
        ).flat();

        return pairedCards.map(({ media, product }) => {
            const mediaHtml = media.media_type?.includes('video') && media.video_url
                ? `<video src="${media.video_url}" autoplay muted loop playsinline></video>`
                : `<img src="${media.image || ''}" alt="${product?.name || ''}" loading="lazy" />`;

            const productHtml = product ? `
                <div class="product-overlay">
                    <img src="${product.image?.url || ''}" alt="${product.name}" />
                    <div style="flex:1; min-width:0;">
                        <p style="font-size:0.8rem;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${product.name}</p>
                        <p style="font-size:0.75rem;color:#6b7280;">${product.price} ${product.currency || ''}</p>
                    </div>
                    <button class="add-btn add-to-cart-btn" data-product-id="${product.id}" aria-label="Add to cart">
                        <span class="btn-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <path d="M16 10a4 4 0 01-8 0"/>
                            </svg>
                        </span>
                        <span class="btn-loader" style="display:none">
                            <div class="spinner"></div>
                        </span>
                        <span class="btn-success">✓</span>
                    </button>
                </div>
            ` : '';

            return `<div class="media-card">${mediaHtml}${productHtml}</div>`;
        }).join('');
    }

    /* ── Render desktop tabs ── */
    function renderTabs() {
        tabsContainer.innerHTML = tabsData.map(tab => `
            <button data-tab="${tab.tab_id}" class="tab-btn ${tab.tab_id === activeTabId ? 'active' : ''}">
                <span class="tab-title">
                    <span class="tab-check" aria-hidden="true">
                        <svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg>
                    </span>
                    ${tab.title}
                </span>
                ${tab.description ? `<p class="tab-desc">${tab.description}</p>` : ''}
            </button>
        `).join('');

        tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (isAnimating || btn.dataset.tab === activeTabId) return;
                activeTabId = btn.dataset.tab;
                mobileSelect.value = activeTabId;
                mobileDesc.textContent = tabsData.find(t => t.tab_id === activeTabId)?.description || '';
                renderTabs();
                animateContent();
            });
        });
    }

    /* ── Animate content on tab switch ── */
    function animateContent() {
        const active = tabsData.find(t => t.tab_id === activeTabId);
        if (!active) return;

        isAnimating = true;

        // Step 1: fade out
        contentContainer.classList.remove('is-entering');
        contentContainer.classList.add('is-leaving');

        setTimeout(() => {
            // Step 2: swap content
            contentContainer.classList.remove('is-leaving');
            contentContainer.innerHTML = buildHTML(active);
            bindCartButtons();

            // Step 3: force reflow then fade in
            void contentContainer.offsetHeight;
            contentContainer.classList.add('is-entering');

            // Mark cards done after animation so opacity stays 1
            const cards = contentContainer.querySelectorAll('.media-card');
            cards.forEach((card, i) => {
                setTimeout(() => card.classList.add('done'), i * 60 + 320);
            });

            // Unlock after last card animates
            setTimeout(() => {
                contentContainer.classList.remove('is-entering');
                isAnimating = false;
            }, cards.length * 60 + 350);

        }, 180);
    }

    /* ── Init ── */
    renderMobileSelect();
    renderTabs();

    const firstActive = tabsData.find(t => t.tab_id === activeTabId);
    if (firstActive) {
        contentContainer.innerHTML = buildHTML(firstActive);
        bindCartButtons();
        contentContainer.querySelectorAll('.media-card').forEach(c => c.classList.add('done'));
    }
});

  }
}

Home.initiateWhenReady(["index"]);
