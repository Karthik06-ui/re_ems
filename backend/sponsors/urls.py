from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import SponsorViewSet, EventSponsorViewSet

router = SimpleRouter()
router.register('event-placements', EventSponsorViewSet, basename='event_placement')
router.register('', SponsorViewSet, basename='sponsor')

urlpatterns = [
    path('', include(router.urls)),
]
