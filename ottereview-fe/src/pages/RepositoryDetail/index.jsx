import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '../../components/Button'
import Section from '../../components/Section'
import { fetchPR } from '../../features/pullRequest/prApi'
import PRCardDetail from '../../features/pullRequest/PRCardDetail'

const RepositoryDetail = () => {
  const { repoId } = useParams()
  const navigate = useNavigate()
  const [prs, setPrs] = useState([])
  console.log(repoId)

  useEffect(() => {
    const load = async () => {
      const data = await fetchPR()
      const filtered = data.filter((pr) => pr.repo.id === Number(repoId))
      setPrs(filtered)
    }
    load()
  }, [repoId])

  const repoName = prs[0]?.repo.name || ''

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl mb-1">{repoName} PR 목록</h1>
            <p className="text-stone-600">{prs.length}개의 Pull Request</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            navigate(`/${repoId}/pr/create`)
          }}
        >
          <Plus className="w-4 h-4 mr-2 mb-[2px]" />새 PR 생성하기
        </Button>
      </div>

      <div className="space-y-4 py-4">
        <Section className="space-y-2">
          {prs.length === 0 ? (
            <p>PR이 없습니다.</p>
          ) : (
            prs.map((pr) => <PRCardDetail key={pr.id} pr={pr} />)
          )}
        </Section>
      </div>
    </div>
  )
}

export default RepositoryDetail
