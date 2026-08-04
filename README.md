# AEGIS AI

## Enterprise Industrial AI Operations Platform

AEGIS AI is a full-stack enterprise application designed for factories, warehouses, robotics companies, industrial facilities, and maintenance teams.

It combines industrial asset monitoring, real-time telemetry, historical analytics, predictive maintenance, maintenance work orders, secure authentication, and AI-oriented operational workflows in one platform.

---

## Product Vision

Industrial companies often depend on disconnected systems for:

- Machine monitoring
- Robot monitoring
- Maintenance management
- Safety inspections
- Operational analytics
- Technical documentation
- Alerts and reporting

AEGIS AI demonstrates how these capabilities can be integrated into one modern enterprise platform.

---

## Current Features

### Authentication and Security

- Secure user authentication
- Argon2 password hashing
- JWT access tokens
- Rotating refresh-token sessions
- HttpOnly refresh cookie
- Session revocation and logout
- Automatic frontend access-token refresh
- Role-based administrator access
- Audit logging
- User profile and password management

### Machine Operations

- Machine inventory
- Machine status monitoring
- Machine summary
- Machine telemetry
- Historical machine telemetry
- Temperature monitoring
- Vibration monitoring
- Power-consumption monitoring
- Machine health score

### Robot Operations

- Robot inventory
- Robot status monitoring
- Robot summary
- Robot telemetry
- Historical robot telemetry
- Battery monitoring
- Robot utilization
- Robot health score

### Live Telemetry

- FastAPI WebSocket endpoint
- Live machine updates
- Live robot updates
- Frontend connection indicator
- Automatic dashboard updates

### Industrial Analytics

- PostgreSQL-backed historical analytics
- Machine and robot selectors
- Health charts
- Temperature charts
- Vibration charts
- Power-consumption charts
- Battery and utilization charts
- Loading, error, and empty states

### Predictive Maintenance

- Rule-based predictive risk engine
- Risk levels: Low, Medium, High, Critical
- Risk score calculation
- Health trend analysis
- Temperature trend analysis
- Vibration trend analysis
- Power trend analysis
- Anomaly detection
- Recommended maintenance actions
- Facility filtering
- Machine search
- Risk comparison chart

### Maintenance Work Orders

- PostgreSQL work-order storage
- Unique work-order codes
- Work-order priority
- Work-order status lifecycle
- Assigned maintenance team
- Scheduled maintenance time
- Start and completion timestamps
- Open, Scheduled, In Progress, Completed, and Cancelled states
- Overdue calculation
- Work-order search and filters
- Summary cards
- Create work order from a predictive assessment
- Prevent duplicate active work orders
- Start Work action
- Mark Completed action
- Cancel action
- Persistent status changes after browser refresh

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Material UI
- React Router
- React Query
- Redux Toolkit
- Axios
- Recharts

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Psycopg
- Alembic
- Pydantic
- JWT authentication
- WebSockets

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Windows PowerShell
- PostgreSQL
- npm
- Python virtual environment

---

## Project Structure

```text
AEGIS-AI
├── aegis-ai-backend
│   ├── app
│   │   ├── api
│   │   ├── core
│   │   ├── db
│   │   ├── models
│   │   ├── repositories
│   │   ├── schemas
│   │   ├── scripts
│   │   └── services
│   ├── migrations
│   └── .venv
│
├── aegis-ai-frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── hooks
│   │   ├── pages
│   │   ├── services
│   │   └── store
│   └── package.json
│
├── start-aegis.ps1
└── README.md
```

---

## Run the Application

### One-Click Startup

From the main project folder:

```powershell
cd C:\Users\sasim\OneDrive\Desktop\AEGIS-AI
powershell -ExecutionPolicy Bypass -File .\start-aegis.ps1
```

This starts:

- FastAPI backend
- React frontend
- Browser

### Start Backend Manually

```powershell
cd C:\Users\sasim\OneDrive\Desktop\AEGIS-AI\aegis-ai-backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Backend URL:

```text
http://localhost:8000
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

### Start Frontend Manually

