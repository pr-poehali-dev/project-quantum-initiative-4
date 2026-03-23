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
    "urgent":   {"per_km": 60, "base": 1500},
    "standard": {"per_km": 60, "base": 0},
    "comfort":  {"per_km": 70, "base": 0},
    "minivan":  {"per_km": 80, "base": 0},
    "business": {"per_km": 150, "base": 0},
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

# Только Крым исключён из спецтарифа (обычная стоимость как Россия)
CRIMEA_ONLY = {
    "республика крым", "крым", "crimea", "автономна республіка крим",
}


DNR_LNR_ADDR_KEYS = ["донецк", "луганск", "мариуполь", "горловка", "макеевка", "лисичанск", "северодонецк", "краматорск", "днр", "лнр"]
KHERSON_ZAP_ADDR_KEYS = ["херсон", "мелитополь", "бердянск", "токмак", "энергодар", "геническ", "херсонская", "запорожская"]

def geocode(address: str):
    """Получить координаты адреса. Спецтариф только если адрес на Украине вне новых регионов России."""
    addr_lower = address.lower()

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

    # Nominatim может отдать новые регионы как Россию — дополнительно проверяем по тексту запроса
    force_special = (
        any(k in addr_lower for k in DNR_LNR_ADDR_KEYS) or
        any(k in addr_lower for k in KHERSON_ZAP_ADDR_KEYS)
    )

    special = (is_ukraine and not is_crimea) or force_special
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
    kpp = body.get("kpp", "matveev")

    if not from_city or not to_city:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите откуда и куда"})}

    CRIMEA_KEYS = ["крым", "ялта", "симферополь", "севастополь", "керчь", "феодосия", "евпатория", "алушта", "судак", "бахчисарай"]
    KHERSON_ZAP_KEYS = ["херсон", "мелитополь", "бердянск", "токмак", "энергодар", "геническ", "херсонская", "запорожская", "запорожье"]
    DNR_LNR_KEYS = ["донецк", "луганск", "мариуполь", "горловка", "макеевка", "лисичанск", "северодонецк"]
    def is_crimea_addr(a): return any(k in a.lower() for k in CRIMEA_KEYS)
    def is_kherson_zap(a): return any(k in a.lower() for k in KHERSON_ZAP_KEYS)
    def is_dnr_lnr(a): return any(k in a.lower() for k in DNR_LNR_KEYS)
    def is_special(a): return is_dnr_lnr(a) or is_kherson_zap(a)

    raw_points = [from_city] + stops + [to_city]

    from_russia = not is_crimea_addr(from_city) and not is_special(from_city)
    to_russia = not is_crimea_addr(to_city) and not is_special(to_city)
    from_crimea = is_crimea_addr(from_city)
    to_crimea = is_crimea_addr(to_city)

    # КПП — нейтральные точки границы (force_normal=True: не спецзона, не обычная — ноль км)
    # Используем их только для разделения сегментов, сами по себе не добавляют км в тариф
    raw = [(from_city, False)] + [(s, False) for s in stops] + [(to_city, False)]

    # Россия ↔ ДНР/ЛНР: через выбранный КПП (matveev = Матвеев Курган, veselo = Весело-Вознесенка)
    kpp_name = "Весело-Вознесенка, Ростовская область" if kpp == "veselo" else "Матвеев Курган, Ростовская область"
    if is_dnr_lnr(to_city) and from_russia:
        raw = [(from_city, False)] + [(s, False) for s in stops] + [(kpp_name, True), (to_city, False)]
    elif is_dnr_lnr(from_city) and to_russia:
        raw = [(from_city, False), (kpp_name, True)] + [(s, False) for s in stops] + [(to_city, False)]

    # Россия ↔ Херсонская/Запорожская: КПП Васильевка
    elif is_kherson_zap(to_city) and from_russia:
        raw = [(from_city, False)] + [(s, False) for s in stops] + [("Васильевка", True), (to_city, False)]
    elif is_kherson_zap(from_city) and to_russia:
        raw = [(from_city, False), ("Васильевка", True)] + [(s, False) for s in stops] + [(to_city, False)]

    # Крым ↔ Херсонская: КПП Армянск
    elif to_crimea and is_kherson_zap(from_city):
        raw = [(from_city, False), ("Армянск", True)] + [(s, False) for s in stops] + [(to_city, False)]
    elif from_crimea and is_kherson_zap(to_city):
        raw = [(from_city, False)] + [(s, False) for s in stops] + [("Армянск", True), (to_city, False)]

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