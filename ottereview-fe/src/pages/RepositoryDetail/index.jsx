import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { fetchPR } from '../../features/pullRequest/prApi'
import PRCard from '../../features/pullRequest/PRCard'

const RepositoryDetail = () => {
  const { repoId } = useParams()
  const [prs, setPrs] = useState([])

  useEffect(() => {
    const load = async () => {
      const data = await fetchPR()
      const filtered = data.filter((pr) => pr.repoId === Number(repoId))
      setPrs(filtered)
    }
    load()
  }, [repoId])

  return (
    // PR 목록
    <div className="space-y-4 py-4">
      {prs.length === 0 ? (
        <p>PR이 없습니다.</p>
      ) : (
        prs.map((pr) => <PRCard key={pr.id} pr={pr} context="repositoryDetail" />)
      )}
    </div>
  )
}

export default RepositoryDetail
