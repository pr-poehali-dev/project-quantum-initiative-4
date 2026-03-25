import json
import urllib.request
import math
import os
import psycopg2
import time

"""Ежедневная проверка эталонных маршрутов — сравнивает расстояния из БД с расчётом OSRM."""

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SPECIAL_POLYGONS = [
    [(48.07,37.45),(48.35,38.15),(48.55,38.85),(48.1,39.5),
     (47.8,39.6),(47.4,38.9),(47.0,38.2),(46.9,37.8),(46.9,37.2),
     (47.1,37.0),(47.3,37.0),(47.6,37.1),(47.9,37.2),(48.07,37.45)],
    [(48.55,38.85),(48.9,39.3),(49.3,39.7),(49.5,40.2),
     (49.15,40.5),(48.7,40.1),(48.3,39.9),(47.8,39.6),(48.1,39.5),(48.55,38.85)],
    [(47.6,34.2),(47.9,35.1),(47.85,36.0),(47.6,36.8),
     (47.3,37.1),(47.0,36.5),(46.7,35.8),(46.4,35.5),(46.3,34.8),
     (46.4,34.2),(46.7,33.9),(47.0,33.8),(47.3,33.9),(47.6,34.2)],
    [(47.2,32.5),(47.4,33.5),(47.2,34.2),(46.9,34.8),
     (46.5,34.9),(46.2,34.5),(46.0,33.8),(46.0,32.8),(46.3,32.2),(46.7,32.2),(47.2,32.5)],
]

CRIMEA_KEYS = ["крым","республика крым",
    "симферополь","ялта","севастополь","керчь","феодосия","евпатория","алушта","судак",
    "бахчисарай","армянск","саки","белогорск","джанкой","красноперекопск",
    "старый крым","щёлкино","щелкино","инкерман","балаклава",
    "гаспра","кореиз","симеиз","форос","партенит","гурзуф","массандра","ливадия",
]

SPECIAL_KEYS = ["донецк","донецкая народная","днр","мариуполь","горловка","макеевка",
    "краматорск","дебальцево","авдеевка","ясиноватая","енакиево","харцызск",
    "луганск","луганская народная","лнр","лисичанск","северодонецк","алчевск",
    "антрацит","ровеньки",
    "херсон","херсонская","геническ","каховка","скадовск",
    "мелитополь","запорожская","бердянск","токмак","энергодар","пологи",
]

CITY_COORDS = {
    "донецк":(48.015,37.802),"мариуполь":(47.095,37.541),"горловка":(48.290,38.069),
    "макеевка":(47.985,37.967),"луганск":(48.574,39.311),"алчевск":(48.473,38.808),
    "лисичанск":(48.905,38.430),"северодонецк":(48.948,38.493),
    "херсон":(46.636,32.617),"геническ":(46.177,34.815),"каховка":(46.816,33.484),
    "мелитополь":(46.843,35.365),"бердянск":(46.759,36.799),"токмак":(47.253,35.705),
    "энергодар":(47.498,34.654),
    "симферополь":(44.9521,34.1024),"ялта":(44.4952,34.1663),"севастополь":(44.6167,33.5254),
    "керчь":(45.3563,36.4735),"феодосия":(45.0317,35.3827),"евпатория":(45.1977,33.3634),
    "алушта":(44.6718,34.3969),"судак":(44.8492,34.9715),"бахчисарай":(44.7552,33.8613),
    "армянск":(46.1087,33.6893),"саки":(45.1345,33.6039),
    "москва":(55.751,37.618),"санкт-петербург":(59.934,30.335),
    "ростов-на-дону":(47.222,39.718),"краснодар":(45.035,38.975),
    "воронеж":(51.672,39.207),"волгоград":(48.707,44.517),
    "астрахань":(46.349,48.033),"ставрополь":(45.044,41.969),
    "пятигорск":(44.048,43.063),"кисловодск":(43.905,42.717),
    "ессентуки":(44.044,42.862),"нальчик":(43.485,43.607),
    "владикавказ":(43.025,44.682),"грозный":(43.318,45.692),
    "махачкала":(42.984,47.504),"новороссийск":(44.724,37.768),
    "анапа":(44.894,37.316),"геленджик":(44.561,38.076),"сочи":(43.585,39.720),
    "таганрог":(47.236,38.897),"новочеркасск":(47.422,40.093),
    "шахты":(47.709,40.214),"волгодонск":(47.514,42.152),
    "белгород":(50.597,36.587),"курск":(51.730,36.193),
    "тула":(54.193,37.618),"рязань":(54.629,39.742),
    "липецк":(52.603,39.571),"тамбов":(52.721,41.452),
    "орёл":(52.970,36.064),"брянск":(53.244,34.363),
    "смоленск":(54.783,32.045),"калуга":(54.533,36.275),
    "владимир":(56.129,40.407),"ярославль":(57.626,39.893),
    "нижний новгород":(56.327,44.002),"казань":(55.796,49.106),
    "самара":(53.195,50.100),"саратов":(51.533,46.034),
    "пенза":(53.195,45.019),"уфа":(54.735,55.958),
    "тверь":(56.859,35.912),"иваново":(56.997,40.972),
    "майкоп":(44.609,40.100),"элиста":(46.308,44.270),
    "черкесск":(44.223,42.057),
}

