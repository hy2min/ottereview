import { useEffect, useState } from 'react'

import { fetchRepo } from './repositoryApi'
import RepositoryCard from './RepositoryCard'

const RepositoryList = () => {
  const [repos, setRepos] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchRepo()
      setRepos(data)
    }
    fetchData()
  }, [])

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">📁 레포지토리 목록</h2>
      <div className="space-y-2">
        {repos.map((repo) => (
          <RepositoryCard key={repo.id} repo={repo} />
        ))}
      </div>
    </section>
  )
}

export default RepositoryList
