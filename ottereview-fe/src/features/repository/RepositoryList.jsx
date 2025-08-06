import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '../../components/Box'
import { useUserStore } from '../../store/userStore'
import { fetchAuthoredPRs, fetchReviewerPRs } from '../pullRequest/prApi'
import { usePRStore } from '../pullRequest/stores/prStore'
import { fetchRepoList } from './repoApi'
import RepositoryCard from './RepositoryCard'
import { useRepoStore } from './stores/repoStore'

const RepositoryList = () => {
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)
  const { repos, setRepos } = useRepoStore()
  const setAuthoredPRs = usePRStore((state) => state.setAuthoredPRs)
  const setReviewerPRs = usePRStore((state) => state.setReviewerPRs)

  useEffect(() => {
    if (!user?.id) {
      console.warn('user.id 없음, 데이터 요청하지 않음')
      return
    }

    const fetchData = async () => {
      try {
        // 🔹 1. 레포 목록
        const fetchedRepos = await fetchRepoList(user.id)
        console.log('📦 fetchedRepos:', fetchedRepos)
        setRepos(fetchedRepos)

        // 🔹 2. 내가 작성한 PR
        try {
          const authoredPRs = await fetchAuthoredPRs()
          console.log('✍️ authoredPRs:', authoredPRs)
          setAuthoredPRs(authoredPRs)
        } catch (err) {
          console.error('❌ authored PR fetch 실패:', err)
        }

        // 🔹 3. 내가 리뷰어인 PR
        try {
          const reviewerPRs = await fetchReviewerPRs()
          console.log('🧑‍💻 reviewerPRs:', reviewerPRs)
          setReviewerPRs(reviewerPRs)
        } catch (err) {
          console.error('❌ reviewer PR fetch 실패:', err)
        }
      } catch (err) {
        console.error('❌ 전체 fetch 실패:', err)
      }
    }

    fetchData()
  }, [user?.id, setRepos, setAuthoredPRs, setReviewerPRs])

  const handleImport = () => {
    const importUrl = 'https://github.com/apps/Ottereviews/installations/new'
    window.location.href = importUrl
  }

  const handleRepoClick = (repoId) => {
    navigate(`/${repoId}`)
  }

  return (
    <Box shadow className="w-full h-[70vh] flex flex-col">
      <div className="flex justify-between">
        <h2 className="text-xl mb-2">레포지토리</h2>
        <button className="border-2 border-black px-4" onClick={handleImport}>
          연결
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {repos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">연결된 레포지토리가 없습니다.</p>
          </div>
        ) : (
          repos.map((repo) =>
            repo.id ? (
              <RepositoryCard key={repo.id} repo={repo} onClick={() => handleRepoClick(repo.id)} />
            ) : null
          )
        )}
      </div>
    </Box>
  )
}

export default RepositoryList
