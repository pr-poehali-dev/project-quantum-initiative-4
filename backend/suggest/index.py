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
                'limit': '6',
                'countrycodes': 'ru,by,kz',
            })
        )
        req = urllib.request.Request(url, headers={'User-Agent': 'TaxiApp/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())

        results = []
        for item in data:
            name = item.get('display_name', '')
            if name:
                parts = [p.strip() for p in name.split(',')][:3]
                results.append(', '.join(parts))

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
                'zoom': '14',
            })
        )
        req = urllib.request.Request(url, headers={
            'User-Agent': 'TaxiApp/1.0',
        })
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())

        address_data = data.get('address', {})
        parts = []
        for key in ['city', 'town', 'village', 'suburb', 'road', 'house_number']:
            val = address_data.get(key)
            if val:
                parts.append(val)

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