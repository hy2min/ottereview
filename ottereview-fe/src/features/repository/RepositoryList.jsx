import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import CustomSelect from '@/components/InputBox/CustomSelect'
import RepositoryCard from '@/features/repository/RepositoryCard'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const RepositoryList = () => {
  const navigate = useNavigate()
  const repos = useRepoStore((state) => state.repos)
  const [selectedAccount, setSelectedAccount] = useState('all')

  const handleRepoClick = (repo) => {
    // fullName에서 레포 이름만 추출 (예: "username/repo-name" -> "repo-name")
    const repoName = repo.fullName.split('/')[1]
    // repoId는 path로, repoName은 쿼리 파라미터로 전달
    navigate(`/${repo.id}?name=${encodeURIComponent(repoName)}`)
  }

  // 고유한 account 목록 생성 및 필터링된 레포 목록
  const { accountOptions, filteredRepos } = useMemo(() => {
    const accounts = [...new Set(repos.map((repo) => repo.fullName.split('/')[0]))].sort()
    const options = [
      { label: 'Organization', value: 'all' },
      ...accounts.map((account) => ({ label: account, value: account })),
    ]
    const filtered =
      selectedAccount === 'all'
        ? repos
        : repos.filter((repo) => repo.fullName.split('/')[0] === selectedAccount)

    return {
      accountOptions: options,
      filteredRepos: filtered,
    }
  }, [repos, selectedAccount])

  return (
    <Box shadow className="w-full h-[70vh] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl">레포지토리</h2>

        {/* Account 필터 선택 */}
        {accountOptions.length > 2 && (
          <div className="w-48">
            <CustomSelect
              options={accountOptions}
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              placeholder="계정 선택"
            />
          </div>
        )}
      </div>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {repos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl text-gray-500">연결된 레포지토리가 없습니다.</p>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-gray-500">선택한 계정의 레포지토리가 없습니다.</p>
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
