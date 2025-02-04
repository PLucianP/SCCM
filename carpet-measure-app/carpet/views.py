from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods
from django.conf import settings
from .utils import generate_qr_code
import json
import qrcode
from io import BytesIO
import base64
import os
from datetime import datetime
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Workspace, Client, Order, Item, Measurement, Delivery, Document, Company
from .serializers import (
    WorkspaceSerializer, ClientSerializer, OrderSerializer,
    ItemSerializer, MeasurementSerializer, DeliverySerializer, 
    DocumentSerializer, CompanySerializer
)
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views import View
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import update_session_auth_hash
from rest_framework.exceptions import ValidationError


def home(request):
    """
    View for the home page
    """
    return render(request, 'home.html')


def create_qr(request):
    """
    View for creating QR codes
    """
    if request.method == 'POST':
        content = request.POST.get('qr_content')
        size = request.POST.get('qr_size', 'medium')

        # Define QR code size based on selection
        size_map = {
            'small': 5,
            'medium': 8,
            'large': 10
        }
        box_size = size_map.get(size, 8)

        try:
            # Create QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=box_size,
                border=4,
            )
            qr.add_data(content)
            qr.make(fit=True)

            # Create QR code image
            img = qr.make_image(fill_color="black", back_color="white")

            # Create media/qrcodes directory if it doesn't exist
            qr_dir = os.path.join(settings.MEDIA_ROOT, 'qrcodes')
            os.makedirs(qr_dir, exist_ok=True)

            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'qr_code_{timestamp}.png'
            filepath = os.path.join(qr_dir, filename)

            # Save the image to media/qrcodes
            img.save(filepath)

            # Also create base64 for immediate display
            img_buffer = BytesIO()
            img.save(img_buffer, format='PNG')
            img_str = base64.b64encode(img_buffer.getvalue()).decode()

            return render(request, 'create_qr.html', {
                'qr_code': f'data:image/png;base64,{img_str}',
                'success': True,
                'saved_path': os.path.join('qrcodes', filename)
            })

        except Exception as e:
            return render(request, 'create_qr.html', {
                'error': str(e),
                'success': False
            })

    return render(request, 'create_qr.html')