KERCH_BRIDGE = (36.536, 45.308)
ARMIANSK = (33.691, 46.103)
CHONGAR = (34.394, 46.003)

DEVIATION_THRESHOLD = 15.0


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    d_lat = math.radians(lat2-lat1)
    d_lon = math.radians(lon2-lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(d_lon/2)**2
    return R*2*math.asin(math.sqrt(a))


def point_in_polygon(lat, lon, poly):
    n = len(poly); inside = False; j = n-1
    for i in range(n):
        xi,yi = poly[i]; xj,yj = poly[j]
        if ((yi>lon)!=(yj>lon)) and (lat < (xj-xi)*(lon-yi)/(yj-yi)+xi):
            inside = not inside
        j = i
    return inside


def is_in_special_zone(lat, lon):
    return any(point_in_polygon(lat, lon, p) for p in SPECIAL_POLYGONS)


def is_crimea_addr(addr):
    return any(k in addr.lower() for k in CRIMEA_KEYS)


def is_special_addr(addr):
    return any(k in addr.lower() for k in SPECIAL_KEYS)


def geocode_city(address):
    addr_lower = address.lower()
    for key, coord in CITY_COORDS.items():
        if key in addr_lower:
            return coord
    return None


def osrm_route(coords):
    try:
        coord_str = ";".join(f"{lon},{lat}" for lon,lat in coords)
        url = (f"http://router.project-osrm.org/route/v1/driving/{coord_str}"
               f"?overview=full&geometries=geojson&alternatives=false")
        req = urllib.request.Request(url, headers={"User-Agent": "ug-transfer-app/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        if data.get("code") != "Ok":
            return None
        route = data["routes"][0]
        dist_km = route["distance"] / 1000.0
        pts = route["geometry"]["coordinates"]
        waypoints = [(pt[1], pt[0]) for pt in pts]
        return {"distance_km": dist_km, "waypoints": waypoints}
    except Exception:
        return None


def split_km_by_zone(waypoints, total_km):
    h_normal = 0.0
    h_special = 0.0
    for i in range(len(waypoints)-1):
        lat1,lon1 = waypoints[i]
        lat2,lon2 = waypoints[i+1]
        seg = haversine(lat1,lon1,lat2,lon2)
        mid_lat = (lat1+lat2)/2
        mid_lon = (lon1+lon2)/2
        if is_in_special_zone(mid_lat, mid_lon):
            h_special += seg
        else:
            h_normal += seg
    h_total = h_normal + h_special
    if h_total == 0:
        return total_km, 0.0
    ratio_special = h_special / h_total
    km_special = total_km * ratio_special
    km_normal = total_km * (1 - ratio_special)
    return km_normal, km_special


def is_kherson_addr(a):
    return any(k in a.lower() for k in ["херсон","херсонская","геническ","каховка"])


def is_zap_addr(a):
    return any(k in a.lower() for k in ["мелитополь","запорожская","бердянск","токмак","энергодар","пологи"])


def check_single_route(from_city, to_city):
    coord_from = geocode_city(from_city)
    coord_to = geocode_city(to_city)
    if not coord_from or not coord_to:
        return None, None, "geocode_failed"

    from_crimea = is_crimea_addr(from_city)
    to_crimea = is_crimea_addr(to_city)
    all_special = is_special_addr(from_city) and is_special_addr(to_city)
    all_crimea = from_crimea and to_crimea

    osrm_coords = [(coord_from[1], coord_from[0]), (coord_to[1], coord_to[0])]

    if from_crimea and not to_crimea:
        if is_kherson_addr(to_city):
            osrm_coords.insert(1, ARMIANSK)
        elif is_zap_addr(to_city):
            osrm_coords.insert(1, CHONGAR)
        else:
            osrm_coords.insert(1, KERCH_BRIDGE)
    elif to_crimea and not from_crimea:
        if is_kherson_addr(from_city):
            osrm_coords.insert(len(osrm_coords)-1, ARMIANSK)
        elif is_zap_addr(from_city):
            osrm_coords.insert(len(osrm_coords)-1, CHONGAR)
        else:
            osrm_coords.insert(len(osrm_coords)-1, KERCH_BRIDGE)

    result = osrm_route(osrm_coords)
    if not result:
        return None, None, "osrm_failed"

    total_km = result["distance_km"]

    if all_special:
        km_normal, km_special = 0.0, total_km
    elif all_crimea:
        km_normal, km_special = total_km, 0.0
    else:
        km_normal, km_special = split_km_by_zone(result["waypoints"], total_km)

    return round(km_normal), round(km_special), None


def fix_route(event):
    """Пересчитывает маршрут через OSRM и обновляет эталон в БД."""
    body = json.loads(event.get("body", "{}"))
    route_id = body.get("route_id")
    if not route_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "route_id required"})}

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, from_city, to_city, km_normal, km_special FROM routes_reference WHERE id = %s", (route_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "route not found"})}

    _, from_city, to_city, old_normal, old_special = row
    old_total = old_normal + old_special

    calc_normal, calc_special, err = check_single_route(from_city, to_city)
    if err:
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "status": "error", "error": err, "route_id": route_id,
            "from": from_city, "to": to_city,
        })}

    calc_total = calc_normal + calc_special
    deviation = abs(calc_total - old_total) / old_total * 100 if old_total > 0 else 0

    if deviation <= DEVIATION_THRESHOLD:
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "status": "ok", "route_id": route_id,
            "from": from_city, "to": to_city,
            "message": f"Отклонение {round(deviation,1)}% в пределах нормы, исправление не требуется",
            "old_km": old_total, "calc_km": calc_total,
        })}

    cur.execute(
        "UPDATE routes_reference SET km_normal = %s, km_special = %s, "
        "notes = %s, updated_at = NOW() WHERE id = %s",
        (calc_normal, calc_special,
         f"Автоисправлено: было {old_normal}+{old_special}={old_total}км, стало {calc_normal}+{calc_special}={calc_total}км",
         route_id)
    )

    reverse_city_from = to_city
    reverse_city_to = from_city
    cur.execute(
        "UPDATE routes_reference SET km_normal = %s, km_special = %s, "
        "notes = %s, updated_at = NOW() "
        "WHERE LOWER(from_city) = LOWER(%s) AND LOWER(to_city) = LOWER(%s)",
        (calc_normal, calc_special,
         f"Автоисправлено (обратный): было→стало {calc_normal}+{calc_special}={calc_total}км",
         reverse_city_from, reverse_city_to)
    )

    conn.commit()
    conn.close()

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({
        "status": "fixed", "route_id": route_id,
        "from": from_city, "to": to_city,
        "old_normal": old_normal, "old_special": old_special, "old_total": old_total,
        "new_normal": calc_normal, "new_special": calc_special, "new_total": calc_total,
        "deviation": round(deviation, 1),
    })}


