import os
import json
import urllib.request
import urllib.parse


def handler(event: dict, context) -> dict:
    """Проксирует запросы к Яндекс Geocoder API для подсказок адресов и геокодирования."""

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

    api_key = os.environ.get('YANDEX_GEOCODER_API_KEY', 'feba36e0-0c20-42ea-aac4-e0d61b0ff690')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'suggest')

    if action == 'suggest':
        query = params.get('q', '')
        if not query:
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'results': []})
            }
        url = (
            'https://geocode-maps.yandex.ru/1.x/?'
            + urllib.parse.urlencode({
                'apikey': api_key,
                'geocode': query,
                'results': '6',
                'format': 'json',
                'lang': 'ru_RU',
            })
        )
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        members = (
            data.get('response', {})
                .get('GeoObjectCollection', {})
                .get('featureMember', [])
        )
        suggestions = []
        for m in members:
            text = (
                m.get('GeoObject', {})
                 .get('metaDataProperty', {})
                 .get('GeocoderMetaData', {})
                 .get('text', '')
            )
            if text:
                suggestions.append(text)
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'results': suggestions})
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
            'https://geocode-maps.yandex.ru/1.x/?'
            + urllib.parse.urlencode({
                'apikey': api_key,
                'geocode': f'{lon},{lat}',
                'results': '1',
                'format': 'json',
                'lang': 'ru_RU',
            })
        )
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        address = (
            data.get('response', {})
                .get('GeoObjectCollection', {})
                .get('featureMember', [{}])[0]
                .get('GeoObject', {})
                .get('metaDataProperty', {})
                .get('GeocoderMetaData', {})
                .get('text', '')
        )
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