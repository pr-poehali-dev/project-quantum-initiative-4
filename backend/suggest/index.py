import json
import urllib.request
import urllib.parse


def handler(event: dict, context) -> dict:
    """Автоподсказки адресов через Яндекс Suggest API и обратный геокодинг через Nominatim."""

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
        req = urllib.request.Request(url, headers={'User-Agent': 'TaxiApp/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())

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

        # Краткие названия регионов для пометки в подсказках
        REGION_SHORT = {
            'донецкая народная республика': 'ДНР',
            'донецька область': 'ДНР',
            'луганская народная республика': 'ЛНР',
            'луганська область': 'ЛНР',
            'херсонская область': 'Херсонская обл.',
            'херсонська область': 'Херсонская обл.',
            'запорожская область': 'Запорожская обл.',
            'запорізька область': 'Запорожская обл.',
        }

        # Первый проход — собираем все города для дедупликации
        candidates = []
        city_counts = {}
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
            city_counts[city_key] = city_counts.get(city_key, 0) + 1
            candidates.append({
                'country': country,
                'main': main,
                'city_key': city_key,
                'region_short': region_short,
            })

        results = []
        seen = set()
        for c in candidates:
            main = c['main']
            # Если этот город встречается в нескольких регионах — добавляем пометку ДНР/ЛНР
            if c['region_short'] and city_counts.get(c['city_key'], 0) > 1:
                main = main + ' (' + c['region_short'] + ')'

            line = c['country'] + '|' + main
            if line in seen:
                continue
            seen.add(line)
            results.append(c['country'] + ', ' + main)

            if len(results) >= 6:
                break

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