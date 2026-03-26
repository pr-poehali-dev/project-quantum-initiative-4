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
    # ДНР — детальные административные границы
    [
        (48.718,37.309),(48.755,37.400),(48.800,37.530),(48.830,37.650),
        (48.850,37.780),(48.852,37.900),(48.840,38.020),(48.810,38.150),
        (48.780,38.250),(48.745,38.350),(48.700,38.480),(48.650,38.600),
        (48.600,38.720),(48.550,38.850),(48.500,38.900),(48.450,38.920),
        (48.400,38.900),(48.350,38.850),(48.300,38.780),(48.250,38.700),
        (48.200,38.620),(48.150,38.550),(48.100,38.500),(48.050,38.480),
        (48.000,38.500),(47.950,38.520),(47.900,38.500),(47.850,38.450),
        (47.800,38.380),(47.750,38.300),(47.700,38.200),(47.650,38.100),
        (47.600,38.000),(47.550,37.900),(47.500,37.800),(47.450,37.700),
        (47.400,37.600),(47.350,37.550),(47.300,37.520),(47.250,37.500),
        (47.200,37.490),(47.150,37.480),(47.100,37.470),(47.050,37.450),
        (47.000,37.400),(46.950,37.350),(46.920,37.280),(46.900,37.200),
        (46.880,37.100),(46.870,37.000),(46.880,36.900),(46.900,36.820),
        (46.930,36.760),(46.960,36.700),(47.000,36.650),(47.050,36.620),
        (47.100,36.600),(47.150,36.590),(47.200,36.600),(47.250,36.620),
        (47.300,36.650),(47.350,36.700),(47.400,36.760),(47.450,36.830),
        (47.500,36.900),(47.550,36.980),(47.600,37.050),(47.650,37.100),
        (47.700,37.120),(47.750,37.130),(47.800,37.120),(47.850,37.100),
        (47.900,37.090),(47.950,37.080),(48.000,37.090),(48.050,37.100),
        (48.100,37.110),(48.150,37.120),(48.200,37.130),(48.250,37.140),
        (48.300,37.150),(48.350,37.160),(48.400,37.170),(48.450,37.190),
        (48.500,37.210),(48.550,37.230),(48.600,37.260),(48.650,37.280),
        (48.700,37.300),(48.718,37.309),
    ],
    # ЛНР — детальные административные границы
    [
        (48.550,38.850),(48.600,38.900),(48.650,38.950),(48.700,39.020),
        (48.750,39.100),(48.800,39.180),(48.850,39.280),(48.900,39.380),
        (48.940,39.480),(48.970,39.580),(49.000,39.680),(49.030,39.780),
        (49.060,39.880),(49.100,39.980),(49.140,40.060),(49.180,40.130),
        (49.220,40.180),(49.260,40.220),(49.300,40.260),(49.340,40.300),
        (49.380,40.340),(49.400,40.380),(49.410,40.430),(49.405,40.480),
        (49.390,40.530),(49.370,40.570),(49.340,40.600),(49.300,40.620),
        (49.260,40.630),(49.220,40.620),(49.180,40.600),(49.140,40.570),
        (49.100,40.530),(49.060,40.480),(49.020,40.430),(48.980,40.380),
        (48.940,40.340),(48.900,40.300),(48.860,40.260),(48.820,40.220),
        (48.780,40.180),(48.740,40.140),(48.700,40.100),(48.660,40.060),
        (48.620,40.020),(48.580,39.980),(48.540,39.940),(48.500,39.900),
        (48.460,39.860),(48.420,39.820),(48.380,39.780),(48.340,39.740),
        (48.300,39.700),(48.260,39.660),(48.220,39.630),(48.180,39.600),
        (48.140,39.580),(48.100,39.560),(48.060,39.540),(48.020,39.520),
        (47.980,39.500),(47.940,39.480),(47.900,39.500),(47.850,39.450),
        (47.820,39.380),(47.800,39.300),(47.790,39.200),(47.800,39.100),
        (47.820,39.000),(47.850,38.920),(47.880,38.870),(47.920,38.830),
        (47.960,38.800),(48.000,38.780),(48.050,38.760),(48.100,38.750),
        (48.150,38.740),(48.200,38.740),(48.250,38.750),(48.300,38.760),
        (48.350,38.780),(48.400,38.800),(48.450,38.820),(48.500,38.840),
        (48.550,38.850),
    ],
    # Запорожская область — детальные административные границы
    [
        (47.640,34.050),(47.680,34.150),(47.720,34.260),(47.760,34.380),
        (47.800,34.500),(47.830,34.620),(47.850,34.740),(47.860,34.860),
        (47.870,34.980),(47.875,35.100),(47.870,35.220),(47.860,35.340),
        (47.845,35.460),(47.825,35.580),(47.800,35.700),(47.770,35.820),
        (47.740,35.940),(47.710,36.060),(47.680,36.160),(47.650,36.260),
        (47.620,36.360),(47.590,36.460),(47.560,36.560),(47.530,36.650),
        (47.500,36.740),(47.470,36.820),(47.430,36.900),(47.390,36.960),
        (47.350,37.010),(47.310,37.050),(47.270,37.080),(47.230,37.100),
        (47.190,37.110),(47.150,37.100),(47.110,37.080),(47.070,37.050),
        (47.030,37.000),(46.990,36.940),(46.950,36.870),(46.910,36.800),
        (46.870,36.720),(46.840,36.640),(46.820,36.560),(46.810,36.480),
        (46.800,36.400),(46.790,36.320),(46.780,36.240),(46.770,36.160),
        (46.760,36.080),(46.745,36.000),(46.730,35.920),(46.710,35.840),
        (46.690,35.760),(46.660,35.680),(46.630,35.600),(46.600,35.520),
        (46.570,35.440),(46.540,35.370),(46.510,35.300),(46.480,35.240),
        (46.450,35.190),(46.420,35.140),(46.390,35.090),(46.360,35.040),
        (46.330,34.980),(46.310,34.920),(46.290,34.860),(46.280,34.790),
        (46.270,34.720),(46.270,34.640),(46.280,34.560),(46.290,34.480),
        (46.310,34.400),(46.330,34.330),(46.360,34.260),(46.390,34.200),
        (46.420,34.140),(46.460,34.090),(46.500,34.040),(46.540,34.000),
        (46.580,33.970),(46.620,33.940),(46.660,33.920),(46.700,33.900),
        (46.740,33.890),(46.780,33.880),(46.820,33.880),(46.860,33.890),
        (46.900,33.900),(46.940,33.920),(46.980,33.940),(47.020,33.960),
        (47.060,33.980),(47.100,34.000),(47.140,34.010),(47.180,34.020),
        (47.220,34.020),(47.260,34.020),(47.300,34.020),(47.340,34.020),
        (47.380,34.020),(47.420,34.020),(47.460,34.020),(47.500,34.020),
        (47.540,34.020),(47.580,34.030),(47.620,34.040),(47.640,34.050),
    ],
    # Херсонская область — детальные административные границы
    [
        (47.260,32.360),(47.300,32.450),(47.340,32.550),(47.380,32.660),
        (47.410,32.780),(47.430,32.900),(47.445,33.020),(47.450,33.150),
        (47.445,33.280),(47.430,33.400),(47.410,33.520),(47.380,33.640),
        (47.340,33.750),(47.300,33.860),(47.260,33.960),(47.220,34.050),
        (47.180,34.020),(47.140,34.010),(47.100,34.000),(47.060,33.980),
        (47.020,33.960),(46.980,33.940),(46.940,33.920),(46.900,33.900),
        (46.860,33.890),(46.820,33.880),(46.780,33.880),(46.740,33.890),
        (46.700,33.900),(46.660,33.920),(46.620,33.940),(46.580,33.970),
        (46.540,34.000),(46.500,34.040),(46.460,34.090),(46.420,34.140),
        (46.390,34.200),(46.360,34.260),(46.330,34.330),(46.310,34.400),
        (46.290,34.480),(46.280,34.560),(46.270,34.640),(46.270,34.720),
        (46.280,34.790),(46.290,34.860),(46.270,34.880),(46.240,34.880),
        (46.210,34.870),(46.180,34.850),(46.160,34.820),(46.150,34.780),
        (46.140,34.740),(46.130,34.690),(46.120,34.640),(46.110,34.580),
        (46.100,34.520),(46.090,34.450),(46.080,34.380),(46.070,34.310),
        (46.065,34.240),(46.060,34.170),(46.058,34.100),(46.060,34.020),
        (46.065,33.950),(46.070,33.880),(46.070,33.810),(46.065,33.740),
        (46.060,33.670),(46.050,33.600),(46.040,33.530),(46.025,33.460),
        (46.010,33.400),(45.990,33.340),(45.970,33.280),(45.950,33.230),
        (45.930,33.190),(45.920,33.150),(45.920,33.100),(45.930,33.050),
        (45.950,33.010),(45.980,32.980),(46.010,32.960),(46.040,32.940),
        (46.060,32.910),(46.070,32.870),(46.080,32.820),(46.085,32.770),
        (46.080,32.720),(46.070,32.670),(46.050,32.620),(46.030,32.570),
        (46.010,32.520),(45.990,32.480),(45.975,32.430),(45.970,32.380),
        (45.975,32.330),(45.990,32.290),(46.010,32.260),(46.040,32.230),
        (46.070,32.200),(46.100,32.180),(46.140,32.160),(46.180,32.150),
        (46.220,32.150),(46.260,32.150),(46.300,32.160),(46.340,32.170),
        (46.380,32.180),(46.420,32.190),(46.460,32.200),(46.500,32.210),
        (46.540,32.220),(46.580,32.230),(46.620,32.240),(46.660,32.250),
        (46.700,32.260),(46.740,32.270),(46.780,32.280),(46.820,32.290),
        (46.860,32.300),(46.900,32.300),(46.940,32.310),(46.980,32.310),
        (47.020,32.310),(47.060,32.310),(47.100,32.310),(47.140,32.320),
        (47.180,32.330),(47.220,32.340),(47.260,32.360),
    ],
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


