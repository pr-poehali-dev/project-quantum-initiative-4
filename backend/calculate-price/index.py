import json
import urllib.request
import math


TARIFFS = {
    "urgent":   {"per_km": 30, "base": 1500},
    "standard": {"per_km": 30, "base": 0},
    "comfort":  {"per_km": 40, "base": 0},
    "minivan":  {"per_km": 60, "base": 0},
    "business": {"per_km": 80, "base": 0},
}

TARIFFS_SPECIAL = {
    "urgent":   {"per_km": 80, "base": 1500},
    "standard": {"per_km": 80, "base": 0},
    "comfort":  {"per_km": 90, "base": 0},
    "minivan":  {"per_km": 100, "base": 0},
    "business": {"per_km": 180, "base": 0},
}

EXTRAS = {
    "childSeat": 1500,
    "pet": 1000,
    "booster": 1000,
}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

UKRAINE_COUNTRIES = {"украина", "ukraine", "україна"}

CRIMEA_ONLY = {
    "республика крым", "крым", "crimea", "автономна республіка крим",
}

SPECIAL_ZONE_POLYGONS = [
    # ДНР
    [
        (48.07, 37.45), (48.35, 38.15), (48.55, 38.85), (48.1, 39.5),
        (47.8, 39.6), (47.4, 38.9), (47.1, 38.2), (47.3, 37.5),
        (47.6, 37.1), (47.9, 37.2), (48.07, 37.45),
    ],
    # ЛНР
    [
        (48.55, 38.85), (48.9, 39.3), (49.3, 39.7), (49.5, 40.2),
        (49.15, 40.5), (48.7, 40.1), (48.3, 39.9), (47.8, 39.6),
        (48.1, 39.5), (48.55, 38.85),
    ],
    # Запорожская область
    [
        (47.6, 34.2), (47.9, 35.1), (47.85, 36.0), (47.6, 36.8),
        (47.3, 37.1), (47.0, 36.5), (46.7, 35.8), (46.6, 34.8),
        (46.9, 34.2), (47.3, 33.9), (47.6, 34.2),
    ],
    # Херсонская область
    [
        (47.0, 32.5), (47.2, 33.5), (46.9, 34.2), (46.6, 34.8),
        (46.4, 34.4), (46.35, 33.6), (46.4, 32.8), (46.6, 32.3),
        (47.0, 32.5),
    ],
]

DNR_LNR_ADDR_KEYS = ["донецк", "луганск", "мариуполь", "горловка", "макеевка", "лисичанск", "северодонецк", "краматорск", "днр", "лнр"]
KHERSON_ZAP_ADDR_KEYS = ["херсон", "мелитополь", "бердянск", "токмак", "энергодар", "геническ", "херсонская", "запорожская", "запорожье"]
CRIMEA_ADDR_KEYS = ["крым", "ялта", "симферополь", "севастополь", "керчь", "феодосия", "евпатория", "алушта", "судак", "бахчисарай"]

# КПП — точки входа/выхода в спецзоны
KPP_COORDS = {
    "matveev":   (47.556, 38.882),  # Матвеев Курган (ДНР)
    "veselo":    (47.393, 38.474),  # Весело-Вознесенка (ДНР)
    "vasilevka": (47.471, 35.283),  # Васильевка (Запорожская обл.)
    "armiansk":  (46.103, 33.691),  # Армянск (Крым — западный)
    "chongar":   (46.003, 34.394),  # Чонгар (Крым — восточный)
    "kerch":     (45.360, 36.467),  # Крымский мост
    "rostov":    (47.222, 39.718),  # Ростов-на-Дону
}

# Координаты городов в спецзонах (для OSRM внутри зоны)
SPECIAL_CITY_COORDS = {
    "донецк":        (48.015, 37.802),
    "луганск":       (48.574, 39.307),
    "мариуполь":     (47.095, 37.541),
    "горловка":      (48.290, 38.069),
    "макеевка":      (47.985, 37.967),
    "лисичанск":     (48.901, 38.432),
    "северодонецк":  (48.952, 38.491),
    "краматорск":    (48.723, 37.537),
    "мелитополь":    (46.847, 35.367),
    "бердянск":      (46.756, 36.800),
    "токмак":        (47.253, 35.706),
    "энергодар":     (47.503, 34.653),
    "херсон":        (46.636, 32.617),
    "геническ":      (46.167, 34.817),
}


