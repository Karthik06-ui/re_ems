from rest_framework import serializers
from .models import DiscussionThread, Comment
from authentication.serializers import UserSerializer

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'thread', 'author', 'parent', 'content', 'created_at', 'replies')
        read_only_fields = ('id', 'thread', 'author', 'created_at')

    def get_replies(self, obj):
        # Limit to 2 levels deep by not querying deeper if parent is already set
        if obj.parent is not None:
            return []
        replies = obj.replies.all()
        return CommentSerializer(replies, many=True).data

class DiscussionThreadSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionThread
        fields = ('id', 'chapter', 'author', 'title', 'content', 'created_at', 'comment_count')
        read_only_fields = ('id', 'author', 'created_at')

    def get_comment_count(self, obj):
        return obj.comments.count()