def yandex_route(coords):
    api_key = os.environ.get('YANDEX_ROUTES_API_KEY', '')
    if not api_key:
        return None
    try:
        waypoints_str = "~".join(f"{lon},{lat}" for lon, lat in coords)
        url = f"https://api.routing.yandex.net/v2/route?apikey={api_key}&waypoints={waypoints_str}&mode=driving"
        req = urllib.request.Request(url, headers={"User-Agent": "ug-transfer-app/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
        route = data.get("route")
        if not route or not route.get("legs"):
            return None
        total_distance = 0.0
        all_points = []
        for leg in route["legs"]:
            if leg.get("status") != "OK":
                return None
            for step in leg.get("steps", []):
                total_distance += step.get("length", 0)
                pts = step.get("polyline", {}).get("points", [])
                for pt in pts:
                    all_points.append((pt[1], pt[0]))
        dist_km = total_distance / 1000.0
        return {"distance_km": dist_km, "waypoints": all_points}
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


def is_route_unreliable(from_city, to_city):
    """OSRM не знает дорог в спецзонах — строит объезды через Россию."""
    f_spec = is_special_addr(from_city)
    t_spec = is_special_addr(to_city)
    f_crim = is_crimea_addr(from_city)
    t_crim = is_crimea_addr(to_city)
    if f_spec and t_spec:
        return True
    if (f_spec or t_spec) and (f_crim or t_crim):
        return True
    if (f_spec and not t_spec and not t_crim) or (t_spec and not f_spec and not f_crim):
        return True
    return False


def check_single_route(from_city, to_city):
    coord_from = geocode_city(from_city)
    coord_to = geocode_city(to_city)
    if not coord_from or not coord_to:
        return None, None, "geocode_failed"

    from_crimea = is_crimea_addr(from_city)
    to_crimea = is_crimea_addr(to_city)
    all_special = is_special_addr(from_city) and is_special_addr(to_city)
    all_crimea = from_crimea and to_crimea

    route_coords = [(coord_from[1], coord_from[0]), (coord_to[1], coord_to[0])]

    if from_crimea and not to_crimea:
        if is_kherson_addr(to_city):
            route_coords.insert(1, ARMIANSK)
        elif is_zap_addr(to_city):
            route_coords.insert(1, CHONGAR)
        else:
            route_coords.insert(1, KERCH_BRIDGE)
    elif to_crimea and not from_crimea:
        if is_kherson_addr(from_city):
            route_coords.insert(len(route_coords)-1, ARMIANSK)
        elif is_zap_addr(from_city):
            route_coords.insert(len(route_coords)-1, CHONGAR)
        else:
            route_coords.insert(len(route_coords)-1, KERCH_BRIDGE)

    result = yandex_route(route_coords)
    if not result:
        result = osrm_route(route_coords)
    if not result:
        return None, None, "route_api_failed"

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

    if is_route_unreliable(from_city, to_city):
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "status": "ok", "route_id": route_id,
            "from": from_city, "to": to_city,
            "message": "Маршрут в спецзоне — OSRM ненадёжен, эталон сохранён",
            "old_km": old_total, "calc_km": old_total,
        })}

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

        if is_route_unreliable(from_city, to_city):
            skipped.append({"id": route_id, "from": from_city, "to": to_city, "deviation": 0, "reason": "speczone"})
            continue

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

    skipped = []

    for row in rows:
        route_id, from_city, to_city, old_normal, old_special = row
        old_total = old_normal + old_special

        pair_key = tuple(sorted([from_city.lower(), to_city.lower()]))
        if pair_key in seen_pairs:
            continue
        seen_pairs.add(pair_key)

        if is_route_unreliable(from_city, to_city):
            skipped.append({"id": route_id, "from": from_city, "to": to_city, "reason": "speczone"})
            continue

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
        "skipped": len(skipped),
        "errors": len(errors),
        "has_more": has_more,
        "next_offset": offset + limit if has_more else None,
        "updated_details": updated,
        "skipped_details": skipped,
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

        if is_route_unreliable(from_city, to_city):
            cur.execute(
                "INSERT INTO route_check_logs (route_id, from_city, to_city, ref_km_normal, ref_km_special, "
                "calc_km_normal, calc_km_special, deviation_pct, status, error_detail) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (route_id, from_city, to_city, ref_normal, ref_special,
                 ref_normal, ref_special, 0, "ok", "speczone: OSRM пропущен")
            )
            results.append({
                "id": route_id, "from": from_city, "to": to_city,
                "ref_km": ref_total, "calc_km": ref_total,
                "deviation": 0, "status": "ok",
            })
            continue

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