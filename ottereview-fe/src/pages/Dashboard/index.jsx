import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import ChatRoomList from '@/features/chat/ChatRoomList'
import { fetchAuthoredPRs, fetchReviewerPRs } from '@/features/pullRequest/prApi'
import PRList from '@/features/pullRequest/PRList'
import { usePRStore } from '@/features/pullRequest/stores/prStore'
import { fetchRepoList } from '@/features/repository/repoApi'
import RepositoryList from '@/features/repository/RepositoryList'
import { useRepoStore } from '@/features/repository/stores/repoStore'
import { api } from '@/lib/api'
import { useUserStore } from '@/store/userStore'

const Dashboard = () => {
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)

  const setAuthoredPRs = usePRStore((state) => state.setAuthoredPRs)
  const setReviewerPRs = usePRStore((state) => state.setReviewerPRs)
  const setRepos = useRepoStore((state) => state.setRepos)

  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      try {
        const fetchedRepos = await fetchRepoList()
        console.log('📦 레포 응답:', fetchedRepos)

        if (Array.isArray(fetchedRepos)) {
          setRepos(fetchedRepos)
        } else {
          console.warn('⚠️ 레포 응답이 배열이 아님:', fetchedRepos)
          setRepos([]) // 또는 clearRepos()
        }

        const authored = await fetchAuthoredPRs()
        console.log('📦 내가 작성한 PRs:', authored)
        setAuthoredPRs(authored)

        const reviewed = await fetchReviewerPRs()
        console.log('📦 내가 리뷰할 PRs:', reviewed)
        setReviewerPRs(reviewed)
      } catch (err) {
        console.error('📛 대시보드 fetch 실패:', err)

        setRepos([])
        setAuthoredPRs([])
        setReviewerPRs([])
      }
    }

    fetchData()
  }, [user?.id, setRepos, setAuthoredPRs, setReviewerPRs])

  const handleTest = async () => {
    try {
      const res = await api.get(`/api/repositories/1/pull-requests/3/merges/conflicts`)
      console.log('응답: ', res.data)
    } catch (err) {
      console.error('요청 실패: ', err)
    }
  }

  return (
    <div className="pt-2 space-y-3">
      <div className="flex justify-between items-center">
        <Box shadow className="min-h-24 flex-row space-y-1">
          <h1 className="text-2xl">안녕하세요, {user?.githubUsername}님! 👋</h1>
          <p className="text-stone-600">오늘도 수달처럼 꼼꼼하게 코드를 리뷰해보세요!</p>
        </Box>

        <ChatRoomList />

        <div className="flex gap-2">
          <button
            onClick={handleTest}
            className="bg-white border border-stone-300 rounded-full px-4 py-2 hover:bg-stone-100 shadow-sm"
          >
            응답 테스트
          </button>
          <button
            onClick={() => navigate('/chatroom/test')}
            className="bg-white border border-stone-300 rounded-full px-4 py-2 hover:bg-stone-100 shadow-sm"
          >
            채팅 테스트
          </button>
          <button
            onClick={() => navigate('/audiotest')}
            className="bg-white border border-stone-300 rounded-full px-4 py-2 hover:bg-stone-100 shadow-sm"
          >
            오디오 테스트
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row mb-4 justify-center gap-4 max-w-7xl mx-auto">
        <div className="w-full md:w-1/2 min-w-0">
          <RepositoryList />
        </div>
        <div className="w-full md:w-1/2 min-w-0">
          <PRList />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
