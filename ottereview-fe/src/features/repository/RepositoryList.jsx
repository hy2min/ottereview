import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import RepositoryCard from '@/features/repository/RepositoryCard'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const RepositoryList = () => {
  const navigate = useNavigate()
  const repos = useRepoStore((state) => state.repos)

  const handleImport = () => {
    const importUrl = import.meta.env.VITE_GITHUB_IMPORT_URL
    const width = 600
    const height = 700

    window.open(
      importUrl,
      '_blank',
      `width=${width},height=${height},left=${(screen.width - width) / 2},top=${(screen.height - height) / 2},scrollbars=yes,resizable=yes`
    )
  }

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
        <div className="flex flex-col gap-1">
          <label className="text-xs theme-text-muted text-right">새 저장소</label>
          <Button variant="primary" onClick={handleImport}>
            + 레포지토리 연결
          </Button>
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {repos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl theme-text-muted">연결된 레포지토리가 없습니다.</p>
          </div>
        ) : (
          repos.map((repo) =>
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
