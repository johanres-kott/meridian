// Vitest setup: jsdom-polyfills used by component tests.
// Loaded for every test file via the `setupFiles` entry in vite.config.js.

import "@testing-library/jest-dom/vitest";

// jsdom does not implement matchMedia — needed by useIsMobile and any component
// that subscribes to a media query. Stub it as "never matches" by default;
// individual tests can override window.matchMedia if they need a different value.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},      // legacy API some libs still call
    removeListener: () => {},   // legacy API
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
