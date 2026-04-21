// Vitest setup — polyfills for jsdom before every test file.
//
// jsdom does not implement window.matchMedia, so hooks like useIsMobile()
// blow up when a component is rendered in tests. Provide a no-op stub.

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},       // deprecated, kept for compatibility
    removeListener() {},    // deprecated, kept for compatibility
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
}
