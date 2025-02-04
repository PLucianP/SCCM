# Smart Service Platform - Architecture Diagram

## System Architecture Overview

```mermaid
graph LR
    subgraph "Platform Core"
        PM[Plugin Manager] --> |Manages| PS[Plugin System]
        PS --> |Validates| SV[Security Validator]
        PS --> |Controls| VH[Version Handler]
        PM --> |Routes| AG[API Gateway]
        AG --> |Authenticates| Auth[Authentication]
        Auth --> |Enforces| ABAC[Attribute-Based Access Control]
        PM --> |Isolates| DM[Database Manager]
    end

    subgraph "Service Plugins"
        CW[Carpet Washing Service]
        WP[Wedding Planning Service]
        MB[Mobile Bar Service]
        FS[Future Services...]
    end

    subgraph "Plugin Components"
        direction TB
        API[REST API] --> Models
        Models --> DB[(Isolated Database)]
        API --> UI[User Interface]
        UI --> |Uses| Assets[Static Assets]
        UI --> |Renders| Templates[Templates]
    end

    subgraph "Business Owner Access"
        BO[Business Owner] --> |Accesses| PS
        PS --> |Grants Access| CW
        PS --> |Grants Access| WP
        PS --> |Grants Access| MB
    end

    subgraph "Platform Owner Control"
        PO[Platform Owner] --> |Manages| PM
        PO --> |Reviews| BR[Business Registration]
        BR --> |Verifies| BA[Business Access]
        BA --> |Controls| PS
    end

    subgraph "Database Isolation"
        DM --> |Manages| MDB[(Main Database)]
        DM --> |Isolates| CDB[(Carpet Service DB)]
        DM --> |Isolates| WDB[(Wedding Service DB)]
        DM --> |Isolates| BDB[(Bar Service DB)]
    end

    subgraph "Security Layer"
        SV --> |Enforces| SEC[Security Measures]
        SEC --> |Implements| CSRF[CSRF Protection]
        SEC --> |Manages| ST[Session Tokens]
        SEC --> |Controls| RL[Rate Limiting]
        SEC --> |Validates| IN[Input Validation]
    end

    subgraph "Plugin Lifecycle"
        VH --> |Controls| IN[Installation]
        VH --> |Manages| UP[Updates]
        VH --> |Handles| UN[Uninstallation]
        VH --> |Tracks| VER[Versions]
    end

    %% Connections
    CW --> API
    WP --> API
    MB --> API
```

## Component Details

### Platform Core
- **Plugin Manager**: Central system for plugin lifecycle management
- **Security Validator**: Ensures plugin security compliance
- **Version Handler**: Manages plugin versions and updates
- **API Gateway**: Routes requests to appropriate plugins
- **Authentication**: Handles user authentication and authorization
- **Database Manager**: Manages database isolation and connections

### Service Plugins
Each plugin operates independently with:
- Isolated database
- Dedicated API endpoints
- Custom business logic
- Specific UI components
- Service-specific features

### Access Control
1. **Platform Owner**
   - Full system access
   - Plugin management
   - Business verification
   - Security monitoring

2. **Business Owner**
   - Service-specific access
   - Limited to verified services
   - Employee management
   - Business operations

3. **Employees**
   - Task-specific access
   - Limited functionality
   - Managed by business owner

### Security Implementation
```mermaid
flowchart LR
    subgraph "Security Layers"
        direction TB
        L1[Authentication] --> L2[Authorization]
        L2 --> L3[Data Isolation]
        L3 --> L4[API Security]
    end

    subgraph "Per Plugin"
        direction TB
        S1[Input Validation] --> S2[Access Control]
        S2 --> S3[Data Encryption]
        S3 --> S4[Audit Logging]
    end
```

### Database Architecture
```mermaid
flowchart TB
    subgraph "Main Platform DB"
        Users
        Permissions
        PluginRegistry
    end

    subgraph "Plugin DBs"
        CarpetDB[Carpet Service DB]
        WeddingDB[Wedding Service DB]
        BarDB[Bar Service DB]
    end

    Users --> |References| CarpetDB
    Users --> |References| WeddingDB
    Users --> |References| BarDB
```

## Communication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant AG as API Gateway
    participant PM as Plugin Manager
    participant P as Plugin
    participant DB as Database

    C->>AG: Request
    AG->>PM: Validate Request
    PM->>P: Route to Plugin
    P->>DB: Database Operation
    DB-->>P: Response
    P-->>AG: Plugin Response
    AG-->>C: Final Response
```

## Plugin Installation Flow

```mermaid
stateDiagram-v2
    [*] --> Submitted
    Submitted --> Validating
    Validating --> SecurityCheck
    SecurityCheck --> DatabaseSetup
    DatabaseSetup --> PermissionSetup
    PermissionSetup --> Active
    Active --> [*]

    SecurityCheck --> Failed
    Failed --> [*]
```

This architecture ensures:
- Secure multi-tenancy
- Plugin isolation
- Scalability
- Maintainability
- Business separation
- Data protection 