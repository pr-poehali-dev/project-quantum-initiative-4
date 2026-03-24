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

# ─── Ключевые слова для распознавания зон ───────────────────────────────────

CRIMEA_KEYS = [
    "крым", "ялта", "симферополь", "севастополь", "керчь", "феодосия",
    "евпатория", "алушта", "судак", "бахчисарай", "республика крым",
]

DNR_KEYS = [
    "донецк", "донецкая народная", "днр", "мариуполь", "горловка",
    "макеевка", "краматорск", "дебальцево", "авдеевка", "ясиноватая",
    "енакиево", "харцызск", "шахтёрск", "шахтерск", "снежное", "торез",
    "иловайск", "волноваха", "угледар", "докучаевск", "новоазовск",
]

LNR_KEYS = [
    "луганск", "луганская народная", "лнр", "лисичанск", "северодонецк",
    "алчевск", "стаханов", "антрацит", "красный луч", "свердловск",
    "перевальск", "брянка", "кировск", "первомайск", "ровеньки",
    "красный луч", "молодогвардейск",
]

KHERSON_KEYS = [
    "херсон", "херсонская", "геническ", "новая каховка", "каховка",
]

ZAP_KEYS = [
    "мелитополь", "запорожская", "бердянск", "токмак", "энергодар",
    "пологи", "васильевка", "приморск",
]

DNR_LNR_KEYS = DNR_KEYS + LNR_KEYS
SPECIAL_KEYS = DNR_LNR_KEYS + KHERSON_KEYS + ZAP_KEYS

# ─── КПП координаты ─────────────────────────────────────────────────────────

# Реальные дорожные расстояния проверены через OSRM:
# Москва→Матвеев Курган: 1129 км, Матвеев Курган→Донецк: 140 км = 1269 км (оптимально для Донецка)
# Москва→Весело-Вознесенка: 1168 км, Весело-Вознесенка→Донецк: 118 км = 1286 км
# Москва→Изварино: 1037 км, Изварино→Луганск: 62 км = 1099 км (оптимально для ЛНР)

KPP = {
    # ДНР — южные КПП
    "matveev":    {"coord": (47.556, 38.882), "name": "Матвеев Курган"},
    "veselo":     {"coord": (47.393, 38.474), "name": "Весело-Вознесенка"},
    "novoshakht": {"coord": (47.758, 39.925), "name": "Новошахтинск"},
    # ЛНР — северные КПП
    "izvarino":   {"coord": (48.143, 39.538), "name": "Изварино"},
    "chertkovo":  {"coord": (49.406, 40.174), "name": "Чертково"},
    "bugaevka":   {"coord": (49.213, 40.527), "name": "Бугаевка"},
    # Крым
    "kerch":      {"coord": (45.360, 36.467), "name": "Керченский мост"},
    "chongar":    {"coord": (46.003, 34.394), "name": "Чонгар"},
    "armiansk":   {"coord": (46.103, 33.691), "name": "Армянск"},
    # Транзит
    "rostov":     {"coord": (47.222, 39.718), "name": "Ростов-на-Дону"},
    "krasnodar":  {"coord": (45.044, 38.976), "name": "Краснодар"},
}

KPP_DNR = ["matveev", "veselo", "novoshakht"]
KPP_LNR = ["izvarino", "chertkovo", "bugaevka"]
KPP_ALL = KPP_DNR + KPP_LNR

# ─── Хардкодные координаты спецгородов (Nominatim часто врёт) ───────────────

