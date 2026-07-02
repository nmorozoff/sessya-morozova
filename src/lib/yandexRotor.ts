export function signalYandexRotorLoaded() {
  if (window.YandexRotorSettings) {
    window.YandexRotorSettings.IsLoaded = true;
  }
}

export function resetYandexRotorLoaded() {
  if (window.YandexRotorSettings) {
    window.YandexRotorSettings.IsLoaded = false;
  }
}

/** Waits for lazy chunks, images, and paint before signaling Yandex crawler. */
export function scheduleYandexRotorLoaded() {
  const markLoaded = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(signalYandexRotorLoaded);
    });
  };

  if (document.readyState === "complete") {
    markLoaded();
    return;
  }

  window.addEventListener("load", markLoaded, { once: true });
}