def fix_all_problems(event):
    """Исправляет все проблемные маршруты за сегодня."""
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT DISTINCT route_id, from_city, to_city, ref_km_normal, ref_km_special "
        "FROM route_check_logs WHERE status = 'deviation' AND check_date = CURRENT_DATE "
        "ORDER BY deviation_pct DESC"
    )
    rows = cur.fetchall()
    conn.close()

    fixed = []
    skipped = []
    errors = []

    for row in rows:
        route_id, from_city, to_city, ref_normal, ref_special = row
        ref_total = ref_normal + ref_special

        calc_normal, calc_special, err = check_single_route(from_city, to_city)
        if err:
            errors.append({"id": route_id, "from": from_city, "to": to_city, "error": err})
            time.sleep(0.2)
            continue

        calc_total = calc_normal + calc_special
        deviation = abs(calc_total - ref_total) / ref_total * 100 if ref_total > 0 else 0

        if deviation <= DEVIATION_THRESHOLD:
            skipped.append({"id": route_id, "from": from_city, "to": to_city, "deviation": round(deviation, 1)})
            time.sleep(0.2)
            continue

        conn2 = get_db()
        cur2 = conn2.cursor()
        cur2.execute(
            "UPDATE routes_reference SET km_normal = %s, km_special = %s, "
            "notes = %s, updated_at = NOW() WHERE id = %s",
            (calc_normal, calc_special,
             f"Автоисправлено: {ref_normal}+{ref_special}→{calc_normal}+{calc_special}",
             route_id)
        )
        cur2.execute(
            "UPDATE routes_reference SET km_normal = %s, km_special = %s, "
            "notes = %s, updated_at = NOW() "
            "WHERE LOWER(from_city) = LOWER(%s) AND LOWER(to_city) = LOWER(%s)",
            (calc_normal, calc_special,
             f"Автоисправлено (обратный): {calc_normal}+{calc_special}={calc_total}км",
             to_city, from_city)
        )
        conn2.commit()
        conn2.close()

        fixed.append({
            "id": route_id, "from": from_city, "to": to_city,
            "old_km": ref_total, "new_km": calc_total, "deviation": round(deviation, 1),
        })
        time.sleep(0.2)

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({
        "fixed": len(fixed), "skipped": len(skipped), "errors": len(errors),
        "details": fixed, "skipped_details": skipped, "error_details": errors,
    })}