CITY_COORDS = {
    # ДНР
    "донецк":       (48.015, 37.802),
    "мариуполь":    (47.095, 37.541),
    "горловка":     (48.290, 38.069),
    "макеевка":     (47.985, 37.967),
    "краматорск":   (48.723, 37.537),
    "дебальцево":   (48.344, 38.404),
    "авдеевка":     (48.143, 37.751),
    "ясиноватая":   (48.125, 37.844),
    "енакиево":     (48.222, 38.213),
    "харцызск":     (47.998, 38.153),
    "волноваха":    (47.610, 37.500),
    "угледар":      (47.773, 37.270),
    "докучаевск":   (47.748, 37.680),
    "новоазовск":   (47.113, 38.078),
    "шахтёрск":     (47.978, 38.481),
    "шахтерск":     (47.978, 38.481),
    "снежное":      (47.978, 38.765),
    "торез":        (47.998, 38.618),
    "иловайск":     (47.923, 38.202),
    # ЛНР
    "луганск":      (48.574, 39.307),
    "лисичанск":    (48.901, 38.432),
    "северодонецк": (48.952, 38.491),
    "алчевск":      (48.466, 38.803),
    "стаханов":     (48.558, 38.657),
    "антрацит":     (48.121, 39.088),
    "кировск":      (48.651, 38.654),
    "первомайск":   (48.425, 38.566),
    "ровеньки":     (48.077, 39.375),
    "свердловск":   (48.046, 39.647),
    "перевальск":   (48.459, 38.861),
    "брянка":       (48.516, 38.740),
    # Запорожская
    "мелитополь":   (46.847, 35.367),
    "бердянск":     (46.756, 36.800),
    "токмак":       (47.253, 35.706),
    "энергодар":    (47.503, 34.653),
    "пологи":       (47.479, 36.253),
    # Херсонская
    "херсон":       (46.636, 32.617),
    "геническ":     (46.167, 34.817),
    "каховка":      (46.818, 33.479),
    # Крым
    "симферополь":  (44.952, 34.102),
    "ялта":         (44.495, 34.166),
    "севастополь":  (44.602, 33.525),
    "феодосия":     (45.028, 35.383),
    "евпатория":    (45.189, 33.370),
    "алушта":       (44.676, 34.410),
    "судак":        (44.851, 34.979),
    "бахчисарай":   (44.752, 33.860),
}


def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def osrm_distance(lat1, lon1, lat2, lon2) -> float:
    """Реальное дорожное расстояние через OSRM. Fallback: haversine × 1.4."""
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
    return haversine(lat1, lon1, lat2, lon2) * 1.4


def best_kpp_for(from_coord, to_coord, kpp_list: list) -> str:
    """Выбирает КПП с минимальным расстоянием от КПП до пункта назначения (не от старта!)."""
    best_key = kpp_list[0]
    best_dist = float("inf")
    for key in kpp_list:
        kc = KPP[key]["coord"]
        # Главный критерий — близость КПП к пункту назначения
        d = haversine(kc[0], kc[1], to_coord[0], to_coord[1])
        if d < best_dist:
            best_dist = d
            best_key = key
    return best_key


