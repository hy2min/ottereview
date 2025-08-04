import { useState } from 'react'

import Box from '../../components/Box'
import InputBox from '../../components/InputBox'
import { useRepoStore } from '../repository/repoStore'
import PRCardCompact from './PRCardCompact'
import { usePRStore } from './stores/prStore'

const PRList = () => {
  const prs = usePRStore((state) => state.pullRequests)
  const repos = useRepoStore((state) => state.repos)
  const [selectedRepoId, setSelectedRepoId] = useState('all')

  // 전체 레포 기준으로 드롭다운 옵션 구성
  const repoOptions = repos.map((repo) => ({
    label: repo.fullName,
    value: String(repo.id),
  }))

  // 선택된 레포 기준으로 PR 필터링
  const filteredPRs =
    selectedRepoId === 'all' ? prs : prs.filter((pr) => pr.repo.id === Number(selectedRepoId))

  return (
    <Box shadow className="w-full h-[70vh] flex flex-col pl-4 pr-2">
      <div className="flex mb-2 justify-between">
        <h2 className="text-xl mr-8">PR 목록</h2>

        {/* 필터 드롭다운 */}
        <div className="-my-[9px] mr-7 w-80">
          <InputBox
            as="select"
            options={[{ label: '전체', value: 'all' }, ...repoOptions]}
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {filteredPRs.map((pr) => (
          <PRCardCompact key={pr.id} pr={pr} />
        ))}
      </div>
    </Box>
  )
}

export default PRList
