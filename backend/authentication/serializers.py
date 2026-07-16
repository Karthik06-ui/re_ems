from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import AdminProfile, AuditLog

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    is_profile_completed = serializers.BooleanField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)
    registrations_count = serializers.SerializerMethodField()
    checkins_count = serializers.SerializerMethodField()
    event_history = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'name', 'email', 'avatar', 'is_admin', 'auth_provider',
            'roll_number', 'department', 'phone_number', 'is_profile_completed', 'created_at',
            'registrations_count', 'checkins_count', 'event_history'
        )
        read_only_fields = ('id', 'auth_provider', 'created_at', 'is_profile_completed', 'is_admin')

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
        # Append serialized user profile with is_admin flag to response
        data['user'] = UserSerializer(self.user).data
        return data


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ('id', 'name', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class AuditLogSerializer(serializers.ModelSerializer):
    admin_profile_name = serializers.SerializerMethodField()
    admin_user_email = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            'id', 'admin_user_email', 'admin_profile_name', 'action_type',
            'entity_type', 'entity_id', 'entity_label', 'changes', 'timestamp'
        )

    def get_admin_profile_name(self, obj):
        return obj.admin_profile.name if obj.admin_profile else 'Unknown'

    def get_admin_user_email(self, obj):
        return obj.admin_user.email if obj.admin_user else 'Unknown'
