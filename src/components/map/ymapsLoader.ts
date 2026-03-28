import { AnyRef } from "./specialZones";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ymaps: any;
    _ymapsReady: boolean;
  }
}

export function loadYmaps(): Promise<void> {
  return new Promise((resolve) => {
    if (window.ymaps && window._ymapsReady) { resolve(); return; }
    if (document.getElementById("ymaps-script")) {
      const wait = setInterval(() => {
        if (window._ymapsReady) { clearInterval(wait); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = "ymaps-script";
    script.src = "https://api-maps.yandex.ru/2.1/?apikey=feba36e0-0c20-42ea-aac4-e0d61b0ff690&lang=ru_RU";
    script.onload = () => {
      window.ymaps.ready(() => {
        window._ymapsReady = true;
        resolve();
      });
    };
    document.head.appendChild(script);
  });
}

export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const result = await window.ymaps.geocode(address, { results: 1 });
    const obj = result.geoObjects.get(0);
    if (!obj) return null;
    return obj.geometry.getCoordinates() as [number, number];
  } catch {
    return null;
  }
}

const ROUTE_BUILDER_URL = "https://functions.poehali.dev/c0181108-9a28-416b-a122-5a0668abfaff";

export async function fetchBackendPolyline(addrFrom: string, addrTo: string): Promise<AnyRef | null> {
  try {
    const url = `${ROUTE_BUILDER_URL}?action=build_route&from=${encodeURIComponent(addrFrom)}&to=${encodeURIComponent(addrTo)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.polyline && data.polyline.length >= 2) {
      return new window.ymaps.Polyline(
        data.polyline,
        {},
        { strokeColor: "#c8d44a", strokeWidth: 4, opacity: 0.9 }
      );
    }
  } catch { /* ignore */ }
  const [c1, c2] = await Promise.all([geocodeAddress(addrFrom), geocodeAddress(addrTo)]);
  if (!c1 || !c2) return null;
  return new window.ymaps.Polyline([c1, c2], {}, { strokeColor: "#c8d44a", strokeWidth: 4, opacity: 0.9 });
}
