# SCW (Smart Carpet Washing) - Architecture Documentation

## System Overview

SCW is a modular platform built on a plugin-based architecture that allows service providers to manage their carpet washing operations efficiently. The system follows a modern, scalable architecture with clear separation of concerns.

## Core Architecture

```
measure/
├── core/
│   ├── authentication/           # User authentication and authorization
│   │   ├── models.py            # User and permission models
│   │   └── views.py             # Authentication views
│   └── plugin_manager/          # Plugin system management
├── carpet/                      # Carpet Washing Plugin
│   ├── models.py                # Data models for orders, items, etc.
│   ├── views.py                 # Business logic and API endpoints
│   ├── serializers.py           # Data serialization/deserialization
│   ├── urls.py                  # URL routing
│   └── data/                    # Plugin-specific data
├── static/                      # Static assets
│   ├── css/                     # Stylesheets
│   │   ├── dashboard.css        # Dashboard styling
│   │   ├── measure.css          # Measurement tool styling
│   │   └── order_detail.css     # Order details styling
│   └── js/                      # JavaScript modules
│       ├── dashboard.js         # Dashboard functionality
│       ├── measure.js           # Camera and measurement tools
│       └── order_detail.js      # Order management
├── templates/                   # HTML templates
│   └── carpet/                  # Plugin-specific templates
│       ├── dashboard.html       # Main dashboard view
│       ├── measure.html         # Measurement interface
│       └── order_detail.html    # Order details view
├── media/                       # User-uploaded files
└── staticfiles/                 # Collected static files for production
```

## Key Components

### 1. Plugin System
- **Core Platform**
  - Plugin registry and management
  - Version control and updates
  - Security validation
  - Database isolation

### 2. Authentication & Authorization
- Attribute-based access control
- Workspace-level permissions
- User management
- Session handling

### 3. Carpet Washing Plugin
#### Models
- `Workspace`: Business unit management
- `Client`: Customer information
- `Order`: Order processing and tracking
- `Item`: Individual products within orders
- `Measurement`: Product measurements
- `Delivery`: Delivery management
- `Document`: Document templates and generation

#### Features
- **Measurement System**
  - Camera integration
  - Real-time dimension calculation
  - QR code generation
  - Image processing

- **Order Management**
  - Status tracking
  - Priority system
  - Price calculation
  - Document generation

- **Client Management**
  - Profile management
  - Order history
  - Communication preferences

### 4. Frontend Architecture
#### Components
- **Dashboard**
  - Order overview
  - Statistics
  - Quick actions

- **Measurement Tool**
  - Camera controls
  - Dimension calculation
  - Preview functionality

- **Order Details**
  - Product management
  - Price calculation
  - Document generation

#### Technologies
- TailwindCSS for styling
- Alpine.js for reactivity
- Vanilla JavaScript for functionality

## Data Flow

```mermaid
graph TD
    A[Client Browser] --> B[Django Views]
    B --> C[REST API]
    C --> D[Serializers]
    D --> E[Models]
    E --> F[Database]
    
    B --> G[Templates]
    G --> H[Static Files]
    H --> A
```

## Security Measures

1. **Authentication**
   - CSRF protection
   - Session management
   - Token-based API auth

2. **Data Protection**
   - Per-plugin database isolation
   - Encrypted storage
   - Access control

3. **API Security**
   - Rate limiting
   - Input validation
   - Error handling

## Database Schema

### Core Tables
```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(150) UNIQUE,
    email VARCHAR(254),
    is_active BOOLEAN,
    created_at TIMESTAMP
);

-- Workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    color VARCHAR(7),
    owner_id UUID,
    created_at TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    workspace_id UUID,
    client_id UUID,
    status VARCHAR(20),
    priority VARCHAR(10),
    created_at TIMESTAMP
);

-- Items
CREATE TABLE items (
    id UUID PRIMARY KEY,
    order_id UUID,
    material_type VARCHAR(50),
    dimensions JSONB,
    price DECIMAL,
    qr_code VARCHAR(100)
);
```

## API Endpoints

### Order Management
```python
@router.get("/orders/")
async def list_orders():

@router.post("/orders/")
async def create_order():

@router.get("/orders/{id}/")
async def get_order():

@router.patch("/orders/{id}/")
async def update_order():
    
```

### Measurement
```python
@router.post("/measurements/capture/")
async def capture_measurement()

@router.get("/measurements/{id}/")
async def get_measurement()
```

## Development Workflow

1. **Local Development**
   ```bash
   python manage.py runserver
   ```

2. **Database Migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Static Files**
   ```bash
   python manage.py collectstatic
   ```

## Deployment

1. **Requirements**
   - Python 3.8+
   - PostgreSQL
   - Redis (for caching)
   - Node.js (for asset compilation)

2. **Environment Variables**
   ```
   DEBUG=False
   SECRET_KEY=your-secret-key
   DATABASE_URL=postgres://user:pass@host:5432/dbname
   ALLOWED_HOSTS=your-domain.com
   ```

3. **Production Setup**
   - Gunicorn as WSGI server
   - Nginx as reverse proxy
   - SSL/TLS certificates
   - Database backups

## Future Considerations

1. **Scalability**
   - Microservices architecture
   - Load balancing
   - Caching strategies

2. **Features**
   - Real-time notifications
   - Advanced analytics
   - Mobile app integration

3. **Integration**
   - Payment gateways
   - CRM systems
   - Accounting software 