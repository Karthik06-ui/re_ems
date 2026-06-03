from django.db import models
from django.conf import settings

class Chapter(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    logo = models.URLField(max_length=500, blank=True, null=True)
    banner = models.URLField(max_length=500, blank=True, null=True)
    social_links = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class UserChapterRole(models.Model):
    class Role(models.TextChoices):
        LEAD = 'chapter_lead', 'Chapter Lead'
        ORGANIZER = 'organizer', 'Organizer'
        MEMBER = 'member', 'Member'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chapter_roles'
    )
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='user_roles'
    )
    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.MEMBER
    )

    class Meta:
        unique_together = ('user', 'chapter')

    def __str__(self):
        return f"{self.user.email} - {self.chapter.name} ({self.role})"
