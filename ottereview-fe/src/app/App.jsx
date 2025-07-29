import { Navigate, Route, Routes } from 'react-router-dom'

import ChatRoom from '../pages/ChatRoom'
import Conflict from '../pages/Conflict'
import Dashboard from '../pages/Dashboard'
import Landing from '../pages/Landing'
import PRCreate from '../pages/PRCreate'
import PRreview from '../pages/PRReview'
import RepositoryDetail from '../pages/RepositoryDetail'
// import { useUserStore } from './store/userStore' // 로그인 상태 저장소
// 기타 필요한 페이지 import

const App = () => {
  // const isLoggedIn = useUserStore((state) => state.isLoggedIn)
  const isLoggedIn = true

  return (
    <Routes>
      {!isLoggedIn ? (
        // 로그인 전: 랜딩페이지만 허용
        <>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        // 로그인 후: 대시보드 중심으로 라우팅
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/:repoId" element={<RepositoryDetail />} />
          <Route path="/:repoId/pr/:prId/review" element={<PRreview />} />
          <Route path="/:repoId/pr/:prId/conflict" element={<Conflict />} />
          <Route path="/chatroom/:roomId" element={<ChatRoom />} />
          <Route path="/:repoId/pr/create/*" element={<PRCreate />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  )
}

export default App
