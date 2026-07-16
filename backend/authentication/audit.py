from .models import AuditLog


def log_admin_action(request, action_type, entity_type, entity_id=None,
                     entity_label='', changes=None):
    """
    Creates an AuditLog entry using request.user and request.admin_profile.
    Can be called from any view that performs an administrative action.

    Args:
        request: The DRF request object (must have .user and optionally .admin_profile)
        action_type: One of AuditLog.ActionType values (e.g., 'create', 'update', 'delete')
        entity_type: String name of the entity (e.g., 'Event', 'Sponsor')
        entity_id: Primary key of the affected entity
        entity_label: Human-readable label (e.g., event title)
        changes: Dict of changes, e.g., {"field": {"before": x, "after": y}}
    """
    try:
        AuditLog.objects.create(
            admin_user=request.user if request.user.is_authenticated else None,
            admin_profile=getattr(request, 'admin_profile', None),
            action_type=action_type,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            entity_label=str(entity_label),
            changes=changes or {}
        )
    except Exception:
        # Audit logging should never break the primary operation
        pass
