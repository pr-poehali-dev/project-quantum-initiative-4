import json
import os
import urllib.request
import math


TARIFFS = {
    "urgent":   {"per_km": 30, "base": 1500},
    "standard": {"per_km": 30, "base": 0},
    "comfort":  {"per_km": 40, "base": 0},
    "minivan":  {"per_km": 60, "base": 0},
    "business": {"per_km": 80, "base": 0},
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


def geocode(address: str, api_key: str = ""):
    """Получить координаты адреса через Nominatim (OpenStreetMap)."""
    url = (
        f"https://nominatim.openstreetmap.org/search"
        f"?q={urllib.request.quote(address)}&format=json&limit=1&accept-language=ru"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "ug-transfer-app/1.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    if not data:
        return None
    return float(data[0]["lat"]), float(data[0]["lon"])


def haversine(lat1, lon1, lat2, lon2) -> float:
    """Расстояние между двумя точками по формуле Гаверсина (км)."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def handler(event: dict, context) -> dict:
    """Рассчитать стоимость поездки по тарифу и доп. услугам."""
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
    for p in points:
        c = geocode(p)
        if not c:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"Не удалось найти: {p}"})}
        coords.append(c)

    distance_km = sum(
        haversine(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
        for i in range(len(coords) - 1)
    )
    distance_km = round(distance_km)

    extras_cost = sum(cost for key, cost in EXTRAS.items() if extras_selected.get(key))

    tariff = TARIFFS.get(car_class, TARIFFS["standard"])
    price = tariff["per_km"] * distance_km + tariff["base"] + extras_cost

    all_prices = {
        key: t["per_km"] * distance_km + t["base"] + extras_cost
        for key, t in TARIFFS.items()
    }

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "distance_km": distance_km,
            "price": price,
            "car_class": car_class,
            "all_prices": all_prices,
        }),
    }