import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { fetchRepo } from './repositoryApi'
import RepositoryCard from './RepositoryCard'

const RepositoryList = () => {
  const [repos, setRepos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchRepo()
      setRepos(data)
    }
    fetchData()
  }, [])

  const handleRepoClick = (repoId) => {
    navigate(`/${repoId}`)
  }

  return (
    <section className="border p-4">
      <h2 className="text-xl font-semibold mb-4">📁 레포지토리 목록</h2>
      <div className="space-y-2">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repo={repo} onClick={() => handleRepoClick(repo.id)} />
        ))}
      </div>
    </section>
  )
}

export default RepositoryList
