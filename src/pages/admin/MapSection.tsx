import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Zone {
  name: string;
  polygon: [number, number][];
  type: string;
}

interface RouteResult {
  from: string;
  to: string;
  km_normal: number;
  km_special: number;
  km_total: number;
  duration_hours: number;
  source: string;
  polyline: [number, number][];
  zone_segments: { start_idx: number; end_idx: number; zone: string }[];
}

const ZONE_COLORS: Record<string, { fill: string; stroke: string }> = {
  special: { fill: "rgba(255, 100, 50, 0.25)", stroke: "rgba(255, 100, 50, 0.7)" },
  crimea: { fill: "rgba(255, 200, 50, 0.2)", stroke: "rgba(255, 200, 50, 0.6)" },
};

export default function MapSection() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(funcUrls["route-builder"] + "?action=zones")
      .then((r) => r.json())
      .then((data) => {
        if (data.zones) setZones(data.zones);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [47.0, 37.0],
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || zones.length === 0) return;

    zones.forEach((zone) => {
      const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.special;
      const latLngs: L.LatLngExpression[] = zone.polygon.map(
        ([lat, lon]) => [lat, lon] as [number, number]
      );
      L.polygon(latLngs, {
        color: colors.stroke,
        fillColor: colors.fill,
        fillOpacity: 0.5,
        weight: 2,
      })
        .addTo(mapRef.current!)
        .bindTooltip(zone.name, {
          permanent: false,
          direction: "center",
          className: "zone-tooltip",
        });
    });
  }, [zones]);

  const buildRoute = async () => {
    if (!fromCity || !toCity) return;
    setLoading(true);
    setError("");
    setRouteResult(null);

    if (routeLayerRef.current) {
      routeLayerRef.current.clearLayers();
    }

    try {
      const res = await fetch(
        funcUrls["route-builder"] +
          `?action=build_route&from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRouteResult(data);
        drawRoute(data);
      }
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  };

  const drawRoute = (data: RouteResult) => {
    if (!mapRef.current || !routeLayerRef.current || !data.polyline || data.polyline.length === 0)
      return;

    const group = routeLayerRef.current;
    const latLngs: L.LatLngExpression[] = data.polyline.map(
      ([lat, lon]) => [lat, lon] as [number, number]
    );

    L.polyline(latLngs, {
      color: "#3b82f6",
      weight: 4,
      opacity: 0.8,
    }).addTo(group);

    if (data.zone_segments) {
      data.zone_segments.forEach((seg) => {
        const segPoints = data.polyline.slice(seg.start_idx, seg.end_idx + 1);
        if (segPoints.length > 1) {
          const segLatLngs: L.LatLngExpression[] = segPoints.map(
            ([lat, lon]) => [lat, lon] as [number, number]
          );
          L.polyline(segLatLngs, {
            color: "#f97316",
            weight: 6,
            opacity: 0.9,
          })
            .addTo(group)
            .bindTooltip(seg.zone, { permanent: false });
        }
      });
    }

    const startIcon = L.divIcon({
      html: '<div style="width:12px;height:12px;background:#22c55e;border-radius:50%;border:2px solid #fff;"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      className: "",
    });
    const endIcon = L.divIcon({
      html: '<div style="width:12px;height:12px;background:#ef4444;border-radius:50%;border:2px solid #fff;"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
      className: "",
    });

    const first = data.polyline[0];
    const last = data.polyline[data.polyline.length - 1];

    L.marker([first[0], first[1]], { icon: startIcon })
      .addTo(group)
      .bindTooltip(data.from, { permanent: true, direction: "top", className: "route-label" });
    L.marker([last[0], last[1]], { icon: endIcon })
      .addTo(group)
      .bindTooltip(data.to, { permanent: true, direction: "top", className: "route-label" });

    mapRef.current.fitBounds(L.polyline(latLngs).getBounds().pad(0.1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && fromCity && toCity && !loading) {
      buildRoute();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Icon name="Map" size={20} className="text-blue-400" />
          Карта зон повышенного тарифа
        </h2>

        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Откуда (город)"
            value={fromCity}
            onChange={(e) => setFromCity(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-yellow flex-1 min-w-[200px]"
          />
          <input
            type="text"
            placeholder="Куда (город)"
            value={toCity}
            onChange={(e) => setToCity(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-yellow flex-1 min-w-[200px]"
          />
          <button
            onClick={buildRoute}
            disabled={loading || !fromCity || !toCity}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <Icon name="Loader2" size={16} className="animate-spin" />
            ) : (
              <Icon name="Route" size={16} />
            )}
            Построить
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {routeResult && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-xs mb-1">Всего</div>
              <div className="text-xl font-bold">{routeResult.km_total} км</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Обычный тариф</div>
              <div className="text-xl font-bold text-green-400">{routeResult.km_normal} км</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Повышенный тариф</div>
              <div className="text-xl font-bold text-orange-400">{routeResult.km_special} км</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Время в пути</div>
              <div className="text-xl font-bold">
                {routeResult.duration_hours ? `${routeResult.duration_hours} ч` : "\u2014"}
              </div>
            </div>
            <div className="col-span-2 md:col-span-4 flex flex-wrap gap-4 text-xs text-gray-500">
              <span>
                Источник: <span className="text-gray-300">{routeResult.source}</span>
              </span>
              {routeResult.zone_segments && routeResult.zone_segments.length > 0 && (
                <span>
                  Зоны:{" "}
                  <span className="text-orange-400">
                    {routeResult.zone_segments.map((s) => s.zone).join(", ")}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className="w-4 h-4 rounded"
              style={{ background: "rgba(255, 100, 50, 0.5)" }}
            ></span>
            Зона повышенного тарифа (ДНР, ЛНР, Запорожская, Херсонская)
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className="w-4 h-4 rounded"
              style={{ background: "rgba(255, 200, 50, 0.4)" }}
            ></span>
            Крым
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className="w-4 h-4 rounded"
              style={{ background: "#3b82f6" }}
            ></span>
            Маршрут
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className="w-4 h-4 rounded"
              style={{ background: "#f97316" }}
            ></span>
            Участок в спецзоне
          </div>
        </div>

        <div
          ref={mapContainerRef}
          className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-700"
        />
      </div>
    </div>
  );
}
