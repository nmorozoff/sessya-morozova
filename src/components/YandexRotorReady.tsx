import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { resetYandexRotorLoaded, scheduleYandexRotorLoaded } from "@/lib/yandexRotor";

/**
 * Signals Yandex Rotor when the current route and its assets are ready.
 * Placed inside <Suspense> so lazy-loaded pages are included.
 */
const YandexRotorReady = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    resetYandexRotorLoaded();
    scheduleYandexRotorLoaded();
  }, [pathname]);

  return null;
};

export default YandexRotorReady;
