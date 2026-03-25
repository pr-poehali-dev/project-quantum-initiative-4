import json
import urllib.request
import math
import os
import psycopg2


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
EXTRAS = {"childSeat": 1500, "pet": 1000, "booster": 1000}
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

# Допустимое отклонение от эталона (%)
MAX_DEVIATION_PCT = 20.0

# ─── Полигоны спецзон (повышенный тариф) ─────────────────────────────────────
SPECIAL_POLYGONS = [
    # ДНР (расширен на юг до Мариуполя и Азовского моря)
    [(48.07,37.45),(48.35,38.15),(48.55,38.85),(48.1,39.5),
     (47.8,39.6),(47.4,38.9),(47.0,38.2),(46.9,37.8),(46.9,37.2),
     (47.1,37.0),(47.3,37.0),(47.6,37.1),(47.9,37.2),(48.07,37.45)],
    # ЛНР
    [(48.55,38.85),(48.9,39.3),(49.3,39.7),(49.5,40.2),
     (49.15,40.5),(48.7,40.1),(48.3,39.9),(47.8,39.6),(48.1,39.5),(48.55,38.85)],
    # Запорожская (расширен на юг до Мелитополя и Азовского моря)
    [(47.6,34.2),(47.9,35.1),(47.85,36.0),(47.6,36.8),
     (47.3,37.1),(47.0,36.5),(46.7,35.8),(46.4,35.5),(46.3,34.8),
     (46.4,34.2),(46.7,33.9),(47.0,33.8),(47.3,33.9),(47.6,34.2)],
    # Херсонская (расширен на юг до Каховского водохранилища)
    [(47.2,32.5),(47.4,33.5),(47.2,34.2),(46.9,34.8),
     (46.5,34.9),(46.2,34.5),(46.0,33.8),(46.0,32.8),(46.3,32.2),(46.7,32.2),(47.2,32.5)],
]

CRIMEA_KEYS = ["крым","республика крым",
    "симферополь","ялта","севастополь","керчь","феодосия","евпатория","алушта","судак",
    "бахчисарай","армянск","саки","белогорск","джанкой","красноперекопск",
    "старый крым","щёлкино","щелкино","инкерман","балаклава",
    "гаспра","кореиз","симеиз","форос","партенит","гурзуф","массандра","ливадия","мисхор","никита",
    "коктебель","орджоникидзе","новый свет","морское","черноморское","межводное",
    "оленёвка","оленевка","штормовое","мирный","заозёрное","заозерное",
    "новофёдоровка","новофедоровка","николаевка","песчаное","гвардейское","перевальное",
    "зуя","мазанка","почтовое","куйбышево","соколиное",
    "красногвардейское","октябрьское","первомайское","раздольное",
    "нижнегорский","нижнегорское","советский","советское","кировское","кировский",
    "ленино","ленинское","зеленогорское","приморский","береговое","курортное",
    "багерово","аджимушкай","героевское","глазовка",
    "малый маяк","утёс","утес","пушкино","кацивели","санаторное",
    "поповка","витино","окунёвка","окуневка",
    "солнечная долина","насыпное","золотое поле","приветное","рыбачье",
    "малореченское","солнечногорское","генеральское","канака","весёлое","веселое",
    "кача","любимовка","орловка","учкуевка","андреевка","фронтовое","терновка",
    "флотское","резервное","орлиное","гончарное","родниковское","широкое",
    "воинка","ишунь","суворовское","азовское","льговское","семисотка",
]
SPECIAL_KEYS = ["донецк","донецкая народная","днр","мариуполь","горловка","макеевка",
    "краматорск","дебальцево","авдеевка","ясиноватая","енакиево","харцызск","шахтёрск",
    "шахтерск","снежное","торез","иловайск","волноваха","угледар","докучаевск","новоазовск",
    "луганск","луганская народная","лнр","лисичанск","северодонецк","алчевск","стаханов",
    "антрацит","красный луч","свердловск","перевальск","брянка","кировск","первомайск",
    "ровеньки","молодогвардейск",
    "херсон","херсонская","геническ","новая каховка","каховка","скадовск",
    "мелитополь","запорожская","бердянск","токмак","энергодар","пологи","приморск",
]

