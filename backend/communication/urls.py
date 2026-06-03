from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import EmailCampaignViewSet

router = SimpleRouter()
router.register('', EmailCampaignViewSet, basename='campaign')

urlpatterns = [
    path('', include(router.urls)),
]