@require_http_methods(["GET", "POST"])
def test_qr(request):
    """
    View for testing QR codes with YHD-3200DB device
    """
    if request.method == 'GET':
        # Get list of existing QR codes
        qr_dir = os.path.join(settings.MEDIA_ROOT, 'qrcodes')
        qr_codes = []

        if os.path.exists(qr_dir):
            for filename in os.listdir(qr_dir):
                if filename.endswith('.png'):
                    qr_codes.append({
                        'name': filename,
                        'url': os.path.join(settings.MEDIA_URL, 'qrcodes', filename),
                        'date': datetime.fromtimestamp(
                            os.path.getctime(os.path.join(qr_dir, filename))
                        ).strftime('%Y-%m-%d %H:%M:%S')
                    })

        # Sort QR codes by date, newest first
        qr_codes.sort(key=lambda x: x['date'], reverse=True)

        return render(request, 'test_qr.html', {'qr_codes': qr_codes})

    # For POST requests, use the existing logic
    workspaces = load_mock_data('workspaces.json')['workspaces']
    default_workspace = workspaces[0]['name'] if workspaces else "HQ"

    sample_data = {
        "workspace": default_workspace,
        "client": {
            "name": "Test Client",
            "phone": "123-456-7890",
            "address": "Test Address"
        },
        "products": [
            {
                "type": "carpet",
                "dimensions": {
                    "width": 200,
                    "height": 300,
                    "surface": 6.0
                },
                "price": 1200
            }
        ]
    }

    try:
        qr_path = generate_qr_code(sample_data)
        return JsonResponse({
            'success': True,
            'qr_path': qr_path
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


def load_mock_data(file_name):
    """Load mock data from JSON file"""
    file_path = os.path.join(os.path.dirname(__file__), 'data/mock', file_name)
    with open(file_path, 'r') as f:
        return json.load(f)


@login_required
def dashboard(request):
    """Dashboard view showing key metrics"""
    # Get orders from the database
    orders = Order.objects.all().order_by('-created_at')
    active_statuses = ['NEW', 'WIP']

    # Get clients from the database
    clients = Client.objects.all()

    # Get workspaces from the database
    workspaces = Workspace.objects.filter(is_active=True)

    context = {
        'total_orders': orders.count(),
        'new_orders': orders.filter(status='NEW').count(),
        'active_orders': orders.filter(status__in=active_statuses).count(),
        'total_clients': clients.count(),
        'recent_orders': orders[:6],  # Show 6 most recent orders
        'workspaces': workspaces
    }
    return render(request, 'carpet/dashboard.html', context)


@login_required
def orders(request):
    """Orders list view"""
    orders = Order.objects.select_related('client', 'workspace').prefetch_related('items').all()
    context = {
        'orders': orders,
        'alternate_sidebar': True,
        'show_back_button': True
    }
    return render(request, 'carpet/dashboard.html', context)  # Redirect to dashboard instead of a separate orders page


@login_required
def order_detail(request, order_id):
    """Order detail view"""
    try:
        order = Order.objects.select_related('client', 'workspace').prefetch_related('items').get(id=order_id)
        context = {
            'order': order,
        }
        return render(request, 'carpet/order_detail.html', context)
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found'}, status=404)


def measure(request):
    """Measurement interface"""
    measurements = load_mock_data('measurements.json')['measurements']
    context = {
        'measurements': measurements,
        'camera_enabled': True
    }
    return render(request, 'carpet/measure.html', context)


@method_decorator(login_required, name='dispatch')
class ProfileView(View):
    template_name = 'carpet/profile.html'

    def get(self, request):
        return render(request, self.template_name)

    def post(self, request):
        user = request.user
        user.first_name = request.POST.get('first_name', '')
        user.last_name = request.POST.get('last_name', '')
        user.email = request.POST.get('email', '')
        user.save()
        messages.success(request, 'Profile updated successfully')
        return redirect('service-carpet-washing:profile')


@method_decorator(login_required, name='dispatch')
class SecurityView(View):
    template_name = 'carpet/security.html'

    def get(self, request):
        return render(request, self.template_name)

    def post(self, request):
        user = request.user
        current_password = request.POST.get('current_password')
        new_password1 = request.POST.get('new_password1')
        new_password2 = request.POST.get('new_password2')

        if not user.check_password(current_password):
            messages.error(request, 'Current password is incorrect')
            return render(request, self.template_name)

        if new_password1 != new_password2:
            messages.error(request, 'New passwords do not match')
            return render(request, self.template_name)

        try:
            validate_password(new_password1, user)
        except ValidationError as e:
            messages.error(request, '\n'.join(e.messages))
            return render(request, self.template_name)

        user.set_password(new_password1)
        user.save()
        update_session_auth_hash(request, user)  # Keep user logged in
        messages.success(request, 'Password changed successfully')
        return redirect('service-carpet-washing:security')


def workspaces(request):
    """Workspaces management interface"""
    return render(request, 'carpet/workspaces.html', {
        'alternate_sidebar': True,
        'show_back_button': True
    })


def documents(request):
    """Documents management interface"""
    context = {
        'alternate_sidebar': True,
        'show_back_button': True,
        'workspace_id': request.user.workspace.id if request.user.workspace else None
    }
    return render(request, 'carpet/documents.html', context)


@api_view(['POST'])
def upload_file(request):
    """Handle file uploads for document templates"""
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=400)
    
    file = request.FILES['file']
    if not file.content_type.startswith('image/'):
        return Response({'error': 'File must be an image'}, status=400)
    
    # Create upload directory if it doesn't exist
    upload_dir = os.path.join(settings.MEDIA_ROOT, 'documents')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.name}"
    filepath = os.path.join(upload_dir, filename)
    
    # Save the file
    with open(filepath, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)
    
    # Return the URL
    url = f"{settings.MEDIA_URL}documents/{filename}"
    return Response({'url': url})


class WorkspaceViewSet(viewsets.ModelViewSet):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(owner_id=self.request.user.id)

    def perform_create(self, serializer):
        # Create the workspace
        workspace = serializer.save(
            owner_id=str(self.request.user.id),
            created_by_id=str(self.request.user.id),
            updated_by_id=str(self.request.user.id)
        )
        
        # If this is the user's first workspace, set it as their active workspace
        if not self.request.user.workspace:
            from django.db import connections
            with connections['default'].cursor() as cursor:
                cursor.execute(
                    "UPDATE auth_user SET workspace_id = %s WHERE id = %s",
                    [workspace.id, self.request.user.id]
                )
            self.request.user.workspace = workspace

    @action(detail=True, methods=['post'])
    def set_active(self, request, pk=None):
        """Set a workspace as the active one for the current user"""
        workspace = self.get_object()
        
        # Update user's active workspace in the main app
        from django.db import connections
        with connections['default'].cursor() as cursor:
            cursor.execute(
                "UPDATE auth_user SET workspace_id = %s WHERE id = %s",
                [workspace.id, request.user.id]
            )
        
        # Update the user instance
        request.user.workspace = workspace
        
        return Response({'status': 'workspace set as active'})


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace')
        queryset = self.queryset
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        return queryset

    def perform_create(self, serializer):
        # Set created_by_id and updated_by_id to the current user's ID
        serializer.save(
            created_by_id=str(self.request.user.id),
            updated_by_id=str(self.request.user.id)
        )


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace')
        status_filter = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')

        queryset = self.queryset
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority:
            queryset = queryset.filter(priority=priority)

        return queryset.select_related('client').prefetch_related('items', 'deliveries')

    def perform_create(self, serializer):
        # Set created_by_id and updated_by_id to the current user's ID
        serializer.save(
            created_by_id=str(self.request.user.id),
            updated_by_id=str(self.request.user.id)
        )

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        order = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.assigned_to_id = user_id
        order.save()
        return Response(self.get_serializer(order).data)


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        order_id = self.request.query_params.get('order')
        status_filter = self.request.query_params.get('status')

        queryset = self.queryset
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.prefetch_related('measurements')

    def perform_create(self, serializer):
        # Set created_by_id and updated_by_id to the current user's ID
        serializer.save(
            created_by_id=str(self.request.user.id),
            updated_by_id=str(self.request.user.id)
        )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        item = self.get_object()
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.status = new_status
        item.save()
        return Response(self.get_serializer(item).data)


