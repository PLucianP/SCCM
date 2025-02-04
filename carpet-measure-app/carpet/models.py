from django.db import models
from django.conf import settings
from uuid import uuid4


class BasePluginModel(models.Model):
    """Base model for all plugin models with plugin-specific database routing"""
    id = models.UUIDField(primary_key=True, default=uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by_id = models.UUIDField()  # Reference to main app's User
    updated_by_id = models.UUIDField()  # Reference to main app's User

    class Meta:
        abstract = True
        managed = True
        app_label = 'carpet'


class Workspace(BasePluginModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    owner_id = models.UUIDField()  # Reference to main app's User model
    is_active = models.BooleanField(default=True)
    color = models.CharField(max_length=7, default="#4F46E5")  # Hex color code


class Client(BasePluginModel):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, null=True)  # Make address optional
    email = models.EmailField(blank=True)
    preferences = models.JSONField(default=dict, blank=True)  # For communication preferences


class Order(BasePluginModel):
    STATUS_CHOICES = [
        ('NEW', 'New Order'),
        ('WIP', 'Work in Progress'),
        ('FINISHED', 'Finished'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled')
    ]
    PRIORITY_CHOICES = [
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    client = models.ForeignKey(Client, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES)
    price_per_sqm = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    assigned_to_id = models.UUIDField(null=True)  # Reference to main app's User
    qr_code = models.CharField(max_length=255, unique=True)  # For order tracking
    estimated_completion = models.DateTimeField(null=True)
    actual_completion = models.DateTimeField(null=True)

    @property
    def measured_items_count(self):
        """Count items that have non-zero surface area"""
        return self.items.filter(dimensions__surface__gt=0).count()

    @property
    def total_items_count(self):
        return self.items.count()

    @property
    def total_area(self):
        """Calculate total area from all items"""
        return sum(float(item.dimensions.get('surface', 0)) for item in self.items.all())

    @property
    def calculated_total_price(self):
        """Calculate total price based on area and price per sqm"""
        return self.total_area * float(self.price_per_sqm)


class Item(BasePluginModel):
    MATERIAL_CHOICES = [
        ('CARPET', 'Carpet'),
        ('BLANKET', 'Blanket'),
        ('RUG', 'Rug'),
        ('CURTAIN', 'Curtain'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('RECEIVED', 'Received'),
        ('WASHING', 'Washing'),
        ('DRYING', 'Drying'),
        ('READY', 'Ready'),
        ('DELIVERED', 'Delivered')
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    material_type = models.CharField(max_length=50, choices=MATERIAL_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='RECEIVED')
    dimensions = models.JSONField(default=dict)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    special_instructions = models.TextField(blank=True)
    qr_code = models.CharField(max_length=255, unique=True)  # For item tracking
    estimated_completion = models.DateTimeField(null=True)

    @property
    def calculated_price(self):
        """Calculate item price based on surface area and order's price per sqm"""
        surface = float(self.dimensions.get('surface', 0))
        if surface > 0 and self.order.price_per_sqm:
            return float(surface) * float(self.order.price_per_sqm)
        return 0


class Measurement(BasePluginModel):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='measurements')
    dimensions = models.JSONField()
    image_url = models.CharField(max_length=255)
    measured_at = models.DateTimeField(auto_now_add=True)
    measured_by_id = models.UUIDField()  # Reference to main app's User
    notes = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)


class Delivery(BasePluginModel):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled')
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='deliveries')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    scheduled_time = models.DateTimeField()
    completed_time = models.DateTimeField(null=True, blank=True)
    route_data = models.JSONField(null=True, blank=True)
    driver_id = models.UUIDField()  # Reference to main app's User
    pickup_address = models.TextField()
    delivery_address = models.TextField()
    qr_code = models.CharField(max_length=255, unique=True)  # For delivery tracking
    customer_signature = models.TextField(blank=True)  # Base64 encoded signature
    delivery_notes = models.TextField(blank=True)


class Document(BasePluginModel):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    template_image = models.CharField(max_length=255)
    order_fields = models.JSONField(default=list)
    company_fields = models.JSONField(default=list)
    text_sections = models.JSONField(default=list)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = True
        app_label = 'carpet'


class Company(BasePluginModel):
    name = models.CharField(max_length=100)
    address = models.TextField()
    working_hours = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    class Meta:
        managed = True
        app_label = 'carpet'