def geocode_city(address: str):
    """Возвращает (lat, lon) для адреса. Сначала проверяет хардкодные координаты."""
    addr_lower = address.lower()
    for key, coord in CITY_COORDS.items():
        if key in addr_lower:
            return coord
    url = (
        f"https://nominatim.openstreetmap.org/search"
        f"?q={urllib.request.quote(address)}&format=json&limit=1&accept-language=ru&addressdetails=1"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "ug-transfer-app/1.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    if not data:
        return None
    item = data[0]
    return (float(item["lat"]), float(item["lon"]))


def is_crimea(addr: str) -> bool:
    return any(k in addr.lower() for k in CRIMEA_KEYS)

def is_dnr(addr: str) -> bool:
    return any(k in addr.lower() for k in DNR_KEYS)

def is_lnr(addr: str) -> bool:
    return any(k in addr.lower() for k in LNR_KEYS)

def is_dnr_lnr(addr: str) -> bool:
    return is_dnr(addr) or is_lnr(addr)

def is_kherson(addr: str) -> bool:
    return any(k in addr.lower() for k in KHERSON_KEYS)

def is_zap(addr: str) -> bool:
    return any(k in addr.lower() for k in ZAP_KEYS)

def is_kherson_zap(addr: str) -> bool:
    return is_kherson(addr) or is_zap(addr)

def is_special(addr: str) -> bool:
    return is_dnr_lnr(addr) or is_kherson_zap(addr)

def is_russia(addr: str) -> bool:
    return not is_crimea(addr) and not is_special(addr)


def calc_price(km_normal, km_special, tariff_key, extras_cost):
    t = TARIFFS.get(tariff_key, TARIFFS["standard"])
    ts = TARIFFS_SPECIAL.get(tariff_key, TARIFFS_SPECIAL["standard"])
    return round(t["per_km"] * km_normal + ts["per_km"] * km_special + t["base"] + extras_cost)


def build_waypoints(from_city, to_city):
    """
    Строит список путевых точек [(lat, lon, is_special_zone)].
    Возвращает None при ошибке геокодирования.
    """
    fc = geocode_city(from_city)
    tc = geocode_city(to_city)
    if not fc or not tc:
        return None

    # Армянск — приграничный крымский город, сам является КПП.
    # Маршрут Армянск↔Херсонская/Запорожская — прямой без промежуточных точек.
    from_armiansk = "армянск" in from_city.lower()
    to_armiansk = "армянск" in to_city.lower()
    if (from_armiansk and is_kherson_zap(to_city)) or (to_armiansk and is_kherson_zap(from_city)):
        return [
            (fc[0], fc[1], False),
            (tc[0], tc[1], True),
        ]
    if (from_armiansk and is_kherson_zap(to_city) is False and not is_special(to_city)):
        return [
            (fc[0], fc[1], False),
            (tc[0], tc[1], False),
        ]

    # ── Россия → ДНР ──────────────────────────────────────────────────────
    if is_russia(from_city) and is_dnr(to_city):
        kpp_list = KPP_DNR
        kpp = best_kpp_for(fc, tc, kpp_list)
        kc = KPP[kpp]["coord"]
        return [
            (fc[0], fc[1], False),
            (kc[0], kc[1], False),
            (tc[0], tc[1], True),
        ]

    # ── ДНР → Россия ──────────────────────────────────────────────────────
    if is_dnr(from_city) and is_russia(to_city):
        kpp = best_kpp_for(fc, tc, KPP_DNR)
        kc = KPP[kpp]["coord"]
        return [
            (fc[0], fc[1], True),
            (kc[0], kc[1], False),
            (tc[0], tc[1], False),
        ]

    # ── Россия → ЛНР ──────────────────────────────────────────────────────
    if is_russia(from_city) and is_lnr(to_city):
        kpp = best_kpp_for(fc, tc, KPP_LNR)
        kc = KPP[kpp]["coord"]
        return [
            (fc[0], fc[1], False),
            (kc[0], kc[1], False),
            (tc[0], tc[1], True),
        ]

    # ── ЛНР → Россия ──────────────────────────────────────────────────────
    if is_lnr(from_city) and is_russia(to_city):
        kpp = best_kpp_for(fc, tc, KPP_LNR)
        kc = KPP[kpp]["coord"]
        return [
            (fc[0], fc[1], True),
            (kc[0], kc[1], False),
            (tc[0], tc[1], False),
        ]

    # ── Россия → Запорожская/Херсонская ───────────────────────────────────
    if is_russia(from_city) and is_kherson_zap(to_city):
        kc = KPP["veselo"]["coord"]
        return [
            (fc[0], fc[1], False),
            (kc[0], kc[1], False),
            (tc[0], tc[1], True),
        ]

    # ── Запорожская/Херсонская → Россия ───────────────────────────────────
    if is_kherson_zap(from_city) and is_russia(to_city):
        kc = KPP["veselo"]["coord"]
        return [
            (fc[0], fc[1], True),
            (kc[0], kc[1], False),
            (tc[0], tc[1], False),
        ]

    # ── Крым → Россия / Россия → Крым (через Керченский мост) ────────────
    if is_crimea(from_city) and is_russia(to_city):
        kc = KPP["kerch"]["coord"]
        return [
            (fc[0], fc[1], False),
            (kc[0], kc[1], False),
            (tc[0], tc[1], False),
        ]

    if is_russia(from_city) and is_crimea(to_city):
        kc = KPP["kerch"]["coord"]
        return [
            (fc[0], fc[1], False),
            (kc[0], kc[1], False),
            (tc[0], tc[1], False),
        ]

    # ── Крым ↔ Херсонская (Армянск или Чонгар) ───────────────────────────
    if is_crimea(from_city) and is_kherson(to_city):
        kpp = best_kpp_for(fc, tc, ["armiansk", "chongar"])
        kc = KPP[kpp]["coord"]
        return [
            (fc[0], fc[1], False),
            (kc[0], kc[1], False),
            (tc[0], tc[1], True),
        ]

    if is_kherson(from_city) and is_crimea(to_city):
        kpp = best_kpp_for(fc, tc, ["armiansk", "chongar"])
        kc = KPP[kpp]["coord"]
        return [
            (fc[0], fc[1], True),
            (kc[0], kc[1], False),
            (tc[0], tc[1], False),
        ]

    # ── Крым ↔ Запорожская (Чонгар или Весело-Вознесенка) ────────────────
    if is_crimea(from_city) and is_zap(to_city):
        kpp = best_kpp_for(fc, tc, ["chongar", "veselo"])
        kc = KPP[kpp]["coord"]
        return [
            (fc[0], fc[1], False),
            (kc[0], kc[1], False),
            (tc[0], tc[1], True),
        ]

    if is_zap(from_city) and is_crimea(to_city):
        kpp = best_kpp_for(fc, tc, ["chongar", "veselo"])
        kc = KPP[kpp]["coord"]
        return [
            (fc[0], fc[1], True),
            (kc[0], kc[1], False),
            (tc[0], tc[1], False),
        ]

    # ── Крым ↔ ДНР/ЛНР (через Керчь + Ростов + КПП) ────────────────────
    if is_crimea(from_city) and is_dnr_lnr(to_city):
        kpp_list = KPP_DNR if is_dnr(to_city) else KPP_LNR
        kpp = best_kpp_for(KPP["rostov"]["coord"], tc, kpp_list)
        kc_kpp = KPP[kpp]["coord"]
        kc_kerch = KPP["kerch"]["coord"]
        kc_rostov = KPP["rostov"]["coord"]
        return [
            (fc[0], fc[1], False),
            (kc_kerch[0], kc_kerch[1], False),
            (kc_rostov[0], kc_rostov[1], False),
            (kc_kpp[0], kc_kpp[1], False),
            (tc[0], tc[1], True),
        ]

    if is_dnr_lnr(from_city) and is_crimea(to_city):
        kpp_list = KPP_DNR if is_dnr(from_city) else KPP_LNR
        kpp = best_kpp_for(fc, KPP["rostov"]["coord"], kpp_list)
        kc_kpp = KPP[kpp]["coord"]
        kc_kerch = KPP["kerch"]["coord"]
        kc_rostov = KPP["rostov"]["coord"]
        return [
            (fc[0], fc[1], True),
            (kc_kpp[0], kc_kpp[1], False),
            (kc_rostov[0], kc_rostov[1], False),
            (kc_kerch[0], kc_kerch[1], False),
            (tc[0], tc[1], False),
        ]

    # ── Обычный маршрут ───────────────────────────────────────────────────
    from_special = is_special(from_city) or is_crimea(from_city)
    to_special = is_special(to_city) or is_crimea(to_city)
    return [
        (fc[0], fc[1], from_special and not is_crimea(from_city)),
        (tc[0], tc[1], to_special and not is_crimea(to_city)),
    ]


def handler(event: dict, context) -> dict:
    """Рассчитать стоимость межгородной поездки с учётом зон повышенного тарифа."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    from_city = body.get("from", "").strip()
    to_city = body.get("to", "").strip()
    car_class = body.get("carClass", "standard")
    extras_selected = body.get("extras", {})
    stops = body.get("stops", [])

    if not from_city or not to_city:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите откуда и куда"})}

    # Строим waypoints с учётом КПП
    all_cities = [from_city] + [s for s in stops if s.strip()] + [to_city]

    # Для маршрута с промежуточными остановками — считаем посегментно
    if len(all_cities) == 2:
        waypoints = build_waypoints(from_city, to_city)
    else:
        # С промежуточными — основной маршрут через КПП, остановки добавляем внутри зоны
        waypoints = build_waypoints(from_city, to_city)
        # TODO: полная поддержка остановок в разных зонах

    if waypoints is None:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не удалось определить адрес"})}



    # Считаем расстояние по сегментам
    km_normal = 0.0
    km_special = 0.0

    for i in range(len(waypoints) - 1):
        lat1, lon1, sp1 = waypoints[i]
        lat2, lon2, sp2 = waypoints[i + 1]
        seg_km = osrm_distance(lat1, lon1, lat2, lon2)
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