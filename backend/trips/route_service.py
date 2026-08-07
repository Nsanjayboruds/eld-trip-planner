import requests
from django.conf import settings


class RouteServiceError(Exception):
    pass


NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
OSRM_BASE = 'https://router.project-osrm.org'

HEADERS = {
    'User-Agent': 'ELDTripPlanner/1.0 (educational project)',
}


def geocode(location_text):
    url = f'{NOMINATIM_BASE}/search'
    params = {
        'q': location_text,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'us',
    }
    
    try:
        response = requests.get(url, params=params, headers=HEADERS, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            raise RouteServiceError(f'Could not geocode location: {location_text}')
        
        result = data[0]
        return {
            'lat': float(result['lat']),
            'lng': float(result['lon']),
            'name': result.get('display_name', location_text).split(',')[0] + ', ' + location_text.split(',')[-1].strip() if ',' in location_text else result.get('display_name', location_text),
        }
    except requests.RequestException as e:
        raise RouteServiceError(f'Geocoding API error: {str(e)}')


def geocode_autocomplete(text):
    url = f'{NOMINATIM_BASE}/search'
    params = {
        'q': text,
        'format': 'json',
        'limit': 5,
        'countrycodes': 'us',
    }
    
    try:
        response = requests.get(url, params=params, headers=HEADERS, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for item in data:
            results.append({
                'name': item.get('display_name', ''),
                'lat': float(item['lat']),
                'lng': float(item['lon']),
            })
        return results
    except requests.RequestException:
        return []


def get_route(waypoints):
    coords_str = ';'.join([f'{wp[0]},{wp[1]}' for wp in waypoints])
    
    url = f'{OSRM_BASE}/route/v1/driving/{coords_str}'
    params = {
        'overview': 'full',
        'geometries': 'geojson',
        'steps': 'true',
        'annotations': 'true',
    }
    
    try:
        response = requests.get(url, params=params, headers=HEADERS, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if data.get('code') != 'Ok' or not data.get('routes'):
            raise RouteServiceError('No route found between the given locations.')
        
        route = data['routes'][0]
        
        geometry = route['geometry']['coordinates']
        
        total_distance_miles = route['distance'] * 0.000621371
        total_duration_hours = route['duration'] / 3600
        
        segments = []
        for leg in route.get('legs', []):
            segment_data = {
                'distance_miles': leg['distance'] * 0.000621371,
                'duration_hours': leg['duration'] / 3600,
                'steps': [],
            }
            for step in leg.get('steps', []):
                segment_data['steps'].append({
                    'instruction': step.get('name', '') or step.get('ref', ''),
                    'distance_miles': step.get('distance', 0) * 0.000621371,
                    'duration_seconds': step.get('duration', 0),
                })
            segments.append(segment_data)
        
        return {
            'geometry': geometry,
            'total_distance_miles': total_distance_miles,
            'total_duration_hours': total_duration_hours,
            'segments': segments,
            'bbox': None,
        }
    except requests.RequestException as e:
        raise RouteServiceError(f'Routing API error: {str(e)}')


def get_full_trip_route(current_coords, pickup_coords, dropoff_coords):
    waypoints = [
        [current_coords['lng'], current_coords['lat']],
        [pickup_coords['lng'], pickup_coords['lat']],
        [dropoff_coords['lng'], dropoff_coords['lat']],
    ]
    
    return get_route(waypoints)