def point_in_polygon(lat: float, lon: float, polygon: list) -> bool:
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if ((yi > lon) != (yj > lon)) and (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def is_in_special_zone(lat: float, lon: float) -> bool:
    for polygon in SPECIAL_ZONE_POLYGONS:
        if point_in_polygon(lat, lon, polygon):
            return True
    return False


def geocode(address: str):
    """Получить координаты адреса и определить зону тарифа."""
    addr_lower = address.lower()

    # Проверяем известные спецгорода — берём хардкодные координаты
    for key, coord in SPECIAL_CITY_COORDS.items():
        if key in addr_lower:
            special = any(k in addr_lower for k in DNR_LNR_ADDR_KEYS + KHERSON_ZAP_ADDR_KEYS)
            return coord, special

    url = (
        f"https://nominatim.openstreetmap.org/search"
        f"?q={urllib.request.quote(address)}&format=json&limit=1&accept-language=ru&addressdetails=1"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "ug-transfer-app/1.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    if not data:
        return None, None
    item = data[0]
    lat, lon = float(item["lat"]), float(item["lon"])
    addr = item.get("address", {})
    country = addr.get("country", "").lower()
    state = addr.get("state", "").lower()

    is_ukraine = country in UKRAINE_COUNTRIES
    is_crimea = any(k in state for k in CRIMEA_ONLY)
    if not is_crimea and is_ukraine:
        if 44.3 <= lat <= 46.2 and 32.5 <= lon <= 36.7:
            is_crimea = True

    force_crimea = any(k in addr_lower for k in CRIMEA_ADDR_KEYS)
    if force_crimea:
        return (lat, lon), False

    force_special = (
        any(k in addr_lower for k in DNR_LNR_ADDR_KEYS) or
        any(k in addr_lower for k in KHERSON_ZAP_ADDR_KEYS)
    )

    coord_special = is_in_special_zone(lat, lon)
    special = (is_ukraine and not is_crimea) or force_special or coord_special
    return (lat, lon), special


def osrm_distance(lat1, lon1, lat2, lon2) -> float:
    """Реальное дорожное расстояние через OSRM (км). Fallback на haversine×1.35."""
    try:
        url = (
            f"http://router.project-osrm.org/route/v1/driving/"
            f"{lon1},{lat1};{lon2},{lat2}"
            f"?overview=false&alternatives=false"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "ug-transfer-app/1.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read())
        if data.get("code") == "Ok":
            return data["routes"][0]["distance"] / 1000.0
    except Exception:
        pass
    # Fallback: haversine × 1.35
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a)) * 1.35


def calc_price(km_normal, km_special, tariff_key, extras_cost):
    t = TARIFFS.get(tariff_key, TARIFFS["standard"])
    ts = TARIFFS_SPECIAL.get(tariff_key, TARIFFS_SPECIAL["standard"])
    return t["per_km"] * km_normal + ts["per_km"] * km_special + t["base"] + extras_cost


def handler(event: dict, context) -> dict:
    """Рассчитать стоимость поездки с учётом зон повышенного тарифа (новые регионы России). Использует OSRM для точного дорожного расстояния."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    from_city = body.get("from", "")
    to_city = body.get("to", "")
    car_class = body.get("carClass", "standard")
    extras_selected = body.get("extras", {})
    stops = body.get("stops", [])
    kpp = body.get("kpp", "matveev")

    if not from_city or not to_city:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите откуда и куда"})}

    def is_crimea_addr(a): return any(k in a.lower() for k in CRIMEA_ADDR_KEYS)
    def is_kherson_zap(a): return any(k in a.lower() for k in KHERSON_ZAP_ADDR_KEYS)
    def is_dnr_lnr(a): return any(k in a.lower() for k in DNR_LNR_ADDR_KEYS)
    def is_special(a): return is_dnr_lnr(a) or is_kherson_zap(a)

    from_russia = not is_crimea_addr(from_city) and not is_special(from_city)
    to_russia = not is_crimea_addr(to_city) and not is_special(to_city)
    from_crimea = is_crimea_addr(from_city)
    to_crimea = is_crimea_addr(to_city)

    kpp_key = kpp if kpp in ("matveev", "veselo") else "matveev"

    # Сегменты: список (addr_or_label, is_special_segment, preset_coord)
    # is_special_segment=True → этот сегмент считается по спецтарифу
    all_cities = [from_city] + stops + [to_city]

    # --- Строим список точек маршрута ---
    # Каждая точка: (lat, lon, is_special)
    waypoints = []  # список (lat, lon, is_special_zone_flag)

    if is_dnr_lnr(to_city) and from_crimea:
        # Крым → (мост) → Ростов → КПП → ДНР
        fc, _ = geocode(from_city)
        tc, _ = geocode(to_city)
        if not fc or not tc:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не удалось определить адрес"})}
        waypoints = [
            (fc[0], fc[1], False),
            (KPP_COORDS["kerch"][0], KPP_COORDS["kerch"][1], False),
            (KPP_COORDS["rostov"][0], KPP_COORDS["rostov"][1], False),
            (KPP_COORDS[kpp_key][0], KPP_COORDS[kpp_key][1], False),
            (tc[0], tc[1], True),
        ]

    elif is_dnr_lnr(from_city) and to_crimea:
        # ДНР → КПП → Ростов → (мост) → Крым
        fc, _ = geocode(from_city)
        tc, _ = geocode(to_city)
        if not fc or not tc:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не удалось определить адрес"})}
        waypoints = [
            (fc[0], fc[1], True),
            (KPP_COORDS[kpp_key][0], KPP_COORDS[kpp_key][1], False),
            (KPP_COORDS["rostov"][0], KPP_COORDS["rostov"][1], False),
            (KPP_COORDS["kerch"][0], KPP_COORDS["kerch"][1], False),
            (tc[0], tc[1], False),
        ]

    elif is_dnr_lnr(to_city) and from_russia:
        fc, _ = geocode(from_city)
        tc, _ = geocode(to_city)
        if not fc or not tc:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не удалось определить адрес"})}
        waypoints = [
            (fc[0], fc[1], False),
            (KPP_COORDS[kpp_key][0], KPP_COORDS[kpp_key][1], False),
            (tc[0], tc[1], True),
        ]

    elif is_dnr_lnr(from_city) and to_russia:
        fc, _ = geocode(from_city)
        tc, _ = geocode(to_city)
        if not fc or not tc:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не удалось определить адрес"})}
        waypoints = [
            (fc[0], fc[1], True),
            (KPP_COORDS[kpp_key][0], KPP_COORDS[kpp_key][1], False),
            (tc[0], tc[1], False),
        ]

    elif is_kherson_zap(to_city) and from_russia:
        fc, _ = geocode(from_city)
        tc, _ = geocode(to_city)
        if not fc or not tc:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не удалось определить адрес"})}
        waypoints = [
            (fc[0], fc[1], False),
            (KPP_COORDS["vasilevka"][0], KPP_COORDS["vasilevka"][1], False),
            (tc[0], tc[1], True),
        ]

    elif is_kherson_zap(from_city) and to_russia:
        fc, _ = geocode(from_city)
        tc, _ = geocode(to_city)
        if not fc or not tc:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не удалось определить адрес"})}
        waypoints = [
            (fc[0], fc[1], True),
            (KPP_COORDS["vasilevka"][0], KPP_COORDS["vasilevka"][1], False),
            (tc[0], tc[1], False),
        ]

    elif to_crimea and is_kherson_zap(from_city):
        fc, _ = geocode(from_city)
        tc, _ = geocode(to_city)
        if not fc or not tc:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не удалось определить адрес"})}
        waypoints = [
            (fc[0], fc[1], True),
            (KPP_COORDS["chongar"][0], KPP_COORDS["chongar"][1], False),
            (tc[0], tc[1], False),
        ]

    elif from_crimea and is_kherson_zap(to_city):
        fc, _ = geocode(from_city)
        tc, _ = geocode(to_city)
        if not fc or not tc:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не удалось определить адрес"})}
        waypoints = [
            (fc[0], fc[1], False),
            (KPP_COORDS["chongar"][0], KPP_COORDS["chongar"][1], False),
            (tc[0], tc[1], True),
        ]

    else:
        # Обычный маршрут — геокодируем все точки
        for addr in all_cities:
            coord, special = geocode(addr)
            if not coord:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"Не удалось найти: {addr}"})}
            waypoints.append((coord[0], coord[1], special))

    # --- Считаем расстояние по сегментам через OSRM ---
    km_normal = 0.0
    km_special = 0.0

    for i in range(len(waypoints) - 1):
        lat1, lon1, sp1 = waypoints[i]
        lat2, lon2, sp2 = waypoints[i + 1]
        seg_km = osrm_distance(lat1, lon1, lat2, lon2)
        # Сегмент спецзоны если хотя бы одна из точек в спецзоне
        if sp1 or sp2:
            km_special += seg_km
        else:
            km_normal += seg_km

    km_normal = round(km_normal)
    km_special = round(km_special)
    distance_km = km_normal + km_special

    extras_cost = sum(cost for key, cost in EXTRAS.items() if extras_selected.get(key))

    price = calc_price(km_normal, km_special, car_class, extras_cost)
    all_prices = {key: calc_price(km_normal, km_special, key, extras_cost) for key in TARIFFS}

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "distance_km": distance_km,
            "price": price,
            "car_class": car_class,
            "all_prices": all_prices,
            "has_special_zone": km_special > 0,
            "km_normal": km_normal,
            "km_special": km_special,
        }),
    }
