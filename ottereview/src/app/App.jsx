import { Navigate, Route, Routes } from 'react-router-dom'

import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import { useUserStore } from './store/userStore' // 로그인 상태 저장소
// 기타 필요한 페이지 import

const App = () => {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)

  return (
    <Routes>
      {!isLoggedIn ? (
        // 로그인 전: 랜딩페이지만 허용
        <>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        // 로그인 후: 대시보드 중심으로 라우팅
        <>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* 다른 라우트들 추가 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  )
}

export default App

// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { useState } from "react";
// import Header from "../widgets/header";
// import Dashboard from "../widgets/dashboard";
// import LandingPage from "../pages/landing";
// import PRListPage from "../pages/pr-list";
// import PRDetailPage from "../pages/pr-detail";
// import PRCreatePage from "../pages/pr-create";
// import MergeStatusPage from "../pages/merge-status";
// import "./styles/index.css";

// // Mock data
// const mockUser = {
//   id: 1,
//   username: "developer_kim",
//   name: "김개발자",
//   email: "kim@example.com",
//   avatar: "",
//   role: "developer",
//   skills: ["React", "TypeScript", "Node.js"],
//   isOnline: true,
//   lastActive: new Date().toISOString(),
// };

// const mockRepositories = [
//   {
//     id: 1,
//     name: "react-dashboard",
//     fullName: "team/react-dashboard",
//     description: "리액트 기반 관리자 대시보드",
//     private: false,
//     owner: mockUser,
//     defaultBranch: "main",
//     language: "TypeScript",
//     topics: ["react", "dashboard", "typescript"],
//     stargazersCount: 15,
//     forksCount: 3,
//     openIssuesCount: 2,
//     updatedAt: "2025-01-20T10:30:00Z",
//     convention: "airbnb",
//   },
//   {
//     id: 2,
//     name: "node-api-server",
//     fullName: "team/node-api-server",
//     description: "Node.js REST API 서버",
//     private: true,
//     owner: mockUser,
//     defaultBranch: "main",
//     language: "JavaScript",
//     topics: ["nodejs", "api", "express"],
//     stargazersCount: 8,
//     forksCount: 1,
//     openIssuesCount: 5,
//     updatedAt: "2025-01-19T15:45:00Z",
//     convention: "standard",
//   },
//   {
//     id: 3,
//     name: "mobile-app",
//     fullName: "team/mobile-app",
//     description: "팀 프로젝트 모바일 앱",
//     private: false,
//     owner: mockUser,
//     defaultBranch: "main",
//     language: "React Native",
//     topics: ["react-native", "mobile", "app"],
//     stargazersCount: 12,
//     forksCount: 2,
//     openIssuesCount: 3,
//     updatedAt: "2025-01-18T09:15:00Z",
//     convention: "airbnb",
//   },
// ];

// const mockPullRequests = [
//   {
//     id: 1,
//     number: 1,
//     title: "사용자 인증 시스템 구현",
//     description:
//       "JWT 기반 인증 시스템을 구현했습니다. 토큰 생성, 검증, 리프레시 로직이 포함되어 있으며, 보안성이 크게 향상되었습니다.",
//     author: { id: 2, username: "alice.dev", name: "Alice" },
//     reviewers: [
//       { id: 1, username: "developer_kim", name: "김개발자" },
//       { id: 3, username: "bob.frontend", name: "Bob" },
//     ],
//     repository: mockRepositories[0],
//     sourceBranch: "feature/auth-system",
//     targetBranch: "main",
//     status: "open",
//     state: "open",
//     mergeable: true,
//     conflicts: false,
//     filesChanged: 8,
//     additions: 245,
//     deletions: 67,
//     comments: 5,
//     reviews: 2,
//     createdAt: "2025-01-20T08:00:00Z",
//     updatedAt: "2025-01-20T12:25:00Z",
//     aiSummary:
//       "JWT 기반 인증 시스템을 구현했습니다. 토큰 생성, 검증, 리프레시 로직이 포함되어 있으며, 보안성이 크게 향상되었습니다. 프론트엔드와 백엔드 모두 수정이 필요한 규모가 큰 변경사항입니다.",
//     voiceMemos: [{ id: 1, title: "인증 로직 설명" }],
//     textMemos: [{ id: 1, title: "JWT 구현 노트" }],
//     referenceLinks: [{ id: 1, title: "JWT 공식 문서" }],
//     priority: "high",
//   },
//   {
//     id: 2,
//     number: 2,
//     title: "메인 대시보드 UI 개선",
//     description:
//       "대시보드 내를 현대적이고 사용자 친화적으로 개선했습니다. 새로운 색상 팔레트를 적용하고 반응형 디자인을 구현했습니다.",
//     author: { id: 3, username: "bob.frontend", name: "Bob" },
//     reviewers: [
//       { id: 1, username: "developer_kim", name: "김개발자" },
//       { id: 4, username: "carol.backend", name: "Carol" },
//     ],
//     repository: mockRepositories[0],
//     sourceBranch: "feature/dashboard-ui",
//     targetBranch: "main",
//     status: "approved",
//     state: "open",
//     mergeable: true,
//     conflicts: false,
//     filesChanged: 12,
//     additions: 189,
//     deletions: 203,
//     comments: 3,
//     reviews: 2,
//     createdAt: "2025-01-20T10:00:00Z",
//     updatedAt: "2025-01-20T14:30:00Z",
//     aiSummary:
//       "대시보드 내를 현대적이고 사용자 친화적으로 개선했습니다. 새로운 색상 팔레트를 적용하고 반응형 디자인을 구현했습니다. 접근성과 사용성이 크게 향상되었습니다.",
//     voiceMemos: [],
//     textMemos: [
//       { id: 1, title: "UI 개선 계획" },
//       { id: 2, title: "색상 팔레트 변경" },
//     ],
//     referenceLinks: [{ id: 1, title: "디자인 시스템 가이드" }],
//     priority: "medium",
//   },
//   {
//     id: 3,
//     number: 3,
//     title: "API 응답 속도 최적화",
//     description:
//       "데이터베이스 쿼리를 최적화하고 Redis 캐싱을 도입하여 API 응답 속도를 평균 40% 개선했습니다.",
//     author: { id: 4, username: "carol.backend", name: "Carol" },
//     reviewers: [{ id: 1, username: "developer_kim", name: "김개발자" }],
//     repository: mockRepositories[1],
//     sourceBranch: "feature/api-optimization",
//     targetBranch: "main",
//     status: "open",
//     state: "open",
//     mergeable: false,
//     conflicts: true,
//     filesChanged: 6,
//     additions: 156,
//     deletions: 89,
//     comments: 2,
//     reviews: 1,
//     createdAt: "2025-01-18T16:00:00Z",
//     updatedAt: "2025-01-19T11:20:00Z",
//     aiSummary:
//       "데이터베이스 쿼리를 최적화하고 Redis 캐싱을 도입하여 API 응답 속도를 평균 40% 개선했습니다. 특히 복잡한 조인 쿼리의 성능이 크게 향상되었습니다.",
//     voiceMemos: [],
//     textMemos: [{ id: 1, title: "성능 최적화 노트" }],
//     referenceLinks: [],
//     priority: "high",
//   },
// ];

// const mockChatRooms = [
//   {
//     id: 1,
//     title: "React Dashboard 핫픽스",
//     description: "사용자 인증 버그 해결",
//     participants: [
//       { id: 1, name: "김개발자" },
//       { id: 3, name: "Bob" },
//     ],
//     status: "active",
//     lastActivity: "오후 08:45",
//   },
//   {
//     id: 2,
//     title: "API 리팩토링 회의",
//     description: "REST API 설계 개선",
//     participants: [
//       { id: 1, name: "김개발자" },
//       { id: 4, name: "Carol" },
//     ],
//     status: "idle",
//     lastActivity: "오후 06:45",
//   },
//   {
//     id: 3,
//     title: "UI/UX 디자인 싱크",
//     description: "모바일 반응형 디자인",
//     participants: [{ id: 3, name: "Bob" }],
//     status: "idle",
//     lastActivity: "오전 02:15",
//   },
// ];

// function App() {
//   const [user] = useState(mockUser);
//   const [repositories] = useState(mockRepositories);
//   const [pullRequests] = useState(mockPullRequests);
//   const [chatRooms] = useState(mockChatRooms);
//   const [isVoiceChatActive] = useState(false);

//   return (
//     <Router>
//       <div className="">
//         <Routes>
//           {/* 랜딩 페이지를 메인 경로로 설정 */}
//           <Route path="/" element={<LandingPage />} />

//           {/* 대시보드는 /dashboard로 이동 */}
//           <Route
//             path="/dashboard"
//             element={
//               <>
//                 <Header />
//                 <Dashboard
//                   user={user}
//                   repositories={repositories}
//                   pullRequests={pullRequests}
//                   chatRooms={chatRooms}
//                 />
//               </>
//             }
//           />

//           {/* PR 목록 페이지 */}
//           <Route
//             path="/pr"
//             element={
//               <>
//                 <Header user={user} isVoiceChatActive={isVoiceChatActive} />
//                 <PRListPage
//                   repository={repositories[0]}
//                   pullRequests={pullRequests}
//                 />
//               </>
//             }
//           />

//           {/* PR 상세 페이지 */}
//           <Route
//             path="/pr/:id"
//             element={
//               <>
//                 <Header user={user} isVoiceChatActive={isVoiceChatActive} />
//                 <PRDetailPage pullRequests={pullRequests} user={user} />
//               </>
//             }
//           />

//           {/* PR 생성 페이지 */}
//           <Route
//             path="/pr/create"
//             element={
//               <>
//                 <Header user={user} isVoiceChatActive={isVoiceChatActive} />
//                 <PRCreatePage repositories={repositories} user={user} />
//               </>
//             }
//           />

//           {/* 머지 현황 페이지 */}
//           <Route
//             path="/merge/:id"
//             element={
//               <>
//                 <Header user={user} isVoiceChatActive={isVoiceChatActive} />
//                 <MergeStatusPage pullRequests={pullRequests} user={user} />
//               </>
//             }
//           />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;
