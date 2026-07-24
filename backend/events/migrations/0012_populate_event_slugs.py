from django.db import migrations
from django.utils.text import slugify

def populate_slugs(apps, schema_editor):
    Event = apps.get_model('events', 'Event')
    for event in Event.objects.filter(slug__isnull=True) | Event.objects.filter(slug=''):
        base_slug = slugify(event.title) if event.title else 'event'
        if not base_slug:
            base_slug = 'event'
        candidate = base_slug
        num = 1
        while Event.objects.filter(slug=candidate).exclude(pk=event.pk).exists():
            candidate = f"{base_slug}-{num}"
            num += 1
        event.slug = candidate
        event.save(update_fields=['slug'])

def reverse_populate(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('events', '0011_event_slug'),
    ]

    operations = [
        migrations.RunPython(populate_slugs, reverse_code=reverse_populate),
    ]
