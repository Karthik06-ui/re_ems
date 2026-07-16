from django.db import models
from django.conf import settings as django_settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email).lower()
        extra_fields.setdefault('auth_provider', User.AuthProvider.EMAIL)

        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class AuthProvider(models.TextChoices):
        EMAIL = 'email', 'Email'
        GOOGLE = 'google', 'Google'
        GITHUB = 'github', 'Github'
        LINKEDIN = 'linkedin', 'LinkedIn'

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, db_index=True)
    avatar = models.URLField(max_length=500, blank=True, null=True)
    auth_provider = models.CharField(
        max_length=50,
        choices=AuthProvider.choices,
        default=AuthProvider.EMAIL
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    roll_number = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    notification_preferences = models.TextField(default='{"outreach": true, "announcements": true, "reminders": true}', blank=True)

    @property
    def notification_preferences_dict(self):
        import json
        try:
            return json.loads(self.notification_preferences or '{}')
        except Exception:
            return {"outreach": True, "announcements": True, "reminders": True}

    @property
    def is_admin(self):
        """Admin determination is based solely on email match with ADMIN_EMAIL env var."""
        admin_email = getattr(django_settings, 'ADMIN_EMAIL', '')
        return bool(admin_email and self.email.lower() == admin_email.lower())

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    @property
    def is_profile_completed(self):
        return bool(self.name and self.roll_number and self.department and self.phone_number)

    def __str__(self):
        label = "admin" if self.is_admin else "participant"
        return f"{self.email} ({label})"


class AdminProfile(models.Model):
    """
    Identity label for committee members sharing the single admin account.
    No credentials — only used for accountability and audit attribution.
    """
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        status = "Active" if self.is_active else "Disabled"
        return f"{self.name} ({status})"


class AuditLog(models.Model):
    """
    Centralized audit trail for all administrative actions.
    Records the acting profile, action, entity, and changes.
    """
    class ActionType(models.TextChoices):
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        STATUS_CHANGE = 'status_change', 'Status Change'
        SEND = 'send', 'Send'
        CHECKIN = 'checkin', 'Check In'
        APPROVE = 'approve', 'Approve'
        LOGIN = 'login', 'Login'
        PROFILE_SELECT = 'profile_select', 'Profile Select'

    admin_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_logs'
    )
    admin_profile = models.ForeignKey(
        AdminProfile,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_logs'
    )
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100, null=True, blank=True)
    entity_label = models.CharField(max_length=255, blank=True, default='')
    changes = models.TextField(default='{}', blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    @property
    def changes_dict(self):
        import json
        try:
            return json.loads(self.changes or '{}')
        except Exception:
            return {}

    def save(self, *args, **kwargs):
        # Auto-serialize dict to JSON string if changes is passed as dict
        import json
        if isinstance(self.changes, dict):
            self.changes = json.dumps(self.changes)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    def __str__(self):
        profile_name = self.admin_profile.name if self.admin_profile else "Unknown"
        return f"{profile_name} {self.action_type} {self.entity_type} at {self.timestamp}"
