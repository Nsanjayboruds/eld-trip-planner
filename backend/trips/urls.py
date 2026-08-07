from django.urls import path
from . import views

urlpatterns = [
    path('trip-plan/', views.plan_trip, name='plan-trip'),
    path('autocomplete/', views.autocomplete_location, name='autocomplete'),
]
