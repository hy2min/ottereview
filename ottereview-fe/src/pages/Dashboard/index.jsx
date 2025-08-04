import { useNavigate } from 'react-router-dom'

import ChatRoomList from '../../features/chat/ChatRoomList'
import PRList from '../../features/pullRequest/PRList'
import RepositoryList from '../../features/repository/RepositoryList'
import { useRepoStore } from '../../features/repository/repoStore'
import { api } from '../../lib/api'
import { useUserStore } from '../../store/userStore'

const Dashboard = () => {
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)
  const repos = useRepoStore((state) => state.repos)
  const handleTest = async () => {
    try {
      const accountId = user.id
      const res = await api.get(`/api/repositories/1/pull-requests`)
      console.log('응답: ', res.data)
    } catch (err) {
      console.error('요청 실패: ', err)
    }
  }

  return (
    <div className="pt-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl mb-1">안녕하세요, 김개발자님! 👋</h1>
          <p className="text-stone-600">오늘도 수달처럼 꼼꼼하게 코드를 리뷰해보세요!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            className="border border-stone-300 rounded-full px-4 py-2 hover:bg-stone-100 shadow-sm"
          >
            응답 테스트
          </button>
          {/* 기존 채팅 테스트 */}
          <button
            onClick={() => navigate('/chatroom/test')}
            className="border border-stone-300 rounded-full px-4 py-2 hover:bg-stone-100 shadow-sm"
          >
            채팅 테스트
          </button>

          {/* ✅ 오디오 테스트 버튼 추가 */}
          <button
            onClick={() => navigate('/audiotest')}
            className="border border-stone-300 rounded-full px-4 py-2 hover:bg-stone-100 shadow-sm"
          >
            오디오 테스트
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-4 py-4 max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
        <RepositoryList />
        <PRList />
      </div>
    </div>
  )
}

export default Dashboard
