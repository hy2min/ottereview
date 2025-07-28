import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { fetchPR } from '../../features/pullRequest/prApi'
import PRCard from '../../features/pullRequest/PRCard'

const RepositoryDetail = () => {
  const { repoId } = useParams()
  const navigate = useNavigate()
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
    <div className="p-6">
      <div className="flex items-center gap-4">
        <button className="border px-4 py-1" onClick={() => navigate(-1)}>
          ← 뒤로가기
        </button>
        <h1 className="text-2xl font-bold">레포 상세 페이지 (ID: {repoId})</h1>
      </div>

      {/* PR 목록 */}
      <div className="space-y-4 py-4">
        {prs.length === 0 ? <p>PR이 없습니다.</p> : prs.map((pr) => <PRCard key={pr.id} pr={pr} />)}
      </div>
    </div>
  )
}

export default RepositoryDetail
