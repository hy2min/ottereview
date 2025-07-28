# OtteReview 🦦

**AI가 함께하는 코드 리뷰 플랫폼**

수달처럼 꼼꼼하게 코드를 검토하고, AI의 도움으로 더 빠르고 정확한 코드 리뷰를 경험하세요. 팀의 코드 품질을 한 단계 끌어올리는 새로운 방법입니다.

## ✨ 주요 기능

- 🤖 **AI 코드 분석**: GPT 기반 AI가 코드의 품질, 보안, 성능을 자동으로 분석
- 🎤 **음성 채팅 리뷰**: 실시간 음성 채팅으로 팀원들과 함께 코드를 리뷰
- 🔒 **보안 검사**: 자동으로 보안 취약점을 탐지하고 안전한 코드 작성을 도와
- 🔗 **GitHub 통합**: GitHub과 완벽하게 통합되어 기존 워크플로우를 그대로 유지
- 👥 **팀 협업**: 팀원들과 함께 코드를 리뷰하고, 의견을 공유하며 더 나은 코드를 만들어
- ⚡ **빠른 리뷰**: AI의 도움으로 코드 리뷰 시간을 단축하고 더 효율적인 개발을 경험

## 🎨 디자인 특징

- **픽셀 아트 스타일**: 마인크래프트/레트로 게임에서 영감을 받은 독특한 디자인
- **수달 마스코트**: 친근하고 꼼꼼한 수달 캐릭터로 브랜딩
- **직관적인 UI**: 개발자들이 쉽게 사용할 수 있는 직관적인 인터페이스
- **반응형 디자인**: 모든 디바이스에서 완벽하게 작동

## 🏗️ 프로젝트 구조 (Feature-Sliced Design)

```
src/
├── app/                    # 애플리케이션 설정
│   ├── App.jsx            # 메인 앱 컴포넌트
│   └── styles/            # 글로벌 스타일
├── pages/                 # 페이지 컴포넌트
│   ├── landing/           # 랜딩 페이지
│   ├── pr-list/           # PR 목록 페이지
│   ├── pr-detail/         # PR 상세 페이지
│   ├── pr-create/         # PR 생성 페이지
│   └── merge-status/      # 머지 상태 페이지
├── widgets/               # 위젯 컴포넌트
│   ├── header/            # 헤더 위젯
│   └── dashboard/         # 대시보드 위젯
├── features/              # 기능별 컴포넌트
├── entities/              # 도메인 엔티티
│   ├── user/              # 사용자 모델
│   ├── repository/        # 레포지토리 모델
│   └── pull-request/      # PR 모델
└── shared/                # 공유 컴포넌트
    └── ui/                # UI 컴포넌트
        ├── Button/        # 버튼 컴포넌트
        ├── Card/          # 카드 컴포넌트
        ├── Badge/         # 배지 컴포넌트
        └── Input/         # 입력 컴포넌트
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치 및 실행

1. **저장소 클론**

   ```bash
   git clone https://github.com/your-username/ottereview.git
   cd ottereview
   ```

2. **의존성 설치**

   ```bash
   npm install
   ```

3. **개발 서버 실행**

   ```bash
   npm run dev
   ```

4. **브라우저에서 확인**
   ```
   http://localhost:5173
   ```

### 빌드

```bash
npm run build
```

### 미리보기

```bash
npm run preview
```

## 🛠️ 기술 스택

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Architecture**: Feature-Sliced Design (FSD)
- **Fonts**: Press Start 2P (픽셀 폰트), Inter

## 📱 페이지 설명

### 🏠 랜딩 페이지 (`/`)

- 서비스 소개 및 주요 기능 설명
- GitHub 연동 및 데모 버튼
- 픽셀 아트 스타일의 매력적인 디자인

### 📊 대시보드 (`/dashboard`)

- 진행중인 PR 목록 (코드 리뷰 중심)
- 레포지토리 목록
- 빠른 작업 버튼들
- 실시간 채팅방
- 오늘의 통계 및 성과

### 📋 PR 목록 (`/pr`)

- 필터링 및 검색 기능
- 승인 상태별 분류
- 머지 버튼 (승인 완료 시)
- 레포지토리별 필터링

### 🔍 PR 상세 (`/pr/:id`)

- PR 정보 및 변경사항
- AI 요약 및 분석
- 리뷰어 승인/거부 기능
- 머지 버튼 (조건 충족 시)

### ➕ PR 생성 (`/pr/create`)

- 새 PR 생성 폼
- 리뷰어 선택
- 음성/텍스트 메모 추가
- 참조 링크 추가

### 🔄 머지 상태 (`/merge/:id`)

- 머지 진행 상태 표시
- 충돌 해결 인터페이스
- 머지 옵션 설정
- 완료/실패 처리

## 🎨 UI 컴포넌트

### 버튼 (Button)

- `primary`: 주요 액션 (녹색)
- `secondary`: 보조 액션 (파란색)
- `accent`: 강조 액션 (노란색)
- `outline`: 테두리만 있는 버튼

### 카드 (Card)

- `minecraft-container`: 마인크래프트 스타일 컨테이너
- `card-header`: 카드 헤더
- `card-content`: 카드 내용
- `card-footer`: 카드 푸터

### 배지 (Badge)

- `success`: 성공 상태 (녹색)
- `warning`: 경고 상태 (주황색)
- `danger`: 위험 상태 (빨간색)
- `info`: 정보 상태 (파란색)

### 입력 (Input)

- 픽셀 아트 스타일의 입력 필드
- 포커스 시 녹색 테두리
- 에러 상태 지원

## 🎯 개발 가이드라인

### 코드 스타일

- **컴포넌트**: PascalCase (예: `PRDetailPage`)
- **파일**: kebab-case (예: `pr-detail-page.jsx`)
- **함수**: camelCase (예: `handleSubmit`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`)

### 컴포넌트 작성 규칙

1. **단일 책임**: 하나의 컴포넌트는 하나의 책임만 가져야 함
2. **재사용성**: 가능한 한 재사용 가능하게 작성
3. **Props 검증**: PropTypes 또는 TypeScript 사용 권장
4. **성능 최적화**: React.memo, useMemo, useCallback 적절히 사용

### 상태 관리

- **로컬 상태**: useState 사용
- **전역 상태**: 필요시 Context API 또는 Redux 사용
- **서버 상태**: React Query 또는 SWR 사용 권장

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

- **프로젝트 링크**: [https://github.com/your-username/ottereview](https://github.com/your-username/ottereview)
- **이메일**: contact@ottereview.com
- **웹사이트**: [https://ottereview.com](https://ottereview.com)

## 🙏 감사의 말

- [Lucide](https://lucide.dev/) - 아이콘 제공
- [Tailwind CSS](https://tailwindcss.com/) - 스타일링 프레임워크
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) - 픽셀 폰트

---

**OtteReview**와 함께 수달처럼 꼼꼼한 코드 리뷰를 시작하세요! 🦦✨
