# AEGIS AI — Free Deployment Readiness

This directory documents how AEGIS AI could be prepared for a future cloud
deployment.

## Important

This repository does not:

- Create AWS resources
- Connect to an AWS account
- Require a credit card
- Deploy to any paid cloud service
- Generate cloud charges
- Store AWS credentials

All current development, testing, Docker builds, security scanning, and CI/CD
verification remain local or use free GitHub Actions resources.

## Current Free Environment

AEGIS AI currently uses:

- Local Docker Desktop
- Local PostgreSQL with pgvector
- Local Ollama models
- Local backend and frontend containers
- GitHub repository
- GitHub Actions CI workflows
- Free dependency and container-security scanners

## Deployment-Ready Components

The project includes:

- FastAPI backend Dockerfile
- React frontend Dockerfile
- Docker Compose configuration
- PostgreSQL container configuration
- Persistent database storage
- Environment-variable protection
- Non-root containers
- Backend and frontend health checks
- Alembic database migrations
- Backup and restore verification
- Backend automated tests
- Frontend automated tests
- Dependency security auditing
- Container vulnerability scanning
- GitHub Actions pipelines

## Possible Future Infrastructure

A company could later deploy AEGIS AI using:

- Container hosting for the FastAPI backend
- Static or container hosting for the React frontend
- PostgreSQL with pgvector
- Private object storage
- Secure secret management
- HTTPS load balancing
- Monitoring and centralized logging

None of these services are created by this repository.

## Required Environment Variables

### Application

- `APP_NAME`
- `APP_DESCRIPTION`
- `APP_VERSION`
- `ENVIRONMENT`
- `API_V1_PREFIX`
- `FRONTEND_ORIGINS`

### Database

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_ECHO`

### Authentication

- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`
- `JWT_REFRESH_TOKEN_EXPIRE_DAYS`
- `JWT_ISSUER`
- `JWT_AUDIENCE`

### AI Providers

- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `OLLAMA_BASE_URL`

Only variables required by the selected AI provider should be configured.

## Secret Protection

Production secrets must never be committed to Git.

The following files remain local and ignored:

- `.env`
- `.env.docker`
- `aegis-ai-backend/.env`
- `aegis-ai-frontend/.env`

Passwords, API keys, private keys, access tokens, and cloud credentials must
not be stored in source code, Docker images, workflow files, or public example
files.

## Database Migration

A future deployment would apply database migrations using:

`python -m alembic upgrade head`

A verified backup should be created before applying production migrations.

## Health Verification

Backend health endpoint:

`GET /health`

Frontend health endpoint:

`GET /health`

Both endpoints should pass before a future release is considered successful.

## Current Status

AEGIS AI is deployment-ready from an architecture, containerization, testing,
security, and CI/CD perspective.

No live cloud infrastructure has been created, and this documentation does not
perform any deployment or create any cost.
