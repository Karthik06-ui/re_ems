from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import DiscussionThreadViewSet

router = SimpleRouter()
router.register('', DiscussionThreadViewSet, basename='thread')

urlpatterns = [
    path('', include(router.urls)),
]
