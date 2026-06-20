export async function getCachedProductDetails(productId) {
  const cacheKey = `product_${productId}_details`;

  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const response = await salla.product.getDetails(productId, [
    "images",
    "options",
  ]);

  const data = {
    images: response?.data?.images || [],
    options: response?.data?.options || [],
    timestamp: Date.now(),
  };

  sessionStorage.setItem(cacheKey, JSON.stringify(data));

  return data;
}
// quick view event dispatcher
export const quickView = {
  open(product) {
    document.dispatchEvent(
      new CustomEvent('quick-view:open', {
        detail: structuredClone(product),
      })
    );
  },

  close() {
    document.dispatchEvent(
      new CustomEvent('quick-view:close')
    );
  },

  onOpen(callback) {
    document.addEventListener('quick-view:open', (event) => {
      callback(event.detail);
    });
  },

  onClose(callback) {
    document.addEventListener('quick-view:close', callback);
  },
};