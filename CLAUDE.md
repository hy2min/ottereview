# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OtterReview is a multi-service code review platform that integrates GitHub with AI-powered analysis and real-time collaboration tools. The system consists of three main services:

- **ottereview-fe**: React + Vite frontend with real-time chat and WebRTC capabilities
- **ottereview-be**: Spring Boot backend API with GitHub integration
- **ottereview-ai**: FastAPI Python service for AI-powered code analysis

## Development Commands

### Frontend (ottereview-fe/)
```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

#### ESLint Configuration
- Uses React hooks and React refresh plugins
- Simple import sort enforced
- Console warnings allowed for warn/error only
- Unused variables with uppercase patterns ignored

### Backend (ottereview-be/)
```bash
./gradlew bootRun                    # Run Spring Boot application
./gradlew build                      # Build the application
./gradlew test                       # Run tests
./gradlew bootJar                    # Create executable JAR
docker-compose up                    # Run with dependencies (MySQL, Redis, OpenVidu)
docker-compose up springboot-app     # Run only the Spring Boot service
```

### AI Service (ottereview-ai/)
```bash
python main.py                       # Run FastAPI server
pip install -r requirements.txt     # Install dependencies
uvicorn main:app --reload           # Run with auto-reload
```

#### Key AI Dependencies
- FastAPI for REST API endpoints
- OpenAI for GPT integration
- LangChain for AI workflow management
- ChromaDB for vector embeddings
- Redis for caching
- PyYAML for configuration management

### Full Stack Development
```bash
# From project root, run all services with Docker Compose
docker-compose -f ottereview-be/docker-compose.yml up
```

## Architecture Overview

### Service Communication
- Frontend communicates with backend via REST API and WebSocket (STOMP)
- Backend communicates with AI service via HTTP client (WebClient)
- Backend connects to GitHub via OAuth2 and GitHub App integration
- Redis is used for caching PR preparation data and session management
- MySQL stores application data with JPA/Hibernate

### Key Integration Points

**GitHub Integration:**
- OAuth2 authentication for users
- GitHub App for repository access and webhooks
- Webhook handlers for PR events, reviews, and branch protection
- JGit library for Git operations

**AI Service Integration:**
- PR title/summary generation
- Review tone conversion ("cushion" feature)
- Convention checking with configurable rules
- Reviewer recommendations using RAG (Retrieval-Augmented Generation)
- Priority recommendations based on historical data

**Real-time Features:**
- WebSocket chat with STOMP protocol
- WebRTC video conferencing with OpenVidu
- Live collaborative whiteboard using tldraw
- Real-time conflict resolution interface

### Data Flow for PR Review Process

1. **PR Preparation**: Backend fetches GitHub PR data, processes diffs, and stores in Redis
2. **AI Analysis**: AI service reads from Redis, performs analysis, and returns recommendations
3. **Real-time Collaboration**: WebSocket connections enable live chat during review sessions
4. **Review Submission**: Reviews are submitted to both database and GitHub via API

### Frontend Architecture

**State Management:**
- Zustand for global state (auth, UI, chat, conflicts)
- Feature-specific stores in `/features/*/stores/`

**Key Features:**
- Dynamic routing with React Router DOM
- Code diff visualization with syntax highlighting
- Monaco Editor integration for code editing
- Tailwind CSS for styling with custom components

**WebRTC Integration:**
- OpenVidu browser client for video/audio
- Custom components for meeting rooms and participants
- Screen sharing and recording capabilities

### Backend Architecture

**Core Modules:**
- `account`: User and GitHub account management
- `auth`: JWT and OAuth2 authentication
- `pullrequest`: PR CRUD and GitHub synchronization  
- `review`: Review submission and GitHub integration
- `webhook`: GitHub webhook event processing
- `ai`: AI service client and integration
- `mettingroom`: OpenVidu session management

**Key Components:**
- GitHub App utilities for installation and token management
- Custom JWT authentication with refresh token rotation
- Async webhook processing for GitHub events
- Redis-based caching for PR preparation data
- S3 integration for file storage

### Environment Configuration

The application uses profile-based configuration:
- `local`: For IntelliJ/IDE development
- `docker`: For Docker Compose development
- Production profiles can be added as needed

Required environment variables include GitHub App credentials, database connections, OpenVidu configuration, and AI service URLs.

## Git Workflow

Follow the documented Git conventions in README.md:
- Use conventional commit messages with Korean or English
- Branch naming: `feature/*`, `fix/*`, `hotfix/*`, `release/*`
- Main branches: `main` (production), `develop` (integration)
- All feature development should branch from and merge back to `develop`

### Available Commit Types
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정  
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드 업무, 패키지 매니저 설정 등

## Testing and Quality

### Frontend
- ESLint configured with React and import sorting rules
- Prettier for code formatting

### Backend  
- JUnit 5 for testing with Spring Boot Test
- Run tests with `./gradlew test`
- Integration tests can use testcontainers for database

### AI Service
- FastAPI provides automatic API documentation at `/docs`
- Async request handling for AI operations
- Redis integration for caching and data retrieval