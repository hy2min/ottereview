import { Rocket, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import Box from '@/components/Box'
import { useAuthStore } from '@/features/auth/authStore'
import ChatRoomList from '@/features/chat/ChatRoomList'
import { fetchAuthoredPRs, fetchReviewerPRs } from '@/features/pullRequest/prApi'
import PRList from '@/features/pullRequest/PRList'
import { fetchRepoList } from '@/features/repository/repoApi'
import RepositoryList from '@/features/repository/RepositoryList'
import { useRepoStore } from '@/features/repository/stores/repoStore'
import { api } from '@/lib/api'
import { useUserStore } from '@/store/userStore'

const Dashboard = () => {
  const user = useUserStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  // 로컬 상태로 PR 데이터 관리
  const [authoredPRs, setAuthoredPRs] = useState([])
  const [reviewerPRs, setReviewerPRs] = useState([])

  // 레포는 여전히 zustand 사용 (다른 페이지에서도 사용할 가능성이 있다면)
  const setRepos = useRepoStore((state) => state.setRepos)

  // 공통 fetchData 함수를 분리
  const fetchData = async () => {
    try {
      const fetchedRepos = await fetchRepoList()
      console.log('📦 레포 응답:', fetchedRepos)

      if (Array.isArray(fetchedRepos)) {
        setRepos(fetchedRepos)
      } else {
        console.warn('⚠️ 레포 응답이 배열이 아님:', fetchedRepos)
        setRepos([])
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

  // GitHub Install 완료 이벤트 처리
  useEffect(() => {
    const handleMessage = (event) => {
      // 보안: 자신의 도메인에서만 메시지 받기
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'GITHUB_INSTALL_COMPLETE') {
        console.log('🔄 GitHub 설치 완료 - 대시보드 데이터 새로고침')
        fetchData()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Dashboard 전용 update 이벤트 (레포지토리 업데이트)
  useEffect(() => {
    if (!user?.id || !accessToken) return

    const updateEventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/sse/make-clients?github-id=${user.githubId}`
    )

    updateEventSource.addEventListener('update', (event) => {
      console.log('🔄 레포지토리 업데이트 이벤트 (Dashboard):', event.data)
      fetchData()
    })

    updateEventSource.onopen = () => console.log('🔌 Update SSE 연결 성공 (Dashboard)')
    updateEventSource.onerror = (error) => console.error('❌ Update SSE 오류:', error)

    return () => {
      console.log('🔌 Update SSE 연결 해제 (Dashboard)')
      updateEventSource.close()
    }
  }, [user?.id, accessToken])

  // 초기 데이터 로드
  useEffect(() => {
    if (!user?.id) return
    fetchData()
  }, [user?.id])

  // user 객체 구조 확인을 위한 console.log
  console.log('User 객체:', user)
  console.log('User profile_image_url:', user?.profile_image_url)

  return (
    <div className="pt-2 space-y-8">
      {/* 환영 메시지와 채팅방 목록 */}
      <div className="flex flex-col xl:flex-row gap-6 items-stretch">
        <Box shadow className="xl:w-1/2 min-h-32 flex-col space-y-3 relative">
          <div className="flex items-center gap-4">
            {/* GitHub Profile Image */}
            <div className="relative">
              <img
                src={
                  user?.profileImageUrl ||
                  user?.profile_image_url ||
                  'https://github.com/identicons/jasonlong.png'
                }
                alt={`${user?.githubUsername}'s profile`}
                className="w-16 h-16 rounded-full border-3 border-orange-500 shadow-lg object-cover"
                onError={(e) => {
                  e.target.src = 'https://github.com/identicons/jasonlong.png'
                }}
              />
            </div>

            {/* Welcome Message */}
            <div className="flex-1">
              <h1 className="text-2xl xl:text-3xl theme-text font-bold">
                안녕하세요, {user?.githubUsername}님!
              </h1>
              <p className="theme-text-secondary text-base xl:text-lg">
                효율적인 코드 리뷰로 팀의 생산성을 높여보세요!
              </p>
            </div>
          </div>
        </Box>

        <div className="flex-1 lg:w-1/2">
          <ChatRoomList />
        </div>
      </div>

      {/* 메인 콘텐츠: Repository와 PR 관리 (더 강조) */}
      <div className="theme-bg-secondary border theme-border p-6 rounded-xl theme-shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Rocket className="w-8 h-8 text-orange-500" />
              <h2 className="text-3xl font-bold theme-text">코드 리뷰 워크스페이스</h2>
            </div>
            <p className="theme-text-muted">Repository와 Pull Request를 효율적으로 관리하세요</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/2 min-w-0">
              <RepositoryList />
            </div>
            <div className="w-full lg:w-1/2 min-w-0">
              <PRList authoredPRs={authoredPRs} reviewerPRs={reviewerPRs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
