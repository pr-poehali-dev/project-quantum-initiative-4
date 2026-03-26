export interface Zone {
  name: string;
  polygon: [number, number][];
  type: string;
}

export interface RouteResult {
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

export const ZONE_COLORS: Record<string, { fill: string; stroke: string; vertex: string }> = {
  special: { fill: "rgba(255, 100, 50, 0.25)", stroke: "rgba(255, 100, 50, 0.7)", vertex: "#ff6432" },
  crimea: { fill: "rgba(255, 200, 50, 0.2)", stroke: "rgba(255, 200, 50, 0.6)", vertex: "#ffc832" },
};
