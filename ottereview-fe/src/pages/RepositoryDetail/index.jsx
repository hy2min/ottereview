import { FolderCode, Globe, Lock, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
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

  const name = repo?.fullName?.split('/')[1]

  useEffect(() => {
    const load = async () => {
      try {
        const repoPRsData = await fetchRepoPRList(repoId)
        console.log('repoPRsdata : ', repoPRsData)
        setRepoPRs(repoPRsData)

        if (repo?.accountId && repoId) {
          const branchData = await fetchBrancheListByRepoId(repoId)
          console.log('branchdata : ', branchData)
          setBranches(branchData) // 로컬 상태에 저장
        }
      } catch (err) {
        console.error('❌ PR 또는 브랜치 목록 불러오기 실패:', err)
        setRepoPRs([]) // 에러 시 빈 배열로 초기화
        setBranches([]) // 브랜치도 빈 배열로 초기화
      }
    }

    if (repoId) {
      load()
    }
  }, [repoId, repo?.accountId])

  // repo가 없는 경우 로딩 또는 에러 처리
  if (!repo) {
    return (
      <div className="pt-2">
        <Box shadow className="min-h-24 flex items-center justify-center">
          <p className="text-stone-600">레포지토리를 찾을 수 없습니다.</p>
        </Box>
      </div>
    )
  }

  return (
    <div className="pt-2 space-y-3">
      <div className="flex justify-between items-center">
        <Box shadow className="min-h-24 flex-row space-y-1">
          <div className="flex items-center space-x-3">
            <FolderCode className="min-w-8 min-h-8" />
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl leading-tight">{name}</h1>
              {/* Private/Public 아이콘 + 텍스트 */}
              {repo.private ? (
                <div className="flex items-center space-x-1 text-amber-600">
                  <Lock className="w-6 h-6 " />
                  <span className="text-lg font-medium mt-[4px]">Private</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-emerald-600 mt-[2px]">
                  <Globe className="w-6 h-6" />
                  <span className="text-lg font-medium mt-[4px]">Public</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-stone-600">{repoPRs.length}개의 Pull Request</p>
        </Box>

        <Button variant="primary" size="lg" onClick={() => navigate(`/${repoId}/pr/create`)}>
          <Plus className="w-4 h-4 mr-2 mb-[2px]" />새 PR 생성하기
        </Button>
      </div>

      <div className="space-y-3">
        {repoPRs.length === 0 ? (
          <p>PR이 없습니다.</p>
        ) : (
          repoPRs.map((pr) => <PRCardDetail key={pr.id} pr={pr} />)
        )}
      </div>
    </div>
  )
}

export default RepositoryDetail
