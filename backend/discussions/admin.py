from django.contrib import admin
from .models import DiscussionThread, Comment

@admin.register(DiscussionThread)
class DiscussionThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created_at', 'deleted_at')
    list_filter = ('deleted_at',)
    search_fields = ('title', 'author__email')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('thread', 'author', 'parent', 'created_at')
    search_fields = ('author__email', 'content')
