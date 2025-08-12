import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import ChatRoomList from '@/features/chat/ChatRoomList'
import { fetchAuthoredPRs, fetchReviewerPRs } from '@/features/pullRequest/prApi'
import PRList from '@/features/pullRequest/PRList'
import { fetchRepoList } from '@/features/repository/repoApi'
import RepositoryList from '@/features/repository/RepositoryList'
import { useRepoStore } from '@/features/repository/stores/repoStore'
import { api } from '@/lib/api'
import { useUserStore } from '@/store/userStore'

const Dashboard = () => {
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)

  // 로컬 상태로 PR 데이터 관리
  const [authoredPRs, setAuthoredPRs] = useState([])
  const [reviewerPRs, setReviewerPRs] = useState([])

  // 레포는 여전히 zustand 사용 (다른 페이지에서도 사용할 가능성이 있다면)
  const setRepos = useRepoStore((state) => state.setRepos)

  useEffect(() => {
    const handleMessage = (event) => {
      // 보안: 자신의 도메인에서만 메시지 받기
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'GITHUB_INSTALL_COMPLETE') {
        console.log('🔄 GitHub 설치 완료 - 대시보드 데이터 새로고침')

        // 기존 fetchData 로직 재실행
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

        fetchData()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [setRepos])

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

    fetchData()
  }, [user?.id, setRepos])

  const handleTest = async () => {
    try {
      const res = await api.get(`/api/repositories/1/pull-requests/5/merges/conflicts`)
      console.log('응답: ', res.data)
    } catch (err) {
      console.error('요청 실패: ', err)
    }
  }

  return (
    <div className="pt-2 space-y-8">
      {/* 환영 메시지와 채팅방 목록 */}
      <div className="flex flex-col xl:flex-row gap-6 items-stretch">
        <Box shadow className="xl:w-1/2 min-h-32 flex-col space-y-3 relative">
          <h1 className="text-2xl xl:text-3xl theme-text font-bold">안녕하세요, {user?.githubUsername}님! 👋</h1>
          <p className="theme-text-secondary text-base xl:text-lg">오늘도 수달처럼 꼼꼼하게 코드를 리뷰해보세요!</p>
          
          <button
            onClick={handleTest}
            className="theme-btn text-xs px-2 py-1 absolute top-2 right-2"
            title="API 응답 테스트"
          >
            응답테스트
          </button>
        </Box>

        <div className="xl:w-1/2">
          <ChatRoomList />
        </div>
      </div>

      {/* 메인 콘텐츠: Repository와 PR 관리 (더 강조) */}
      <div className="theme-bg-secondary border theme-border p-6 rounded-xl theme-shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold theme-text mb-2">🚀 코드 리뷰 워크스페이스</h2>
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
