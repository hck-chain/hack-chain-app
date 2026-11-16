import "@testing-library/jest-dom";

// jsdom no implementa IntersectionObserver, y framer-motion lo necesita para
// `whileInView`. Sin este stub, cualquier test que renderice un componente con
// animacion de entrada revienta con "IntersectionObserver is not defined"
// antes de llegar a la primera asercion.
if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() { }
    unobserve() { }
    disconnect() { }
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }

  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
}
