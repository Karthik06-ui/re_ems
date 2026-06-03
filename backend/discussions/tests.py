from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import DiscussionThread, Comment
from chapters.models import Chapter

User = get_user_model()

class DiscussionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='author@test.com', name='Author User', password='password123')
        self.chapter = Chapter.objects.create(name='GDG Denver', slug='gdg-denver')
        self.thread = DiscussionThread.objects.create(
            chapter=self.chapter,
            author=self.user,
            title='Welcome Thread',
            content='Welcome to the GDG Denver chapter!'
        )
        self.list_url = reverse('thread-list')
        self.comments_url = reverse('thread-comments', kwargs={'pk': self.thread.pk})

    def test_create_thread(self):
        """Ensure authenticated member can post a discussion thread."""
        self.client.force_authenticate(user=self.user)
        data = {
            'chapter': self.chapter.id,
            'title': 'New Topic',
            'content': 'Some content here'
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DiscussionThread.objects.count(), 2)

    def test_post_comment_and_replies(self):
        """Ensure member can write comments and nested replies under a thread."""
        self.client.force_authenticate(user=self.user)
        # Post top-level comment
        comment_data = {'content': 'This is a comment.'}
        response = self.client.post(self.comments_url, comment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 1)
        
        # Post a nested reply
        parent_comment = Comment.objects.first()
        reply_data = {
            'content': 'This is a reply.',
            'parent': parent_comment.id
        }
        response = self.client.post(self.comments_url, reply_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 2)
        
        # Get comments list and assert structure
        response = self.client.get(self.comments_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return top-level comment containing the nested reply in serialized list
        self.assertEqual(len(response.data), 1)
        self.assertEqual(len(response.data[0]['replies']), 1)
        self.assertEqual(response.data[0]['replies'][0]['content'], 'This is a reply.')
