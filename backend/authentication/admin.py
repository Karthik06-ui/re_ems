from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'role', 'auth_provider', 'is_staff', 'is_active')
    list_filter = ('role', 'auth_provider', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'avatar')}),
        ('Permissions', {'fields': ('role', 'auth_provider', 'is_staff', 'is_superuser', 'is_active', 'groups', 'user_permissions')}),
    )
    search_fields = ('email', 'name')
    ordering = ('email',)

admin.site.register(User, UserAdmin)
