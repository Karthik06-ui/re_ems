from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Chapter, UserChapterRole
from authentication.serializers import UserSerializer

User = get_user_model()

class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ('id', 'name', 'slug', 'description', 'location', 'logo', 'banner', 'social_links', 'created_at')
        read_only_fields = ('id', 'created_at')

class UserChapterRoleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_email = serializers.EmailField(write_only=True)

    class Meta:
        model = UserChapterRole
        fields = ('id', 'user', 'user_email', 'role')

    def create(self, validated_data):
        email = validated_data.pop('user_email').lower()
        chapter = self.context['chapter']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_email": "User with this email does not exist."})
        
        role_instance, created = UserChapterRole.objects.update_or_create(
            user=user,
            chapter=chapter,
            defaults={'role': validated_data.get('role', UserChapterRole.Role.MEMBER)}
        )
        return role_instance
