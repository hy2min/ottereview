import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'
import { validateBranches, validatePR } from '@/features/pullRequest/prApi'
import { fetchBrancheListByRepoId } from '@/features/repository/repoApi'
import { useBranchStore } from '@/features/repository/stores/branchStore'

const PRCreateStep1 = ({
  goToStep,
  repoId,
  formData,
  updateFormData,
  setValidationPR,
  setValidationBranches,
}) => {
  const navigate = useNavigate()
  const [prCheckResult, setPrCheckResult] = useState(null) // 'exists' | 'not_exists' | null
  const [existingPRData, setExistingPRData] = useState(null)

  const [source, setSource] = useState(formData.source || '')
  const [target, setTarget] = useState(formData.target || '')
  const [canGoNext, setCanGoNext] = useState(false)

  const branches = useBranchStore((state) => state.branchesByRepo[repoId] || [])
  const setBranchesForRepo = useBranchStore((state) => state.setBranchesForRepo)

  const handleValidateBranches = async () => {
    try {
      const data = await validateBranches({
        repoId,
        source,
        target,
      })

      setValidationBranches(data)
      setCanGoNext(data?.isPossible)
      console.log(data?.isPossible)
      console.log('ValidateBranches', data)
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
  }, [repoId, setBranchesForRepo])

  // source나 target이 바뀔 때 상태 초기화 및 검증
  useEffect(() => {
    // 브랜치가 바뀌면 이전 결과를 먼저 초기화
    setPrCheckResult(null)
    setExistingPRData(null)
    setValidationBranches(null) // 브랜치 검증 결과도 초기화

    const isValidBranches = source && target && source !== target

    if (isValidBranches) {
      // 직접 API 호출하여 의존성 배열 문제 해결
      const validatePRData = async () => {
        try {
          const data = await validatePR({
            repoId,
            source,
            target,
          })

          // 응답 성공 = 기존 PR이 존재
          setValidationPR(data)
          setPrCheckResult('exists')
          setExistingPRData(data)
          console.log('ValidatePR - 기존 PR 존재:', data)
        } catch (err) {
          // 에러 = PR이 존재하지 않음 (생성 가능)
          console.log('ValidatePR - PR 없음, 생성 가능')
          setPrCheckResult('not_exists')
          setExistingPRData(null)
        }
      }

      const timeoutId = setTimeout(() => {
        validatePRData()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [source, target, repoId, setValidationPR, setValidationBranches])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      setPrCheckResult(null)
      setExistingPRData(null)
    }
  }, [])

  const branchOptions = [
    { label: '브랜치를 선택하세요', value: '' },
    ...branches.map((b) => ({
      label: b.name,
      value: b.name,
    })),
  ]

  const handleGoToPRReview = () => {
    if (existingPRData && existingPRData.id) {
      navigate(`/${repoId}/pr/${existingPRData.id}/review`)
    }
  }

  const handleNextStep = () => {
    // props로 받은 updateFormData 사용
    updateFormData({ source: source, target: target })
    console.log('Updated formData:', { source: source, target: target })
    goToStep(2)
  }

  // 상태별 UI 결정
  const isSameBranch = source && target && source === target
  const canCreatePR = prCheckResult === 'not_exists'
  const existingPR = prCheckResult === 'exists'

  return (
    <div className="space-y-4">
      <Box shadow className="space-y-4 w-2/3 mx-auto">
        <div className="space-y-2">
          <InputBox
            label="소스 브랜치"
            as="select"
            options={branchOptions}
            value={source || ''}
            onChange={(e) => setSource(e.target.value)}
            placeholder="소스 브랜치를 선택하세요"
          />

          <InputBox
            label="타겟 브랜치"
            as="select"
            options={branchOptions}
            value={target || ''}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="타겟 브랜치를 선택하세요"
          />
        </div>

        {/* 고정된 메시지 영역 */}
        <div className="min-h-[60px] flex items-center justify-center">
          {isSameBranch && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800 w-full">
              소스 브랜치와 타겟 브랜치가 동일합니다.
            </div>
          )}

          {source && target && !isSameBranch && !existingPR && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-blue-800 break-words w-full">
              <strong>{source}</strong> 에서 <strong>{target}</strong> 로의 변경을 생성합니다.
            </div>
          )}

          {existingPR && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-md w-full">
              <p className="text-green-800">이미 생성된 Pull Request가 있습니다.</p>
            </div>
          )}
        </div>

        {/* 고정된 버튼 영역 */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={existingPR ? handleGoToPRReview : handleValidateBranches}
            disabled={isSameBranch || !canCreatePR} // canCreatePR이 true일 때만 브랜치 검증 버튼 활성화
            className={existingPR ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {existingPR ? '기존 PR 리뷰하러 가기' : '브랜치 검증'}
          </Button>
        </div>
      </Box>
      <div className="mx-auto z-10">
        <div className="flex justify-center items-center space-x-3">
          <Button
            onClick={() => {
              navigate('/dashboard')
            }}
            variant="secondary"
          >
            이전
          </Button>

          <Button onClick={handleNextStep} variant="primary" disabled={!canGoNext}>
            다음
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PRCreateStep1
