class NavigationMenu extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
            <div class="main-menu-skel" aria-hidden="true">
                <span class="header-skel-item header-skel-item--menu" style="width:80px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:60px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:90px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:70px"></span>
                <span class="header-skel-item header-skel-item--menu" style="width:80px"></span>
            </div>`;

    // Cache للمنتجات عشان منطلبش أكتر من مرة
    this.productsCache = {};

    salla
      .onReady()
      .then(() => salla.lang.onLoaded())
      .then(() => {
        this.menus = [];
        this.displayAllText = salla.lang.get("blocks.home.display_all");
        this.moreText = salla.lang.get("common.titles.more");
        this.visibleMenus = [];
        this.overflowMenus = [];

        return salla.api.component
          .getMenus()
          .then(({ data }) => {
            this.menus = data;
            return this.render();
          })
          .then(() => {
            this.initializeResponsiveMenu();
            this.initializeMegaMenu(); // 👈 هنا بنشغل الميجا منيو
          })
          .catch((error) =>
            salla.logger.error("salla-menu::Error fetching menus", error),
          );
      });
  }

  hasChildren(menu) {
    return menu?.children?.length > 0;
  }

  hasProducts(menu) {
    return menu?.products?.length > 0;
  }

  getDesktopClasses(menu, isRootMenu) {
    return `!hidden lg:!block ${isRootMenu ? "root-level lg:!inline-block" : "relative"} ${menu.products ? " mega-menu" : ""}
        ${this.hasChildren(menu) ? " has-children" : ""}`;
  }

  getMobileMenu(menu, displayAllText) {
    const menuImage = menu.image
      ? `<img src="${menu.image}" class="rounded-full" width="48" height="48" alt="${menu.title}" />`
      : "";

    return `
        <li class="lg:hidden text-sm font-bold" ${menu.attrs}>
            ${
              !this.hasChildren(menu)
                ? `
                <a href="${menu.url}" aria-label="${menu.title || "category"}" class="text-gray-500 ${menu.image ? "!py-3" : ""}" ${menu.link_attrs}>
                    ${menuImage}
                    <span>${menu.title || ""}</span>
                </a>`
                : `
                <span class="${menu.image ? "!py-3" : ""}">
                    ${menuImage}
                    ${menu.title}
                </span>
                <ul>
                    <li class="text-sm font-bold">
                        <a href="${menu.url}" class="text-gray-500">${displayAllText}</a>
                    </li>
                    ${menu.children.map((subMenu) => this.getMobileMenu(subMenu, displayAllText)).join("")}
                </ul>
            `
            }
        </li>`;
  }

  getDesktopMenu(menu, isRootMenu, additionalClasses = "") {
    // استخراج الـ category ID من الـ URL
    const categoryId = this.extractCategoryId(menu.url);

    return `
        <li class="${this.getDesktopClasses(menu, isRootMenu)} ${additionalClasses}" 
            ${menu.attrs} 
            data-menu-item
            ${isRootMenu && categoryId ? `data-category-id="${categoryId}" data-category-url="${menu.url}"` : ""}>
            <a href="${menu.url}" aria-label="${menu.title || "category"}" ${menu.link_attrs}>
                <span>${menu.title}</span>
            </a>
            ${
              this.hasChildren(menu)
                ? `
                <div class="sub-menu ${this.hasProducts(menu) ? "w-full left-0 flex" : "w-56"}">
                    <ul class="${this.hasProducts(menu) ? "w-56 shrink-0 m-8 rtl:ml-0 ltr:mr-0" : ""}">
                        ${menu.children.map((subMenu) => this.getDesktopMenu(subMenu, false)).join("\n")}
                    </ul>
                    ${
                      this.hasProducts(menu)
                        ? `
                    <salla-products-list
                        source="selected"
                        shadow-on-hover
                        source-value="[${menu.products}]" />`
                        : ""
                    }
                </div>`
                : ""
            }
        </li>`;
  }

  /**
   * استخراج الـ Category ID من الـ URL
   */
  extractCategoryId(url) {
    if (!url) return null;
    // بيجيب الـ ID من آخر الـ URL زي c145655181
    const match = url.match(/c(\d+)$/);
    return match ? match[1] : null;
  }

  getMenus() {
    return this.menus
      .map(
        (menu) => `
            ${this.getMobileMenu(menu, this.displayAllText)}
            ${this.getDesktopMenu(menu, true)}
        `,
      )
      .join("\n");
  }

  createMoreDropdown() {
    if (this.overflowMenus.length === 0) return "";

    return `
        <li class="!hidden lg:!block root-level lg:!inline-block has-children relative" id="more-menu-dropdown">
            <a href="#" aria-label="${this.moreText}">
                <span>${this.moreText}</span>
            </a>
            <div class="sub-menu w-56">
                <ul>
                    ${this.overflowMenus.map((menu) => this.getDesktopMenu(menu, false)).join("\n")}
                </ul>
            </div>
        </li>`;
  }

  /**
   * تهيئة الميجا منيو على كل item في الهيدر
   */
  initializeMegaMenu() {
    if (window.innerWidth < 1024) return;

    const menuItems = this.querySelectorAll(
      ".root-level[data-menu-item][data-category-id]",
    );

    menuItems.forEach((item) => {
      const categoryId = item.getAttribute("data-category-id");
      const categoryUrl = item.getAttribute("data-category-url");
      if (!categoryId) return;

      let hoverTimeout;
      let leaveTimeout;

      item.addEventListener("mouseenter", () => {
        clearTimeout(leaveTimeout);
        hoverTimeout = setTimeout(() => {
          this.showMegaDropdown(item, categoryId, categoryUrl);
        }, 150); // تأخير بسيط عشان مش يفتح بالغلط
      });

      item.addEventListener("mouseleave", (e) => {
        clearTimeout(hoverTimeout);
        // نشوف لو الماوس راح على الـ dropdown نفسه
        const dropdown = item.querySelector(".mega-products-dropdown");
        if (dropdown && dropdown.contains(e.relatedTarget)) return;

        leaveTimeout = setTimeout(() => {
          this.hideMegaDropdown(item);
        }, 200);
      });
    });
  }

  /**
   * عرض الـ dropdown بالمنتجات
   */
  async showMegaDropdown(item, categoryId, categoryUrl) {
    // لو موجود خليه يظهر بس
    let dropdown = item.querySelector(".mega-products-dropdown");
    if (dropdown) {
      dropdown.classList.add("active");
      return;
    }

    // إنشاء الـ dropdown أول مرة مع loader
    dropdown = document.createElement("div");
    dropdown.className = "mega-products-dropdown";
    dropdown.innerHTML = `
            <div class="mega-dropdown-inner">
                <div class="mega-loader">
                    <span></span><span></span><span></span>
                </div>
            </div>`;
    item.appendChild(dropdown);

    // نمنع الـ dropdown من يقفل لو الماوس جوه
    dropdown.addEventListener("mouseenter", () => {
      item.querySelector(".mega-products-dropdown")?.classList.add("active");
    });
    dropdown.addEventListener("mouseleave", () => {
      this.hideMegaDropdown(item);
    });

    // نطلب المنتجات
    const products = await this.fetchCategoryProducts(categoryId);

    if (!products || products.length === 0) {
      item.removeChild(dropdown);
      return;
    }

    // نبني الـ slider
    dropdown.innerHTML = this.buildProductsSlider(products, categoryUrl);
    dropdown.classList.add("active");
    this.initSlider(dropdown);
  }

  /**
   * إخفاء الـ dropdown
   */
  hideMegaDropdown(item) {
    const dropdown = item.querySelector(".mega-products-dropdown");
    if (dropdown) {
      dropdown.classList.remove("active");
    }
  }

  /**
   * جلب منتجات التصنيف من الـ API مع Cache
   */
  async fetchCategoryProducts(categoryId) {
    if (this.productsCache[categoryId]) {
      return this.productsCache[categoryId];
    }

    try {
      const response = await salla.api.product.list({
        category: categoryId,
        limit: 8,
        page: 1,
      });
      const products = response?.data || [];
      this.productsCache[categoryId] = products;
      return products;
    } catch (error) {
      salla.logger.error("mega-menu::Error fetching products", error);
      return [];
    }
  }

  /**
   * بناء HTML الـ slider
   */
  buildProductsSlider(products, categoryUrl) {
    const currency = salla.money.getCurrency()?.symbol || "";

    const cards = products
      .map((product) => {
        const image = product.thumbnail || product.image?.url || "";
        const price = product.price?.amount || product.price || 0;
        const oldPrice =
          product.sale_price?.amount || product.regular_price?.amount || null;
        const formattedPrice = salla.money.format(price);
        const formattedOldPrice = oldPrice
          ? salla.money.format(oldPrice)
          : null;

        return `
            <div class="mega-product-card">
                <a href="${product.url}" class="mega-product-link">
                    <div class="mega-product-img-wrap">
                        <img src="${image}" alt="${product.name}" loading="lazy" />
                    </div>
                    <div class="mega-product-info">
                        <p class="mega-product-name">${product.name}</p>
                        <div class="mega-product-price">
                            <span class="mega-price-current">${formattedPrice}</span>
                            ${formattedOldPrice ? `<span class="mega-price-old">${formattedOldPrice}</span>` : ""}
                        </div>
                    </div>
                </a>
            </div>`;
      })
      .join("");

    return `
        <div class="mega-dropdown-inner">
            <div class="mega-slider-wrapper">
                <button class="mega-slider-btn mega-slider-prev" aria-label="prev">&#8249;</button>
                <div class="mega-slider-track-wrap">
                    <div class="mega-slider-track">
                        ${cards}
                    </div>
                </div>
                <button class="mega-slider-btn mega-slider-next" aria-label="next">&#8250;</button>
            </div>
            ${categoryUrl ? `<a href="${categoryUrl}" class="mega-view-all">عرض الكل</a>` : ""}
        </div>`;
  }

  /**
   * تشغيل الـ slider
   */
  initSlider(dropdown) {
    const track = dropdown.querySelector(".mega-slider-track");
    const prevBtn = dropdown.querySelector(".mega-slider-prev");
    const nextBtn = dropdown.querySelector(".mega-slider-next");
    if (!track || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    const visibleCount = 4; // كام card يظهر في نفس الوقت

    const getCardWidth = () => {
      const card = track.querySelector(".mega-product-card");
      return card ? card.offsetWidth + 16 : 200; // 16 = gap
    };

    const totalCards = track.querySelectorAll(".mega-product-card").length;
    const maxIndex = Math.max(0, totalCards - visibleCount);

    const slideTo = (index) => {
      currentIndex = Math.max(0, Math.min(index, maxIndex));
      const offset = currentIndex * getCardWidth();
      // RTL support
      const isRtl = document.documentElement.dir === "rtl";
      track.style.transform = isRtl
        ? `translateX(${offset}px)`
        : `translateX(-${offset}px)`;

      prevBtn.style.opacity = currentIndex === 0 ? "0.3" : "1";
      nextBtn.style.opacity = currentIndex >= maxIndex ? "0.3" : "1";
    };

    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isRtl = document.documentElement.dir === "rtl";
      slideTo(isRtl ? currentIndex + 1 : currentIndex - 1);
    });

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isRtl = document.documentElement.dir === "rtl";
      slideTo(isRtl ? currentIndex - 1 : currentIndex + 1);
    });

    slideTo(0);
  }

  initializeResponsiveMenu() {
    if (window.innerWidth < 1024) return;

    const mainMenu = this.querySelector(".main-menu");
    if (!mainMenu) return;

    const isMoreMenuEnabled = window.enable_more_menu;
    if (!isMoreMenuEnabled) return;

    this.checkMenuOverflow();

    const resizeHandler = this.debounce(() => {
      this.checkMenuOverflow();
    }, 250);

    window.addEventListener("resize", resizeHandler);
  }

  checkMenuOverflow() {
    const mainMenu = this.querySelector(".main-menu");
    if (!mainMenu) return;

    const container = mainMenu.closest(".container");
    if (!container) return;

    this.visibleMenus = [...this.menus];
    this.overflowMenus = [];

    const existingMore = mainMenu.querySelector("#more-menu-dropdown");
    if (existingMore) existingMore.remove();

    const menuItems = mainMenu.querySelectorAll(".root-level[data-menu-item]");
    menuItems.forEach((item) => {
      item.style.display = "";
    });

    const containerWidth = container.offsetWidth;
    const otherElements = container.querySelector(".flex").children;
    let usedWidth = 0;

    Array.from(otherElements).forEach((element) => {
      if (!element.contains(mainMenu)) usedWidth += element.offsetWidth;
    });

    const availableWidth = containerWidth - usedWidth - 300;
    let currentWidth = 0;
    let visibleCount = 0;

    menuItems.forEach((item, index) => {
      const itemWidth = item.offsetWidth;
      if (
        currentWidth + itemWidth <= availableWidth &&
        index < this.menus.length
      ) {
        currentWidth += itemWidth;
        visibleCount++;
      } else {
        item.style.setProperty("display", "none", "important");
        if (index < this.menus.length)
          this.overflowMenus.push(this.menus[index]);
      }
    });

    this.visibleMenus = this.menus.slice(0, visibleCount);

    if (this.overflowMenus.length > 0) {
      mainMenu.insertAdjacentHTML("beforeend", this.createMoreDropdown());
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  render() {
    this.innerHTML = `
        <nav id="mobile-menu" class="mobile-menu">
            <ul class="main-menu">${this.getMenus()}</ul>
            <button class="btn--close close-mobile-menu sicon-cancel lg:hidden"></button>
        </nav>
        <button class="btn--close-sm close-mobile-menu sicon-cancel hidden"></button>`;
  }
}

customElements.define("custom-main-menu", NavigationMenu);
