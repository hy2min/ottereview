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
      const res = await api.get(`/api/repositories/8/pull-requests/23/merges/conflicts`)
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
          <PRList authoredPRs={authoredPRs} reviewerPRs={reviewerPRs} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
