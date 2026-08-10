import MobileMenu from "mmenu-light";
import Swal from "sweetalert2";
import Anime from "./partials/anime";
import initTootTip from "./partials/tooltip";
import AppHelpers from "./app-helpers";
import "./partials/quickvirw.js";
class App extends AppHelpers {
  constructor() {
    super();
    window.app = this;
  }

  loadTheApp() {
    this.commonThings();
    this.initiateNotifier();
    this.initiateMobileMenu();
    if (header_is_sticky) {
      this.initiateStickyMenu();
    }
    if (enable_side_cart) {
        this.init_SideCart();
    }
     if (is_animation) {
      this.animationSite();
    }
    this.initAddToCart();
    this.initiateDropdowns();
    this.initiateModals();
    this.initiateCollapse();
    this.initAttachWishlistListeners();

    // Ensure #more-menu-dropdown exists before running changeMenuDirection
    const menuDirInterval = setInterval(() => {
      if (document.querySelector("#more-menu-dropdown")) {
        this.changeMenuDirection();
        clearInterval(menuDirInterval);
      }
    }, 100);

    initTootTip();
    this.loadModalImgOnclick();

    salla.comment.event.onAdded(() => window.location.reload());

    this.status = "ready";
    document.dispatchEvent(new CustomEvent("theme::ready"));
    this.log("Theme Loaded 🎉");
  }

  log(message) {
    salla.log(`ThemeApp(Raed)::${message}`);
    return this;
  }
    getLocalizedMessage(key) {
    const lang = document.documentElement.lang || "ar";
    const messages = {
      ar: {
        clear_all: "\u062d\u0630\u0641 \u0627\u0644\u0643\u0644",
        clear_all_confirm: "\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0643\u0644 \u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u0633\u0644\u0629\u061f",
        "coupon_field_label": "كود الخصم",
        added: "تم اضافة المنتج لقائمة الأمنيات",
        removed: "تم حذف المنتج من قائمة الأمنيات",
      },
      en: {
        added: "Product added to wishlist",
        removed: "Product removed from wishlist",
        "coupon_field_label": "Coupon code",
        clear_all: "Clear all",
        clear_all_confirm: "Do you want to remove all items from the cart?",
      },
    };
    return messages[lang]?.[key] || messages["ar"][key] || key;
  }

