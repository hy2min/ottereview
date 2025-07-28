import { useEffect, useState } from 'react'

import { fetchPR } from './prApi'
import PRCard from './PRCard'

const PRList = () => {
  const [prs, setPrs] = useState([])
  const [selectedRepoId, setSelectedRepoId] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchPR()
      setPrs(data)
    }
    fetchData()
  }, [])

  // repoId별로 고유한 목록 추출 (repoId + repo 이름 묶어서)
  const repoOptions = [...new Map(prs.map((pr) => [pr.repoId, pr.repo])).entries()]

  // 필터링된 PR
  const filteredPRs =
    selectedRepoId === 'all' ? prs : prs.filter((pr) => pr.repoId === Number(selectedRepoId))

  return (
    <section className="border p-4 space-y-4">
      <h2 className="text-xl font-semibold">📦 PR 목록</h2>

      {/* 필터 드롭다운 */}
      <div>
        <label className="mr-2">레포 필터:</label>
        <select
          className="border px-2 py-1"
          value={selectedRepoId}
          onChange={(e) => setSelectedRepoId(e.target.value)}
        >
          <option value="all">전체</option>
          {repoOptions.map(([repoId, repoName]) => (
            <option key={repoId} value={repoId}>
              {repoName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filteredPRs.map((pr) => (
          <PRCard key={pr.id} pr={pr} context="dashboard" />
        ))}
      </div>
    </section>
  )
}

export default PRList
