from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import timedelta

from .models import Event, Registration, Waitlist

User = get_user_model()

class EventRegistrationTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email='user_a@test.com', name='User A', password='password123',
            roll_number='A101', department='CSE', phone_number='1234567890'
        )
        self.user_b = User.objects.create_user(
            email='user_b@test.com', name='User B', password='password123',
            roll_number='B102', department='ECE', phone_number='1234567891'
        )
        self.user_c = User.objects.create_user(
            email='user_c@test.com', name='User C', password='password123',
            roll_number='C103', department='MECH', phone_number='1234567892'
        )
        
        # Create an event with capacity = 2
        self.event = Event.objects.create(
            title='NY Dev Summit',
            description='Summit description',
            type=Event.EventType.PHYSICAL,
            status=Event.EventStatus.PUBLISHED,
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=2),
            capacity=2
        )
        self.register_url = reverse('event-register', kwargs={'pk': self.event.pk})
        self.cancel_url = reverse('event-cancel', kwargs={'pk': self.event.pk})

    def test_registration_success_within_capacity(self):
        """User A and B register successfully since capacity is 2."""
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(self.register_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Registration.objects.filter(event=self.event, status=Registration.Status.CONFIRMED).count(), 1)

        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(self.register_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Registration.objects.filter(event=self.event, status=Registration.Status.CONFIRMED).count(), 2)

    def test_waitlist_activation_on_capacity_exceeded(self):
        """User C registers after capacity is filled and gets added to the waitlist."""
        # Fill capacity
        Registration.objects.create(event=self.event, user=self.user_a, status=Registration.Status.CONFIRMED)
        Registration.objects.create(event=self.event, user=self.user_b, status=Registration.Status.CONFIRMED)

        # User C registers
        self.client.force_authenticate(user=self.user_c)
        response = self.client.post(self.register_url)
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        
        # Verify waitlist entry
        wait_entry = Waitlist.objects.filter(event=self.event, user=self.user_c).first()
        self.assertIsNotNone(wait_entry)
        self.assertEqual(wait_entry.position, 1)

    def test_waitlist_promotion_on_cancellation(self):
        """When User A cancels, User C is promoted from the waitlist to Confirmed (FIFO)."""
        # User A and B confirmed
        Registration.objects.create(event=self.event, user=self.user_a, status=Registration.Status.CONFIRMED)
        Registration.objects.create(event=self.event, user=self.user_b, status=Registration.Status.CONFIRMED)
        # User C on waitlist
        Waitlist.objects.create(event=self.event, user=self.user_c, position=1)

        # User A cancels
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(self.cancel_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify User A cancelled
        reg_a = Registration.objects.get(event=self.event, user=self.user_a)
        self.assertEqual(reg_a.status, Registration.Status.CANCELLED)

        # Verify User C promoted to Confirmed
        reg_c = Registration.objects.filter(event=self.event, user=self.user_c).first()
        self.assertIsNotNone(reg_c)
        self.assertEqual(reg_c.status, Registration.Status.CONFIRMED)

        # Verify User C deleted from waitlist
        self.assertEqual(Waitlist.objects.filter(event=self.event).count(), 0)


class ChapterSettingTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@test.com', name='Admin User', password='password123',
            role=User.Role.ADMIN, roll_number='ADM01', department='ADMIN', phone_number='1111111111'
        )
        self.member_user = User.objects.create_user(
            email='member@test.com', name='Member User', password='password123',
            role=User.Role.PARTICIPANT, roll_number='MEM01', department='CSE', phone_number='2222222222'
        )
        self.url = reverse('chapter-detail', kwargs={'slug': 'gdg-workspace'})

    def test_get_chapter_settings_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'gdg-workspace')
        self.assertEqual(response.data['name'], 'Research and Exploration (RÉ) Workspace')

    def test_patch_chapter_settings_unauthorized(self):
        self.client.force_authenticate(user=self.member_user)
        response = self.client.patch(self.url, {'name': 'Updated Name'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_chapter_settings_authorized(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(self.url, {'name': 'Updated GDG Chapter', 'location': 'New Coimbatore'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated GDG Chapter')
        self.assertEqual(response.data['location'], 'New Coimbatore')

