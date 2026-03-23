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

// Полигоны зон повышенного тарифа (ДНР, ЛНР, Запорожская, Херсонская)
// Координаты: [lat, lon]
const SPECIAL_ZONES = [
  {
    name: "ДНР",
    coords: [
      [48.07, 37.45], [48.35, 38.15], [48.55, 38.85], [48.1, 39.5],
      [47.8, 39.6], [47.4, 38.9], [47.1, 38.2], [47.3, 37.5],
      [47.6, 37.1], [47.9, 37.2], [48.07, 37.45],
    ],
  },
  {
    name: "ЛНР",
    coords: [
      [48.55, 38.85], [48.9, 39.3], [49.3, 39.7], [49.5, 40.2],
      [49.15, 40.5], [48.7, 40.1], [48.3, 39.9], [47.8, 39.6],
      [48.1, 39.5], [48.55, 38.85],
    ],
  },
  {
    name: "Запорожская",
    coords: [
      [47.6, 34.2], [47.9, 35.1], [47.85, 36.0], [47.6, 36.8],
      [47.3, 37.1], [47.0, 36.5], [46.7, 35.8], [46.6, 34.8],
      [46.9, 34.2], [47.3, 33.9], [47.6, 34.2],
    ],
  },
  {
    name: "Херсонская",
    coords: [
      [47.0, 32.5], [47.2, 33.5], [46.9, 34.2], [46.6, 34.8],
      [46.3, 34.5], [46.0, 33.8], [46.2, 32.8], [46.5, 32.3],
      [47.0, 32.5],
    ],
  },
];

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
    return obj.geometry.getCoordinates() as [number, number];
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRef = any;

const CRIMEA_KEYWORDS = ["ялта", "симферополь", "севастополь", "керчь", "феодосия", "евпатория", "крым", "алушта", "судак", "бахчисарай"];
const SPECIAL_KEYWORDS = ["донецк", "луганск", "мелитополь", "херсон", "запорожье", "мариуполь", "бердянск", "днр", "лнр", "херсонская", "запорожская"];

const isCrimea = (addr: string) => CRIMEA_KEYWORDS.some(k => addr.toLowerCase().includes(k));
const isSpecial = (addr: string) => SPECIAL_KEYWORDS.some(k => addr.toLowerCase().includes(k));

export default function HeroBackground({ from, to, stops = [] }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AnyRef>(null);
  const routeObjectsRef = useRef<AnyRef[]>([]);
  const zonesAddedRef = useRef(false);

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

        // Рисуем зоны спецтарифа один раз
        if (!zonesAddedRef.current) {
          SPECIAL_ZONES.forEach(zone => {
            const polygon = new window.ymaps.Polygon([zone.coords], { hintContent: zone.name }, {
              fillColor: "#cc000055",
              strokeColor: "#cc0000",
              strokeWidth: 1.5,
              opacity: 1,
            });
            mapInstanceRef.current.geoObjects.add(polygon);
          });
          zonesAddedRef.current = true;
        }
      }
    });
    return () => { destroyed = true; };
  }, []);

  useEffect(() => {
    if (!window._ymapsReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    routeObjectsRef.current.forEach(obj => map.geoObjects.remove(obj));
    routeObjectsRef.current = [];

    if (!from.trim() || !to.trim()) return;

    (async () => {
      const allAddresses = [from, ...stops.filter(Boolean), to];

      // Маршрут через Керчь/Краснодар если один конец в Крыму
      if (isCrimea(from) && !isCrimea(to)) {
        allAddresses.splice(1, 0, "Керчь", "Краснодар");
      } else if (!isCrimea(from) && isCrimea(to)) {
        allAddresses.splice(allAddresses.length - 1, 0, "Краснодар", "Керчь");
      } else if (isCrimea(from) && isSpecial(to)) {
        // Крым → спецзона: через Керчь
        allAddresses.splice(1, 0, "Керчь");
      }

      // Строим маршрут по дорогам через ymaps.route
      const route = await window.ymaps.route(allAddresses, {
        routingMode: "auto",
        mapStateAutoApply: false,
      });

      // Скрываем все путевые точки
      const wps = route.getWayPoints();
      for (let i = 0; i < wps.getLength(); i++) {
        wps.get(i).options.set({ visible: false });
      }

      route.getPaths().options.set({
        strokeColor: "#c8d44a",
        strokeWidth: 4,
        opacity: 0.9,
      });

      map.geoObjects.add(route);
      routeObjectsRef.current.push(route);

      // Два маркера — только реальный старт и финиш
      const [coordFrom, coordTo] = await Promise.all([
        geocodeAddress(from),
        geocodeAddress(to),
      ]);
      [coordFrom, coordTo].forEach(coord => {
        if (!coord) return;
        const pm = new window.ymaps.Placemark(coord, {}, {
          preset: "islands#dotIcon",
          iconColor: "#c8d44a",
        });
        map.geoObjects.add(pm);
        routeObjectsRef.current.push(pm);
      });

      // Позиционирование
      const isMobile = window.innerWidth < 640;
      const margin: [number, number, number, number] = isMobile
        ? [20, 20, Math.round(window.innerHeight * 0.88), 20]
        : [80, 80, 80, 80];

      const bounds = route.getBounds();
      if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: margin });
    })();
  }, [from, to, stops]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}