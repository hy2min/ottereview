import { FolderCode, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import { fetchPRList } from '@/features/pullRequest/prApi'
import PRCardDetail from '@/features/pullRequest/PRCardDetail'
import { usePRStore } from '@/features/pullRequest/stores/prStore'
import { fetchBrancheListByRepoId } from '@/features/repository/repoApi'
import { useBranchStore } from '@/features/repository/stores/branchStore'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const RepositoryDetail = () => {
  const { repoId } = useParams()
  const navigate = useNavigate()
  const setBranchesForRepo = useBranchStore((state) => state.setBranchesForRepo)

  const repos = useRepoStore((state) => state.repos)
  const repo = repos.find((r) => r.id === Number(repoId))

  const [account, name] = repo.fullName.split('/')

  const repoPRs = usePRStore((state) => state.repoPRs)
  const setRepoPRs = usePRStore((state) => state.setRepoPRs)

  const prs = repoPRs.filter((pr) => pr.repo?.id === Number(repoId))

  useEffect(() => {
    const load = async () => {
      try {
        const repoData = await fetchPRList(repoId)
        console.log('repodata : ', repoData)
        setRepoPRs(repoData)

        if (repo?.accountId && repoId) {
          const branchData = await fetchBrancheListByRepoId(repoId)
          console.log('branchdata : ', branchData)
          setBranchesForRepo(Number(repoId), branchData)
        }
      } catch (err) {
        console.error('❌ PR 또는 브랜치 목록 불러오기 실패:', err)
      }
    }

    load()
  }, [repoId, setRepoPRs])

  return (
    <div className="pt-2 space-y-3">
      <div className="flex justify-between items-center">
        <Box shadow className="p-4">
          <div className="flex items-center space-x-1">
            <FolderCode className="w-8 h-8 mb-[4px]" />
            <h1 className="text-2xl">{name}</h1>
          </div>
          <p className="text-stone-600">{prs.length}개의 Pull Request</p>
        </Box>

        <Button variant="primary" size="lg" onClick={() => navigate(`/${repoId}/pr/create`)}>
          <Plus className="w-4 h-4 mr-2 mb-[2px]" />새 PR 생성하기
        </Button>
      </div>

      <div className="space-y-3">
        {prs.length === 0 ? (
          <p>PR이 없습니다.</p>
        ) : (
          prs.map((pr) => <PRCardDetail key={pr.id} pr={pr} />)
        )}
      </div>
    </div>
  )
}

export default RepositoryDetail