```powershell
cd C:\Users\sasim\OneDrive\Desktop\AEGIS-AI\aegis-ai-frontend
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Database Migration

Activate the backend environment:

```powershell
cd C:\Users\sasim\OneDrive\Desktop\AEGIS-AI\aegis-ai-backend
.\.venv\Scripts\Activate.ps1
```

Check the current migration:

```powershell
alembic current
```

Apply pending migrations:

```powershell
alembic upgrade head
```

---

## Seed Demo Data

Seed telemetry history:

```powershell
python -m app.scripts.seed_telemetry_history
```

Seed maintenance work orders:

```powershell
python -m app.scripts.seed_maintenance_work_orders
```

---

## Project Health Check

Run:

```powershell
cd C:\Users\sasim\OneDrive\Desktop\AEGIS-AI\aegis-ai-backend
.\.venv\Scripts\Activate.ps1
python -m app.scripts.project_health_check
```

Expected ending:

```text
PROJECT HEALTH CHECK PASSED
AEGIS AI core systems are healthy.
```

---

## Important API Endpoints

### Machines

```text
GET    /api/v1/machines
GET    /api/v1/machines/summary
GET    /api/v1/machines/{machine_id}
GET    /api/v1/machines/{machine_id}/telemetry/history
GET    /api/v1/machines/{machine_id}/telemetry/latest
POST   /api/v1/machines/{machine_id}/telemetry/readings
```

### Robots

```text
GET    /api/v1/robots
GET    /api/v1/robots/summary
GET    /api/v1/robots/{robot_id}
GET    /api/v1/robots/{robot_id}/telemetry/history
GET    /api/v1/robots/{robot_id}/telemetry/latest
POST   /api/v1/robots/{robot_id}/telemetry/readings
```

### Predictive Maintenance

```text
GET /api/v1/predictive-maintenance/assessments
GET /api/v1/predictive-maintenance/summary
```

### Maintenance Work Orders

```text
GET     /api/v1/maintenance-work-orders
GET     /api/v1/maintenance-work-orders/summary
POST    /api/v1/maintenance-work-orders
GET     /api/v1/maintenance-work-orders/{work_order_id}
PATCH   /api/v1/maintenance-work-orders/{work_order_id}
PATCH   /api/v1/maintenance-work-orders/{work_order_id}/status
DELETE  /api/v1/maintenance-work-orders/{work_order_id}
```

### Live Telemetry

```text
WebSocket /api/v1/telemetry/live
```

---

## Production Build

Run:

```powershell
cd C:\Users\sasim\OneDrive\Desktop\AEGIS-AI\aegis-ai-frontend
npm run build
```

The production files are generated inside:

```text
aegis-ai-frontend\dist
```

---

## Portfolio Demonstration Flow

A recommended interview demonstration:

1. Sign in securely.
2. Show machine and robot monitoring.
3. Demonstrate live telemetry.
4. Open historical analytics.
5. Explain predictive risk scoring.
6. Filter machines by risk and facility.
7. Create a maintenance work order from an assessment.
8. Show duplicate active-order prevention.
9. Start the work order.
10. Mark it completed.
11. Refresh the browser to prove PostgreSQL persistence.
12. Show FastAPI documentation and database architecture.

---

## Interview Explanation

AEGIS AI demonstrates the ability to build:

- Enterprise React applications
- Secure FastAPI backends
- PostgreSQL data models
- Repository and service-layer architecture
- JWT authentication
- Refresh-token security
- WebSockets
- Historical telemetry pipelines
- Industrial analytics dashboards
- Predictive maintenance logic
- Operational workflow automation
- Enterprise maintenance-management features

---

## Security Notice

Real passwords, tokens, JWT secrets, database passwords, and environment secrets must never be committed to Git or included in documentation.

Use local environment variables and secure secret-management services for production deployments.

---

## Project Status

The current prototype includes a working end-to-end flow from industrial telemetry to predictive assessment and maintenance work-order completion.

The application is designed as a portfolio-ready enterprise AI and industrial operations demonstration.
