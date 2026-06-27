# 🛠️ QA Forge — AI-Powered Quality Assurance Platform

QA Forge is a multi-agent AI quality assurance platform built to automatically generate testing artifacts—including comprehensive test cases, robust automation scripts, bug reports, and target documentation—from simple, raw inputs. It utilizes an orchestration of **Gemini AI Agents** operating sequentially, allowing QA teams to automate testing workflows without requiring direct codebase access.

---

## 📐 System Architecture

QA Forge orchestrates 7 sequential AI agents, each specializing in a single stage of the QA lifecycle:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User Input Interface                          │
│     (HAR Files, Feature Specs, screenshots, API Docs, Jira Tickets)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        7-Agent Sequential Pipeline                     │
│                                                                        │
│  1. Input Sanitizer  ──▶  2. Orchestrator  ──▶  3. Test Case Writer    │
│           ▲                                            │               │
│           │                                            ▼               │
│  7. Report Compiler  ◀──  6. Bug Analyst   ◀──  4. Test Reviewer       │
│           ▲                                            │               │
│           └───────────  5. Scripter Agent(s) ◀─────────┘               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Generated QA Artifacts                         │
│   (Playwright, Cypress, Appium, Locust, Postman, Bug Reports, etc.)    │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Input Sanitizer**: Cleanses, standardizes, and parses the raw input (e.g. sanitizing secrets from HAR uploads or extracting structured text from images).
2. **Orchestrator**: Plans the analysis, determines required scripts, and routes contexts to downstream agents.
3. **Test Case Writer**: Formulates structured, step-by-step test cases covering functional, edge, and negative scenarios.
4. **Test Reviewer**: Critically assesses the generated test cases for QA standards, logical soundness, and edge-case coverage.
5. **Scripter Agent(s)**: Generates execution-ready test automation scripts (Playwright, Cypress, Postman, etc.).
6. **Bug Analyst**: Predicts potential regression areas and summarizes bugs found during runtime or log parsing.
7. **Report Compiler**: Consolidates all reviews, test runs, scripts, and logs into standard QA reports.

---

## 🛠️ Tech Stack & Services

| Layer | Technologies & Tools | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Next.js 14 (App Router), Zustand, TanStack Query | Responsive UI & real-time monitoring |
| **Backend** | Node.js, Express.js, TypeScript, BullMQ | REST API & asynchronous job queuing |
| **Database** | PostgreSQL 16, Prisma ORM | Relational data persistence |
| **Cache & Queue**| Redis 7 | Job queuing backend for BullMQ & cache layer |
| **Object Store** | MinIO (S3-Compatible Object Storage) | File storage for logs, HAR files, and reports |
| **AI Processing**| Gemini AI (Gemma 4 / Gemini API) | Multi-agent execution and generation |
| **Containerization**| Docker, Docker Compose | Consistent development & deployment environment |

---

## 📁 Project Directory Structure

```
qa-forge/
├── backend/                  # Node.js + Express.js API Gateway & AI Pipeline
│   ├── src/                  # TypeScript source files
│   │   ├── api/              # Controllers, middlewares, routes, and validation
│   │   ├── services/         # AI pipeline orchestration & external integrations
│   │   └── server.ts         # Backend application entrypoint
│   ├── prisma/               # Database schemas & migrations
│   └── package.json          # Backend dependencies & script definitions
├── frontend/                 # Next.js 14 Web Application
│   ├── src/                  # Next.js pages, layouts, and components
│   │   └── app/              # App router modules & page flows
│   └── package.json          # Frontend dependencies & script definitions
├── shared/                   # Shared TypeScript models, contracts, and constants
├── docker/                   # Docker configurations (PostgreSQL, Redis, MinIO)
├── Makefile                  # Developer tooling commands (convenience wrappers)
├── docker-compose.yml        # Multi-container orchestration (Production)
└── docker-compose.dev.yml    # Development overrides (hot reloading & debug tools)
```

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js v20+](https://nodejs.org/) (for local/IDE autocompletion and scripting)
- **Gemini API Key** (Set as `GEMINI_API_KEY` in environment variables)

---

### 1. Installation and Environment Setup

Clone the repository and copy the environment template:
```bash
cp .env.example .env
```
Open `.env` and configure your API keys and credentials:
```env
# Gemini API Key Setup
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemma-4-26b-a4b-it
```

---

### 2. Automatic Setup (Using Makefile)

On environments with `make` (Unix, WSL, or Windows Git Bash), run:
```bash
make setup
```
This commands automatically installs dependencies across `backend`, `frontend`, and `shared`, spins up local Docker dependencies (Postgres, Redis, MinIO), runs migrations, and initializes the database.

---

### 3. Spin Up Development Services

Launch all developer containers (Express API, Next.js frontend, Postgres, Redis, MinIO) with hot-reloading:
```bash
# Using Makefile
make dev

# Or directly using Docker Compose
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Once running:
- **Frontend App**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:4000/api/v1`
- **Prisma Studio (DB Explorer)**: `http://localhost:5555` (Run `make db-studio`)
- **MinIO Dashboard (S3 Storage)**: `http://localhost:9001` (Credentials: `qaforge`/`qaforge_secret`)

---

### 4. Running Tests
```bash
# Run all frontend and backend tests
make test

# Run backend unit/integration tests only
make test-backend

# Run Playwright End-to-End tests
make test-e2e
```

---

## 🔑 Default Credentials

Use the following credentials to access pre-seeded accounts during development:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@qaforge.local` | `admin123` |
| **QA Engineer** | `qa@qaforge.local` | `qa123` |

---

## 📄 License
Proprietary — Internal Use Only.
