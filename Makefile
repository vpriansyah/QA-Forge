# ═══════════════════════════════════════════════════════════
# QA Forge — Makefile (Common Commands)
# ═══════════════════════════════════════════════════════════

.PHONY: dev dev-build dev-debug stop build up down logs clean \
        db-migrate db-seed db-studio db-reset \
        test test-backend test-frontend test-e2e \
        setup help

# ─── HELP ─────────────────────────────────────────────────
help: ## Show this help message
	@echo.
	@echo   QA Forge - Available Commands
	@echo   ═══════════════════════════════
	@echo.
	@echo   Development:
	@echo     make dev          - Start dev environment (all services)
	@echo     make dev-build    - Rebuild and start dev environment
	@echo     make dev-debug    - Start with pgAdmin + BullBoard
	@echo     make stop         - Stop all services
	@echo.
	@echo   Database:
	@echo     make db-migrate   - Run Prisma migrations
	@echo     make db-seed      - Seed database
	@echo     make db-studio    - Open Prisma Studio
	@echo     make db-reset     - Reset database (WARNING: destroys data)
	@echo.
	@echo   Testing:
	@echo     make test         - Run all tests
	@echo     make test-backend - Run backend tests only
	@echo     make test-e2e     - Run E2E tests (Playwright)
	@echo.
	@echo   Production:
	@echo     make build        - Build production images
	@echo     make up           - Start production services
	@echo     make down         - Stop production services
	@echo.
	@echo   Maintenance:
	@echo     make logs         - Tail all service logs
	@echo     make clean        - Remove all containers, volumes, images
	@echo     make setup        - First-time project setup
	@echo.

# ─── DEVELOPMENT ──────────────────────────────────────────
dev: ## Start development environment
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-build: ## Rebuild and start dev environment
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-debug: ## Start dev with debug tools (pgAdmin, BullBoard)
	docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile debug up --build

stop: ## Stop all services
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# ─── DATABASE ─────────────────────────────────────────────
db-migrate: ## Run Prisma migrations
	docker compose exec backend npx prisma migrate dev

db-seed: ## Seed database with sample data
	docker compose exec backend npx prisma db seed

db-studio: ## Open Prisma Studio (port 5555)
	docker compose exec backend npx prisma studio

db-reset: ## Reset database (WARNING: data loss!)
	docker compose exec backend npx prisma migrate reset --force

# ─── TESTING ──────────────────────────────────────────────
test: ## Run all tests
	docker compose exec backend npm test
	cd frontend && npm test

test-backend: ## Run backend tests only
	docker compose exec backend npm test

test-frontend: ## Run frontend tests
	cd frontend && npm test

test-e2e: ## Run E2E tests with Playwright
	cd frontend && npx playwright test

# ─── PRODUCTION ───────────────────────────────────────────
build: ## Build production Docker images
	docker compose build

up: ## Start production services
	docker compose up -d

down: ## Stop production services
	docker compose down

# ─── LOGS & MONITORING ───────────────────────────────────
logs: ## Tail all service logs
	docker compose logs -f

logs-backend: ## Tail backend logs only
	docker compose logs -f backend

logs-frontend: ## Tail frontend logs only
	docker compose logs -f frontend

# ─── MAINTENANCE ──────────────────────────────────────────
clean: ## Remove all containers, volumes, and networks
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans
	docker image prune -f

setup: ## First-time project setup
	@echo Setting up QA Forge...
	@if not exist .env copy .env.example .env
	cd backend && npm install
	cd frontend && npm install
	cd shared && npm install
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis minio minio-init
	@echo Waiting for services to start...
	timeout /t 10 /nobreak
	cd backend && npx prisma generate
	cd backend && npx prisma migrate dev
	@echo.
	@echo ✅ Setup complete! Run 'make dev' to start developing.
