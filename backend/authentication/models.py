from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email).lower()
        extra_fields.setdefault('role', User.Role.MEMBER)
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
        extra_fields.setdefault('role', User.Role.PLATFORM_ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        PLATFORM_ADMIN = 'platform_admin', 'Platform Admin'
        CHAPTER_LEAD = 'chapter_lead', 'Chapter Lead'
        ORGANIZER = 'organizer', 'Organizer'
        SPEAKER = 'speaker', 'Speaker'
        MEMBER = 'member', 'Member'

    class AuthProvider(models.TextChoices):
        EMAIL = 'email', 'Email'
        GOOGLE = 'google', 'Google'
        GITHUB = 'github', 'Github'
        LINKEDIN = 'linkedin', 'LinkedIn'

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, db_index=True)
    avatar = models.URLField(max_length=500, blank=True, null=True)
    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.MEMBER
    )
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
            
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    @property
    def is_profile_completed(self):
        return bool(self.name and self.roll_number and self.department and self.phone_number)

    def __str__(self):
        return f"{self.email} ({self.role})"

