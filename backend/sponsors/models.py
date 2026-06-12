from django.db import models
from events.models import Event

class Sponsor(models.Model):
    class Tier(models.TextChoices):
        GOLD = 'gold', 'Gold'
        SILVER = 'silver', 'Silver'
        BRONZE = 'bronze', 'Bronze'

    name = models.CharField(max_length=255)
    logo = models.URLField(max_length=500, blank=True, null=True)
    website = models.URLField(max_length=500, blank=True)
    tier = models.CharField(max_length=50, choices=Tier.choices, default=Tier.BRONZE)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class EventSponsor(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='event_sponsors')
    sponsor = models.ForeignKey(Sponsor, on_delete=models.CASCADE, related_name='event_placements')
    tier_override = models.CharField(
        max_length=50, 
        choices=Sponsor.Tier.choices, 
        null=True, 
        blank=True
    )

    class Meta:
        unique_together = ('event', 'sponsor')

    def __str__(self):
        return f"{self.sponsor.name} sponsoring {self.event.title}"
