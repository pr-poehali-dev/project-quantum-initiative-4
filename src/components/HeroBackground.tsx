import { useEffect, useRef } from "react";

interface Props {
  from: string;
  to: string;
  stops?: string[];
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ymaps: any;
    _ymapsReady: boolean;
  }
}

function loadYmaps(): Promise<void> {
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

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const result = await window.ymaps.geocode(address, { results: 1 });
    const obj = result.geoObjects.get(0);
    if (!obj) return null;
    const coords = obj.geometry.getCoordinates();
    return coords as [number, number];
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRef = any;

export default function HeroBackground({ from, to, stops = [] }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AnyRef>(null);
  const objectsRef = useRef<AnyRef[]>([]);

  useEffect(() => {
    let destroyed = false;
    loadYmaps().then(() => {
      if (destroyed || !mapRef.current) return;
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
          center: [55.751574, 37.573856],
          zoom: 5,
          controls: [],
        });
        mapInstanceRef.current.behaviors.disable("scrollZoom");
      }
    });
    return () => { destroyed = true; };
  }, []);

  useEffect(() => {
    if (!window._ymapsReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Удаляем все старые объекты
    objectsRef.current.forEach(obj => map.geoObjects.remove(obj));
    objectsRef.current = [];

    if (!from.trim() || !to.trim()) return;

    (async () => {
      const CRIMEA_KEYWORDS = ["ялта", "симферополь", "севастополь", "керчь", "феодосия", "евпатория", "крым", "алушта", "судак", "бахчисарай"];
      const isCrimea = (addr: string) => CRIMEA_KEYWORDS.some(k => addr.toLowerCase().includes(k));

      // Формируем точки маршрута
      const allAddresses = [from, ...stops.filter(Boolean), to];

      // Если из/в Крым — добавляем Керчь и Краснодар как промежуточные для геокодинга
      if (isCrimea(from) && !isCrimea(to)) {
        allAddresses.splice(1, 0, "Керчь", "Краснодар");
      } else if (!isCrimea(from) && isCrimea(to)) {
        allAddresses.splice(allAddresses.length - 1, 0, "Краснодар", "Керчь");
      }

      const coords = await Promise.all(allAddresses.map(geocodeAddress));
      const validCoords = coords.filter(Boolean) as [number, number][];

      if (validCoords.length < 2) return;

      // Рисуем одну линию через все точки
      const polyline = new window.ymaps.Polyline(validCoords, {}, {
        strokeColor: "#c8d44a",
        strokeWidth: 4,
        opacity: 0.9,
      });
      map.geoObjects.add(polyline);
      objectsRef.current.push(polyline);

      // Только две точки: старт и финиш
      const startPlacemark = new window.ymaps.Placemark(validCoords[0], {}, {
        preset: "islands#dotIcon",
        iconColor: "#c8d44a",
      });
      const endPlacemark = new window.ymaps.Placemark(validCoords[validCoords.length - 1], {}, {
        preset: "islands#dotIcon",
        iconColor: "#c8d44a",
      });
      map.geoObjects.add(startPlacemark);
      map.geoObjects.add(endPlacemark);
      objectsRef.current.push(startPlacemark, endPlacemark);

      // Позиционируем карту
      const isMobile = window.innerWidth < 640;
      const margin: [number, number, number, number] = isMobile
        ? [20, 20, Math.round(window.innerHeight * 0.88), 20]
        : [80, 80, 80, 80];

      map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: margin });
    })();
  }, [from, to, stops]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}
