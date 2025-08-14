import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import CustomSelect from '@/components/InputBox/CustomSelect'
import RepositoryCard from '@/features/repository/RepositoryCard'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const RepositoryList = () => {
  const navigate = useNavigate()
  const repos = useRepoStore((state) => state.repos)
  const [selectedAccount, setSelectedAccount] = useState('all')

  // 고유한 account 목록 생성 (커스텀 셀렉트용 옵션 형태로)
  const accountOptions = useMemo(() => {
    const uniqueAccounts = [...new Set(repos.map(repo => repo.fullName.split('/')[0]))]
    const sortedAccounts = uniqueAccounts.sort()
    
    return [
      { value: 'all', label: '전체 계정' },
      ...sortedAccounts.map(account => ({ value: account, label: account }))
    ]
  }, [repos])

  // 필터링된 레포 목록
  const filteredRepos = useMemo(() => {
    if (selectedAccount === 'all') return repos
    return repos.filter(repo => repo.fullName.split('/')[0] === selectedAccount)
  }, [repos, selectedAccount])

  const handleRepoClick = (repo) => {
    // fullName에서 레포 이름만 추출 (예: "username/repo-name" -> "repo-name")
    const repoName = repo.fullName.split('/')[1]
    // repoId는 path로, repoName은 쿼리 파라미터로 전달
    navigate(`/${repo.id}?name=${encodeURIComponent(repoName)}`)
  }

  return (
    <Box shadow className="w-full h-[70vh] flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📁</span>
            <h2 className="text-2xl font-semibold theme-text">Repository</h2>
          </div>
          <p className="text-sm theme-text-muted">연결된 저장소들을 관리하세요</p>
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs theme-text-muted text-right">계정 필터</label>
          <CustomSelect
            options={accountOptions}
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            placeholder="계정 선택"
          />
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {repos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl theme-text-muted">연결된 레포지토리가 없습니다.</p>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl theme-text-muted">선택된 계정에 레포지토리가 없습니다.</p>
          </div>
        ) : (
          filteredRepos.map((repo) =>
            repo.id ? (
              <RepositoryCard key={repo.id} repo={repo} onClick={() => handleRepoClick(repo)} />
            ) : null
          )
        )}
      </div>
    </Box>
  )
}

export default RepositoryList
