import { useEffect, useRef } from "react";
import { AnyRef } from "./specialZones";
import { isCrimea, isDnrLnr, isKherson, isZap, isKhersonZap, isSpecialZone } from "./specialZones";
import { loadYmaps, geocodeAddress, fetchBackendPolyline } from "./ymapsLoader";

interface UseMapRouteParams {
  from: string;
  to: string;
  stops: string[];
  formHeight?: number;
}

export function useMapRoute({ from, to, stops, formHeight }: UseMapRouteParams) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AnyRef>(null);
  const routeObjectsRef = useRef<AnyRef[]>([]);
  const zonesAddedRef = useRef(false);
  const formHeightRef = useRef(formHeight);
  formHeightRef.current = formHeight;
  const singleMarkerRef = useRef<AnyRef>(null);

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
    if ((from.trim() && to.trim()) || (!from.trim() && !to.trim())) {
      if (singleMarkerRef.current && mapInstanceRef.current) {
        try { mapInstanceRef.current.geoObjects.remove(singleMarkerRef.current); } catch { /* */ }
        singleMarkerRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const addr = from.trim() || to.trim();

    const show = async () => {
      let attempts = 0;
      while (!window._ymapsReady || !mapInstanceRef.current) {
        if (cancelled || attempts > 50) return;
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      if (cancelled) return;

      const coord = await geocodeAddress(addr);
      if (cancelled || !coord) return;

      const map = mapInstanceRef.current;
      if (singleMarkerRef.current) {
        try { map.geoObjects.remove(singleMarkerRef.current); } catch { /* */ }
      }
      singleMarkerRef.current = new window.ymaps.Placemark(coord, {
        balloonContent: addr,
      }, {
        preset: "islands#dotIcon",
        iconColor: "#c8d44a",
      });
      map.geoObjects.add(singleMarkerRef.current);

      const isMobile = window.innerWidth < 640;
      const bm = isMobile ? (formHeightRef.current ?? Math.round(window.innerHeight * 0.55)) + 16 : 40;
      const margin: [number, number, number, number] = isMobile ? [60, 16, bm, 16] : [76, 40, 40, 420];
      map.setCenter(coord, 10, { duration: 300, checkZoomRange: true }).then(() => {
        map.margin.setDefaultMargin(margin);
      });
    };
    show();
    return () => { cancelled = true; };
  }, [from, to]);

  useEffect(() => {
    if (!from.trim() || !to.trim()) {
      if (mapInstanceRef.current) {
        routeObjectsRef.current.forEach(obj => { try { mapInstanceRef.current.geoObjects.remove(obj); } catch { /* ignore */ } });
        routeObjectsRef.current = [];
      }
      return;
    }
    if (singleMarkerRef.current && mapInstanceRef.current) {
      try { mapInstanceRef.current.geoObjects.remove(singleMarkerRef.current); } catch { /* */ }
      singleMarkerRef.current = null;
    }

    let cancelled = false;

    const run = async () => {
      let attempts = 0;
      while (!window._ymapsReady || !mapInstanceRef.current) {
        if (cancelled || attempts > 100) return;
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      if (cancelled) return;

      const map = mapInstanceRef.current;
      routeObjectsRef.current.forEach(obj => { try { map.geoObjects.remove(obj); } catch { /* ignore */ } });
      routeObjectsRef.current = [];

      const cleanStops = stops.filter(Boolean);
      const allPoints = [from, ...cleanStops, to];
      const hasSpecialStop = cleanStops.some(s => isKhersonZap(s) || isDnrLnr(s) || isCrimea(s));

      if (hasSpecialStop) {
        const addRouteToMap = (route: AnyRef) => {
          const wps = route.getWayPoints();
          for (let i = 0; i < wps.getLength(); i++) wps.get(i).options.set({ visible: false });
          route.getPaths().options.set({ strokeColor: "#c8d44a", strokeWidth: 4, opacity: 0.9 });
        };

        const segments: string[][] = [];
        for (let i = 0; i < allPoints.length - 1; i++) {
          const sFrom = allPoints[i];
          const sTo = allPoints[i + 1];
          const seg: string[] = [sFrom];

          const fC = isCrimea(sFrom), tC = isCrimea(sTo);
          const fZ = isZap(sFrom), tZ = isZap(sTo);
          const fH = isKherson(sFrom), tH = isKherson(sTo);
          const fD = isDnrLnr(sFrom), tD = isDnrLnr(sTo);
          const fR = !fC && !fZ && !fH && !fD;
          const tR = !tC && !tZ && !tH && !tD;

          if (fC && tH) seg.push("Армянск");
          else if (fH && tC) seg.push("Армянск");
          else if (fC && tZ) seg.push("Чонгар");
          else if (fZ && tC) seg.push("Чонгар");
          else if ((fR || fC) && tD) seg.push("Весело-Вознесенка, Ростовская область");
          else if (fD && (tR || tC)) seg.push("Весело-Вознесенка, Ростовская область");
          else if (fR && tZ) seg.push("Весело-Вознесенка, Ростовская область");
          else if (fZ && tR) seg.push("Весело-Вознесенка, Ростовская область");
          else if (fR && tH) seg.push("Армянск");
          else if (fH && tR) seg.push("Армянск");

          seg.push(sTo);
          segments.push(seg);
        }

        const segRoutes = await Promise.all(
          segments.map(seg => window.ymaps.route(seg, { routingMode: "auto", mapStateAutoApply: false }).catch(() => null))
        );
        if (cancelled) return;

        const newObjects: AnyRef[] = [];
        for (let si = 0; si < segRoutes.length; si++) {
          if (segRoutes[si]) {
            addRouteToMap(segRoutes[si]);
            newObjects.push(segRoutes[si]);
          } else {
            const seg = segments[si];
            const fb = await fetchBackendPolyline(seg[0], seg[seg.length - 1]);
            if (fb) newObjects.push(fb);
          }
        }
        if (!newObjects.length) return;

        for (const addr of allPoints) {
          const coord = await geocodeAddress(addr);
          if (cancelled) return;
          if (coord) newObjects.push(new window.ymaps.Placemark(coord, {}, { preset: "islands#dotIcon", iconColor: "#c8d44a" }));
        }

        newObjects.forEach(obj => map.geoObjects.add(obj));
        routeObjectsRef.current = newObjects;

        const isMobile = window.innerWidth < 640;
        const bm = isMobile ? (formHeightRef.current ?? Math.round(window.innerHeight * 0.55)) + 16 : 40;
        const margin: [number, number, number, number] = isMobile ? [60, 16, bm, 16] : [76, 40, 40, 420];
        const placemarksCoords = newObjects
          .filter((o: AnyRef) => o.geometry?.getType?.() === "Point")
          .map((o: AnyRef) => o.geometry.getCoordinates() as [number, number]);
        if (placemarksCoords.length >= 2) {
          const lats = placemarksCoords.map((c: [number, number]) => c[0]);
          const lons = placemarksCoords.map((c: [number, number]) => c[1]);
          map.setBounds([[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]], { checkZoomRange: true, zoomMargin: margin });
        } else {
          const firstRoute = newObjects.find((o: AnyRef) => o.getBounds);
          if (firstRoute) { const b = firstRoute.getBounds(); if (b) map.setBounds(b, { checkZoomRange: true, zoomMargin: margin }); }
        }
        return;
      }

      const allAddresses = [from, ...cleanStops, to];

      const fromArmiansk = from.toLowerCase().includes("армянск");
      const toArmiansk = to.toLowerCase().includes("армянск");

      const getLen = (r: AnyRef) => { try { return r.getPaths().get(0).getLength(); } catch { return Infinity; } };

      if (isCrimea(from) && !isCrimea(to)) {
        if (fromArmiansk) {
          // Армянск сам КПП
        } else if (isKherson(to)) {
          const [rc, ra] = await Promise.all([
            window.ymaps.route([from, "Чонгар", to], { routingMode: "auto" }).catch(() => null),
            window.ymaps.route([from, "Армянск", to], { routingMode: "auto" }).catch(() => null),
          ]);
          if (cancelled) return;
          allAddresses.splice(1, 0, getLen(ra) < getLen(rc) ? "Армянск" : "Чонгар");
        } else if (isZap(to)) {
          const [rc, rv] = await Promise.all([
            window.ymaps.route([from, "Чонгар", to], { routingMode: "auto" }).catch(() => null),
            window.ymaps.route([from, "Весело-Вознесенка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          ]);
          if (cancelled) return;
          allAddresses.splice(1, 0, getLen(rv) < getLen(rc) ? "Весело-Вознесенка, Ростовская область" : "Чонгар");
        } else {
          allAddresses.splice(1, 0, "Керчь", "Краснодар");
        }
      } else if (isCrimea(to) && !isCrimea(from)) {
        if (toArmiansk) {
          // Армянск сам КПП
        } else if (isKherson(from)) {
          const [rc, ra] = await Promise.all([
            window.ymaps.route([from, "Чонгар", to], { routingMode: "auto" }).catch(() => null),
            window.ymaps.route([from, "Армянск", to], { routingMode: "auto" }).catch(() => null),
          ]);
          if (cancelled) return;
          allAddresses.splice(allAddresses.length - 1, 0, getLen(ra) < getLen(rc) ? "Армянск" : "Чонгар");
        } else if (isZap(from)) {
          const [rc, rv] = await Promise.all([
            window.ymaps.route([from, "Чонгар", to], { routingMode: "auto" }).catch(() => null),
            window.ymaps.route([from, "Весело-Вознесенка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          ]);
          if (cancelled) return;
          allAddresses.splice(allAddresses.length - 1, 0, getLen(rv) < getLen(rc) ? "Весело-Вознесенка, Ростовская область" : "Чонгар");
        } else {
          allAddresses.splice(allAddresses.length - 1, 0, "Краснодар", "Керчь");
        }
      } else if (isDnrLnr(to) && !isCrimea(from) && !isKhersonZap(from)) {
        const [r1, r2, r3, r4, r5, r6] = await Promise.all([
          window.ymaps.route([from, "Матвеев Курган, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Весело-Вознесенка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Новошахтинск, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Изварино, Луганская Народная Республика", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Чертково, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Бугаевка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
        ]);
        if (cancelled) return;
        const best = [
          { name: "Матвеев Курган, Ростовская область", len: getLen(r1) },
          { name: "Весело-Вознесенка, Ростовская область", len: getLen(r2) },
          { name: "Новошахтинск, Ростовская область", len: getLen(r3) },
          { name: "Изварино, Луганская Народная Республика", len: getLen(r4) },
          { name: "Чертково, Ростовская область", len: getLen(r5) },
          { name: "Бугаевка, Ростовская область", len: getLen(r6) },
        ].reduce((a, b) => a.len <= b.len ? a : b);
        allAddresses.splice(allAddresses.length - 1, 0, best.name);
      } else if (isDnrLnr(from) && !isCrimea(to) && !isKhersonZap(to)) {
        const [r1, r2, r3, r4, r5, r6] = await Promise.all([
          window.ymaps.route([from, "Матвеев Курган, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Весело-Вознесенка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Новошахтинск, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Изварино, Луганская Народная Республика", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Чертково, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Бугаевка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
        ]);
        if (cancelled) return;
        const best = [
          { name: "Матвеев Курган, Ростовская область", len: getLen(r1) },
          { name: "Весело-Вознесенка, Ростовская область", len: getLen(r2) },
          { name: "Новошахтинск, Ростовская область", len: getLen(r3) },
          { name: "Изварино, Луганская Народная Республика", len: getLen(r4) },
          { name: "Чертково, Ростовская область", len: getLen(r5) },
          { name: "Бугаевка, Ростовская область", len: getLen(r6) },
        ].reduce((a, b) => a.len <= b.len ? a : b);
        allAddresses.splice(1, 0, best.name);
      } else if (isZap(to) && !isCrimea(from) && !isDnrLnr(from) && !isKhersonZap(from)) {
        const [r1, r2] = await Promise.all([
          window.ymaps.route([from, "Весело-Вознесенка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Матвеев Курган, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
        ]);
        if (cancelled) return;
        const best = [
          { name: "Весело-Вознесенка, Ростовская область", len: getLen(r1) },
          { name: "Матвеев Курган, Ростовская область", len: getLen(r2) },
        ].reduce((a, b) => a.len <= b.len ? a : b);
        allAddresses.splice(allAddresses.length - 1, 0, best.name);
      } else if (isZap(from) && !isCrimea(to) && !isDnrLnr(to) && !isKhersonZap(to)) {
        const [r1, r2] = await Promise.all([
          window.ymaps.route([from, "Весело-Вознесенка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Матвеев Курган, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
        ]);
        if (cancelled) return;
        const best = [
          { name: "Весело-Вознесенка, Ростовская область", len: getLen(r1) },
          { name: "Матвеев Курган, Ростовская область", len: getLen(r2) },
        ].reduce((a, b) => a.len <= b.len ? a : b);
        allAddresses.splice(1, 0, best.name);
      } else if (isKherson(to) && !isCrimea(from) && !isDnrLnr(from) && !isZap(from)) {
        const [r1, r2] = await Promise.all([
          window.ymaps.route([from, "Весело-Вознесенка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Армянск", to], { routingMode: "auto" }).catch(() => null),
        ]);
        if (cancelled) return;
        const best = [
          { name: "Весело-Вознесенка, Ростовская область", len: getLen(r1) },
          { name: "Армянск", len: getLen(r2) },
        ].reduce((a, b) => a.len <= b.len ? a : b);
        allAddresses.splice(allAddresses.length - 1, 0, best.name);
      } else if (isKherson(from) && !isCrimea(to) && !isDnrLnr(to) && !isZap(to)) {
        const [r1, r2] = await Promise.all([
          window.ymaps.route([from, "Весело-Вознесенка, Ростовская область", to], { routingMode: "auto" }).catch(() => null),
          window.ymaps.route([from, "Армянск", to], { routingMode: "auto" }).catch(() => null),
        ]);
        if (cancelled) return;
        const best = [
          { name: "Весело-Вознесенка, Ростовская область", len: getLen(r1) },
          { name: "Армянск", len: getLen(r2) },
        ].reduce((a, b) => a.len <= b.len ? a : b);
        allAddresses.splice(1, 0, best.name);
      }

      const hasViaPoint = allAddresses.length > 2;
      let routes: AnyRef[] = [];
      const backendLines: AnyRef[] = [];
      const hasSpecialAddr = isSpecialZone(from) || isSpecialZone(to);
      const bothSpecial = isSpecialZone(from) && isSpecialZone(to);

      if (hasSpecialAddr && !hasViaPoint && !bothSpecial) {
        const backendRoute = await fetchBackendPolyline(from, to);
        if (cancelled) return;
        if (backendRoute) backendLines.push(backendRoute);
      } else {
        const r = await window.ymaps.route(allAddresses, { routingMode: "auto", mapStateAutoApply: false }).catch(() => null);
        if (r) {
          routes = [r];
        } else if (hasSpecialAddr) {
          const backendRoute = await fetchBackendPolyline(from, to);
          if (cancelled) return;
          if (backendRoute) backendLines.push(backendRoute);
        }
      }

      if (cancelled || (routes.length === 0 && backendLines.length === 0)) return;

      const [coordFrom, coordTo] = await Promise.all([geocodeAddress(from), geocodeAddress(to)]);
      if (cancelled) return;

      const newObjects: AnyRef[] = [];

      routes.forEach(route => {
        const wps = route.getWayPoints();
        for (let i = 0; i < wps.getLength(); i++) {
          wps.get(i).options.set({ visible: false });
        }
        route.getPaths().options.set({ strokeColor: "#c8d44a", strokeWidth: 4, opacity: 0.9 });
        newObjects.push(route);
      });

      backendLines.forEach(line => newObjects.push(line));

      [coordFrom, coordTo].forEach(coord => {
        if (!coord) return;
        newObjects.push(new window.ymaps.Placemark(coord, {}, { preset: "islands#dotIcon", iconColor: "#c8d44a" }));
      });

      newObjects.forEach(obj => map.geoObjects.add(obj));
      routeObjectsRef.current = newObjects;

      const route = routes[0];

      const isMobile = window.innerWidth < 640;
      const bottomMargin = isMobile
        ? (formHeightRef.current ?? Math.round(window.innerHeight * 0.55)) + 16
        : 40;
      const margin: [number, number, number, number] = isMobile ? [60, 16, bottomMargin, 16] : [76, 40, 40, 420];

      const boundsCoords = [coordFrom, coordTo].filter(Boolean) as [number, number][];
      if (boundsCoords.length === 2) {
        const latMin = Math.min(...boundsCoords.map(c => c[0]));
        const latMax = Math.max(...boundsCoords.map(c => c[0]));
        const lonMin = Math.min(...boundsCoords.map(c => c[1]));
        const lonMax = Math.max(...boundsCoords.map(c => c[1]));
        map.setBounds([[latMin, lonMin], [latMax, lonMax]], { checkZoomRange: true, zoomMargin: margin });
      } else if (route) {
        const bounds = route.getBounds();
        if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: margin });
      }
    };

    run();
    return () => { cancelled = true; };
  }, [from, to, stops]);

  return { mapRef };
}
