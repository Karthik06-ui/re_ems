from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import ChapterViewSet

router = SimpleRouter()
router.register('', ChapterViewSet, basename='chapter')

urlpatterns = [
    path('', include(router.urls)),
]
