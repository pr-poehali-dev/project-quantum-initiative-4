import { useState, useEffect, useRef, useCallback } from "react";
import funcUrls from "../../../backend/func2url.json";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Zone, RouteResult, ZONE_COLORS } from "./map/mapTypes";
import ZoneEditorToolbar from "./map/ZoneEditorToolbar";
import RouteBuilder from "./map/RouteBuilder";

export default function MapSection() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const zoneLayerRef = useRef<L.LayerGroup | null>(null);
  const vertexLayerRef = useRef<L.LayerGroup | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editingZoneIdx, setEditingZoneIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const zonesRef = useRef<Zone[]>([]);
  const editingIdxRef = useRef<number | null>(null);

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  useEffect(() => {
    editingIdxRef.current = editingZoneIdx;
  }, [editingZoneIdx]);

  const loadZones = useCallback(() => {
    fetch(funcUrls["route-builder"] + "?action=zones")
      .then((r) => r.json())
      .then((data) => {
        if (data.zones) {
          setZones(data.zones);
          setHasChanges(false);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

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

    zoneLayerRef.current = L.layerGroup().addTo(map);
    vertexLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const drawZones = useCallback(() => {
    if (!mapRef.current || !zoneLayerRef.current) return;
    zoneLayerRef.current.clearLayers();

    zones.forEach((zone, idx) => {
      const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.special;
      const isEditing = editMode && editingZoneIdx === idx;
      const latLngs: L.LatLngExpression[] = zone.polygon.map(
        ([lat, lon]) => [lat, lon] as [number, number]
      );
      const poly = L.polygon(latLngs, {
        color: isEditing ? "#fff" : colors.stroke,
        fillColor: colors.fill,
        fillOpacity: isEditing ? 0.4 : 0.5,
        weight: isEditing ? 3 : 2,
        dashArray: isEditing ? "8 4" : undefined,
      });
      poly.addTo(zoneLayerRef.current!);
      if (!editMode) {
        poly.bindTooltip(zone.name, {
          permanent: false,
          direction: "center",
          className: "zone-tooltip",
        });
      } else {
        poly.bindTooltip(zone.name + (isEditing ? " (редактирование)" : ""), {
          permanent: false,
          direction: "center",
          className: "zone-tooltip",
        });
        if (!isEditing) {
          poly.on("click", () => {
            setEditingZoneIdx(idx);
          });
          poly.setStyle({ cursor: "pointer" });
        }
      }
    });
  }, [zones, editMode, editingZoneIdx]);

  useEffect(() => {
    drawZones();
  }, [drawZones]);

  const drawVertices = useCallback(() => {
    if (!vertexLayerRef.current || !mapRef.current) return;
    vertexLayerRef.current.clearLayers();

    if (!editMode || editingZoneIdx === null || !zones[editingZoneIdx]) return;

    const zone = zones[editingZoneIdx];
    const colors = ZONE_COLORS[zone.type] || ZONE_COLORS.special;

    zone.polygon.forEach((point, ptIdx) => {
      const vertexIcon = L.divIcon({
        html: `<div style="width:10px;height:10px;background:${colors.vertex};border:2px solid #fff;border-radius:50%;cursor:grab;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
        className: "",
      });

      const marker = L.marker([point[0], point[1]], {
        icon: vertexIcon,
        draggable: true,
        zIndexOffset: 1000,
      });

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        const currentZones = [...zonesRef.current];
        const currentIdx = editingIdxRef.current;
        if (currentIdx === null || !currentZones[currentIdx]) return;

        const updatedPolygon = [...currentZones[currentIdx].polygon];
        updatedPolygon[ptIdx] = [
          Math.round(pos.lat * 1000) / 1000,
          Math.round(pos.lng * 1000) / 1000,
        ];

        if (ptIdx === 0 && updatedPolygon.length > 1) {
          updatedPolygon[updatedPolygon.length - 1] = updatedPolygon[0];
        }
        if (ptIdx === updatedPolygon.length - 1 && updatedPolygon.length > 1) {
          updatedPolygon[0] = updatedPolygon[ptIdx];
        }

        currentZones[currentIdx] = {
          ...currentZones[currentIdx],
          polygon: updatedPolygon as [number, number][],
        };
        setZones(currentZones);
        setHasChanges(true);
      });

      marker.bindTooltip(`#${ptIdx} [${point[0].toFixed(3)}, ${point[1].toFixed(3)}]`, {
        permanent: false,
        direction: "top",
        className: "vertex-tooltip",
      });

      marker.on("contextmenu", (e: L.LeafletMouseEvent) => {
        L.DomEvent.preventDefault(e);
        const currentZones = [...zonesRef.current];
        const currentIdx = editingIdxRef.current;
        if (currentIdx === null || !currentZones[currentIdx]) return;
        if (currentZones[currentIdx].polygon.length <= 4) return;

        const updatedPolygon = currentZones[currentIdx].polygon.filter(
          (_, i) => i !== ptIdx
        );
        if (updatedPolygon.length > 1) {
          updatedPolygon[updatedPolygon.length - 1] = updatedPolygon[0];
        }
        currentZones[currentIdx] = {
          ...currentZones[currentIdx],
          polygon: updatedPolygon as [number, number][],
        };
        setZones(currentZones);
        setHasChanges(true);
      });

      marker.addTo(vertexLayerRef.current!);
    });

    zone.polygon.forEach((point, ptIdx) => {
      if (ptIdx >= zone.polygon.length - 1) return;
      const nextPt = zone.polygon[ptIdx + 1];
      const midLat = (point[0] + nextPt[0]) / 2;
      const midLon = (point[1] + nextPt[1]) / 2;

      const midIcon = L.divIcon({
        html: `<div style="width:8px;height:8px;background:transparent;border:2px solid ${colors.vertex};border-radius:50%;cursor:copy;opacity:0.5;"></div>`,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
        className: "",
      });

      const midMarker = L.marker([midLat, midLon], {
        icon: midIcon,
        zIndexOffset: 500,
      });

      midMarker.on("click", () => {
        const currentZones = [...zonesRef.current];
        const currentIdx = editingIdxRef.current;
        if (currentIdx === null || !currentZones[currentIdx]) return;

        const updatedPolygon = [...currentZones[currentIdx].polygon];
        const newPoint: [number, number] = [
          Math.round(midLat * 1000) / 1000,
          Math.round(midLon * 1000) / 1000,
        ];
        updatedPolygon.splice(ptIdx + 1, 0, newPoint);
        currentZones[currentIdx] = {
          ...currentZones[currentIdx],
          polygon: updatedPolygon,
        };
        setZones(currentZones);
        setHasChanges(true);
      });

      midMarker.bindTooltip("Клик — добавить точку", {
        permanent: false,
        direction: "top",
      });

      midMarker.addTo(vertexLayerRef.current!);
    });
  }, [zones, editMode, editingZoneIdx]);

  useEffect(() => {
    drawVertices();
  }, [drawVertices]);

  const saveZones = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(funcUrls["route-builder"] + "?action=save_zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zones }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setSaveMsg("Сохранено!");
        setHasChanges(false);
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        setSaveMsg("Ошибка: " + (data.error || "неизвестная"));
      }
    } catch {
      setSaveMsg("Ошибка сети");
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingZoneIdx(null);
    setHasChanges(false);
    loadZones();
  };

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

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-5">
        <ZoneEditorToolbar
          editMode={editMode}
          editingZoneIdx={editingZoneIdx}
          zones={zones}
          saving={saving}
          hasChanges={hasChanges}
          saveMsg={saveMsg}
          onSave={saveZones}
          onCancel={cancelEdit}
          onStartEdit={() => {
            setEditMode(true);
            setEditingZoneIdx(null);
          }}
          onSelectZone={setEditingZoneIdx}
        />

        {!editMode && (
          <RouteBuilder
            fromCity={fromCity}
            toCity={toCity}
            loading={loading}
            error={error}
            routeResult={routeResult}
            onFromChange={setFromCity}
            onToChange={setToCity}
            onBuild={buildRoute}
          />
        )}

        {editMode && error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className="w-4 h-4 rounded"
              style={{ background: "rgba(255, 100, 50, 0.5)" }}
            ></span>
            Зона повышенного тарифа
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className="w-4 h-4 rounded"
              style={{ background: "rgba(255, 200, 50, 0.4)" }}
            ></span>
            Крым
          </div>
          {!editMode && (
            <>
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
            </>
          )}
        </div>

        <div
          ref={mapContainerRef}
          className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-700"
        />
      </div>
    </div>
  );
}
