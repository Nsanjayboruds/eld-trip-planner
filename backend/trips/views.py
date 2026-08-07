from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import TripInputSerializer
from .route_service import geocode, geocode_autocomplete, get_full_trip_route, RouteServiceError
from .hos_engine import HOSEngine


@api_view(['POST'])
def plan_trip(request):
    serializer = TripInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    
    try:
        current_loc = geocode(data['current_location'])
        pickup_loc = geocode(data['pickup_location'])
        dropoff_loc = geocode(data['dropoff_location'])
        
        route_data = get_full_trip_route(current_loc, pickup_loc, dropoff_loc)
        
        engine = HOSEngine(
            current_cycle_used=data['current_cycle_used']
        )
        result = engine.simulate_trip(route_data, current_loc, pickup_loc, dropoff_loc)
        
        response_data = {
            'route': {
                'geometry': route_data['geometry'],
                'total_distance_miles': round(route_data['total_distance_miles'], 1),
                'total_duration_hours': round(route_data['total_duration_hours'], 1),
                'bbox': route_data.get('bbox'),
                'segments': [
                    {
                        'distance_miles': round(s['distance_miles'], 1),
                        'duration_hours': round(s['duration_hours'], 1),
                    }
                    for s in route_data['segments']
                ],
            },
            'locations': {
                'current': current_loc,
                'pickup': pickup_loc,
                'dropoff': dropoff_loc,
            },
            'stops': result['stops'],
            'daily_logs': result['daily_logs'],
            'trip_summary': result['trip_summary'],
        }
        
        return Response(response_data)
    
    except RouteServiceError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )
    except Exception as e:
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def autocomplete_location(request):
    query = request.GET.get('q', '').strip()
    if len(query) < 2:
        return Response([])
    
    results = geocode_autocomplete(query)
    return Response(results)
