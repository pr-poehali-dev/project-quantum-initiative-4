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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRef = any;

export default function HeroBackground({ from, to, stops = [] }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AnyRef>(null);
  const routeRef = useRef<AnyRef>(null);

  useEffect(() => {
    let destroyed = false;
    loadYmaps().then(() => {
      if (destroyed || !mapRef.current) return;
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
          center: [55.751574, 37.573856],
          zoom: 5,
          controls: ["zoomControl"],
        });
        mapInstanceRef.current.behaviors.disable("scrollZoom");
      }
    });
    return () => { destroyed = true; };
  }, []);

  useEffect(() => {
    if (!window._ymapsReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (routeRef.current) {
      map.geoObjects.remove(routeRef.current);
      routeRef.current = null;
    }

    if (!from.trim() || !to.trim()) return;

    const CRIMEA_KEYWORDS = ["ялта", "симферополь", "севастополь", "керчь", "феодосия", "евпатория", "крым", "республика крым", "алушта", "судак", "бахчисарай"];
    const isCrimea = (addr: string) => CRIMEA_KEYWORDS.some(k => addr.toLowerCase().includes(k));

    const userStops = stops.filter(Boolean);
    let routePoints: string[];

    if (isCrimea(from) || isCrimea(to)) {
      // Принудительный маршрут через Керчь и Краснодар
      if (isCrimea(from)) {
        routePoints = [from, "Керчь", "Краснодар", ...userStops, to];
      } else {
        routePoints = [from, ...userStops, "Краснодар", "Керчь", to];
      }
    } else {
      routePoints = [from, ...userStops, to];
    }

    window.ymaps.route(routePoints, {
      routingMode: "auto",
      mapStateAutoApply: true,
      results: 1,
    }).then((route: AnyRef) => {
      route.getPaths().options.set({
        strokeColor: "#c8d44a",
        strokeWidth: 4,
        opacity: 0.9,
        showJamsTime: false,
      });
      route.getWayPoints().options.set({
        preset: "islands#dotIcon",
        iconColor: "#c8d44a",
        visible: false,
      });
      // Показываем только первую точку и последнюю
      const wps = route.getWayPoints();
      wps.each((wp: AnyRef, i: number) => {
        wp.options.set({ visible: i === 0 || i === wps.getLength() - 1 });
      });
      map.geoObjects.add(route);
      routeRef.current = route;
    }).catch(() => {});
  }, [from, to, stops]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}