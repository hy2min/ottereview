# 🦦 OtterReview

> **실시간 협업 기반 코드 리뷰 & 화이트보드 플랫폼**  
> SSAFY 11기 공통 프로젝트 (2024-2025)

<img src="otter_logo.png" width="180" alt="OtterReview Logo" />

---

## 📌 프로젝트 개요

OtterReview는 개발자들이 **코드 리뷰 과정에서 발생하는 병목과 비효율성**을 해소하기 위해 제작된 **실시간 협업 플랫폼**입니다.  
코드 공유, 화이트보드 기반 아이디어 스케치, 음성 채팅, 실시간 채팅을 하나의 환경에서 제공합니다.

- 💬 **코드 리뷰 최적화** : 실시간 코드 공유 및 동시 편집
- 🎨 **화이트보드 협업** : tldraw 기반 자유로운 다자간 드로잉
- 🎧 **오디오 채팅** : 회의실 내 음성 기반 토론 지원
- 💡 **AI 보조** : 자동 요약 및 리뷰 서포트 기능 확장 예정

---

## 🚀 주요 기능

### 1. 코드 리뷰

- CodeMirror + Yorkie CRDT 기반 실시간 코드 공유
- 충돌 해결 히스토리 추적
- Pull Request 기반 코드 리뷰 관리

### 2. 화이트보드

- tldraw 기반 실시간 드로잉
- 사용자별 색상/펜 도구 제공
- 멀티 커서 동시 작업 지원

### 3. 실시간 커뮤니케이션

- SockJS + STOMP 기반 채팅
- OpenVidu/LiveKit 기반 오디오 회의
- 회의록/대화 로그 자동 저장

---

## 🛠 기술 스택

### Frontend

- **React (Vite)**
- **Zustand** (전역 상태 관리)
- **Yorkie** (실시간 CRDT 동기화)
- **tldraw** (화이트보드)
- **SockJS + STOMP** (실시간 채팅)
- **LiveKit / OpenVidu** (오디오/화상 회의)

### Backend

- **Spring Boot 3.x**
- **WebSocket (STOMP)** 기반 채팅/알림
- **JPA + MySQL** (데이터 관리)
- **OAuth 2.0 (GitHub)** 로그인

### DevOps

- **Docker Compose** (FE/BE 통합 배포)
- **Nginx + SSL (Let’s Encrypt)**
- **GitHub Actions** CI/CD

---

## 📂 폴더 구조

```plaintext
ottereview/
 ┣ ottereview-fe/       # React (Vite) Frontend
 ┣ ottereview-be/       # Spring Boot Backend
 ┣ docs/                # 문서 및 다이어그램
 ┣ docker-compose.yml   # 통합 실행 환경
 ┗ README.md
```

## ⚡ 설치 및 실행

### 1. 환경 변수 설정

`ottereview-fe/.env`, `ottereview-be/.env` 파일을 생성 후 환경 변수 입력:

```env
# Frontend
VITE_API_URL=http://localhost:8080

# Backend
SPRING_PROFILES_ACTIVE=local
DB_URL=jdbc:mysql://localhost:3306/ottereview
DB_USERNAME=root
DB_PASSWORD=yourpassword
```

### 2. 실행

```
# Frontend 실행
cd ottereview-fe
npm install
npm run dev

# Backend 실행
cd ottereview-be
./gradlew bootRun

# 전체 실행 (Docker)
docker-compose up --build
```

## 📸 화면 예시

| 코드 리뷰 화면                     | 화이트보드 협업                   |
| ---------------------------------- | --------------------------------- |
| ![](./docs/assets/code_review.png) | ![](./docs/assets/whiteboard.png) |

---

## 👥 팀원

| 이름   | 역할 | GitHub      |
| ------ | ---- | ----------- |
| 신진우 | 팀장 | BE / AI     |
| 임강범 | 팀원 | BE          |
| 윤경일 | 팀원 | BE / INFRA  |
| 박서진 | 팀원 | BE          |
| 이혜민 | 팀원 | FE / WebRTC |
| 김희주 | 팀원 | FE / WebRTC |

---

## 📅 개발 일정

- **2025.07 ~ 2025.08** : SSAFY 2학기 공통 프로젝트
- **2025.08 ~ 2025.09** : 기능 고도화 및 배포

---

## 📜 라이선스

Copyright ⓒ 2024 OtterReview
