import json
import urllib.request
import urllib.parse


# Хардкодный справочник городов спецзон — Nominatim часто их не находит или путает
SPECIAL_CITIES = [
    # ДНР
    ("Донецк", "Донецкая Народная Республика", "ДНР"),
    ("Мариуполь", "Донецкая Народная Республика", "ДНР"),
    ("Горловка", "Донецкая Народная Республика", "ДНР"),
    ("Макеевка", "Донецкая Народная Республика", "ДНР"),
    ("Краматорск", "Донецкая Народная Республика", "ДНР"),
    ("Дебальцево", "Донецкая Народная Республика", "ДНР"),
    ("Авдеевка", "Донецкая Народная Республика", "ДНР"),
    ("Ясиноватая", "Донецкая Народная Республика", "ДНР"),
    ("Енакиево", "Донецкая Народная Республика", "ДНР"),
    ("Харцызск", "Донецкая Народная Республика", "ДНР"),
    ("Шахтёрск", "Донецкая Народная Республика", "ДНР"),
    ("Снежное", "Донецкая Народная Республика", "ДНР"),
    ("Торез", "Донецкая Народная Республика", "ДНР"),
    ("Иловайск", "Донецкая Народная Республика", "ДНР"),
    ("Волноваха", "Донецкая Народная Республика", "ДНР"),
    ("Угледар", "Донецкая Народная Республика", "ДНР"),
    ("Докучаевск", "Донецкая Народная Республика", "ДНР"),
    ("Новоазовск", "Донецкая Народная Республика", "ДНР"),
    ("Докучаевск", "Донецкая Народная Республика", "ДНР"),
    # ЛНР
    ("Луганск", "Луганская Народная Республика", "ЛНР"),
    ("Лисичанск", "Луганская Народная Республика", "ЛНР"),
    ("Северодонецк", "Луганская Народная Республика", "ЛНР"),
    ("Алчевск", "Луганская Народная Республика", "ЛНР"),
    ("Стаханов", "Луганская Народная Республика", "ЛНР"),
    ("Антрацит", "Луганская Народная Республика", "ЛНР"),
    ("Красный Луч", "Луганская Народная Республика", "ЛНР"),
    ("Свердловск", "Луганская Народная Республика", "ЛНР"),
    ("Перевальск", "Луганская Народная Республика", "ЛНР"),
    ("Брянка", "Луганская Народная Республика", "ЛНР"),
    ("Кировск", "Луганская Народная Республика", "ЛНР"),
    ("Первомайск", "Луганская Народная Республика", "ЛНР"),
    ("Ровеньки", "Луганская Народная Республика", "ЛНР"),
    ("Молодогвардейск", "Луганская Народная Республика", "ЛНР"),
    # Запорожская
    ("Мелитополь", "Запорожская область", None),
    ("Бердянск", "Запорожская область", None),
    ("Токмак", "Запорожская область", None),
    ("Энергодар", "Запорожская область", None),
    ("Пологи", "Запорожская область", None),
    ("Приморск", "Запорожская область", None),
    # Херсонская
    ("Херсон", "Херсонская область", None),
    ("Геническ", "Херсонская область", None),
    ("Каховка", "Херсонская область", None),
    ("Новая Каховка", "Херсонская область", None),
    ("Скадовск", "Херсонская область", None),
    # Крым
    ("Симферополь", "Республика Крым", None),
    ("Ялта", "Республика Крым", None),
    ("Севастополь", "Республика Крым", None),
    ("Феодосия", "Республика Крым", None),
    ("Евпатория", "Республика Крым", None),
    ("Алушта", "Республика Крым", None),
    ("Судак", "Республика Крым", None),
    ("Бахчисарай", "Республика Крым", None),
    ("Керчь", "Республика Крым", None),
    ("Саки", "Республика Крым", None),
]


def search_special(query: str) -> list:
    """Ищет среди хардкодных городов спецзон по подстроке."""
    q = query.lower().strip()
    results = []
    seen = set()
    for city, region, short in SPECIAL_CITIES:
        if q in city.lower():
            # ДНР/ЛНР: "Россия, г. Донецк ДНР"
            # Остальные: "Россия, Республика Крым, г. Симферополь"
            if short:
                label_display = f"Россия, г. {city} {short}"
            else:
                label_display = f"Россия, {region}, г. {city}"
            key = city.lower()
            if key not in seen:
                seen.add(key)
                results.append(label_display)
    return results


