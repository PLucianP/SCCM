Name of the team: WizTech

Name of the project: SCCM (Smart Camera Carpet Measurements)

Members:

- Paul Lucian Pinzariu

# Smart Carpet Washing Service

The Smart Carpet Washing Service (SCW) is a comprehensive platform designed to streamline carpet washing operations. It features a modular architecture with a plugin-based system that allows for easy integration of additional services.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Installation](#installation)
3. [Usage](#usage)
4. [BlueSky Presentation](BlueSky)

## Architecture Overview
For detailed architecture documentation, see:
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)

## Installation
To install the Carpet Measurement App:
```bash
cd carpet-measure-app
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Usage

### Development Server
```bash
python manage.py runserver
```

### Admin Interface
1. Create a superuser:
```bash
python manage.py createsuperuser
```
2. Access the admin panel at: `http://localhost:8000/admin`

### Measurement Tool
1. Access the measurement interface at: `http://localhost:8000/measure`
2. Use the camera to capture carpet dimensions
3. View real-time measurements and generate QR codes

### Order Management
1. Create new orders through the dashboard
2. Track order status and priority
3. Generate delivery documents

### QR Code Generation
1. Scan QR codes to view product details
2. Generate new QR codes for items
3. Print QR codes for product labeling


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