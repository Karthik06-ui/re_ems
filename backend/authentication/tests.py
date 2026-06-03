from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

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
        self.assertEqual(response.data['user']['role'], User.Role.MEMBER)

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
        
        # Authenticate client using helper
        self.client.force_authenticate(user=user)
        
        # Get profile
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], user.email)
        self.assertEqual(response.data['name'], user.name)

        # Update profile
        patch_data = {'name': 'Jane Updated'}
        response = self.client.patch(self.me_url, patch_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Jane Updated')
        
        # Verify db persistence
        user.refresh_from_db()
        self.assertEqual(user.name, 'Jane Updated')

