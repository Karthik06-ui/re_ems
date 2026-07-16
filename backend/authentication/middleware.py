from rest_framework_simplejwt.tokens import AccessToken
from .models import AdminProfile


class AdminProfileMiddleware:
    """
    Extracts admin_profile_id from JWT access token claims and attaches the
    corresponding AdminProfile instance to request.admin_profile.

    For non-admin users or requests without a profile claim, request.admin_profile
    is set to None.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.admin_profile = None

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer ') and hasattr(request, 'user'):
            try:
                token_str = auth_header.split(' ', 1)[1]
                token = AccessToken(token_str)
                profile_id = token.get('admin_profile_id')
                if profile_id:
                    try:
                        request.admin_profile = AdminProfile.objects.get(
                            id=profile_id, is_active=True
                        )
                    except AdminProfile.DoesNotExist:
                        request.admin_profile = None
            except Exception:
                pass

        response = self.get_response(request)
        return response
