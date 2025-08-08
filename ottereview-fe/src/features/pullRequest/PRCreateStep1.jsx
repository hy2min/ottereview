import axios from 'axios'
import { useEffect } from 'react'

import Box from '@/components/Box'
import { fetchBrancheListByRepoId } from '@/features/repository/repoApi'
import { useBranchStore } from '@/features/repository/stores/branchStore'
import { api } from '@/lib/api'

import InputBox from '../../components/InputBox'
import { usePRCreateStore } from './stores/prCreateStore'

const PRCreateStep1 = ({ repoId, accountId, setNextDisabled }) => {
  const formData = usePRCreateStore((state) => state.formData)
  const setFormData = usePRCreateStore((state) => state.setFormData)

  const branches = useBranchStore((state) => state.branchesByRepo[repoId] || [])
  const setBranchesForRepo = useBranchStore((state) => state.setBranchesForRepo)

  const validateBranches = async (source, target, cancelToken) => {
    try {
      const res = await api.post(
        `/api/repositories/${repoId}/pull-requests/preparation/validation`,
        { source, target },
        { cancelToken }
      )
      console.log('브랜치 검증 응답:', res.data)
      // 검증 성공 시 무조건 활성화
      setNextDisabled(false)
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('브랜치 검증 요청 취소됨')
      } else {
        console.error('브랜치 검증 실패:', err)
      }
      setNextDisabled(true) // 실패나 취소 시 비활성화
    }
  }

  useEffect(() => {
    if (
      !formData.sourceBranch ||
      !formData.targetBranch ||
      formData.sourceBranch === formData.targetBranch
    ) {
      setNextDisabled(true)
      return
    }

    const cancelTokenSource = axios.CancelToken.source()
    const timer = setTimeout(() => {
      validateBranches(formData.sourceBranch, formData.targetBranch, cancelTokenSource.token)
    }, 500)

    return () => {
      cancelTokenSource.cancel()
      clearTimeout(timer)
    }
  }, [formData.sourceBranch, formData.targetBranch])

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const fetched = await fetchBrancheListByRepoId({ repoId, accountId })
        setBranchesForRepo(repoId, fetched)
      } catch (err) {
        console.error('브랜치 목록 불러오기 실패:', err)
      }
    }

    loadBranches()
  }, [repoId, accountId])

  const branchOptions = [
    { label: '브랜치를 선택하세요', value: '' },
    ...branches.map((b) => ({
      label: b.name,
      value: b.name,
    })),
  ]

  return (
    <Box shadow className="space-y-4">
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
    </Box>
  )
}

export default PRCreateStep1
