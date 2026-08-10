import 'lite-youtube-embed';
import BasePage from './base-page';
import Fslightbox from 'fslightbox';
window.fslightbox = Fslightbox;
import { zoom } from './partials/image-zoom';

class Product extends BasePage {
    onReady() {
        app.watchElements({
            totalPrice: '.total-price',
            productWeight: '.product-weight',
            beforePrice: '.before-price',
            startingPriceTitle: '.starting-price-title',
            productSku: '.product-sku',
        });

        this.initProductOptionValidations();

        if(imageZoom){
            // call the function when the page is ready
            this.initImagesZooming();
            // listen to screen resizing
            window.addEventListener('resize', () => this.initImagesZooming());
        }
            this.initSizeOptionSingle();
    this.observeSizeOptionSingle();
    }

    initProductOptionValidations() {
      document.querySelector('.product-form')?.addEventListener('change', function(){
        this.reportValidity() && salla.product.getPrice(new FormData(this));
      });
    }

    initImagesZooming() {
      // skip if the screen is not desktop or if glass magnifier
      // is already crated for the image before
      const imageZoom = document.querySelector('.image-slider .magnify-wrapper.swiper-slide-active .img-magnifier-glass');
      if (window.innerWidth  < 1024 || imageZoom) return;
      setTimeout(() => {
          // set delay after the resizing is done, start creating the glass
          // to create the glass in the proper position
          const image = document.querySelector('.image-slider .swiper-slide-active img');
          zoom(image?.id, 2);
      }, 250);
  

      document.querySelector('salla-slider.details-slider').addEventListener('slideChange', (e) => {
          // set delay till the active class is ready
          setTimeout(() => {
              const imageZoom = document.querySelector('.image-slider .swiper-slide-active .img-magnifier-glass');
    
              // if the zoom glass is already created skip
              if (window.innerWidth  < 1024 || imageZoom) return;
              const image = document.querySelector('.image-slider .magnify-wrapper.swiper-slide-active img');
              zoom(image?.id, 2);
          }, 250)
      })
    }

    registerEvents() {
      salla.event.on('product::price.updated.failed',()=>{
        app.element('.price-wrapper').classList.add('hidden');
        const outOfStock = app.element('.out-of-stock');
        outOfStock.classList.remove('hidden');
        outOfStock.classList.remove('scale-pulse');
        void outOfStock.offsetWidth; // trigger reflow
        outOfStock.classList.add('scale-pulse');
      })
      salla.product.event.onPriceUpdated((res) => {

        app.element('.out-of-stock').classList.add('hidden')
        app.element('.price-wrapper').classList.remove('hidden')

        let data = res.data,
            is_on_sale = data.has_sale_price && data.regular_price > data.price;

        app.startingPriceTitle?.classList.add('hidden');

        app.productWeight.forEach((el) => {el.innerHTML = data.weight || ''});
        app.totalPrice.forEach((el) => {el.innerHTML = salla.money(data.price)});
        app.beforePrice.forEach((el) => {el.innerHTML = salla.money(data.regular_price)});
        app.productSku.forEach((el) => {el.innerHTML = data.sku || ''});

        app.toggleClassIf('.price_is_on_sale','showed','hidden', ()=> is_on_sale)
        app.toggleClassIf('.starting-or-normal-price','hidden','showed', ()=> is_on_sale)

        document.querySelectorAll('.total-price, .product-weight').forEach(el => {
          el.classList.remove('scale-pulse');
          void el.offsetWidth; // trigger reflow
          el.classList.add('scale-pulse');
        });
      });

      app.onClick('#btn-show-more', e => app.all('#more-content', div => {
        e.target.classList.add('is-expanded');
        div.style = `max-height:${div.scrollHeight}px`;
      }) || e.target.remove());
    }
        initSizeOptionSingle() {
    // Find all containers with the exact data-option-type we want
    const containers = document.querySelectorAll(
      '.product-single .s-product-options-wrapper [data-option-type="single-option"]'
    );

    if (!containers.length) {
      console.warn("No container with data-option-type='single-option' found.");
      return;
    }

    containers.forEach((container) => {
      const select = container.querySelector("select");

      if (!select) {
        console.warn("No <select> found inside single-option container.");
        return;
      }

      const options = Array.from(select.options).filter(
        (opt) => opt.value.trim() !== ""
      );
      const radioContainer = document.createElement("div");
      radioContainer.classList.add("custom-radio-options");

      const radioButtons = [];
      const uniqueSuffix = Math.random().toString(36).substr(2, 9);

      options.forEach((option) => {
        const id = `option_${option.value}_${uniqueSuffix}`;

        const label = document.createElement("label");
        label.setAttribute("for", id);
        label.classList.add("radio-label");
        label.style.display = "block";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = select.name;
        radio.value = option.value;
        radio.id = id;
        radio.required = select.required;
        radio.classList.add("sr-only");

        label.appendChild(radio);
        label.append(` ${option.text}`);
        radioContainer.appendChild(label);

        radioButtons.push({ radio, label });

        radio.addEventListener("change", () => {
          radioButtons.forEach(({ label: lbl }) =>
            lbl.classList.remove("label_active")
          );
          label.classList.add("label_active");
        });
      });

      select.parentNode.replaceChild(radioContainer, select);
    });
  }
  observeSizeOptionSingle() {
    const target = document.querySelector(".product-single salla-product-options");
    if (!target) {
      console.warn("No <salla-product-options> element found in .product-single.");
      return;
    }

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          if (target.classList.contains("hydrated")) {
            observer.disconnect(); // stop observing
            this.initSizeOptionSingle(); // run after hydration
          }
        }
      }
    });

    observer.observe(target, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // If already hydrated, trigger immediately
    if (target.classList.contains("hydrated")) {
      this.initSizeOptionSingle();
      observer.disconnect();
    }
  }
    
}

Product.initiateWhenReady(['product.single']);
