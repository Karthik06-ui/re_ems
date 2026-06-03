from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Chapter, UserChapterRole

User = get_user_model()

class ChapterTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('chapter-list')
        self.user = User.objects.create_user(
            email='lead@chapter.com',
            name='Lead User',
            password='password123'
        )

    def test_chapter_creation_and_auto_lead(self):
        """Ensure authenticated user can create a chapter, and becomes the Lead."""
        self.client.force_authenticate(user=self.user)
        chapter_data = {
            'name': 'GDG Seattle',
            'slug': 'gdg-seattle',
            'description': 'Google Developer Group Seattle chapter',
            'location': 'Seattle, WA'
        }
        response = self.client.post(self.list_url, chapter_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Chapter.objects.count(), 1)
        
        # Verify role auto-assignment
        chapter = Chapter.objects.first()
        self.assertEqual(chapter.name, 'GDG Seattle')
        role = UserChapterRole.objects.filter(user=self.user, chapter=chapter).first()
        self.assertIsNotNone(role)
        self.assertEqual(role.role, UserChapterRole.Role.LEAD)
