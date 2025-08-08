import { useEffect } from 'react'

import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'
import { validateBranches } from '@/features/pullRequest/prApi'
import { usePRCreateStore } from '@/features/pullRequest/stores/prCreateStore'
import { fetchBrancheListByRepoId } from '@/features/repository/repoApi'
import { useBranchStore } from '@/features/repository/stores/branchStore'

const PRCreateStep1 = ({ repoId, accountId }) => {
  const formData = usePRCreateStore((state) => state.formData)
  const setFormData = usePRCreateStore((state) => state.setFormData)

  const branches = useBranchStore((state) => state.branchesByRepo[repoId] || [])
  const setBranchesForRepo = useBranchStore((state) => state.setBranchesForRepo)
  const setValidationResult = usePRCreateStore((state) => state.setValidationResult)


  const handleValidate = async () => {
    try {
      const result = await validateBranches({
        repoId,
        source: formData.sourceBranch,
        target: formData.targetBranch,
      })

      setValidationResult(result)
      console.log(result)
    } catch (err) {
      console.error('브랜치 검증 실패:', err)
    }
  }

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const fetched = await fetchBrancheListByRepoId(repoId)
        setBranchesForRepo(repoId, fetched)
      } catch (err) {
        console.error('브랜치 목록 불러오기 실패:', err)
      }
    }

    loadBranches()
  }, [repoId, accountId, setBranchesForRepo])

  const branchOptions = [
    { label: '브랜치를 선택하세요', value: '' },
    ...branches.map((b) => ({
      label: b.name,
      value: b.name,
    })),
  ]

  return (
    <Box shadow className="space-y-4 w-2/3 mx-auto">
      <div className="space-y-2">
        <InputBox
          label="소스 브랜치"
          as="select"
          options={branchOptions}
          value={formData.sourceBranch || ''}
          onChange={(e) => setFormData({ sourceBranch: e.target.value })}
          placeholder="소스 브랜치를 선택하세요"
        />

        <InputBox
          label="타겟 브랜치"
          as="select"
          options={branchOptions}
          value={formData.targetBranch || ''}
          onChange={(e) => setFormData({ targetBranch: e.target.value })}
          placeholder="타겟 브랜치를 선택하세요"
        />
      </div>

      {formData.sourceBranch &&
        formData.targetBranch &&
        formData.sourceBranch !== formData.targetBranch && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-blue-800">
            <strong>{formData.sourceBranch}</strong> 에서 <strong>{formData.targetBranch}</strong>{' '}
            로의 변경을 생성합니다.
          </div>
        )}

      {formData.sourceBranch &&
        formData.targetBranch &&
        formData.sourceBranch === formData.targetBranch && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800">
            소스 브랜치와 타겟 브랜치가 동일합니다.
          </div>
        )}

      <Button
        variant="primary"
        onClick={handleValidate}
        disabled={
          !formData.sourceBranch ||
          !formData.targetBranch ||
          formData.sourceBranch === formData.targetBranch
        }
      >
        브랜치 검증
      </Button>
    </Box>
  )
}

export default PRCreateStep1
