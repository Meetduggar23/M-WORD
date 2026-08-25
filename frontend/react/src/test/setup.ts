import '@testing-library/jest-dom';

/* jsdom does not implement matchMedia — required by the theme system
   (prefers-color-scheme detection) and any responsive listeners. */
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

/* jsdom lacks element.scrollIntoView and scrollTo */
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => undefined);
Element.prototype.scrollTo = Element.prototype.scrollTo || (() => undefined);