def handler(event: dict, context) -> dict:
    """Автоподсказки адресов: сначала хардкодные спецзоны, потом Nominatim."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'suggest')

    if action == 'suggest':
        query = params.get('q', '')
        if not query or len(query) < 2:
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'results': []})
            }

        # 1. Сначала ищем в хардкодных спецзонах
        special_results = search_special(query)

        # 2. Запрос к Nominatim
        url = (
            'https://nominatim.openstreetmap.org/search?'
            + urllib.parse.urlencode({
                'q': query,
                'format': 'json',
                'accept-language': 'ru',
                'limit': '10',
                'countrycodes': 'ru,by,ua',
                'addressdetails': '1',
                'dedupe': '1',
            })
        )
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'TaxiApp/1.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
        except Exception:
            data = []

        CRIMEA_STATES = {'республика крым', 'крым', 'crimea', 'автономна республіка крим'}
        RUSSIA_REGIONS = {
            'херсонская область': 'Херсонская область',
            'запорожская область': 'Запорожская область',
            'донецкая народная республика': 'Донецкая Народная Республика',
            'донецька область': 'Донецкая Народная Республика',
            'луганская народная республика': 'Луганская Народная Республика',
            'луганська область': 'Луганская Народная Республика',
            'херсонська область': 'Херсонская область',
            'запорізька область': 'Запорожская область',
        }
        REGION_SHORT = {
            'донецкая народная республика': 'ДНР',
            'донецька область': 'ДНР',
            'луганская народная республика': 'ЛНР',
            'луганська область': 'ЛНР',
        }

        nominatim_results = []
        seen = set()

        # Добавляем хардкодные спецзоны в seen чтобы не дублировать
        for r in special_results:
            city_part = r.split('г. ')[-1].split(' (')[0].lower()
            seen.add(city_part)

        for item in data:
            addr = item.get('address', {})
            country = addr.get('country', '')
            city = (addr.get('city') or addr.get('town') or addr.get('village')
                    or addr.get('municipality') or addr.get('county') or '')
            state = addr.get('state', '')
            road = addr.get('road', '')
            house = addr.get('house_number', '')

            state_lower = state.lower()
            is_crimea = any(k in state_lower for k in CRIMEA_STATES)
            is_russia_region = any(k in state_lower for k in RUSSIA_REGIONS)
            is_ukraine = country.lower() in ('украина', 'ukraine', 'україна')

            if is_ukraine and not is_crimea and not is_russia_region:
                continue

            if is_crimea or is_russia_region:
                country = 'Россия'
                matched_region = next((v for k, v in RUSSIA_REGIONS.items() if k in state_lower), None)
                region = 'Республика Крым' if is_crimea else (matched_region or state)
                region_short = next((v for k, v in REGION_SHORT.items() if k in state_lower), None)
                city_clean = city.replace('город ', '').replace('місто ', '').strip()
                city_label = ('г. ' + city_clean) if city_clean else ''
                street_parts = [p for p in [road, house] if p]
                street = ' '.join(street_parts)
                main_parts = [p for p in [region, city_label, street] if p.strip()]
            else:
                region_short = None
                city_clean = city.replace('город ', '').strip()
                city_label = ('г. ' + city_clean) if city_clean else ''
                street = (road + ', ' + house) if (road and house) else (road or house or '')
                main_parts = [p for p in [city_label or (city if city else state), street] if p.strip()]

            main = ', '.join(main_parts)
            if not main:
                continue

            city_key = city_clean.lower() if city_clean else main.lower()
            if city_key in seen:
                continue
            seen.add(city_key)

            result = country + ', ' + main
            if region_short and city_clean:
                result = country + ', ' + main + ' (' + region_short + ')'

            nominatim_results.append(result)

        # Объединяем: спецзоны первыми, потом обычные города
        results = (special_results + nominatim_results)[:6]

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'results': results})
        }

    elif action == 'geocode':
        lon = params.get('lon', '')
        lat = params.get('lat', '')
        if not lon or not lat:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'lon and lat required'})
            }

        url = (
            'https://nominatim.openstreetmap.org/reverse?'
            + urllib.parse.urlencode({
                'lat': lat,
                'lon': lon,
                'format': 'json',
                'accept-language': 'ru',
                'zoom': '18',
            })
        )
        req = urllib.request.Request(url, headers={'User-Agent': 'TaxiApp/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())

        addr = data.get('address', {})
        city = (addr.get('city') or addr.get('town') or addr.get('village') or addr.get('municipality') or '')
        road = addr.get('road', '')
        house = addr.get('house_number', '')

        parts = []
        if city:
            parts.append(city)
        if road and road != city:
            parts.append(road)
        if house:
            parts.append(house)

        address = ', '.join(parts) if parts else data.get('display_name', '')

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'address': address})
        }

    return {
        'statusCode': 400,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'unknown action'})
    }