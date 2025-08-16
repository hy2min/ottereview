import { FolderCode, Globe, Lock, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'
import { fetchRepoPRList } from '@/features/pullRequest/prApi'
import PRCardDetail from '@/features/pullRequest/PRCardDetail'
import { fetchBrancheListByRepoId } from '@/features/repository/repoApi'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const RepositoryDetail = () => {
  const { repoId } = useParams()
  const navigate = useNavigate()

  const repos = useRepoStore((state) => state.repos)
  const repo = repos.find((r) => r.id === Number(repoId))

  const [repoPRs, setRepoPRs] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState('all') // 브랜치 필터 상태
  const [selectedState, setSelectedState] = useState('OPEN') // 상태 필터 상태 (기본값 OPEN)

  const name = repo?.fullName?.split('/')[1]

  useEffect(() => {
    const load = async () => {
      try {
        const repoPRsData = await fetchRepoPRList(repoId)
        setRepoPRs(repoPRsData)

        if (repo?.accountId && repoId) {
          const branchData = await fetchBrancheListByRepoId(repoId)
          setBranches(branchData)
        }
      } catch (err) {
        console.error('❌ PR 또는 브랜치 목록 불러오기 실패:', err)
        setRepoPRs([])
        setBranches([])
      }
    }

    if (repoId) {
      load()
    }
  }, [repoId, repo?.accountId])

  // 브랜치와 상태 모두 필터링
  const filteredPRs = repoPRs.filter((pr) => {
    const branchMatch = selectedBranch === 'all' || pr.head === selectedBranch
    const stateMatch = selectedState === 'all' || pr.state === selectedState
    return branchMatch && stateMatch
  })

  // 상태 필터 버튼들
  const stateFilters = [
    { label: 'OPEN', value: 'OPEN', variant: 'success' },
    { label: 'MERGED', value: 'MERGED', variant: 'primary' },
    { label: 'CLOSED', value: 'CLOSED', variant: 'secondary' },
    { label: 'ALL', value: 'all', variant: 'outline' },
  ]

  const branchOptions = [
    { label: '모든 브랜치', value: 'all' },
    ...branches.map((branch) => ({
      label: branch.name,
      value: branch.name,
    })),
  ]


  if (!repo) {
    return (
      <div className="pt-2">
        <Box shadow className="min-h-24 flex items-center justify-center">
          <p className="theme-text-secondary">레포지토리를 찾을 수 없습니다.</p>
        </Box>
      </div>
    )
  }

  return (
    <div className="pt-2 space-y-3">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <Box shadow className="min-h-24 flex-row space-y-1 w-full lg:w-1/2">
          <div className="flex items-center space-x-3 min-w-0">
            <FolderCode className="min-w-8 min-h-8 shrink-0" />
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <h1 className="text-2xl leading-tight truncate theme-text">{name}</h1>
              {repo.private ? (
                <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" title="Private Repository" />
              ) : (
                <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" title="Public Repository" />
              )}
            </div>
          </div>
          <p className="theme-text-secondary">{filteredPRs.length}개의 Pull Request</p>
        </Box>

        <div className="flex gap-3 items-end">
          {/* 필터 영역 (브랜치 + 상태 버튼들) */}
          <div className="flex flex-col gap-2">
            {/* 브랜치 필터 */}
            <div className="w-64">
              <InputBox
                as="select"
                options={branchOptions}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                placeholder="브랜치 선택"
              />
            </div>

            {/* 상태 필터 버튼들 */}
            <div className="flex gap-1">
              {stateFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={selectedState === filter.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedState(filter.value)}
                  className="px-2 py-1 text-xs w-16"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 새 PR 생성 버튼 */}
          <div className="flex-shrink-0 ml-auto">
            <Button variant="primary" size="lg" onClick={() => navigate(`/${repoId}/pr/create?repoName=${encodeURIComponent(repo.fullName)}`)}>
              <Plus className="w-4 h-4 mr-2 mb-[2px]" />새 PR 생성하기
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredPRs.length === 0 ? (
          selectedBranch === 'all' && selectedState === 'all' ? (
            <p className="theme-text-secondary">PR이 없습니다.</p>
          ) : (
            <p className="theme-text-secondary">선택한 조건에 맞는 PR이 없습니다.</p>
          )
        ) : (
          filteredPRs.map((pr) => <PRCardDetail key={pr.id} pr={pr} />)
        )}
      </div>
    </div>
  )
}

export default RepositoryDetail