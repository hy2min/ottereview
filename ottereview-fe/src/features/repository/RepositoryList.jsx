import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '../../components/Box'
import { useUserStore } from '../../store/userStore'
import { fetchRepoListByAccountId } from './repoApi'
import RepositoryCard from './RepositoryCard'
import { useRepoStore } from './repoStore'

const RepositoryList = () => {
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)
  const { repos, setRepos } = useRepoStore()

  const handleImport = () => {
    const importUrl = 'https://github.com/apps/kangbeomApp/installations/new'
    window.location.href = importUrl
  }

  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      const data = await fetchRepoListByAccountId(user.id)
      console.log('📥 받은 데이터:', data)
      setRepos(data)
    }

    fetchData()
  }, [user?.id])

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
