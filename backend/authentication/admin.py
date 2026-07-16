from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AdminProfile, AuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        'email', 'name',
        'auth_provider', 'is_staff', 'is_active'
    )

    list_filter = (
        'auth_provider',
        'is_staff', 'is_active'
    )

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'avatar', 'roll_number', 'department', 'phone_number')}),
        ('Permissions', {
            'fields': (
                'auth_provider',
                'is_staff',
                'is_superuser',
                'is_active',
                'groups',
                'user_permissions',
            )
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'name',
                'password1',
                'password2',
                'auth_provider',
                'is_staff',
                'is_active',
            ),
        }),
    )

    search_fields = ('email', 'name')
    ordering = ('email',)


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'admin_profile', 'action_type', 'entity_type', 'entity_label')
    list_filter = ('action_type', 'entity_type')
    search_fields = ('entity_label',)
    ordering = ('-timestamp',)
    readonly_fields = (
        'admin_user', 'admin_profile', 'action_type',
        'entity_type', 'entity_id', 'entity_label', 'changes', 'timestamp'
    )