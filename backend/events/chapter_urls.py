from django.urls import path
from .views import ChapterSettingDetailView

urlpatterns = [
    path('<slug:slug>/', ChapterSettingDetailView.as_view(), name='chapter-detail'),
]