  animationSite() {
  const banner = document.querySelector(".sg_main_banner");

  window.addEventListener("load", () => {
    if (banner) {
      banner.classList.add("show");
    }
  });

  document
    .querySelectorAll("section:not(.sg_main_banner)")
    .forEach((sec, i) => {
      sec.classList.add("reveal");
      sec.style.setProperty("--i", i);
    });

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        } else {
          entry.target.classList.remove("show");
        }
      });
    },
    { threshold: 0.12 }
  );

  document
    .querySelectorAll("section.reveal")
    .forEach((sec) => observer.observe(sec));
}
  initAttachWishlistListeners() {
    let isListenerAttached = false;

    function toggleFavoriteIcon(id, isAdded = true) {
      document
        .querySelectorAll('.s-product-card-wishlist-btn[data-id="' + id + '"]')
        .forEach((btn) => {
          app.toggleElementClassIf(
            btn,
            "s-product-card-wishlist-added",
            "not-added",
            () => isAdded,
          );
          app.toggleElementClassIf(
            btn,
            "pulse-anime",
            "un-favorited",
            () => isAdded,
          );
        });
    }

    if (!isListenerAttached) {
      salla.wishlist.event.onAdded((event, id) => {
        toggleFavoriteIcon(id);
        salla.notify.success(this.getLocalizedMessage("added"));
      });

      salla.wishlist.event.onRemoved((event, id) => {
        toggleFavoriteIcon(id, false);
        salla.notify.success(this.getLocalizedMessage("removed"));
      });

      isListenerAttached = true;
    }
  }
  changeMenuDirection() {
    setTimeout(() => {
      app.all(".root-level.has-children", (item) => {
        if (item.classList.contains("change-menu-dir")) return;
        app.on("mouseover", item, () => {
          let allSubMenus = item.querySelectorAll(".sub-menu");
          allSubMenus.forEach((submenu, idx) => {
            if (idx === 0) return;
            let rect = submenu.getBoundingClientRect();
            if (rect.left < 10 || rect.right > window.innerWidth - 10) {
              app.addClass(item, "change-menu-dir");
            }
          });
        });
      });
    }, 1000);
  }

  loadModalImgOnclick() {
    document.querySelectorAll(".load-img-onclick").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        let modal = document.querySelector("#" + link.dataset.modalId),
          img = modal.querySelector("img"),
          imgSrc = img.dataset.src;
        modal.open();

        if (img.classList.contains("loaded")) return;

        img.src = imgSrc;
        img.classList.add("loaded");
      });
    });
  }

  commonThings() {
    this.cleanContentArticles(".content-entry");
  }

  cleanContentArticles(elementsSelector) {
    let articleElements = document.querySelectorAll(elementsSelector);

    if (articleElements.length) {
      articleElements.forEach((article) => {
        article.innerHTML = article.innerHTML.replace(/\&nbsp;/g, " ");
      });
    }
  }

  isElementLoaded(selector) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (document.querySelector(selector)) {
          clearInterval(interval);
          return resolve(document.querySelector(selector));
        }
      }, 160);
    });
  }

  copyToClipboard(event) {
    event.preventDefault();
    let aux = document.createElement("input"),
      btn = event.currentTarget;
    aux.setAttribute("value", btn.dataset.content);
    document.body.appendChild(aux);
    aux.select();
    document.execCommand("copy");
    document.body.removeChild(aux);
    this.toggleElementClassIf(btn, "copied", "code-to-copy", () => true);
    setTimeout(() => {
      this.toggleElementClassIf(btn, "code-to-copy", "copied", () => true);
    }, 1000);
  }
  initiateNotifier() {
    salla.notify.setNotifier(function (message, type, data) {
      if (window.enable_add_product_toast && data?.data?.googleTags?.event === "addToCart") {
        return;
      }
      if (typeof message == 'object') {
        return Swal.fire(message).then(type);
      }

      return Swal.mixin({
        toast: true,
        position: salla.config.get('theme.is_rtl') ? 'top-start' : 'top-end',
        showConfirmButton: false,
        timer: 2000,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      }).fire({
        icon: type,
        title: message,
        showCloseButton: true,
        timerProgressBar: true
      })
    });
  }


  initiateMobileMenu() {

  this.isElementLoaded('#mobile-menu').then((menu) => {

 
  const mobileMenu = new MobileMenu(menu, "(max-width: 1024px)", "( slidingSubmenus: false)");

  salla.lang.onLoaded(() => {
    mobileMenu.navigation({ title: salla.lang.get('blocks.header.main_menu') });
  });
  const drawer = mobileMenu.offcanvas({ position: salla.config.get('theme.is_rtl') ? "right" : 'left' });

  this.onClick("a[href='#mobile-menu']", event => {
    document.body.classList.add('menu-opened');
    event.preventDefault() || drawer.close() || drawer.open()
    
  });
  this.onClick(".close-mobile-menu", event => {
    document.body.classList.remove('menu-opened');
    event.preventDefault() || drawer.close()
  });
  });

  }

  initiateStickyMenu() {
    let header = this.element('#mainnav'),
      height = this.element('#mainnav .inner')?.clientHeight;
    //when it's landing page, there is no header
    if (!header) {
      return;
    }

    window.addEventListener('load', () => setTimeout(() => this.setHeaderHeight(), 500))
    window.addEventListener('resize', () => this.setHeaderHeight())

    window.addEventListener('scroll', () => {
      window.scrollY >= header.offsetTop + height ? header.classList.add('fixed-pinned', 'animated') : header.classList.remove('fixed-pinned');
      window.scrollY >= 200 ? header.classList.add('fixed-header') : header.classList.remove('fixed-header', 'animated');
    }, { passive: true });
  }

  setHeaderHeight() {
    let height = this.element('#mainnav .inner').clientHeight,
      header = this.element('#mainnav');
    header.style.height = height + 'px';
  }

  initiateDropdowns() {
    this.onClick('.dropdown__trigger', ({ target: btn }) => {
      btn.parentElement.classList.toggle('is-opened');
      document.body.classList.toggle('dropdown--is-opened');
      // Click Outside || Click on close btn
      window.addEventListener('click', ({ target: element }) => {
        if (!element.closest('.dropdown__menu') && element !== btn || element.classList.contains('dropdown__close')) {
          btn.parentElement.classList.remove('is-opened');
          document.body.classList.remove('dropdown--is-opened');
        }
      });
    });
  }

  initiateModals() {
    this.onClick('[data-modal-trigger]', e => {
      let id = '#' + e.target.dataset.modalTrigger;
      this.removeClass(id, 'hidden');
      setTimeout(() => this.toggleModal(id, true)); //small amont of time to running toggle After adding hidden
    });
    salla.event.document.onClick("[data-close-modal]", e => this.toggleModal('#' + e.target.dataset.closeModal, false));
  }
  initFilters() {
    document.addEventListener(
      "click",
      function (event) {
        // ✅ Only run if viewport width is greater than 1024px
        if (window.innerWidth <= 1024) return;

        const title = event.target.closest(".desktop_side_filters .s-filters-widget-title");
        const isInsideDropdown = event.target.closest(
          ".desktop_side_filters .s-filters-widget-container",
        );

        // Handle toggle if a title was clicked
        if (title) {
          const widget = title.closest(".desktop_side_filters .s-filters-widget-container");
          if (!widget) return;

          const content = widget.querySelector(".desktop_side_filters .s-filters-widget-content");
          if (!content) return;

          // Remove any 'closed' class forcibly
          content.classList.remove("s-filters-widget-closed");

          // Toggle 'opened' class
          if (content.classList.contains("s-filters-widget-opened")) {
            content.classList.remove("s-filters-widget-opened");
          } else {
            // Close any other opened dropdowns first
            document
              .querySelectorAll(
                ".desktop_side_filters .s-filters-widget-content.s-filters-widget-opened",
              )
              .forEach((el) => {
                if (el !== content) {
                  el.classList.remove("s-filters-widget-opened");
                }
              });
            content.classList.add("s-filters-widget-opened");
          }

          // Prevent Salla’s default toggle logic
          event.stopImmediatePropagation();
          event.preventDefault();
        } else if (!isInsideDropdown) {
          // ✅ Clicked outside any dropdown -> close all
          document
            .querySelectorAll(
              ".desktop_side_filters .s-filters-widget-content.s-filters-widget-opened",
            )
            .forEach((el) => {
              el.classList.remove("s-filters-widget-opened");
            });
        }
      },
      true,
    ); // useCapture = true
    const productList = document.querySelector("salla-products-list");

    if (productList) {
      const observer = new MutationObserver(() => {
        // Close all open dropdowns when products update
        document
          .querySelectorAll(".desktop_side_filters .s-filters-widget-content.s-filters-widget-opened")
          .forEach((el) => {
            el.classList.remove("s-filters-widget-opened");
          });
      });

      // Observe changes in the content (e.g., product re-render)
      observer.observe(productList, {
        childList: true,
        subtree: true,
      });
    }
  }


  toggleModal(id, isOpen) {
    this.toggleClassIf(`${id} .s-salla-modal-overlay`, 'ease-out duration-300 opacity-100', 'opacity-0', () => isOpen)
      .toggleClassIf(`${id} .s-salla-modal-body`,
        'ease-out duration-300 opacity-100 translate-y-0 sm:scale-100', //add these classes
        'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95', //remove these classes
        () => isOpen)
      .toggleElementClassIf(document.body, 'modal-is-open', 'modal-is-closed', () => isOpen);
    if (!isOpen) {
      setTimeout(() => this.addClass(id, 'hidden'), 350);
    }
  }

  initiateCollapse() {
    document.querySelectorAll('.btn--collapse')
      .forEach((trigger) => {
        const content = document.querySelector('#' + trigger.dataset.show);
        if (!content) return;

        const state = { isOpen: false }

        const toggleState = (isOpen) => {
          state.isOpen = !isOpen;
          this.toggleElementClassIf([content, trigger], 'is-closed', 'is-opened', () => isOpen);
        }

        trigger.addEventListener('click', () => {
          const { isOpen } = state;
          toggleState(isOpen);
        });
      });
  }
  async init_SideCart() {
      const cartBtn = document.querySelector("#sidecart-button");
      const cartPanel = document.querySelector("#sidecart-panel");
      const overlay = document.querySelector("#sidecart-overlay");
      const submitBtn = document.querySelector("#sidecart-submit");
      const content = cartPanel.querySelector(".side-panel__content");
      const itemsWrap = cartPanel.querySelector("#sidecart-items");
      const total = cartPanel.querySelector("#sidecart-total");
      const subTotal = cartPanel.querySelector("#sidecart-subtotal");
      const totalDiscount = cartPanel.querySelector("#sidecart-total-discount");
      // const count = cartPanel.querySelector(".sidecart-products-count");
      const totalItemsEl = document.querySelectorAll(".cart-total-items");
      const footerPanel = cartPanel.querySelector("#sidecart-footer");
      const sideCouponInput = cartPanel.querySelector("#sidecart-coupon-input");
      const sideCouponBtn = cartPanel.querySelector("#sidecart-coupon-btn");
      const sideCouponError = cartPanel.querySelector("#sidecart-coupon-error");
      const sideCouponToggle = cartPanel.querySelector("#sidecart-coupon-toggle");
      const sideCouponToggleText = cartPanel.querySelector("#sidecart-coupon-toggle-text");
      const sideCouponSheet = cartPanel.querySelector("#sidecart-coupon-sheet");
      const sideCouponSheetOverlay = cartPanel.querySelector("#sidecart-coupon-sheet-overlay");
      const sideCouponClose = cartPanel.querySelector("#sidecart-coupon-close");
      const sidecartClearAllBtn = cartPanel.querySelector("#sidecart-clear-all");
      const isRtl = document.documentElement.dir === "rtl" || document.body.dir === "rtl";

      // Guard: abort if critical DOM elements are missing
      if (!cartPanel || !overlay || !itemsWrap || !content) {
        salla.log("Side cart init aborted — required DOM elements missing.");
        return;
      }

      // Set initial offscreen state
      cartPanel.style.transform = `translateX(${isRtl ? '100%' : '-100%'})`;
      cartPanel.style.visibility = "hidden";
      cartPanel.style.pointerEvents = "none";
      content.style.opacity = "0";
      content.style.transform = `translateX(${isRtl ? '10px' : '-10px'})`;

      // ═══════════════════════════════════════════
      //  View Management
      // ═══════════════════════════════════════════
      const toggleCart = (show) => {
        if (show) {
          document.dispatchEvent(new CustomEvent('modal:open', { detail: 'side-cart' }));
          cartPanel.style.visibility = "visible";
          cartPanel.style.pointerEvents = "auto";
          overlay.classList.remove("hidden");
          requestAnimationFrame(() => {
            overlay.classList.add("opacity-100");
            cartPanel.style.transform = "translateX(0)";
            content.style.opacity = "1";
            content.style.transform = "translateX(0)";
          });
        } else {
          toggleCouponSheet(false);
          overlay.classList.remove("opacity-100");
          const outX = isRtl ? "100%" : "-100%";
          cartPanel.style.transform = `translateX(${outX})`;
          content.style.opacity = "0";
          content.style.transform = `translateX(${isRtl ? '10px' : '-10px'})`;
          cartPanel.style.pointerEvents = "none";
          setTimeout(() => {
            overlay.classList.add("hidden");
            cartPanel.style.visibility = "hidden";
          }, 300);
        }
      };

      const toggleCouponSheet = (show) => {
        if (!sideCouponSheet || !sideCouponSheetOverlay) return;

        sideCouponToggle?.setAttribute("aria-expanded", show ? "true" : "false");
        sideCouponSheet.setAttribute("aria-hidden", show ? "false" : "true");

        if (show) {
          sideCouponSheetOverlay.classList.remove("hidden");
          requestAnimationFrame(() => {
            sideCouponSheetOverlay.classList.add("opacity-100");
            sideCouponSheet.style.transform = "translateY(0)";
          });
          setTimeout(() => sideCouponInput?.focus(), 320);
          return;
        }

        sideCouponSheetOverlay.classList.remove("opacity-100");
        sideCouponSheet.style.transform = "translateY(100%)";
        setTimeout(() => {
          if (sideCouponSheet.getAttribute("aria-hidden") === "true") {
            sideCouponSheetOverlay.classList.add("hidden");
          }
        }, 300);
      };

      const updateCouponToggleText = (coupon = '') => {
        if (!sideCouponToggleText) return;
        sideCouponToggleText.textContent = coupon || (this.getLocalizedMessage('coupon_field_label'));
      };

      const getSideCartItemIds = () => {
        return [...itemsWrap.querySelectorAll("form[id^='sidecart-item-'] input[name='id']")]
          .map(input => input.value)
          .filter(Boolean);
      };

      const clearSideCart = async () => {
        const ids = getSideCartItemIds();
        if (!ids.length || sidecartClearAllBtn?.disabled) return;

        if (!window.confirm(this.getLocalizedMessage('clear_all_confirm'))) return;

        const originalHtml = sidecartClearAllBtn.innerHTML;
        sidecartClearAllBtn.disabled = true;
        sidecartClearAllBtn.innerHTML = '<span class="sidecart-spinner"></span>';

        try {
          await Promise.all(ids.map(id => salla.cart.deleteItem(id)));
          await loadCart();
        } catch (err) {
          console.error("Side cart clear all failed:", err);
          salla.notify.error(salla.lang.get("common.messages.error_occurred") || "حدث خطأ");
        } finally {
          sidecartClearAllBtn.innerHTML = originalHtml;
          sidecartClearAllBtn.disabled = false;
        }
      };

      // ═══════════════════════════════════════════
      //  Loading Overlay Helpers
      // ═══════════════════════════════════════════
      function appendLoadingOverlay(formEl) {
        if (!formEl || formEl.querySelector('.sidecart-loading-overlay')) return;
        const ov = document.createElement('div');
        ov.className = 'sidecart-loading-overlay';
        ov.innerHTML = '<span class="sidecart-spinner"></span>';
        formEl.style.position = 'relative';
        formEl.appendChild(ov);
      }

      function removeLoadingOverlay(formEl) {
        if (!formEl) return;
        const ov = formEl.querySelector('.sidecart-loading-overlay');
        if (ov) ov.remove();
      }

      let sidecartCategoriesCache = {};

      function getSidecartCategoriesCacheKey(ids) {
        const lang = document.documentElement.lang || "ar";
        return `sidecart_categories_${lang}_${JSON.stringify(ids)}`;
      }

      function readSidecartCategoriesCache(ids) {
        const cacheKey = getSidecartCategoriesCacheKey(ids);
        if (sidecartCategoriesCache[cacheKey]) return sidecartCategoriesCache[cacheKey];

        try {
          const cached = sessionStorage.getItem(cacheKey);
          sidecartCategoriesCache[cacheKey] = cached ? JSON.parse(cached) : null;
          return sidecartCategoriesCache[cacheKey];
        } catch (e) {
          return null;
        }
      }

      function writeSidecartCategoriesCache(ids, categories) {
        const cacheKey = getSidecartCategoriesCacheKey(ids);
        sidecartCategoriesCache[cacheKey] = categories;

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(categories));
        } catch (e) {
          // Cache is optional; the empty cart still renders from fresh data.
        }
      }

      async function getSidecartCategories(ids) {
        const cached = readSidecartCategoriesCache(ids);
        if (cached) return cached;

        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await salla.product.categories(id);
              return res?.data || res;
            } catch (e) {
              console.warn("Failed category fetch:", id, e);
              return null;
            }
          })
        );

        const categories = results.filter(Boolean);
        if (categories.length) writeSidecartCategoriesCache(ids, categories);
        return categories;
      }

      async function renderSmartEmptyState() {
        const emptyEl = document.getElementById('sidecart-empty-state');

        console.log(emptyEl, "empty state container");
        if (!emptyEl) return;

        const categoriesSetting = window.categories_sidecart;

        console.log(categoriesSetting, "categories setting raw");

        let categories = [];

        const ids = categoriesSetting?.value || [];

        console.log(ids, "category ids");

        if (ids.length > 0) {
          try {
            categories = await getSidecartCategories(ids);
          } catch (e) {
            console.warn("Failed to fetch sidecart categories", e);
          }
        }

        console.log(categories, "final categories");

        if (categories.length > 0) {

          let html = `
            <div class="text-center mb-8">
              <div class="mx-auto w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <i class="sicon-shopping-bag text-4xl text-gray-400"></i>
              </div>

              <h3 class="font-semibold text-lg mb-1">
                ${salla.lang.get("pages.cart.empty_cart") || "السلة فارغة"}
              </h3>

              <p class="text-gray-500 text-sm">
                ابدأ بالتسوق من الفئات المميزة
              </p>
            </div>

            <div class="space-y-2">
          `;

          categories.forEach(cat => {

            const image =
              cat?.image?.url ||
              cat?.image ||
              null;

            const icon = cat?.icon || "sicon-grid";

            const name = cat?.name || cat?.title || "Category";

            const url = cat?.url || `/category/${cat?.slug || cat?.id}`;

            html += `
              <a href="${url}"
                class="group flex items-center gap-4 p-4 rounded-3xl hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-100">

                <!-- IMAGE / ICON -->
                <div class="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-100 ring-1 ring-gray-100 flex-shrink-0">

                  ${image ? `
                    <img src="${image}"
                        alt="${name}"
                        class="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300">
                  ` : `
                    <i class="${icon} text-xl text-gray-500 group-hover:scale-110 transition-transform"></i>
                  `}

                </div>

                <!-- NAME -->
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm line-clamp-1 group-hover:text-secondary transition-colors">
                    ${name}
                  </p>
                </div>

                <!-- ARROW -->
                <i class="sicon-arrow-${isRtl ? 'left' : 'right'} text-xl text-gray-400 group-hover:translate-x-1 transition-transform"></i>

              </a>
            `;
          });

          html += `</div>`;

          // CTA
          html += `
            <button onclick="document.querySelector('.menu-close')?.click()"
                    class="mt-8 w-full flex items-center justify-center gap-2 border border-font text-font py-3.5 rounded-full font-medium hover:bg-font hover:text-background transition-all">
              <i class="sicon-shopping-bag"></i>
              ${isRtl ? 'متابعة التسوق' : 'Continue Shopping'}
            </button>
          `;

          emptyEl.innerHTML = html;

        } else {

          // DEFAULT EMPTY CART
          emptyEl.innerHTML = `
            <div class="text-center justify-center mt-12 py-10 text-gray-500 flex flex-col items-center gap-6">

              <svg class="max-h-[172px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 463 358" fill="none"></svg>

              <p class="text-lg font-medium">
                ${salla.lang.get("pages.cart.empty_cart") || "السلة فارغة"}
              </p>

              <button onclick="document.querySelector('.menu-close')?.click()"
                      class="close-side-panel w-full flex items-center justify-center gap-2 bg-primary text-secondary py-3.5 rounded-full hover:bg-secondary hover:text-font transition-all font-semibold">

                <i class="sicon-shopping-bag text-lg"></i>

                <span>${isRtl ? 'متابعة التسوق' : 'Continue Shopping'}</span>
              </button>

            </div>
          `;
        }
      }
      // ═══════════════════════════════════════════
      //  Core Cart Loader
      // ═══════════════════════════════════════════
      async function loadCart() {
        // Do NOT refresh side cart on the cart page — avoids race conditions
        // with the cart page's <salla-button id="coupon-btn"> component.
        if (salla.config.get('page.slug') === 'cart') return;
        const currentLang = document.documentElement.lang || "ar";

        function enToArNumbers(value) {
          if (value === null || value === undefined) return value;
          const en = ["0","1","2","3","4","5","6","7","8","9"];
          const ar = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
          return String(value).replace(/\d/g, d => ar[en.indexOf(d)]);
        }

        try {
          const res = await salla.api.cart.details();
          const cart = res.data.cart || { items: [], count: 0, total: 0, sub_total: 0, total_discount: 0 };
          const items = cart.items || [];

          // Badge counts
          const totalItems = items.length;
          totalItemsEl.forEach(el => {
            el.style.display = totalItems ? "flex" : "none";
            el.textContent = window.arabic_numbers_enabled ? enToArNumbers(totalItems) : String(totalItems);
          });

          // Reset coupon UI state on every load (will be reconfigured below if coupon exists)
          if (sideCouponInput) {
            sideCouponInput.value = '';
            sideCouponInput.disabled = false;
            sideCouponInput.classList.remove('has-error');
            if (sideCouponBtn) {
              sideCouponBtn.classList.remove('has-coupon');
              const cs = sideCouponBtn.querySelector('.coupon-text');
              const ci = sideCouponBtn.querySelector('.sicon-cancel');
              if (cs) cs.classList.remove('hidden');
              if (ci) ci.classList.add('hidden');
            }
          }
          if (sideCouponError) sideCouponError.textContent = '';

          if (items.length) {
            if (footerPanel) footerPanel.style.display = "";
            if (submitBtn) submitBtn.style.display = "flex";
            if (sidecartClearAllBtn) sidecartClearAllBtn.style.display = "inline-flex";
            // count.textContent = `(${cart.count} ${currentLang === "ar" ? "منتج" : "product"})`;

            itemsWrap.innerHTML = items.map(item => {
              const itemUrl = item.product_url || salla.url.get("*/p" + item.product_id);
              const img = item.product_image || "https://cdn.salla.sa/form-builder/l48OVh1I5UsWqxsN8cNwutoWTK8OS4r1iUVjYD3B.webp";
              const hasOptions = item.options && item.options.length > 0;
              const optionsJson = hasOptions
                ? JSON.stringify(item.options).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                : '[]';

              return `
                <form id="sidecart-item-${item.id}" onchange="salla.form.onChange('cart.updateItem', event)" class="cart-item p-2 rtl:pl-0 ltr:pr-0 border-b relative block last-of-type:border-b-0">
                  <input type="hidden" name="id" value="${item.id}">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex flex-1 gap-4 rtl:space-x-reverse items-center">
                      <a href="${itemUrl}" class="w-20 h-20 flex-shrink-0 self-start">
                        <img src="${img}" alt="${item.product_name}" class="w-full h-full object-contain" loading="lazy" />
                      </a>
                      <div class="space-y-1 min-w-0 flex-1">
                        ${!item.is_taxable ? `<small class="text-gray-400">${salla.lang.get("pages.products.tax_included") || "الضريبة مشمولة"}</small>` : ""}
                        <h2 class="text-sm font-medium">
                          <a href="${itemUrl}" class="line-clamp-2">${item.product_name}</a>
                        </h2>

                        <div class="flex items-center gap-1.5 pt-1">
                          <span class="text-sm text-gray-500 line-through ${item.offer ? "" : "hidden"}">${salla.money(item.product_price)}</span>
                          <span class="item-price font-semibold text-sm">${salla.money(item.price)}</span>
                        </div>

                        ${item.offer ? `
                        <div class="flex items-center gap-1 text-xs text-emerald-600">
                          <i class="sicon-discount-calculator"></i>
                          <span>${item.offer.names}</span>
                        </div>` : ""}



                        ${hasOptions ? `
                        <div class="sidecart-product-options mt-3">
                          <salla-product-options
                            options='${optionsJson}'
                            product-id="${item.product_id}">
                          </salla-product-options>
                        </div>` : ""}
                       ${item.type !== 'donating' && !item.is_hidden_quantity ? `
                        <div class="sidecart-qty-wrap !mt-3">
                          <salla-quantity-input
                            cart-item-id="${item.id}"
                            max="${item.max_quantity || ''}"
                            value="${item.quantity}"
                            name="quantity"
                            aria-label="Quantity">
                          </salla-quantity-input>
                        </div>` : (item.is_hidden_quantity ? `<input type="hidden" value="${item.quantity}" name="quantity">` : '')}
                      </div>
                    </div>
                    <button type="button"
                      class="sidecart-delete-btn text-gray-400 hover:text-red-500 transition-colors absolute top-2 rtl:left-0 ltr:right-0"
                      data-item-id="${item.id}"
                      aria-label="${salla.lang.get("common.elements.remove") || "إزالة"}">
                      <i class="sicon-cancel text-lg text-red-500 hover:rotate-45 transition-transform"></i>
                    </button>
                  </div>
                </form>`;
            }).join("");

            total.innerHTML = salla.money(cart.total);
            subTotal.innerHTML = cart.sub_total ? salla.money(cart.sub_total) : "";
            totalDiscount.innerHTML = cart.total_discount ? `- ${salla.money(cart.total_discount)}` : salla.money(0);

            // Show coupon row when items exist
            const couponWrap = cartPanel.querySelector("#sidecart-coupon-wrap");
            if (couponWrap) couponWrap.style.display = "";

            if (sideCouponInput) {
              if (cart.coupon) {
                sideCouponInput.value = cart.coupon;
                sideCouponInput.disabled = true;
                updateCouponToggleText(cart.coupon);
                sideCouponBtn?.classList.add('has-coupon');
                const couponSpan = sideCouponBtn?.querySelector('.coupon-text');
                const couponIcon = sideCouponBtn?.querySelector('.sicon-cancel');
                if (couponSpan) couponSpan.classList.add('hidden');
                if (couponIcon) couponIcon.classList.remove('hidden');
              } else {
                sideCouponInput.value = '';
                sideCouponInput.disabled = false;
                updateCouponToggleText();
                sideCouponBtn?.classList.remove('has-coupon');
                const couponSpan = sideCouponBtn?.querySelector('.coupon-text');
                const couponIcon = sideCouponBtn?.querySelector('.sicon-cancel');
                if (couponSpan) couponSpan.classList.remove('hidden');
                if (couponIcon) couponIcon.classList.add('hidden');
              }
            }

          } else {
    // Hide coupon row when cart is empty
              const couponWrap = cartPanel.querySelector("#sidecart-coupon-wrap");
              if (couponWrap) couponWrap.style.display = "none";
              toggleCouponSheet(false);
              updateCouponToggleText();

              // Hide footer elements
              if (footerPanel) footerPanel.style.display = "none";
              if (submitBtn) submitBtn.style.display = "none";
              if (sidecartClearAllBtn) sidecartClearAllBtn.style.display = "none";

              // Clear and prepare empty state container
              itemsWrap.innerHTML = `
                  <div id="sidecart-empty-state" class="py-8"></div>
              `;

              // Render smart empty state with categories
              renderSmartEmptyState();
          }
        } catch (err) {
          console.error("Side cart fetch failed:", err);
          itemsWrap.innerHTML = `<div class="p-4 text-sm text-red-500">${salla.lang.get("common.messages.error_occurred") || "حدث خطأ"}</div>`;
        }
      }

      // ═══════════════════════════════════════════
      //  Event Delegation: Delete
      // ═══════════════════════════════════════════
      itemsWrap.addEventListener("click", async (e) => {
        const btn = e.target.closest(".sidecart-delete-btn");
        if (!btn) return;

        e.preventDefault();
        const id = btn.dataset.itemId;
        if (!id || btn.disabled) return;

        btn.disabled = true;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="sidecart-spinner"></span>';

        try {
          await salla.cart.deleteItem(id);
          // cart events fire → loadCart rebuilds the DOM automatically
        } catch (err) {
          console.error("Side cart delete failed:", err);
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          salla.notify.error(salla.lang.get("common.messages.error_occurred") || "حدث خطأ");
        }
      });

      // ═══════════════════════════════════════════
      //  Loading State: show overlay on form change
      // ═══════════════════════════════════════════
      sidecartClearAllBtn?.addEventListener("click", clearSideCart);

      itemsWrap.addEventListener("change", (e) => {
        const form = e.target.closest("form[id^='sidecart-item-']");
        if (form) appendLoadingOverlay(form);
      });

      // When an item update fails (e.g. quantity exceeds max), reload the cart
      // from the API to rebuild the DOM with correct values — this restores the
      // quantity input to its previous valid value, matching the cart page UX.
      salla.cart.event.onItemUpdatedFailed((_data, itemId) => {
        const form = itemsWrap.querySelector(`#sidecart-item-${itemId}`);
        removeLoadingOverlay(form);
        loadCart();
      });

      // ═══════════════════════════════════════════
      //  Event Subscriptions
      // ═══════════════════════════════════════════
      salla.event.cart.onUpdated(loadCart);
      salla.event.cart.onItemAdded(loadCart);
      salla.event.cart.onItemDeleted(loadCart);
      document.addEventListener("salla:cart:updated", loadCart);

      // ═══════════════════════════════════════════
      //  Coupon Handling
      // ═══════════════════════════════════════════
      if (sideCouponInput && sideCouponBtn) {
        sideCouponToggle?.addEventListener("click", () => toggleCouponSheet(true));
        sideCouponClose?.addEventListener("click", () => toggleCouponSheet(false));
        sideCouponSheetOverlay?.addEventListener("click", () => toggleCouponSheet(false));

        sideCouponInput.addEventListener("keyup", (e) => {
          if (e.keyCode === 13) sideCouponBtn.click();
          if (sideCouponError) sideCouponError.textContent = '';
          sideCouponInput.classList.remove('has-error');
        });

        sideCouponBtn.addEventListener("click", async () => {
          const hasCoupon = sideCouponBtn.classList.contains('has-coupon');
          if (!hasCoupon && !sideCouponInput.value.trim()) {
            if (sideCouponError) sideCouponError.textContent = '* ' + (salla.lang.get('pages.checkout.enter_coupon') || 'Please enter a coupon');
            sideCouponInput.classList.add('has-error');
            return;
          }
          // Show loading on button
          const origHtml = sideCouponBtn.innerHTML;
          sideCouponBtn.innerHTML = '<span class="sidecart-spinner"></span>';
          sideCouponBtn.disabled = true;
          try {
            const res = hasCoupon ? await salla.cart.deleteCoupon() : await salla.cart.addCoupon(sideCouponInput.value.trim());
            // Toggle coupon state based on response
            if (res?.data?.cart) {
              const coupon = res.data.cart.coupon;
              if (coupon && !hasCoupon) {
                sideCouponInput.disabled = true;
                updateCouponToggleText(coupon);
                sideCouponBtn.classList.add('has-coupon');
                const cs = sideCouponBtn.querySelector('.coupon-text');
                const ci = sideCouponBtn.querySelector('.sicon-cancel');
                if (cs) cs.classList.add('hidden');
                if (ci) ci.classList.remove('hidden');
              } else if (!coupon && hasCoupon) {
                sideCouponInput.value = '';
                sideCouponInput.disabled = false;
                updateCouponToggleText();
                sideCouponBtn.classList.remove('has-coupon');
                const cs = sideCouponBtn.querySelector('.coupon-text');
                const ci = sideCouponBtn.querySelector('.sicon-cancel');
                if (cs) cs.classList.remove('hidden');
                if (ci) ci.classList.add('hidden');
              }
              if (sideCouponError) sideCouponError.textContent = '';
            }
          } catch (err) {
            if (sideCouponError) {
              sideCouponError.textContent = err?.response?.data?.error?.message || (salla.lang.get('pages.checkout.error_occurred') || 'An error occurred');
            }
            if (!hasCoupon) sideCouponInput.classList.add('has-error');
          } finally {
            sideCouponBtn.innerHTML = origHtml;
            sideCouponBtn.disabled = false;
          }
        });
      }

      // Initial load
      await loadCart();

      // ═══════════════════════════════════════════
      //  Action Hooks
      // ═══════════════════════════════════════════
      submitBtn?.addEventListener("click", () => {
        salla.cart.submit();
        toggleCart(false);
      });

      cartBtn?.addEventListener("click", () => {
        const isVisible = cartPanel.style.visibility === "visible";
        toggleCart(!isVisible);
      });

      // Use event delegation so dynamically-injected close buttons (e.g. empty-cart state) also work
      cartPanel.addEventListener("click", (e) => {
        if (e.target.closest(".menu-close") || e.target.closest(".close-side-panel")) {
          toggleCart(false);
        }
      });

      document.addEventListener('modal:open', (e) => {
        if (e.detail !== 'side-cart' && cartPanel.style.visibility === "visible") {
          toggleCart(false);
        }
      });
      overlay?.addEventListener("click", () => toggleCart(false));
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (sideCouponSheet?.getAttribute("aria-hidden") === "false") {
          toggleCouponSheet(false);
          return;
        }
        toggleCart(false);
      });
  }
  /**
   * Workaround for seeking to simplify & clean, There are three ways to use this method:
   * 1- direct call: `this.anime('.my-selector')` - will use default values
   * 2- direct call with overriding defaults: `this.anime('.my-selector', {duration:3000})`
   * 3- return object to play it letter: `this.anime('.my-selector', false).duration(3000).play()` - will not play animation unless calling play method.
   * @param {string|HTMLElement} selector
   * @param {object|undefined|null|null} options - in case there is need to set attributes one by one set it `false`;
   * @return {Anime|*}
   */
  anime(selector, options = null) {
    let anime = new Anime(selector, options);
    return options === false ? anime : anime.play();
  }

  /**
   * These actions are responsible for pressing "add to cart" button,
   * they can be from any page, especially when mega-menu is enabled
   */
  initAddToCart() {
    salla.cart.event.onUpdated((summary) => {
      document
        .querySelectorAll("[data-cart-total]")
        .forEach((el) => (el.innerHTML = salla.money(summary.total)));
      document
        .querySelectorAll("[data-cart-count]")
        .forEach((el) => (el.innerText = salla.helpers.number(summary.count)));
    });

    salla.cart.event.onItemAdded((response, prodId) => {
      app
        .element("salla-cart-summary")
        .animateToCart(app.element(`#product-${prodId} img`));
    });
  }
}

salla.onReady(() => new App().loadTheApp());
