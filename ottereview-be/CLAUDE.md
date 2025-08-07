# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OtteReview is a comprehensive pull request review platform with three main components:
- **ottereview-fe**: React frontend with Vite
- **ottereview-be**: Spring Boot backend API
- **ottereview-ai**: FastAPI AI service for review assistance and vector database

## Development Commands

### Frontend (ottereview-fe)
```bash
cd ottereview-fe
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (ottereview-be)
```bash
cd ottereview-be
./gradlew bootRun    # Run Spring Boot application (http://localhost:8080)
./gradlew build      # Build the application
./gradlew test       # Run tests
./gradlew clean      # Clean build artifacts
```

### AI Service (ottereview-ai)
```bash
cd ottereview-ai
python main.py       # Run FastAPI development server (http://localhost:8000)
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker Development
```bash
# Run all services with Docker Compose
docker-compose up --build

# Individual service builds
docker build -t ottereview-fe ./ottereview-fe
docker build -t ottereview-be ./ottereview-be
docker build -t ottereview-ai ./ottereview-ai
```

## Architecture & Key Patterns

### Backend Architecture (Spring Boot)
- **Domain-driven structure**: Each feature (account, auth, pullrequest, etc.) has its own package with controller/service/repository/dto layers
- **JWT Authentication**: Custom JWT implementation with access/refresh tokens
- **GitHub Integration**: GitHub App API integration for repository and PR management
- **WebSocket Support**: Real-time chat and collaboration features using STOMP
- **Redis Caching**: PR preparation data cached in Redis
- **S3 Integration**: File uploads handled via AWS S3
- **OpenVidu**: Video conferencing integration for collaborative reviews

### Frontend Architecture (React + Vite)
- **Feature-based organization**: Components organized by domain (auth, chat, pullRequest, etc.)
- **State Management**: Zustand for global state management
- **Routing**: React Router DOM with protected routes
- **WebSocket**: Real-time features using STOMP and SockJS
- **Code Editor**: Monaco Editor integration for code review
- **Whiteboard**: Collaborative whiteboard using Fabric.js
- **UI**: Tailwind CSS for styling

### AI Service Architecture (FastAPI)
- **Review Enhancement**: AI-powered review tone softening via `/ai/review/cushion`
- **PR Title Generation**: Automatic PR title suggestions based on commits and changes via `/ai/pull_requests/title`
- **Vector Database**: ChromaDB integration for PR similarity analysis and reviewer recommendations
- **OpenAI Integration**: Uses OpenAI API for language processing and embeddings

## Configuration Notes

### Environment Variables
- **Backend**: GitHub App credentials, JWT secrets, MySQL database config, Redis config, S3 credentials, OpenVidu config
- **AI service**: OpenAI API key, ChromaDB path
- **Frontend**: Connects to backend at `http://localhost:8080` and AI service at `http://localhost:8000`

### Database
- **MySQL 8.0**: Primary database with JPA/Hibernate for entities (account, repository, pull_request, review, etc.)
- **Redis**: Caching PR preparation data and session management
- **ChromaDB**: Vector database for AI-powered PR analysis and recommendations

### Key Integration Points
- **GitHub App**: Webhook handling for PR events, OAuth authentication, repository management
- **Real-time WebSocket**: STOMP protocol for chat and collaborative whiteboard features
- **AI Processing**: Backend calls AI service for review tone conversion and PR title generation
- **File Storage**: S3 integration for repository assets and file uploads
- **Video Conferencing**: OpenVidu integration for collaborative review sessions

## Git Workflow
The project follows a structured branching strategy:
- `master` branch for production releases (main branch)
- `develop` branch for integration
- `feature/*`, `fix/*`, `hotfix/*` branches for development
- Korean commit messages with conventional commit types (feat, fix, docs, etc.)

## Testing
- **Backend**: JUnit tests with Spring Boot Test (`./gradlew test`)
- **Frontend**: No specific test framework configured yet
- **AI Service**: No tests configured yet

## Important Implementation Notes

### Code Organization
- **Backend domain structure**: Each feature has controller/service/repository/dto layers
- **Frontend feature-based**: Components organized by domain in `src/features/`
- **Consistent naming**: Korean commit messages, English code/comments

### Key Dependencies
- **Frontend**: React 19, Zustand, Monaco Editor, Fabric.js, TailwindCSS, SockJS/STOMP
- **Backend**: Spring Boot 3.5, JWT, GitHub API, WebSocket/STOMP, Redis, S3, OpenVidu
- **AI Service**: FastAPI, ChromaDB, OpenAI, LangChain

### Development Workflow
- Always run lint checks before committing (`npm run lint` for frontend)
- Use profile-based configuration: `local` for development, `docker` for containers
- Vector DB operations are async and require proper error handling

## Coding Standards
- **File Encoding**: Always use UTF-8 encoding for all files
- **Comments and Documentation**: Write comments and documentation in Korean (한글)
- **Code Structure**: English for variable names, function names, and code logic; Korean for comments and explanations