CITY_COORDS = {
    # ── АПП: ДНР ──────────────────────────────────────────────────────────────
    "донецк":(48.015,37.802),"мариуполь":(47.095,37.541),"горловка":(48.290,38.069),
    "макеевка":(47.985,37.967),"краматорск":(48.723,37.537),"дебальцево":(48.344,38.404),
    "авдеевка":(48.143,37.751),"ясиноватая":(48.125,37.844),"енакиево":(48.222,38.213),
    "харцызск":(47.998,38.153),"волноваха":(47.610,37.500),"угледар":(47.773,37.270),
    "докучаевск":(47.748,37.680),"новоазовск":(47.113,38.078),
    "шахтёрск":(47.978,38.481),"шахтерск":(47.978,38.481),
    "снежное":(47.978,38.765),"торез":(47.998,38.618),"иловайск":(47.923,38.202),
    # ── АПП: ЛНР ──────────────────────────────────────────────────────────────
    "луганск":(48.574,39.307),"лисичанск":(48.901,38.432),"северодонецк":(48.952,38.491),
    "алчевск":(48.466,38.803),"стаханов":(48.558,38.657),"антрацит":(48.121,39.088),
    "кировск":(48.651,38.654),"первомайск":(48.425,38.566),"ровеньки":(48.077,39.375),
    "свердловск":(48.046,39.647),"перевальск":(48.459,38.861),"брянка":(48.516,38.740),
    "молодогвардейск":(48.424,39.653),"красный луч":(48.145,38.949),
    # ── АПП: Запорожская ──────────────────────────────────────────────────────
    "мелитополь":(46.847,35.367),"бердянск":(46.756,36.800),"токмак":(47.253,35.706),
    "энергодар":(47.503,34.653),"пологи":(47.479,36.253),"приморск":(46.729,36.349),
    "васильевка":(47.427,35.278),"михайловка":(47.136,35.224),
    # ── АПП: Херсонская ───────────────────────────────────────────────────────
    "херсон":(46.636,32.617),"геническ":(46.167,34.817),"каховка":(46.818,33.479),
    "новая каховка":(46.754,33.383),"скадовск":(46.112,32.912),
    "голая пристань":(46.526,32.184),"цюрупинск":(46.632,32.716),
    # ── Крым: города ─────────────────────────────────────────────────────────
    "симферополь":(44.952,34.102),"ялта":(44.495,34.166),"севастополь":(44.602,33.525),
    "феодосия":(45.028,35.383),"евпатория":(45.189,33.370),"алушта":(44.676,34.410),
    "судак":(44.851,34.979),"бахчисарай":(44.752,33.860),"армянск":(46.103,33.691),
    "керчь":(45.360,36.467),"саки":(45.152,33.601),"белогорск":(45.057,34.597),
    "джанкой":(45.706,34.393),"красноперекопск":(45.949,33.789),
    "старый крым":(45.031,35.092),"щёлкино":(45.429,35.827),"щелкино":(45.429,35.827),
    "инкерман":(44.615,33.608),"балаклава":(44.508,33.600),
    # ── Крым: пгт и посёлки ──────────────────────────────────────────────────
    "гаспра":(44.431,34.100),"кореиз":(44.431,34.079),"симеиз":(44.404,33.992),
    "форос":(44.393,33.785),"партенит":(44.578,34.345),"гурзуф":(44.546,34.277),
    "массандра":(44.514,34.192),"ливадия":(44.467,34.144),"мисхор":(44.425,34.066),
    "никита":(44.535,34.235),"ореанда":(44.467,34.131),
    "коктебель":(44.963,35.249),"орджоникидзе":(44.958,35.356),
    "новый свет":(44.831,34.921),"морское":(44.841,34.778),
    "черноморское":(45.510,32.700),"межводное":(45.595,32.863),
    "оленёвка":(45.379,32.529),"оленевка":(45.379,32.529),
    "штормовое":(45.297,33.060),"мирный":(45.318,33.063),
    "заозёрное":(45.217,33.287),"заозерное":(45.217,33.287),
    "новофёдоровка":(45.163,33.571),"новофедоровка":(45.163,33.571),
    "николаевка":(44.973,33.615),"песчаное":(44.861,33.637),
    "гвардейское":(45.088,33.980),"перевальное":(44.823,34.279),
    "зуя":(44.953,34.326),"мазанка":(44.991,34.249),
    "почтовое":(44.788,33.805),"куйбышево":(44.717,33.739),
    "соколиное":(44.664,33.942),"научный":(44.728,34.015),
    "красногвардейское":(45.381,34.117),"октябрьское":(45.371,34.060),
    "первомайское":(45.719,33.985),"раздольное":(45.780,33.475),
    "нижнегорский":(45.452,34.746),"нижнегорское":(45.452,34.746),
    "советский":(45.320,34.959),"советское":(45.320,34.959),
    "кировское":(45.350,35.208),"кировский":(45.350,35.208),
    "ленино":(45.296,36.218),"ленинское":(45.296,36.218),
    "зеленогорское":(45.143,34.719),
    "приморский":(45.127,35.513),"береговое":(44.990,35.415),
    "курортное":(44.907,35.199),
    # ── Крым: Керченский полуостров ──────────────────────────────────────────
    "багерово":(45.370,36.325),"аджимушкай":(45.375,36.524),
    "героевское":(45.257,36.439),"эльтиген":(45.257,36.439),
    "подмаячный":(45.348,36.580),"жуковка":(45.295,36.379),
    "камыш-бурун":(45.299,36.414),"войково":(45.286,36.467),
    "маяк":(45.434,36.575),"глазовка":(45.392,36.286),
    "октябрьское-керченское":(45.383,36.133),
    # ── Крым: Южный берег (ЮБК) сёла ────────────────────────────────────────
    "малый маяк":(44.619,34.376),"утёс":(44.591,34.362),"утес":(44.591,34.362),
    "пушкино":(44.571,34.333),"лазурное":(44.520,34.212),
    "даниловка":(44.440,34.037),"парковое":(44.436,34.049),
    "голубой залив":(44.418,33.965),"кацивели":(44.394,33.966),
    "понизовка":(44.409,33.881),"санаторное":(44.417,33.830),
    "олива":(44.427,33.816),"мелас":(44.414,33.832),
    "береговое-ялта":(44.480,34.160),
    # ── Крым: Западное побережье ──────────────────────────────────────────────
    "поповка":(45.322,33.119),"витино":(45.323,33.188),
    "окунёвка":(45.417,32.594),"окуневка":(45.417,32.594),
    "марьино":(45.466,32.705),"знаменское":(45.560,32.920),
    "стерегущее":(45.633,33.070),"портовое":(45.539,32.860),
    "медведево":(45.478,32.744),"красносельское":(45.618,33.130),
    "раздольненское":(45.780,33.475),
    # ── Крым: Восточное побережье ─────────────────────────────────────────────
    "солнечная долина":(44.861,35.089),"миндальное":(44.975,35.104),
    "насыпное":(45.002,35.307),"ближнее":(44.996,35.364),
    "золотое поле":(45.073,35.253),
    "приветное":(44.731,34.651),"рыбачье":(44.770,34.564),
    "малореченское":(44.750,34.572),"солнечногорское":(44.744,34.615),
    "генеральское":(44.758,34.651),
    "канака":(44.759,34.710),"весёлое":(44.830,34.838),"веселое":(44.830,34.838),
    "громовка":(44.900,34.915),"грушевка":(45.044,35.023),
    # ── Крым: Центральная часть ──────────────────────────────────────────────
    "добровольское":(45.189,34.420),"грибное":(44.965,34.440),
    "партизаны":(45.133,34.470),"зуйская":(44.953,34.326),
    "мраморное":(44.868,34.269),"доброе":(44.860,34.178),
    "краснолесье":(44.869,34.349),"межгорье":(44.805,34.340),
    "изобильное":(44.781,34.332),"верхняя кутузовка":(44.754,34.310),
    "лучистое":(44.729,34.394),
    "чистенькое":(44.893,34.025),"каменка":(44.867,33.970),
    "скалистое":(44.810,33.846),"трудолюбовка":(44.780,33.780),
    "плотинное":(44.654,33.790),"танковое":(44.696,33.888),
    "верхоречье":(44.670,33.920),"высокое":(44.650,33.880),
    # ── Крым: Северная степная часть ─────────────────────────────────────────
    "красногвардейский":(45.381,34.117),"калинино":(45.370,34.290),
    "петровка":(45.449,34.270),"клепинино":(45.533,34.430),
    "воинка":(45.758,33.773),"новоселовское":(45.820,33.680),
    "ишунь":(45.870,33.820),"суворовское":(45.899,33.747),
    "черноземное":(45.481,34.537),"новогригорьевка":(45.542,34.650),
    "садовое":(45.422,34.890),"грушевка-джанкой":(45.660,34.290),
    "азовское":(45.488,35.375),"льговское":(45.487,35.400),
    "семисотка":(45.478,35.483),
    "чкалово":(45.645,34.730),"табачное":(45.700,34.820),
    "листовое":(45.820,34.160),
    # ── Крым (Севастополь): сёла и пригороды ─────────────────────────────────
    "кача":(44.782,33.548),"любимовка":(44.648,33.553),
    "орловка":(44.628,33.540),"учкуевка":(44.643,33.548),
    "андреевка":(44.729,33.567),"фронтовое":(44.554,33.700),
    "терновка":(44.592,33.760),"хмельницкое":(44.610,33.700),
    "верхнесадовое":(44.633,33.640),"дальнее":(44.639,33.610),
    "флотское":(44.498,33.641),"резервное":(44.489,33.681),
    "орлиное":(44.490,33.770),"гончарное":(44.500,33.750),
    "родниковское":(44.501,33.835),"широкое":(44.514,33.877),
    # ── Центральная Россия ────────────────────────────────────────────────────
    "москва":(55.751,37.618),"санкт-петербург":(59.939,30.316),
    "воронеж":(51.672,39.184),"белгород":(50.598,36.588),
    "курск":(51.730,36.193),"орёл":(52.970,36.063),"орел":(52.970,36.063),
    "тула":(54.193,37.617),"рязань":(54.629,39.737),"калуга":(54.513,36.261),
    "брянск":(53.244,34.364),"смоленск":(54.783,32.046),
    "тверь":(56.861,35.912),"ярославль":(57.626,39.894),"кострома":(57.767,40.927),
    "иваново":(57.000,40.973),"владимир":(56.129,40.406),
    "нижний новгород":(56.327,44.006),"нижний новгород":(56.327,44.006),
    "пенза":(53.195,45.021),"саратов":(51.533,46.034),"самара":(53.196,50.150),
    "тамбов":(52.721,41.452),"липецк":(52.608,39.599),
    "казань":(55.799,49.106),"ульяновск":(54.317,48.402),
    "чебоксары":(56.146,47.252),"йошкар-ола":(56.638,47.895),
    "киров":(58.596,49.660),"пермь":(58.010,56.230),
    "уфа":(54.735,55.958),"оренбург":(51.768,55.097),
    # ── Юг России ─────────────────────────────────────────────────────────────
    "ростов-на-дону":(47.222,39.721),"краснодар":(45.039,38.987),
    "новороссийск":(44.724,37.770),"сочи":(43.585,39.723),
    "анапа":(44.895,37.316),"геленджик":(44.562,38.079),
    "таганрог":(47.209,38.924),"новочеркасск":(47.413,40.093),
    "шахты":(47.708,40.215),"волгодонск":(47.511,42.148),
    "ставрополь":(45.045,41.969),"пятигорск":(44.038,43.058),
    "кисловодск":(43.905,42.726),"ессентуки":(44.048,42.861),
    "нальчик":(43.485,43.607),"владикавказ":(43.024,44.682),
    "грозный":(43.317,45.699),"махачкала":(42.970,47.504),
    "астрахань":(46.348,48.034),"элиста":(46.309,44.268),
    "майкоп":(44.609,40.100),"черкесск":(44.228,42.047),
    # ── Поволжье и Урал ───────────────────────────────────────────────────────
    "волгоград":(48.708,44.513),"саратов":(51.533,46.034),
    "тольятти":(53.511,49.418),"сызрань":(53.155,48.474),
    "екатеринбург":(56.838,60.597),"челябинск":(55.160,61.402),
    "тюмень":(57.153,68.975),"курган":(55.440,65.341),
    "магнитогорск":(53.407,59.063),"нижний тагил":(57.910,59.979),
    # ── Сибирь ────────────────────────────────────────────────────────────────
    "новосибирск":(54.989,82.904),"омск":(54.989,73.368),
    "барнаул":(53.347,83.779),"томск":(56.496,84.972),
    "кемерово":(55.354,86.087),"новокузнецк":(53.757,87.136),
    "красноярск":(56.010,92.852),"иркутск":(52.297,104.296),
    # ── Дальний Восток (добавлено для полноты) ────────────────────────────────
    "хабаровск":(48.480,135.071),"владивосток":(43.115,131.885),
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def normalize_city(name: str) -> str:
    """
    Нормализует название города для поиска в БД.
    Обрабатывает форматы: 'г. Каховка', 'город Каховка', 'Россия, Херсонская область, г. Каховка',
    'Ялта, улица Крупской, 13' — извлекает только название города.
    """
    import re
    n = name.strip()
    # Убираем страну и область в начале строки через запятую
    # Пример: "Россия, Херсонская область, г. Каховка" → "г. Каховка"
    parts = [p.strip() for p in n.split(',')]
    # Ищем часть с "г." или "город" или которая не содержит "область", "регион", "район", "республика", "Россия"
    skip_words = ['россия', 'область', 'регион', 'район', 'республика', 'округ', 'край', 'ssr', 'ukraine']
    city_part = None
    for i, part in enumerate(parts):
        pl = part.lower()
        # Если часть содержит "г." или "город" — берём её
        if re.match(r'^г\.?\s+', pl) or pl.startswith('город '):
            city_part = part.strip()
            break
        # Если это последняя часть с адресом (улица, дом) — берём предыдущую
        if i > 0 and any(w in pl for w in ['улица', 'ул.', 'пр.', 'проспект', 'переулок', 'площадь', 'бульвар', 'набережная']):
            city_part = parts[i-1].strip()
            break
        # Если часть не содержит стоп-слов — кандидат на город
        if not any(w in pl for w in skip_words):
            city_part = part.strip()

    if city_part:
        n = city_part

    # Убираем префиксы "г.", "г ", "город "
    for prefix in ['г. ', 'г.', 'г ', 'город ']:
        if n.lower().startswith(prefix):
            n = n[len(prefix):].strip()
            break

    # Берём только первое слово если осталось несколько (защита от "Симферополь центр")
    # Но сохраняем "Ростов-на-Дону" и подобные
    words = n.split()
    if len(words) > 2 and '-' not in n:
        n = words[0]

    return n.strip().title()


def extract_city_candidates(name: str) -> list:
    """Возвращает список вариантов названия города для поиска."""
    normalized = normalize_city(name)
    candidates = [normalized]
    # Дополнительно: оригинальное название title-case
    original_title = name.strip().title()
    if original_title != normalized:
        candidates.append(original_title)
    return candidates


def lookup_reference(from_city: str, to_city: str):
    """Ищет эталонный маршрут в БД (без учёта регистра, с нормализацией)."""
    try:
        conn = get_db()
        cur = conn.cursor()
        from_candidates = extract_city_candidates(from_city)
        to_candidates   = extract_city_candidates(to_city)
        for fc in from_candidates:
            for tc in to_candidates:
                cur.execute(
                    "SELECT id, km_normal, km_special FROM routes_reference "
                    "WHERE LOWER(from_city) = LOWER(%s) AND LOWER(to_city) = LOWER(%s) LIMIT 1",
                    (fc, tc)
                )
                row = cur.fetchone()
                if row:
                    conn.close()
                    return {"id": row[0], "km_normal": row[1], "km_special": row[2]}
        conn.close()
    except Exception:
        pass
    return None


def lookup_alternatives(from_city: str, to_city: str, car_class: str, extras_cost: int) -> list:
    """Ищет альтернативные маршруты в БД и считает цены для них."""
    try:
        conn = get_db()
        cur = conn.cursor()
        from_candidates = extract_city_candidates(from_city)
        to_candidates   = extract_city_candidates(to_city)
        results = []
        for fc in from_candidates:
            for tc in to_candidates:
                cur.execute(
                    """SELECT variant, km_normal, km_special, via, time_hours, notes
                       FROM routes_alternatives
                       WHERE LOWER(from_city) = LOWER(%s) AND LOWER(to_city) = LOWER(%s)
                       ORDER BY variant""",
                    (fc, tc)
                )
                rows = cur.fetchall()
                if rows:
                    for row in rows:
                        variant, km_n, km_s, via, time_h, notes = row
                        price = calc_price(km_n, km_s, car_class, extras_cost)
                        all_p = {k: calc_price(km_n, km_s, k, extras_cost) for k in TARIFFS}
                        results.append({
                            "variant": variant,
                            "km_normal": km_n,
                            "km_special": km_s,
                            "km_total": km_n + km_s,
                            "price": price,
                            "all_prices": all_p,
                            "via": via,
                            "time_hours": float(time_h) if time_h else None,
                            "notes": notes,
                        })
                    conn.close()
                    return results
        conn.close()
    except Exception:
        pass
    return []


def build_auto_alternatives(km_normal: int, km_special: int, car_class: str, extras_cost: int) -> list:
    """
    Генерирует альтернативу "дешевле" автоматически — только если маршрут СМЕШАННЫЙ
    (есть и нормальные, и спецкм). Чисто-спецзонные маршруты объезда не имеют.
    """
    alts = []
    # Только если есть хотя бы 20% нормальных км — значит маршрут смешанный
    if km_special > 0 and km_normal > 0:
        total = km_normal + km_special
        # Вариант "дешевле" — чуть длиннее нормального пути, сокращаем спецзону
        cheaper_normal  = round(km_normal * 1.20 + km_special * 0.25)
        cheaper_special = round(km_special * 0.75)
        cheaper_price   = calc_price(cheaper_normal, cheaper_special, car_class, extras_cost)
        main_price      = calc_price(km_normal, km_special, car_class, extras_cost)
        if cheaper_price < main_price:
            alts.append({
                "variant": "cheaper",
                "km_normal": cheaper_normal,
                "km_special": cheaper_special,
                "km_total": cheaper_normal + cheaper_special,
                "price": cheaper_price,
                "all_prices": {k: calc_price(cheaper_normal, cheaper_special, k, extras_cost) for k in TARIFFS},
                "via": "объезд спецзоны",
                "time_hours": None,
                "notes": "Длиннее, но меньше км по спецтарифу",
            })
    return alts


def save_log(data: dict):
    """Сохраняет лог расчёта в БД."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO route_calculations_log
               (from_city, to_city, stops, car_class, km_normal, km_special, km_total,
                price, all_prices, reference_id, ref_km_total, deviation_pct,
                is_error, error_reason, source)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                data["from_city"], data["to_city"],
                data.get("stops") or [],
                data["car_class"],
                data["km_normal"], data["km_special"], data["km_total"],
                data["price"],
                json.dumps(data["all_prices"]),
                data.get("reference_id"),
                data.get("ref_km_total"),
                data.get("deviation_pct"),
                data.get("is_error", False),
                data.get("error_reason"),
                data.get("source", "osrm"),
            )
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    d_lat = math.radians(lat2-lat1); d_lon = math.radians(lon2-lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(d_lon/2)**2
    return R*2*math.asin(math.sqrt(a))


def point_in_polygon(lat, lon, poly) -> bool:
    n = len(poly); inside = False; j = n-1
    for i in range(n):
        xi,yi = poly[i]; xj,yj = poly[j]
        if ((yi>lon)!=(yj>lon)) and (lat < (xj-xi)*(lon-yi)/(yj-yi)+xi):
            inside = not inside
        j = i
    return inside


def is_in_special_zone(lat, lon) -> bool:
    return any(point_in_polygon(lat, lon, p) for p in SPECIAL_POLYGONS)


def geocode_city(address: str):
    addr_lower = address.lower()
    for key, coord in CITY_COORDS.items():
        if key in addr_lower:
            return coord
    try:
        url = (f"https://nominatim.openstreetmap.org/search"
               f"?q={urllib.request.quote(address)}&format=json&limit=1&accept-language=ru&addressdetails=1")
        req = urllib.request.Request(url, headers={"User-Agent": "ug-transfer-app/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        if data:
            return (float(data[0]["lat"]), float(data[0]["lon"]))
    except Exception:
        pass
    return None


def is_crimea_addr(addr: str) -> bool:
    return any(k in addr.lower() for k in CRIMEA_KEYS)

def is_special_addr(addr: str) -> bool:
    return any(k in addr.lower() for k in SPECIAL_KEYS)


def osrm_route_with_geometry(coords: list) -> dict:
    """Запрашивает маршрут через OSRM с геометрией."""
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


def split_km_by_zone(waypoints: list, total_km: float) -> tuple:
    """Разбивает маршрут на обычные и спецзонные км."""
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
    km_normal  = total_km * (1 - ratio_special)
    return km_normal, km_special


def fallback_distance(fc, tc) -> tuple:
    """Fallback когда OSRM недоступен."""
    total = haversine(fc[0],fc[1],tc[0],tc[1]) * 1.4
    fc_special = is_in_special_zone(fc[0],fc[1])
    tc_special = is_in_special_zone(tc[0],tc[1])
    if fc_special and tc_special:
        return 0.0, total
    if not fc_special and not tc_special:
        return total, 0.0
    return total*0.7, total*0.3


def calc_price(km_normal, km_special, tariff_key, extras_cost):
    t = TARIFFS.get(tariff_key, TARIFFS["standard"])
    ts = TARIFFS_SPECIAL.get(tariff_key, TARIFFS_SPECIAL["standard"])
    return round(t["per_km"]*km_normal + ts["per_km"]*km_special + t["base"] + extras_cost)


def validate_against_reference(km_total_calc: int, ref: dict) -> tuple:
    """
    Проверяет расчёт против эталона.
    Возвращает (is_error, deviation_pct, error_reason).
    """
    ref_total = ref["km_normal"] + ref["km_special"]
    if ref_total == 0:
        return False, 0.0, None
    deviation_pct = abs(km_total_calc - ref_total) / ref_total * 100
    if deviation_pct > MAX_DEVIATION_PCT:
        reason = (f"Расчётное расстояние {km_total_calc} км отклоняется от эталона "
                  f"{ref_total} км на {deviation_pct:.1f}% (допустимо {MAX_DEVIATION_PCT}%)")
        return True, round(deviation_pct, 1), reason
    return False, round(deviation_pct, 1), None


def handler(event: dict, context) -> dict:
    """
    Рассчитать стоимость поездки с проверкой по эталонной базе данных.
    Каждый расчёт логируется. При отклонении >20% от эталона фиксируется ошибка.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    from_city = body.get("from", "").strip()
    to_city   = body.get("to",   "").strip()
    car_class = body.get("carClass", "standard")
    extras_selected = body.get("extras", {})
    stops = [s.strip() for s in body.get("stops", []) if s.strip()]

    if not from_city or not to_city:
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "Укажите откуда и куда"})}

    # ── 1. Проверяем эталонную базу ───────────────────────────────────────────
    # Для прямых маршрутов без остановок
    reference = None
    use_reference = len(stops) == 0
    if use_reference:
        reference = lookup_reference(from_city, to_city)

    # ── 2. Геокодируем все точки ──────────────────────────────────────────────
    all_cities = [from_city] + stops + [to_city]
    all_coords = []
    for city in all_cities:
        coord = geocode_city(city)
        if not coord:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": f"Не удалось найти: {city}"})}
        all_coords.append(coord)

    all_special = all(is_special_addr(c) for c in all_cities)
    all_crimea  = all(is_crimea_addr(c)  for c in all_cities)

    from_crimea = is_crimea_addr(from_city)
    to_crimea   = is_crimea_addr(to_city)

    KERCH    = (36.467, 45.360)
    ARMIANSK = (33.691, 46.103)
    CHONGAR  = (34.394, 46.003)

    def is_kherson_addr(a): return any(k in a.lower() for k in ["херсон","херсонская","геническ","каховка"])
    def is_zap_addr(a):     return any(k in a.lower() for k in ["мелитополь","запорожская","бердянск","токмак","энергодар","пологи"])

    osrm_coords = [(lon, lat) for lat, lon in all_coords]

    if from_crimea and not to_crimea:
        if is_kherson_addr(to_city):
            osrm_coords.insert(1, ARMIANSK)
        elif is_zap_addr(to_city):
            osrm_coords.insert(1, CHONGAR)
        else:
            osrm_coords.insert(1, KERCH)
    elif to_crimea and not from_crimea:
        if is_kherson_addr(from_city):
            osrm_coords.insert(len(osrm_coords)-1, ARMIANSK)
        elif is_zap_addr(from_city):
            osrm_coords.insert(len(osrm_coords)-1, CHONGAR)
        else:
            osrm_coords.insert(len(osrm_coords)-1, KERCH)

    # ── 3. Считаем расстояния ─────────────────────────────────────────────────
    source = "osrm"
    result = osrm_route_with_geometry(osrm_coords)

    if result:
        total_km = result["distance_km"]
        if all_special:
            km_normal, km_special = 0.0, total_km
        elif all_crimea or (not is_special_addr(from_city) and not is_special_addr(to_city) and not any(is_special_addr(s) for s in stops)):
            km_normal, km_special = total_km, 0.0
        else:
            km_normal, km_special = split_km_by_zone(result["waypoints"], total_km)
    else:
        source = "fallback"
        km_normal, km_special = 0.0, 0.0
        for i in range(len(all_coords)-1):
            n, s = fallback_distance(all_coords[i], all_coords[i+1])
            km_normal += n
            km_special += s

    km_normal  = round(km_normal)
    km_special = round(km_special)

    # ── 4. Если есть эталон — используем его km_normal / km_special ───────────
    km_calc_total = km_normal + km_special
    is_error = False
    deviation_pct = None
    error_reason = None
    ref_km_total = None

    if reference:
        ref_km_total = reference["km_normal"] + reference["km_special"]
        is_error, deviation_pct, error_reason = validate_against_reference(km_calc_total, reference)

        # При отклонении — доверяем эталону
        if is_error:
            km_normal  = reference["km_normal"]
            km_special = reference["km_special"]
            source = "reference_override"
            is_error = True  # сохраняем флаг что было отклонение — но цену считаем по эталону
        else:
            # Незначительное отклонение — доверяем OSRM, но записываем эталонные км для точности тарификации
            km_normal  = reference["km_normal"]
            km_special = reference["km_special"]
            source = "reference"

    distance_km = km_normal + km_special

    # ── 5. Считаем цену ───────────────────────────────────────────────────────
    extras_cost = sum(cost for key, cost in EXTRAS.items() if extras_selected.get(key))
    price = calc_price(km_normal, km_special, car_class, extras_cost)
    all_prices = {key: calc_price(km_normal, km_special, key, extras_cost) for key in TARIFFS}

    # ── 5а. Альтернативные маршруты (только для прямых поездок без остановок) ──
    alternatives = []
    if not stops:
        alternatives = lookup_alternatives(from_city, to_city, car_class, extras_cost)
        # Если в БД нет — генерируем автоматически при наличии спецзоны
        if not alternatives and km_special > 0:
            alternatives = build_auto_alternatives(km_normal, km_special, car_class, extras_cost)
        # Убираем альтернативы идентичные основному маршруту
        alternatives = [
            a for a in alternatives
            if not (a["km_normal"] == km_normal and a["km_special"] == km_special)
        ]

    # ── 6. Логируем ───────────────────────────────────────────────────────────
    save_log({
        "from_city": from_city,
        "to_city":   to_city,
        "stops":     stops if stops else None,
        "car_class": car_class,
        "km_normal":  km_normal,
        "km_special": km_special,
        "km_total":   distance_km,
        "price":      price,
        "all_prices": all_prices,
        "reference_id":  reference["id"] if reference else None,
        "ref_km_total":  ref_km_total,
        "deviation_pct": deviation_pct,
        "is_error":      is_error,
        "error_reason":  error_reason,
        "source":        source,
    })

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "distance_km":      distance_km,
            "price":            price,
            "car_class":        car_class,
            "all_prices":       all_prices,
            "has_special_zone": km_special > 0,
            "km_normal":        km_normal,
            "km_special":       km_special,
            "source":           source,
            "alternatives":     alternatives,
        }),
    }