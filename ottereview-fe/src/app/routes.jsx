import ChatRoom from '../pages/ChatRoom'
import Conflict from '../pages/Conflict'
import Dashboard from '../pages/Dashboard'
import PRCreate from '../pages/PRCreate'
import PRreview from '../pages/PRReview'
import RepositoryDetail from '../pages/RepositoryDetail'

export const protectedRoutes = [
  { path: '/dashboard', element: <Dashboard />, title: '대시보드' },
  { path: '/:repoId', element: <RepositoryDetail />, title: '레포지토리 상세' },
  { path: '/:repoId/pr/:prId/review', element: <PRreview />, title: 'PR 리뷰' },
  { path: '/:repoId/pr/:prId/conflict', element: <Conflict />, title: '충돌 해결' },
  { path: '/chatroom/:roomId', element: <ChatRoom />, title: '채팅방' },
  { path: '/:repoId/pr/create', element: <PRCreate />, title: 'PR 생성' },
]