def recalc_all(event):
    """Принудительно пересчитывает ВСЕ эталонные маршруты через OSRM и обновляет БД."""
    body = json.loads(event.get("body", "{}"))
    offset = int(body.get("offset", 0))
    limit = int(body.get("limit", 30))

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM routes_reference WHERE km_normal + km_special > 1")
    total = cur.fetchone()[0]

    cur.execute(
        "SELECT id, from_city, to_city, km_normal, km_special FROM routes_reference "
        "WHERE km_normal + km_special > 1 ORDER BY id LIMIT %s OFFSET %s",
        (limit, offset)
    )
    rows = cur.fetchall()
    conn.close()

    updated = []
    unchanged = []
    errors = []
    seen_pairs = set()

    for row in rows:
        route_id, from_city, to_city, old_normal, old_special = row
        old_total = old_normal + old_special

        pair_key = tuple(sorted([from_city.lower(), to_city.lower()]))
        if pair_key in seen_pairs:
            continue
        seen_pairs.add(pair_key)

        calc_normal, calc_special, err = check_single_route(from_city, to_city)
        if err:
            errors.append({"id": route_id, "from": from_city, "to": to_city, "error": err})
            time.sleep(0.3)
            continue

        calc_total = calc_normal + calc_special
        deviation = abs(calc_total - old_total) / old_total * 100 if old_total > 0 else 0

        conn2 = get_db()
        cur2 = conn2.cursor()
        cur2.execute(
            "UPDATE routes_reference SET km_normal = %s, km_special = %s, "
            "notes = %s, updated_at = NOW() WHERE id = %s",
            (calc_normal, calc_special,
             f"OSRM-пересчёт: было {old_normal}+{old_special}={old_total}км, стало {calc_normal}+{calc_special}={calc_total}км",
             route_id)
        )
        cur2.execute(
            "UPDATE routes_reference SET km_normal = %s, km_special = %s, "
            "notes = %s, updated_at = NOW() "
            "WHERE LOWER(from_city) = LOWER(%s) AND LOWER(to_city) = LOWER(%s)",
            (calc_normal, calc_special,
             f"OSRM-пересчёт (обратный): {calc_normal}+{calc_special}={calc_total}км",
             to_city, from_city)
        )
        conn2.commit()
        conn2.close()

        entry = {
            "id": route_id, "from": from_city, "to": to_city,
            "old_normal": old_normal, "old_special": old_special, "old_total": old_total,
            "new_normal": calc_normal, "new_special": calc_special, "new_total": calc_total,
            "deviation": round(deviation, 1),
        }
        if deviation > 1:
            updated.append(entry)
        else:
            unchanged.append(entry)

        time.sleep(0.3)

    has_more = (offset + limit) < total

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({
        "total": total,
        "offset": offset,
        "limit": limit,
        "processed": len(rows),
        "updated": len(updated),
        "unchanged": len(unchanged),
        "errors": len(errors),
        "has_more": has_more,
        "next_offset": offset + limit if has_more else None,
        "updated_details": updated,
        "error_details": errors,
    })}


