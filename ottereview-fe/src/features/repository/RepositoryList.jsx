import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '../../components/Box'
import { useUserStore } from '../../store/userStore'
import { fetchPRsByRepoId } from '../pullRequest/prApi'
import { usePRStore } from '../pullRequest/stores/prStore'
import { fetchRepoListByAccountId } from './repoApi'
import RepositoryCard from './RepositoryCard'
import { useRepoStore } from './repoStore'

const RepositoryList = () => {
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)
  const { repos, setRepos } = useRepoStore()
  const setPullRequests = usePRStore((state) => state.setPullRequests)

  useEffect(() => {
    // accountId가 준비되지 않은 경우 실행 안 함
    if (!user?.id) {
      console.warn('user.id 없음, 데이터 요청하지 않음')
      return
    }

    const fetchData = async () => {
      try {
        const fetchedRepos = await fetchRepoListByAccountId(user.id)
        console.log('📦 fetchedRepos:', fetchedRepos)
        setRepos(fetchedRepos)

        const allPRs = []

        for (const repo of fetchedRepos) {
          if (!repo?.id) {
            console.warn('⚠️ repo.id 없음, 건너뜀:', repo)
            continue
          }

          try {
            const prs = await fetchPRsByRepoId(repo.id)
            console.log(`✅ PRs for repo ${repo.id}:`, prs)
            allPRs.push(...prs)
          } catch (err) {
            console.error(`❌ PR fetch 실패 (repoId: ${repo.id})`, err)
          }
        }

        setPullRequests(allPRs)
      } catch (err) {
        console.error('❌ 전체 fetch 실패:', err)
      }
    }

    fetchData()
  }, [user?.id, setRepos, setPullRequests])

  const handleImport = () => {
    const importUrl = 'https://github.com/apps/kangbeomApp/installations/new'
    window.location.href = importUrl
  }

  const handleRepoClick = (repoId) => {
    navigate(`/${repoId}`)
  }

  return (
    <Box shadow className="w-full h-[70vh] flex flex-col">
      <div className="flex justify-between">
        <h2 className="text-xl mb-2">레포지토리 목록</h2>
        <button onClick={handleImport}>연결</button>
      </div>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {repos.map((repo) =>
          repo.id ? (
            <RepositoryCard key={repo.id} repo={repo} onClick={() => handleRepoClick(repo.id)} />
          ) : null
        )}
      </div>
    </Box>
  )
}

export default RepositoryList
