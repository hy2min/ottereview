import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import { fetchPRList } from '@/features/pullRequest/prApi'
import PRCardDetail from '@/features/pullRequest/PRCardDetail'
import { usePRStore } from '@/features/pullRequest/stores/prStore'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const RepositoryDetail = () => {
  const { repoId } = useParams()
  const navigate = useNavigate()

  const repos = useRepoStore((state) => state.repos)
  const repo = repos.find((r) => r.id === Number(repoId))
  const repoName = repo?.fullName || '(알 수 없는 레포지토리)'

  const repoPRs = usePRStore((state) => state.repoPRs)
  const setRepoPRs = usePRStore((state) => state.setRepoPRs)

  const prs = repoPRs.filter((pr) => pr.repo?.id === Number(repoId))
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPRList(repoId)
        console.log(data)
        setRepoPRs(data)
      } catch (err) {
        console.error('❌ PR 목록 불러오기 실패:', err)
      }
    }

    load()
  }, [repoId, setRepoPRs])

  return (
    <div className="pt-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl mb-1">{repoName}</h1>
          <p className="text-stone-600">{prs.length}개의 Pull Request</p>
        </div>

        <Button variant="primary" size="lg" onClick={() => navigate(`/${repoId}/pr/create`)}>
          <Plus className="w-4 h-4 mr-2 mb-[2px]" />새 PR 생성하기
        </Button>
      </div>

      <div className="space-y-4 py-4">
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
