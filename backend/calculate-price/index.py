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

# Новые регионы России (ключевые слова в адресе)
SPECIAL_REGIONS = [
    "херсонская область", "херсонська область",
    "запорожская область", "запорізька область",
    "донецкая народная республика", "донецька область",
    "луганская народная республика", "луганська область",
    # Города спецзон
    "донецк", "луганск", "мариуполь", "бердянск", "мелитополь",
    "херсон", "геническ", "энергодар", "токмак",
]

EXCLUDE_REGIONS = [
    "республика крым", "крым", "crimea", "автономна республіка крим",
    "ялта", "симферополь", "севастополь", "керчь", "феодосия", "евпатория",
]


def geocode(address: str):
    """Получить координаты адреса через Nominatim (OpenStreetMap)."""
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
    # Проверяем поля адреса на спецрегион
    state = addr.get("state", "").lower()
    county = addr.get("county", "").lower()

    addr_text = (state + " " + county).strip()
    # Сначала исключаем Крым
    is_crimea = any(ex in addr_text for ex in EXCLUDE_REGIONS)
    if is_crimea:
        return (lat, lon), False
    special = any(region in addr_text for region in SPECIAL_REGIONS)
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

    points = [from_city] + stops + [to_city]
    coords = []
    specials = []
    for p in points:
        coord, special = geocode(p)
        if not coord:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"Не удалось найти: {p}"})}
        coords.append(coord)
        specials.append(special)

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