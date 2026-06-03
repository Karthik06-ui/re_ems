from django.db import models
from django.conf import settings

class AnalyticsEvent(models.Model):
    event_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100, null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='analytics_events'
    )
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} at {self.timestamp}"
