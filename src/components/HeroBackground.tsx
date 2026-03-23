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
      [46.4, 34.4], [46.35, 33.6], [46.4, 32.8], [46.6, 32.3],
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
// ДНР/ЛНР — маршрут через Керчь+Краснодар
const DNR_LNR_KEYWORDS = ["донецк", "луганск", "мариуполь", "горловка", "макеевка", "днр", "лнр", "краматорск", "северодонецк", "лисичанск"];
// Херсонская/Запорожская — напрямую через Джанкой
const KHERSON_ZAP_KEYWORDS = ["херсон", "мелитополь", "бердянск", "токмак", "энергодар", "геническ", "херсонская", "запорожская", "запорожье"];

const isCrimea = (addr: string) => CRIMEA_KEYWORDS.some(k => addr.toLowerCase().includes(k));
const isDnrLnr = (addr: string) => DNR_LNR_KEYWORDS.some(k => addr.toLowerCase().includes(k));
const isKhersonZap = (addr: string) => KHERSON_ZAP_KEYWORDS.some(k => addr.toLowerCase().includes(k));

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

        zonesAddedRef.current = true;
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

      if (isCrimea(from) && !isCrimea(to)) {
        if (isDnrLnr(to) || (!isKhersonZap(to))) {
          // Крым → ДНР/ЛНР или Россия: через Керчь + Краснодар
          allAddresses.splice(1, 0, "Керчь", "Краснодар");
        }
        // Крым → Херсонская/Запорожская: напрямую через Джанкой (ничего не добавляем)
      } else if (isCrimea(to) && !isCrimea(from)) {
        if (isDnrLnr(from) || (!isKhersonZap(from))) {
          // ДНР/ЛНР или Россия → Крым: через Краснодар + Керчь
          allAddresses.splice(allAddresses.length - 1, 0, "Краснодар", "Керчь");
        }
        // Херсонская/Запорожская → Крым: напрямую
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

      // Позиционирование с учётом шапки и формы
      // margin: [top, right, bottom, left]
      const isMobile = window.innerWidth < 640;
      const margin: [number, number, number, number] = isMobile
        ? [70, 20, Math.round(window.innerHeight * 0.87), 20]
        : [76, 40, 40, 420];

      // Берём bounds из маркеров старта/финиша — надёжнее чем route.getBounds()
      const boundsCoords = [coordFrom, coordTo].filter(Boolean) as [number, number][];
      if (boundsCoords.length === 2) {
        const latMin = Math.min(...boundsCoords.map(c => c[0]));
        const latMax = Math.max(...boundsCoords.map(c => c[0]));
        const lonMin = Math.min(...boundsCoords.map(c => c[1]));
        const lonMax = Math.max(...boundsCoords.map(c => c[1]));
        map.setBounds([[latMin, lonMin], [latMax, lonMax]], { checkZoomRange: true, zoomMargin: margin });
      } else {
        const bounds = route.getBounds();
        if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: margin });
      }
    })();
  }, [from, to, stops]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}