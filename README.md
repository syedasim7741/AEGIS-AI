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

---

## Advanced AI Capabilities

### Retrieval-Augmented Generation

The RAG module allows users to upload and search industrial documents such as:

- Equipment manuals
- Safety procedures
- Maintenance instructions
- Inspection reports
- Operational documentation

The RAG architecture includes:

- Document loading
- Text chunking
- Embedding generation
- PostgreSQL vector storage
- Semantic search
- Context retrieval
- AI-generated answers
- Source-aware responses

The implementation supports local AI providers so the portfolio can operate
without requiring a paid API.

### Agentic AI

The Agentic AI module demonstrates multi-step operational reasoning.

It includes:

- Planner service
- Tool registry
- Tool executor
- Agent runner
- Response-generation service
- Document-search tools
- Operations-monitoring tools
- Maintenance work-order tools
- Structured execution results

The agent can select approved tools, gather operational information, execute a
controlled workflow, and produce a final response.

### Computer Vision

The Computer Vision module supports industrial image inspection.

Its architecture includes:

- Image upload and validation
- Secure image storage
- Inspection schemas
- Ollama vision-model integration
- Inspection-result persistence
- Severity and confidence reporting
- API endpoints for inspection workflows

Potential use cases include:

- Personal protective equipment detection
- Equipment-condition inspection
- Safety-hazard identification
- Manufacturing defect analysis
- Workplace-compliance review

### Local Model Customization

AEGIS AI includes a model-customization workflow based on Ollama Modelfiles and
industrial evaluation datasets.

The project contains:

- Industrial instruction datasets
- Dataset validation
- Multiple model prompt versions
- Structured evaluation cases
- Evaluation-result processing
- Human adjudication records
- Production model release configuration

The selected customized model is published locally as:

```text
aegis-industrial-assistant:production
```

This demonstrates prompt-level model customization and evaluation. It is not
presented as full-weight training or LoRA fine-tuning.

---

## Docker and Local Production Environment

AEGIS AI includes production-style Docker configuration for:

- FastAPI backend
- React frontend
- PostgreSQL with pgvector
- Persistent database storage
- Internal Docker networking
- Environment-variable injection
- Backend and frontend health checks

Start the complete local container environment from the project root:

```powershell
docker compose --env-file .env.docker up --build
```

Default local service addresses:

```text
Frontend: http://localhost:8080
Backend:  http://localhost:8000
Health:   http://localhost:8000/health
Database host port: 5433
```

Stop the containers using:

```powershell
docker compose --env-file .env.docker down
```

The PostgreSQL volume remains persistent unless volumes are explicitly removed.

---

## Automated Testing

### Backend

Backend tests use Pytest.

Run locally:

```powershell
cd aegis-ai-backend
python -m pytest -q
```

The system tests verify:

- Root API route
- Health endpoint
- Health-route OpenAPI exclusion

### Frontend

Frontend tests use Vitest.

Run locally:

```powershell
cd aegis-ai-frontend
npm test
```

Create a production build using:

```powershell
npm run build
```

---

## Security Verification

The project includes several security controls:

- Environment and secret-file protection
- Git secret-exposure validation
- Python dependency auditing
- JavaScript dependency auditing
- Docker container vulnerability scanning
- Non-root container users
- Health checks
- Ignored local credentials
- Documented vulnerability-scan exceptions

Run the secret-protection validator from the project root:

```powershell
python scripts/security/validate_secret_protection.py
```

Run the Python dependency audit:

```powershell
cd aegis-ai-backend
python -m pip_audit --requirement requirements.txt
```

Run the JavaScript dependency audit:

```powershell
cd aegis-ai-frontend
npm audit --audit-level=high
```

The documented Trivy exception is limited to verified stale third-party SBOM
metadata. The final runtime filesystem contains patched package versions.

---

## GitHub Actions CI/CD

The repository includes three automated GitHub Actions workflows.

### Backend CI

The backend workflow:

- Installs Python dependencies
- Creates temporary CI-only secrets
- Validates secret protection
- Checks package compatibility
- Runs backend tests
- Audits Python dependencies

### Frontend CI

The frontend workflow:

- Installs dependencies using `npm ci`
- Runs frontend tests
- Creates the production build
- Audits JavaScript dependencies

### Docker Build

The Docker workflow:

- Builds the backend image
- Builds the frontend image
- Verifies the backend runtime
- Verifies the Nginx frontend runtime
- Displays the resulting image summaries

All three workflows run automatically when relevant files change.

---

## Quick Start

### Requirements

Install:

- Git
- Docker Desktop
- Node.js
- Python
- Ollama

### Clone the Repository

```powershell
git clone https://github.com/syedasim7741/AEGIS-AI.git
cd AEGIS-AI
```

### Create Local Environment Configuration

Copy the public Docker environment example:

```powershell
Copy-Item .env.docker.example .env.docker
```

Replace all placeholder values in `.env.docker` with strong local values.

Never commit `.env.docker`.

### Start AEGIS AI

```powershell
docker compose --env-file .env.docker up --build
```

Wait until PostgreSQL, the backend, and the frontend become healthy.

Open:

```text
http://localhost:8080
```

---

## Deployment Readiness

AEGIS AI is prepared for a future container-based deployment through:

- Dockerized services
- Database migrations
- Health endpoints
- Secret protection
- Automated tests
- Dependency auditing
- Container scanning
- GitHub Actions workflows
- Backup and restore verification

No live AWS infrastructure has been created.

The deployment-readiness documentation is architecture guidance only and does
not create any paid resource or cloud charge.

See:

```text
deployment/aws/README.md
```
