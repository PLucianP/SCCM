from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from .models import Policy


class ABACBackend(ModelBackend):
    def has_perm(self, user_obj, perm, obj=None):
        if not user_obj.is_active:
            return False

        # Split permission string (e.g., 'order.create' -> ['order', 'create'])
        try:
            resource, action = perm.split('.')
        except ValueError:
            return False

        # Get all policies for the user's role
        policies = Policy.objects.filter(
            role__name=user_obj.role,
            resource=resource,
            action=action
        )

        if not policies.exists():
            return False

        # If no object is provided, just check if any policy exists
        if obj is None:
            return True

        # Check each policy's conditions
        for policy in policies:
            if self._check_conditions(policy, user_obj, obj):
                return True

        return False

    def _check_conditions(self, policy, user, obj):
        conditions = policy.conditions

        for condition, value in conditions.items():
            # Workspace-based conditions
            if condition == 'workspace_match':
                if value and user.workspace != getattr(obj, 'workspace', None):
                    return False

            # Owner-based conditions
            elif condition == 'is_owner':
                if value and getattr(obj, 'owner', None) != user:
                    return False

            # Status-based conditions
            elif condition == 'status_in':
                if value and getattr(obj, 'status', None) not in value:
                    return False

            # Role-based conditions
            elif condition == 'role_in':
                if value and user.role not in value:
                    return False

        return True
