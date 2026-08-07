from datetime import datetime, timedelta
import math


OFF_DUTY = 'OFF'
SLEEPER = 'SB'
DRIVING = 'D'
ON_DUTY = 'ON'

MAX_DRIVING_HOURS = 11.0
MAX_ON_DUTY_WINDOW = 14.0
BREAK_AFTER_DRIVING_HOURS = 8.0
BREAK_DURATION_HOURS = 0.5
MAX_CYCLE_HOURS = 70.0
REST_DURATION_HOURS = 10.0
CYCLE_RESTART_HOURS = 34.0
FUEL_INTERVAL_MILES = 1000
FUEL_STOP_DURATION_HOURS = 0.5
PICKUP_DROPOFF_DURATION_HOURS = 1.0
PRE_TRIP_INSPECTION_HOURS = 0.25


class HOSEngine:

    def __init__(self, current_cycle_used=0, start_time=None):
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        self.current_time = start_time or datetime(
            tomorrow.year, tomorrow.month, tomorrow.day, 6, 0, 0
        )
        
        self.driving_today = 0.0
        self.on_duty_window_start = None
        self.driving_since_break = 0.0
        
        self.cycle_used = float(current_cycle_used)
        
        self.miles_since_fuel = 0.0
        self.events = []
        self.stops = []
        
        self.trip_start_time = self.current_time.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        
    def _hours_elapsed_in_window(self):
        if self.on_duty_window_start is None:
            return 0.0
        return (self.current_time - self.on_duty_window_start).total_seconds() / 3600

    def _remaining_driving(self):
        remaining_11 = MAX_DRIVING_HOURS - self.driving_today
        remaining_window = MAX_ON_DUTY_WINDOW - self._hours_elapsed_in_window() if self.on_duty_window_start else MAX_ON_DUTY_WINDOW
        remaining_break = BREAK_AFTER_DRIVING_HOURS - self.driving_since_break
        remaining_cycle = MAX_CYCLE_HOURS - self.cycle_used
        return max(0, min(remaining_11, remaining_window, remaining_break, remaining_cycle))

    def _add_event(self, status, duration_hours, remark='', location=None):
        start = self.current_time
        end = start + timedelta(hours=duration_hours)
        
        self.events.append({
            'start_time': start,
            'end_time': end,
            'status': status,
            'duration_hours': duration_hours,
            'remark': remark,
            'location': location,
        })
        
        self.current_time = end
        
        if status == DRIVING:
            self.driving_today += duration_hours
            self.driving_since_break += duration_hours
            self.cycle_used += duration_hours
        elif status == ON_DUTY:
            self.cycle_used += duration_hours

    def _take_rest(self, location=None, reason=''):
        remark = reason or '10-hour required rest'
        self._add_event(OFF_DUTY, REST_DURATION_HOURS, remark, location)
        
        self.driving_today = 0.0
        self.on_duty_window_start = None
        self.driving_since_break = 0.0
        
        if location:
            self.stops.append({
                'location': location,
                'type': 'rest',
                'arrival_time': self.events[-1]['start_time'].isoformat(),
                'duration_minutes': int(REST_DURATION_HOURS * 60),
                'description': remark,
            })

    def _take_break(self, location=None, reason=''):
        remark = reason or '30-minute required break'
        self._add_event(OFF_DUTY, BREAK_DURATION_HOURS, remark, location)
        self.driving_since_break = 0.0
        
        if location:
            self.stops.append({
                'location': location,
                'type': 'break',
                'arrival_time': self.events[-1]['start_time'].isoformat(),
                'duration_minutes': int(BREAK_DURATION_HOURS * 60),
                'description': remark,
            })

    def _take_fuel_stop(self, location=None):
        self._add_event(ON_DUTY, FUEL_STOP_DURATION_HOURS, 'Fuel stop', location)
        self.miles_since_fuel = 0.0
        
        if location:
            self.stops.append({
                'location': location,
                'type': 'fuel',
                'arrival_time': self.events[-1]['start_time'].isoformat(),
                'duration_minutes': int(FUEL_STOP_DURATION_HOURS * 60),
                'description': 'Fuel stop',
            })

    def _take_cycle_restart(self, location=None):
        remark = '34-hour restart (70-hr cycle limit)'
        self._add_event(OFF_DUTY, CYCLE_RESTART_HOURS, remark, location)
        
        self.driving_today = 0.0
        self.on_duty_window_start = None
        self.driving_since_break = 0.0
        self.cycle_used = 0.0
        
        if location:
            self.stops.append({
                'location': location,
                'type': 'restart',
                'arrival_time': self.events[-1]['start_time'].isoformat(),
                'duration_minutes': int(CYCLE_RESTART_HOURS * 60),
                'description': remark,
            })

    def _open_window_if_needed(self):
        if self.on_duty_window_start is None:
            self.on_duty_window_start = self.current_time

    def _interpolate_location(self, start_loc, end_loc, fraction):
        if not start_loc or not end_loc:
            return start_loc or end_loc
        return {
            'lat': start_loc['lat'] + (end_loc['lat'] - start_loc['lat']) * fraction,
            'lng': start_loc['lng'] + (end_loc['lng'] - start_loc['lng']) * fraction,
        }

    def simulate_trip(self, route_data, current_loc, pickup_loc, dropoff_loc):
        segments = route_data['segments']
        
        off_hours_before = (self.current_time - self.trip_start_time).total_seconds() / 3600
        if off_hours_before > 0:
            actual_start = self.current_time
            self.current_time = self.trip_start_time
            self._add_event(OFF_DUTY, off_hours_before, 'Off duty', {'lat': current_loc['lat'], 'lng': current_loc['lng']})
        
        self._open_window_if_needed()
        self._add_event(ON_DUTY, PRE_TRIP_INSPECTION_HOURS, 'Pre-trip inspection', 
                       {'lat': current_loc['lat'], 'lng': current_loc['lng']})
        
        if len(segments) >= 1:
            seg = segments[0]
            self._drive_segment(
                seg['distance_miles'], 
                seg['duration_hours'],
                {'lat': current_loc['lat'], 'lng': current_loc['lng']},
                {'lat': pickup_loc['lat'], 'lng': pickup_loc['lng']},
                'Driving to pickup'
            )
        
        self._open_window_if_needed()
        pickup_location = {'lat': pickup_loc['lat'], 'lng': pickup_loc['lng']}
        self._add_event(ON_DUTY, PICKUP_DROPOFF_DURATION_HOURS, 
                       f'Pickup at {pickup_loc["name"]}', pickup_location)
        self.stops.append({
            'location': pickup_location,
            'type': 'pickup',
            'arrival_time': self.events[-1]['start_time'].isoformat(),
            'duration_minutes': 60,
            'description': f'Pickup at {pickup_loc["name"]}',
        })
        
        if len(segments) >= 2:
            seg = segments[1]
            self._drive_segment(
                seg['distance_miles'],
                seg['duration_hours'],
                {'lat': pickup_loc['lat'], 'lng': pickup_loc['lng']},
                {'lat': dropoff_loc['lat'], 'lng': dropoff_loc['lng']},
                'Driving to drop-off'
            )
        
        dropoff_location = {'lat': dropoff_loc['lat'], 'lng': dropoff_loc['lng']}
        self._open_window_if_needed()
        self._add_event(ON_DUTY, PICKUP_DROPOFF_DURATION_HOURS,
                       f'Drop-off at {dropoff_loc["name"]}', dropoff_location)
        self.stops.append({
            'location': dropoff_location,
            'type': 'dropoff',
            'arrival_time': self.events[-1]['start_time'].isoformat(),
            'duration_minutes': 60,
            'description': f'Drop-off at {dropoff_loc["name"]}',
        })
        
        last_event_end = self.events[-1]['end_time']
        day_end = last_event_end.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        remaining = (day_end - last_event_end).total_seconds() / 3600
        if remaining > 0:
            self._add_event(OFF_DUTY, remaining, 'Off duty', dropoff_location)
        
        daily_logs = self._build_daily_logs()
        
        total_driving = sum(e['duration_hours'] for e in self.events if e['status'] == DRIVING)
        total_miles = route_data['total_distance_miles']
        
        trip_summary = {
            'total_days': len(daily_logs),
            'total_driving_hours': round(total_driving, 1),
            'total_distance_miles': round(total_miles, 1),
            'estimated_departure': self.events[0]['start_time'].isoformat() if self.events else None,
            'estimated_arrival': self.events[-1]['end_time'].isoformat() if self.events else None,
            'fuel_stops': sum(1 for s in self.stops if s['type'] == 'fuel'),
            'rest_stops': sum(1 for s in self.stops if s['type'] == 'rest'),
        }
        
        return {
            'stops': self.stops,
            'daily_logs': daily_logs,
            'trip_summary': trip_summary,
        }

    def _drive_segment(self, total_miles, total_hours, start_loc, end_loc, remark='Driving'):
        miles_remaining = total_miles
        hours_remaining = total_hours
        
        if total_miles <= 0 or total_hours <= 0:
            return
        
        avg_speed = total_miles / total_hours
        
        while hours_remaining > 0.01:
            self._open_window_if_needed()
            
            drivable = self._remaining_driving()
            
            miles_until_fuel = FUEL_INTERVAL_MILES - self.miles_since_fuel
            hours_until_fuel = miles_until_fuel / avg_speed if avg_speed > 0 else float('inf')
            
            drive_chunk = min(hours_remaining, drivable, hours_until_fuel)
            
            if drive_chunk <= 0.01:
                fraction = 1.0 - (miles_remaining / total_miles) if total_miles > 0 else 1.0
                current_location = self._interpolate_location(start_loc, end_loc, fraction)
                
                if MAX_CYCLE_HOURS - self.cycle_used < 0.5:
                    self._take_cycle_restart(current_location)
                elif BREAK_AFTER_DRIVING_HOURS - self.driving_since_break < 0.5:
                    self._take_break(current_location, '30-min break (8-hr driving limit)')
                else:
                    self._take_rest(current_location, '10-hour rest (driving/window limit reached)')
                    
                    self._open_window_if_needed()
                    self._add_event(ON_DUTY, PRE_TRIP_INSPECTION_HOURS, 'Pre-trip inspection', current_location)
                
                continue
            
            miles_driven = drive_chunk * avg_speed
            fraction_start = 1.0 - (miles_remaining / total_miles) if total_miles > 0 else 0.0
            chunk_location = self._interpolate_location(start_loc, end_loc, fraction_start)
            
            self._add_event(DRIVING, drive_chunk, remark, chunk_location)
            
            miles_remaining -= miles_driven
            hours_remaining -= drive_chunk
            self.miles_since_fuel += miles_driven
            
            if self.miles_since_fuel >= FUEL_INTERVAL_MILES - 1 and hours_remaining > 0.01:
                fraction = 1.0 - (miles_remaining / total_miles) if total_miles > 0 else 1.0
                fuel_location = self._interpolate_location(start_loc, end_loc, fraction)
                self._take_fuel_stop(fuel_location)

    def _build_daily_logs(self):
        if not self.events:
            return []
        
        first_date = self.events[0]['start_time'].date()
        last_date = self.events[-1]['end_time'].date()
        if self.events[-1]['end_time'].hour == 0 and self.events[-1]['end_time'].minute == 0:
            last_date = last_date - timedelta(days=1)
        
        daily_logs = []
        current_date = first_date
        day_number = 1
        
        while current_date <= last_date:
            day_start = datetime.combine(current_date, datetime.min.time())
            day_end = day_start + timedelta(days=1)
            
            day_events = []
            day_miles = 0.0
            remarks = []
            
            for event in self.events:
                evt_start = event['start_time']
                evt_end = event['end_time']
                
                if evt_end <= day_start or evt_start >= day_end:
                    continue
                
                clipped_start = max(evt_start, day_start)
                clipped_end = min(evt_end, day_end)
                
                start_hour = (clipped_start - day_start).total_seconds() / 3600
                end_hour = (clipped_end - day_start).total_seconds() / 3600
                
                if end_hour - start_hour < 0.001:
                    continue
                
                day_events.append({
                    'start_hour': round(start_hour, 2),
                    'end_hour': round(end_hour, 2),
                    'status': event['status'],
                    'remark': event.get('remark', ''),
                })
                
                if event['status'] == DRIVING and event['duration_hours'] > 0:
                    fraction_in_day = (end_hour - start_hour) / (event['duration_hours'] * (3600 / 3600))
                    
                if event.get('remark') and event['status'] != OFF_DUTY:
                    time_str = clipped_start.strftime('%H:%M')
                    remarks.append({
                        'time': time_str,
                        'text': event['remark'],
                    })
            
            totals = {OFF_DUTY: 0, SLEEPER: 0, DRIVING: 0, ON_DUTY: 0}
            for evt in day_events:
                duration = evt['end_hour'] - evt['start_hour']
                if evt['status'] in totals:
                    totals[evt['status']] += duration
            
            daily_logs.append({
                'date': current_date.isoformat(),
                'day_number': day_number,
                'events': day_events,
                'total_hours': {
                    'off_duty': round(totals[OFF_DUTY], 2),
                    'sleeper': round(totals[SLEEPER], 2),
                    'driving': round(totals[DRIVING], 2),
                    'on_duty': round(totals[ON_DUTY], 2),
                },
                'remarks': remarks,
            })
            
            current_date += timedelta(days=1)
            day_number += 1
        
        return daily_logs
