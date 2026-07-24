from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .public_views import PublicEventViewSet

router = SimpleRouter()
router.register('events', PublicEventViewSet, basename='public-event')

urlpatterns = [
    path('', include(router.urls)),
]