def handler(event, context):
    """Проверка эталонных маршрутов порциями — ?offset=0&limit=20. Или ?report=1 для сводки."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}

    if event.get('httpMethod') == 'POST':
        action = params.get('action', '')
        if action == 'fix':
            return fix_route(event)
        if action == 'fix_all':
            return fix_all_problems(event)
        if action == 'recalc_all':
            return recalc_all(event)

    if params.get('report'):
        return get_report()

    offset = int(params.get('offset', 0))
    limit = int(params.get('limit', 20))

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, from_city, to_city, km_normal, km_special FROM routes_reference "
        "WHERE km_normal + km_special > 1 ORDER BY id LIMIT %s OFFSET %s",
        (limit, offset)
    )
    routes = cur.fetchall()

    cur.execute("SELECT COUNT(*) FROM routes_reference WHERE km_normal + km_special > 1")
    total = cur.fetchone()[0]

    results = []
    errors = []

    for route in routes:
        route_id, from_city, to_city, ref_normal, ref_special = route
        ref_total = ref_normal + ref_special

        calc_normal, calc_special, err = check_single_route(from_city, to_city)

        if err:
            cur.execute(
                "INSERT INTO route_check_logs (route_id, from_city, to_city, ref_km_normal, ref_km_special, status, error_detail) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (route_id, from_city, to_city, ref_normal, ref_special, "error", err)
            )
            errors.append({"id": route_id, "from": from_city, "to": to_city, "error": err})
            time.sleep(0.2)
            continue

        calc_total = calc_normal + calc_special
        deviation = abs(calc_total - ref_total) / ref_total * 100 if ref_total > 0 else 0
        status = "ok" if deviation <= DEVIATION_THRESHOLD else "deviation"

        cur.execute(
            "INSERT INTO route_check_logs (route_id, from_city, to_city, ref_km_normal, ref_km_special, "
            "calc_km_normal, calc_km_special, deviation_pct, status, error_detail) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (route_id, from_city, to_city, ref_normal, ref_special,
             calc_normal, calc_special, round(deviation, 1), status,
             f"ref={ref_total}km calc={calc_total}km diff={round(deviation,1)}%" if status == "deviation" else None)
        )

        entry = {
            "id": route_id, "from": from_city, "to": to_city,
            "ref_km": ref_total, "calc_km": calc_total,
            "deviation": round(deviation, 1), "status": status,
        }
        results.append(entry)
        if status == "deviation":
            errors.append(entry)

        time.sleep(0.2)

    conn.commit()
    conn.close()

    has_more = (offset + limit) < total

    if has_more and params.get('auto') == '1':
        next_offset = offset + limit
        try:
            self_url = os.environ.get('CHECK_ROUTES_URL', '')
            if self_url:
                next_url = f"{self_url}?offset={next_offset}&limit={limit}&auto=1"
                req = urllib.request.Request(next_url, headers={"User-Agent": "check-routes-chain"})
                urllib.request.urlopen(req, timeout=3)
        except Exception:
            pass

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "total_routes": total,
            "offset": offset,
            "limit": limit,
            "checked": len(results) + len(errors),
            "ok": sum(1 for r in results if r["status"] == "ok"),
            "deviations": sum(1 for r in results if r["status"] == "deviation"),
            "errors": len(errors),
            "has_more": has_more,
            "next_offset": offset + limit if has_more else None,
            "problems": [e for e in (errors + [r for r in results if r["status"] == "deviation"])],
        }),
    }


def get_report():
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT check_date, "
        "COUNT(*) as total, "
        "SUM(CASE WHEN status='ok' THEN 1 ELSE 0 END) as ok_count, "
        "SUM(CASE WHEN status='deviation' THEN 1 ELSE 0 END) as dev_count, "
        "SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) as err_count "
        "FROM route_check_logs GROUP BY check_date ORDER BY check_date DESC LIMIT 30"
    )
    daily = []
    for row in cur.fetchall():
        daily.append({
            "date": str(row[0]),
            "total": row[1],
            "ok": row[2],
            "deviations": row[3],
            "errors": row[4],
        })

    cur.execute(
        "SELECT route_id, from_city, to_city, ref_km_normal + ref_km_special as ref_km, "
        "calc_km_normal + calc_km_special as calc_km, deviation_pct, error_detail "
        "FROM route_check_logs WHERE status IN ('deviation','error') AND check_date = CURRENT_DATE "
        "ORDER BY deviation_pct DESC NULLS LAST LIMIT 50"
    )
    problems = []
    for row in cur.fetchall():
        problems.append({
            "route_id": row[0], "from": row[1], "to": row[2],
            "ref_km": row[3], "calc_km": row[4],
            "deviation": float(row[5]) if row[5] else None,
            "detail": row[6],
        })

    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"daily_summary": daily, "today_problems": problems}),
    }