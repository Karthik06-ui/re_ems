from django.contrib import admin
from .models import Chapter, UserChapterRole

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'location', 'created_at', 'deleted_at')
    search_fields = ('name', 'slug', 'location')
    list_filter = ('deleted_at',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(UserChapterRole)
class UserChapterRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'chapter', 'role')
    list_filter = ('role', 'chapter')
    search_fields = ('user__email', 'chapter__name')
