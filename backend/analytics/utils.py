from .models import AnalyticsEvent

def log_event(event_type, entity_id=None, user=None, metadata=None):
    try:
        AnalyticsEvent.objects.create(
            event_type=event_type,
            entity_id=str(entity_id) if entity_id else None,
            user=user if user and user.is_authenticated else None,
            metadata=metadata or {}
        )
    except Exception:
        pass
