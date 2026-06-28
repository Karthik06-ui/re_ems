from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    is_profile_completed = serializers.BooleanField(read_only=True)
    registrations_count = serializers.SerializerMethodField()
    checkins_count = serializers.SerializerMethodField()
    event_history = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'name', 'email', 'avatar', 'role', 'auth_provider', 
            'roll_number', 'department', 'phone_number', 'is_profile_completed', 'created_at',
            'registrations_count', 'checkins_count', 'event_history'
        )
        read_only_fields = ('id', 'role', 'auth_provider', 'created_at', 'is_profile_completed')

    def get_registrations_count(self, obj):
        from events.models import Registration
        return Registration.objects.filter(user=obj).count()

    def get_checkins_count(self, obj):
        from events.models import Registration
        return Registration.objects.filter(user=obj, status=Registration.Status.CHECKED_IN).count()

    def get_event_history(self, obj):
        from events.models import Registration
        regs = Registration.objects.filter(user=obj).select_related('event')
        return [
            {
                "event_title": reg.event.title,
                "status": "Checked In" if reg.status == Registration.Status.CHECKED_IN else "Confirmed"
            }
            for reg in regs
        ]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password')

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value.lower()

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Append serialized user profile directly to response body
        data['user'] = UserSerializer(self.user).data
        return data

class UserRoleSerializer(serializers.ModelSerializer):
    user = UserSerializer(source='*')

    class Meta:
        model = User
        fields = ('id', 'user', 'role')
