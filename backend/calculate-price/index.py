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

# Повышенный тариф для новых регионов
TARIFFS_SPECIAL = {
    "urgent":   {"per_km": 75, "base": 1500},
    "standard": {"per_km": 75, "base": 0},
    "comfort":  {"per_km": 85, "base": 0},
    "minivan":  {"per_km": 95, "base": 0},
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

# Регионы которые Nominatim считает Украиной, но по факту Россия — обычный тариф
RUSSIA_NEW_REGIONS = {
    # Крым
    "республика крым", "крым", "crimea", "автономна республіка крим",
    # ДНР — Nominatim возвращает "донецкая область"
    "донецкая народная республика", "донецька область", "донецкая область",
    # ЛНР — Nominatim возвращает "луганская область"
    "луганская народная республика", "луганська область", "луганская область",
    # Запорожская
    "запорожская область", "запорізька область",
    # Херсонская
    "херсонская область", "херсонська область",
}


def geocode(address: str):
    """Получить координаты адреса. Спецтариф только если адрес на Украине вне новых регионов России."""
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
    county = addr.get("county", "").lower()
    city = addr.get("city", addr.get("town", addr.get("village", ""))).lower()
    addr_text = f"{state} {county} {city}"
    is_russia_new = any(k in addr_text for k in RUSSIA_NEW_REGIONS)

    # Запасная проверка по координатам для новых регионов
    # ДНР: ~47.0-48.5 lat, 37.0-39.5 lon
    # ЛНР: ~48.0-50.0 lat, 38.0-40.5 lon
    # Запорожская: ~46.5-48.0 lat, 34.5-37.5 lon
    # Херсонская: ~46.3-47.6 lat, 32.5-35.5 lon
    NEW_REGIONS_BBOX = [
        (47.0, 48.5, 37.0, 39.5),   # ДНР
        (48.0, 50.0, 38.0, 40.5),   # ЛНР
        (46.5, 48.0, 34.5, 37.5),   # Запорожская
        (46.3, 47.6, 32.5, 35.5),   # Херсонская
        (44.3, 46.2, 32.5, 36.7),   # Крым
    ]
    if not is_russia_new and is_ukraine:
        for lat_min, lat_max, lon_min, lon_max in NEW_REGIONS_BBOX:
            if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
                is_russia_new = True
                break

    # Спецтариф только если Украина И не новый регион России
    special = is_ukraine and not is_russia_new
    return (lat, lon), special


def haversine(lat1, lon1, lat2, lon2) -> float:
    """Расстояние между двумя точками по формуле Гаверсина (км)."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def calc_price(km_normal, km_special, tariff_key, extras_cost):
    """Рассчитать комбинированную цену: обычный + повышенный тариф."""
    t = TARIFFS.get(tariff_key, TARIFFS["standard"])
    ts = TARIFFS_SPECIAL.get(tariff_key, TARIFFS_SPECIAL["standard"])
    return t["per_km"] * km_normal + ts["per_km"] * km_special + t["base"] + extras_cost


def handler(event: dict, context) -> dict:
    """Рассчитать стоимость поездки с учётом зон повышенного тарифа (новые регионы России)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    from_city = body.get("from", "")
    to_city = body.get("to", "")
    car_class = body.get("carClass", "standard")
    extras_selected = body.get("extras", {})
    stops = body.get("stops", [])

    if not from_city or not to_city:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите откуда и куда"})}

    CRIMEA_KEYS = ["крым", "ялта", "симферополь", "севастополь", "керчь", "феодосия", "евпатория", "алушта", "судак", "бахчисарай"]
    KHERSON_ZAP_KEYS = ["херсон", "мелитополь", "бердянск", "токмак", "энергодар", "геническ", "херсонская", "запорожская", "запорожье"]
    def is_crimea_addr(a): return any(k in a.lower() for k in CRIMEA_KEYS)
    def is_kherson_zap(a): return any(k in a.lower() for k in KHERSON_ZAP_KEYS)

    # Для расчёта цены используем только реальные точки маршрута (без служебных Керчь/Краснодар)
    # Спецтариф определяется по стране адреса (Украина = спецтариф, кроме Крыма)
    raw = [(from_city, False)] + [(s, False) for s in stops] + [(to_city, False)]

    coords = []
    specials = []
    for addr, force_normal in raw:
        coord, special = geocode(addr)
        if not coord:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"Не удалось найти: {addr}"})}
        coords.append(coord)
        specials.append(False if force_normal else special)

    # Считаем км обычные и км по повышенному тарифу
    # Коэффициент 1.4 — поправка с прямого расстояния на дорожное
    ROAD_FACTOR = 1.4
    km_normal = 0.0
    km_special = 0.0
    for i in range(len(coords) - 1):
        seg_km = haversine(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]) * ROAD_FACTOR
        # Если хотя бы одна точка сегмента в спецзоне — весь сегмент по спецтарифу
        if specials[i] or specials[i + 1]:
            km_special += seg_km
        else:
            km_normal += seg_km

    km_normal = round(km_normal)
    km_special = round(km_special)
    distance_km = km_normal + km_special

    extras_cost = sum(cost for key, cost in EXTRAS.items() if extras_selected.get(key))

    price = calc_price(km_normal, km_special, car_class, extras_cost)
    all_prices = {key: calc_price(km_normal, km_special, key, extras_cost) for key in TARIFFS}

    has_special = km_special > 0

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "distance_km": distance_km,
            "price": price,
            "car_class": car_class,
            "all_prices": all_prices,
            "has_special_zone": has_special,
            "km_normal": km_normal,
            "km_special": km_special,
        }),
    }