from django.urls import reverse
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AdminProfile, AuditLog

User = get_user_model()


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('auth_register')
        self.token_url = reverse('token_obtain_pair')
        self.me_url = reverse('auth_me')
        self.user_data = {
            'email': 'attendee@chapter.com',
            'name': 'Jane Doe',
            'password': 'securepassword123'
        }

    def test_user_registration(self):
        """Ensure a user can register and receive access tokens."""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], self.user_data['email'].lower())
        self.assertEqual(response.data['user']['name'], self.user_data['name'])
        self.assertFalse(response.data['user']['is_admin'])

    def test_user_registration_duplicate_email(self):
        """Ensure duplicate email registration is rejected."""
        User.objects.create_user(
            email=self.user_data['email'],
            name=self.user_data['name'],
            password=self.user_data['password']
        )
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login(self):
        """Ensure registered user can login and retrieve custom JWT payload."""
        User.objects.create_user(
            email=self.user_data['email'],
            name=self.user_data['name'],
            password=self.user_data['password']
        )
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.token_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['name'], self.user_data['name'])

    def test_login_admin_email_returns_is_admin_true(self):
        """Login with ADMIN_EMAIL returns is_admin=true."""
        User.objects.create_user(
            email=settings.ADMIN_EMAIL,
            name='Admin Committee',
            password='adminpassword123'
        )
        response = self.client.post(self.token_url, {
            'email': settings.ADMIN_EMAIL,
            'password': 'adminpassword123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['user']['is_admin'])

    def test_login_participant_returns_is_admin_false(self):
        """Login with a non-admin email returns is_admin=false."""
        User.objects.create_user(
            email='participant@example.com',
            name='Participant',
            password='participantpass123'
        )
        response = self.client.post(self.token_url, {
            'email': 'participant@example.com',
            'password': 'participantpass123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['user']['is_admin'])

    def test_me_endpoint_unauthenticated(self):
        """Ensure unauthenticated users cannot access /me/ profile views."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_authenticated(self):
        """Ensure authenticated user can fetch profile details and perform patch updates."""
        user = User.objects.create_user(
            email=self.user_data['email'],
            name=self.user_data['name'],
            password=self.user_data['password']
        )
        self.client.force_authenticate(user=user)

        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], user.email)
        self.assertEqual(response.data['name'], user.name)

        patch_data = {'name': 'Jane Updated'}
        response = self.client.patch(self.me_url, patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Jane Updated')

        user.refresh_from_db()
        self.assertEqual(user.name, 'Jane Updated')


class AdminProfileTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email=settings.ADMIN_EMAIL,
            name='Admin Committee',
            password='adminpassword123'
        )
        self.participant_user = User.objects.create_user(
            email='participant@example.com',
            name='Participant',
            password='participantpass123'
        )
        self.profiles_url = reverse('admin_profiles')

    def test_admin_profile_crud(self):
        """Full CRUD lifecycle for admin profiles."""
        self.client.force_authenticate(user=self.admin_user)

        # Create
        response = self.client.post(self.profiles_url, {'name': 'Karthik'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        profile_id = response.data['id']

        # Read list
        response = self.client.get(self.profiles_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Update
        detail_url = reverse('admin_profile_detail', kwargs={'pk': profile_id})
        response = self.client.patch(detail_url, {'name': 'Karthik S'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Karthik S')

        # Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(AdminProfile.objects.count(), 0)

    def test_non_admin_cannot_access_profiles(self):
        """Participant users get 403 on profile endpoints."""
        self.client.force_authenticate(user=self.participant_user)
        response = self.client.get(self.profiles_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_profile_select_reissues_jwt(self):
        """Profile selection returns new JWT with admin_profile_id claim."""
        self.client.force_authenticate(user=self.admin_user)
        # Create a profile
        response = self.client.post(self.profiles_url, {'name': 'Rahul'}, format='json')
        profile_id = response.data['id']

        select_url = reverse('admin_profile_select')
        response = self.client.post(select_url, {'profile_id': profile_id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('profile', response.data)
        self.assertEqual(response.data['profile']['name'], 'Rahul')

    def test_disabled_profile_cannot_be_selected(self):
        """Selecting a disabled profile returns 400."""
        self.client.force_authenticate(user=self.admin_user)
        # Create then disable
        response = self.client.post(self.profiles_url, {'name': 'Priya'}, format='json')
        profile_id = response.data['id']
        detail_url = reverse('admin_profile_detail', kwargs={'pk': profile_id})
        self.client.patch(detail_url, {'is_active': False}, format='json')

        select_url = reverse('admin_profile_select')
        response = self.client.post(select_url, {'profile_id': profile_id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_referenced_profile_blocked(self):
        """Profile referenced in audit logs cannot be deleted."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.profiles_url, {'name': 'Ashwin'}, format='json')
        profile_id = response.data['id']
        profile = AdminProfile.objects.get(id=profile_id)

        # Create an audit log referencing this profile
        AuditLog.objects.create(
            admin_user=self.admin_user,
            admin_profile=profile,
            action_type='create',
            entity_type='Event',
            entity_label='Test Event'
        )

        detail_url = reverse('admin_profile_detail', kwargs={'pk': profile_id})
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('audit logs', response.data['detail'])

    def test_audit_log_lists_with_pagination(self):
        """Audit log endpoint returns paginated results."""
        self.client.force_authenticate(user=self.admin_user)
        profile = AdminProfile.objects.create(name='TestProfile')
        for i in range(30):
            AuditLog.objects.create(
                admin_user=self.admin_user,
                admin_profile=profile,
                action_type='create',
                entity_type='Event',
                entity_label=f'Event {i}'
            )

        audit_url = reverse('audit_logs')
        response = self.client.get(audit_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 30)
        self.assertEqual(len(response.data['results']), 25)  # page_size default

    def test_role_field_removed(self):
        """Verify User model no longer has a role attribute."""
        self.assertFalse(hasattr(self.admin_user, 'role') and callable(getattr(self.admin_user, 'role', None)))
        # The model should not have a 'role' database field
        field_names = [f.name for f in User._meta.get_fields()]
        self.assertNotIn('role', field_names)