class MeasurementViewSet(viewsets.ModelViewSet):
    queryset = Measurement.objects.all()
    serializer_class = MeasurementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        item_id = self.request.query_params.get('item')
        if item_id:
            return self.queryset.filter(item_id=item_id)
        return self.queryset

    def perform_create(self, serializer):
        serializer.save(measured_by_id=self.request.user.id)


class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        order_id = self.request.query_params.get('order')
        status_filter = self.request.query_params.get('status')
        driver_id = self.request.query_params.get('driver')

        queryset = self.queryset
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if driver_id:
            queryset = queryset.filter(driver_id=driver_id)

        return queryset

    @action(detail=True, methods=['post'])
    def complete_delivery(self, request, pk=None):
        delivery = self.get_object()
        signature = request.data.get('signature')
        notes = request.data.get('notes', '')

        delivery.status = 'COMPLETED'
        delivery.customer_signature = signature
        delivery.delivery_notes = notes
        delivery.save()

        # Update order status
        order = delivery.order
        order.status = 'DELIVERED'
        order.save()

        return Response(self.get_serializer(delivery).data)


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(workspace=self.request.user.workspace)

    def perform_create(self, serializer):
        user = self.request.user
        if not user.workspace:
            raise ValidationError("Please select an active workspace before creating a document.")

        serializer.save(
            workspace=user.workspace,
            created_by_id=str(user.id),
            updated_by_id=str(user.id)
        )

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate a document from a template for a specific order"""
        document = self.get_object()
        order_id = request.data.get('order_id')
        
        if not order_id:
            return Response(
                {'error': 'order_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            order = Order.objects.get(id=order_id)
            company = Company.objects.filter(is_active=True).first()
            
            # Prepare the document data
            document_data = {
                'name': document.name,
                'type': document.type,
                'template_image': document.template_image,
                'text_sections': document.text_sections,
                'fields': {}
            }
            
            # Get order fields
            for field in document.order_fields:
                if '.' in field:
                    # Handle nested fields (e.g., client.name)
                    main_field, sub_field = field.split('.')
                    if main_field == 'client' and hasattr(order.client, sub_field):
                        document_data['fields'][field] = getattr(order.client, sub_field)
                    elif main_field == 'items':
                        # Handle item fields - collect all items' data
                        document_data['fields'][field] = [
                            getattr(item, sub_field) for item in order.items.all()
                            if hasattr(item, sub_field)
                        ]
                else:
                    # Handle direct order fields
                    if hasattr(order, field):
                        document_data['fields'][field] = getattr(order, field)
            
            # Get company fields if a company exists
            if company:
                for field in document.company_fields:
                    if hasattr(company, field):
                        document_data['fields'][f'company_{field}'] = getattr(company, field)
            
            return Response(document_data)
            
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset


@method_decorator(login_required, name='dispatch')
class CompanyView(View):
    template_name = 'carpet/company.html'

    def get(self, request):
        companies = Company.objects.all()
        return render(request, self.template_name, {
            'companies': companies
        })

    def post(self, request):
        company_id = request.POST.get('id')
        
        company_data = {
            'name': request.POST.get('name'),
            'address': request.POST.get('address'),
            'working_hours': request.POST.get('working_hours'),
            'phone': request.POST.get('phone'),
            'is_active': True
        }

        if company_id:
            company = Company.objects.get(id=company_id)
            for key, value in company_data.items():
                setattr(company, key, value)
            company.updated_by_id = request.user.id
            company.save()
            messages.success(request, 'Company updated successfully')
        else:
            company_data['created_by_id'] = request.user.id
            company_data['updated_by_id'] = request.user.id
            Company.objects.create(**company_data)
            messages.success(request, 'Company created successfully')

        return redirect('service-carpet-washing:company')
