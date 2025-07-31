import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Section from '../../components/Section'
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
    <Section className="w-full h-[70vh] flex flex-col">
      <h2 className="text-xl mb-2">레포지토리 목록</h2>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {repos.map((repo) => (
          <RepositoryCard
            key={repo.id}
            repo={repo}
            onClick={() => handleRepoClick(repo.id)}
            createEnabled={repo.canCreatePR}
          />
        ))}
      </div>
    </Section>
  )
}

export default RepositoryList
