from rest_framework import serializers
from .models import Workspace, Client, Order, Item, Measurement, Delivery, Document, Company


class WorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ['id', 'name', 'description', 'color', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by_id'] = self.context['request'].user.id
        validated_data['updated_by_id'] = self.context['request'].user.id
        validated_data['owner_id'] = self.context['request'].user.id
        return super().create(validated_data)


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'workspace', 'name', 'phone', 'address', 'email', 'preferences']


class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ['id', 'item', 'dimensions', 'image_url', 'measured_at', 'measured_by_id', 'notes', 'is_verified']


class ItemSerializer(serializers.ModelSerializer):
    measurements = MeasurementSerializer(many=True, read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'order', 'material_type', 'status', 'dimensions',
            'price', 'special_instructions', 'qr_code',
            'estimated_completion', 'measurements'
        ]


class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = [
            'id', 'order', 'status', 'scheduled_time', 'completed_time',
            'route_data', 'driver_id', 'pickup_address', 'delivery_address',
            'qr_code', 'customer_signature', 'delivery_notes'
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = ItemSerializer(many=True, read_only=True)
    client_details = ClientSerializer(source='client', read_only=True)
    deliveries = DeliverySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'workspace', 'client', 'client_details', 'status',
            'priority', 'price_per_sqm', 'total_price', 'notes', 'assigned_to_id',
            'qr_code', 'estimated_completion', 'actual_completion',
            'items', 'deliveries', 'created_at', 'updated_at'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['total_products'] = instance.items.count()
        data['measured_products'] = instance.items.exclude(dimensions__isnull=True).count()
        return data


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'name', 'type', 'template_image', 'order_fields', 'company_fields', 'text_sections', 'workspace', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'workspace': {'write_only': True, 'required': False}
        }

    def create(self, validated_data):
        validated_data['created_by_id'] = self.context['request'].user.id
        validated_data['updated_by_id'] = self.context['request'].user.id
        return super().create(validated_data)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'address', 'working_hours', 'phone', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by_id'] = self.context['request'].user.id
        validated_data['updated_by_id'] = self.context['request'].user.id
        return super().create(validated_data)
