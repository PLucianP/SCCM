from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid



class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(
        max_length=20,
        choices=[
            ('ADMIN', 'Administrator'),
            ('MANAGER', 'Manager'),
            ('MEASURER', 'Measurer'),
            ('WORKER', 'Worker'),
        ],
        default='WORKER'
    )
    workspace = models.ForeignKey(
        'carpet.Workspace',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )

    @property
    def display_name(self):
        if self.first_name:
            return self.first_name
        if self.username:
            return self.username
        return self.email

    class Meta:
        db_table = 'auth_user'


class Permission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Role(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    permissions = models.ManyToManyField(Permission, related_name='roles')
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Policy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='policies')
    resource = models.CharField(max_length=100)  # e.g., 'order', 'client', 'measurement'
    action = models.CharField(max_length=100)  # e.g., 'create', 'read', 'update', 'delete'
    conditions = models.JSONField(default=dict)  # Store ABAC conditions as JSON

    class Meta:
        verbose_name_plural = 'policies'
        unique_together = ('role', 'resource', 'action')

    def __str__(self):
        return f"{self.role.name} - {self.resource}.{self.action}"
