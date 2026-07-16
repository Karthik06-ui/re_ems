from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    EventViewSet, SpeakerViewSet, SessionViewSet,
    SurveyQuestionViewSet, AnnouncementViewSet, RegistrationViewSet,
    TeamViewSet, TeamInvitationViewSet
)

router = SimpleRouter()
router.register('speakers', SpeakerViewSet, basename='speaker')
router.register('sessions', SessionViewSet, basename='session')
router.register('survey-questions', SurveyQuestionViewSet, basename='survey-question')
router.register('announcements', AnnouncementViewSet, basename='announcement')
router.register('registrations', RegistrationViewSet, basename='registration')
router.register('teams', TeamViewSet, basename='team')
router.register('invitations', TeamInvitationViewSet, basename='invitation')
router.register('', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
]
