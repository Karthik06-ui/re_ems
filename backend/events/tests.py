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
            roll_number='A101', department='CSE', year_of_study='3rd', phone_number='1234567890'
        )
        self.user_b = User.objects.create_user(
            email='user_b@test.com', name='User B', password='password123',
            roll_number='B102', department='ECE', year_of_study='3rd', phone_number='1234567891'
        )
        self.user_c = User.objects.create_user(
            email='user_c@test.com', name='User C', password='password123',
            roll_number='C103', department='MECH', year_of_study='3rd', phone_number='1234567892'
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
        from django.conf import settings
        # Admin user must match ADMIN_EMAIL for is_admin to return True
        self.admin_user = User.objects.create_user(
            email=settings.ADMIN_EMAIL, name='Admin User', password='password123',
            roll_number='ADM01', department='ADMIN', phone_number='1111111111'
        )
        self.member_user = User.objects.create_user(
            email='member_chapter@test.com', name='Member User', password='password123',
            roll_number='MEM01', department='CSE', phone_number='2222222222'
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


from .models import Team, TeamMember, TeamInvitation

class TeamRegistrationTests(APITestCase):
    def setUp(self):
        self.leader = User.objects.create_user(
            email='leader@test.com', name='Leader', password='password123',
            roll_number='L101', department='CSE', year_of_study='3rd', phone_number='1112223333'
        )
        self.member = User.objects.create_user(
            email='member@test.com', name='Member', password='password123',
            roll_number='M102', department='ECE', year_of_study='3rd', phone_number='1112223334'
        )
        self.team_event = Event.objects.create(
            title='Hackathon 2026',
            description='Hackathon',
            type=Event.EventType.PHYSICAL,
            status=Event.EventStatus.PUBLISHED,
            start_time=timezone.now() + timedelta(days=2),
            end_time=timezone.now() + timedelta(days=2, hours=10),
            capacity=1,
            registration_mode='team',
            min_team_size=2,
            max_team_size=3
        )
        self.create_team_url = reverse('team-list')

    def test_direct_registration_blocked(self):
        """Direct individual registration is blocked for team events."""
        self.client.force_authenticate(user=self.leader)
        url = reverse('event-register', kwargs={'pk': self.team_event.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("This is a team event", response.data['detail'])

    def test_team_registration_workflow(self):
        """Full workflow: create team -> invite -> accept -> register team."""
        # 1. Create team
        self.client.force_authenticate(user=self.leader)
        response = self.client.post(self.create_team_url, {
            'event': self.team_event.id,
            'name': 'Team Devs',
            'description': 'Description'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        team_id = response.data['id']
        team = Team.objects.get(id=team_id)
        self.assertEqual(team.leader, self.leader)

        # 2. Invite member
        invite_url = reverse('team-invite', kwargs={'pk': team.pk})
        response = self.client.post(invite_url, {'email': self.member.email})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 3. Respond to invitation
        self.client.force_authenticate(user=self.member)
        invitations_url = reverse('invitation-list')
        response = self.client.get(invitations_url)
        self.assertEqual(len(response.data), 1)
        invite_id = response.data[0]['id']

        respond_url = reverse('invitation-respond', kwargs={'pk': invite_id})
        response = self.client.post(respond_url, {'response': 'accept'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(TeamMember.objects.filter(team=team).count(), 2)

        # 4. Register team
        self.client.force_authenticate(user=self.leader)
        register_team_url = reverse('team-register-team', kwargs={'pk': team.pk})
        response = self.client.post(register_team_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        team.refresh_from_db()
        self.assertEqual(team.status, Team.RegistrationStatus.REGISTERED)
        self.assertEqual(Registration.objects.filter(event=self.team_event, status=Registration.Status.CONFIRMED).count(), 2)


class PublicEventsAPITests(APITestCase):
    def setUp(self):
        self.published_event = Event.objects.create(
            title='Public AI Workshop',
            description='A public workshop on machine learning.',
            type=Event.EventType.PHYSICAL,
            status=Event.EventStatus.PUBLISHED,
            category=Event.EventCategory.WORKSHOP,
            start_time=timezone.now() + timedelta(days=5),
            end_time=timezone.now() + timedelta(days=5, hours=3),
            capacity=50,
            venue='Auditorium 1'
        )
        self.draft_event = Event.objects.create(
            title='Draft Event',
            description='Draft description',
            type=Event.EventType.VIRTUAL,
            status=Event.EventStatus.DRAFT,
            category=Event.EventCategory.BOOTCAMP,
            start_time=timezone.now() + timedelta(days=10),
            end_time=timezone.now() + timedelta(days=10, hours=2),
            capacity=20
        )
        self.cancelled_event = Event.objects.create(
            title='Cancelled Summit',
            description='Cancelled description',
            type=Event.EventType.HYBRID,
            status=Event.EventStatus.CANCELLED,
            category=Event.EventCategory.HACKATHON,
            start_time=timezone.now() + timedelta(days=15),
            end_time=timezone.now() + timedelta(days=15, hours=5),
            capacity=100
        )
        self.list_url = '/api/public/events/'

    def test_slug_auto_generated(self):
        """Verify that slug is automatically generated when event is created."""
        self.assertTrue(self.published_event.slug.startswith('public-ai-workshop'))

    def test_public_event_list_unauthenticated(self):
        """Public list endpoint returns 200 OK without auth and excludes draft/cancelled events."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = [item['slug'] for item in response.data]
        self.assertIn(self.published_event.slug, slugs)
        self.assertNotIn(self.draft_event.slug, slugs)
        self.assertNotIn(self.cancelled_event.slug, slugs)

    def test_public_event_detail_unauthenticated(self):
        """Public detail endpoint returns sanitized data without PII or internal counts."""
        url = f"/api/public/events/{self.published_event.slug}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # Check required fields present
        self.assertEqual(data['title'], 'Public AI Workshop')
        self.assertEqual(data['slug'], self.published_event.slug)
        self.assertEqual(data['capacity'], 50)
        self.assertEqual(data['remaining_seats'], 50)
        self.assertFalse(data['is_full'])
        self.assertTrue(data['is_registration_open'])
        self.assertEqual(data['public_status'], 'open')

        # Verify sensitive/internal fields NOT present
        self.assertNotIn('registration_count', data)
        self.assertNotIn('registrations', data)
        self.assertNotIn('survey_questions', data)
        self.assertNotIn('announcements', data)
        self.assertNotIn('created_by_user_email', data)
        self.assertNotIn('created_by_profile_name', data)

    def test_public_event_filtering(self):
        """Test time_frame and category filters."""
        url = f"{self.list_url}?time_frame=upcoming&category=workshop"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], self.published_event.slug)



