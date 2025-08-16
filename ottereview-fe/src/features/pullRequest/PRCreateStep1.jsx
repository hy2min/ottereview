import { AlertTriangle, CheckCircle, FileText, Search, X, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'
import { validateBranches, validatePR } from '@/features/pullRequest/prApi'

const PRCreateStep1 = ({
  goToStep,
  repoId,
  selectedBranches,
  updateSelectedBranches,
  setValidationBranches,
  validationBranches,
  branches,
}) => {
  const navigate = useNavigate()
  const [prCheckResult, setPrCheckResult] = useState(null)
  const [existingPRData, setExistingPRData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isValidatingBranches, setIsValidatingBranches] = useState(false)

  const [source, setSource] = useState(selectedBranches.source || '')
  const [target, setTarget] = useState(selectedBranches.target || '')

  // selectedBranches가 업데이트되면 로컬 상태도 동기화 (다른 단계에서 돌아왔을 때)
  useEffect(() => {
    setSource(selectedBranches.source || '')
    setTarget(selectedBranches.target || '')
  }, [selectedBranches.source, selectedBranches.target])

  // 로컬 상태가 변경되면 즉시 selectedBranches에도 반영
  useEffect(() => {
    updateSelectedBranches({ source, target })
  }, [source, target, updateSelectedBranches])

  const handleValidateBranches = async () => {
    if (isValidatingBranches) return // 중복 실행 방지

    setIsValidatingBranches(true)
    try {
      const data = await validateBranches({
        repoId,
        source,
        target,
      })

      setValidationBranches(data)
      console.log(data?.isPossible)
      console.log('ValidateBranches', data)
    } catch (err) {
      console.error('브랜치 검증 실패:', err)
    } finally {
      setIsValidatingBranches(false)
    }
  }

  // source나 target이 바뀔 때 상태 초기화 및 검증
  useEffect(() => {
    // 브랜치가 바뀌면 이전 결과를 먼저 초기화
    setPrCheckResult(null)
    setExistingPRData(null)
    setErrorMessage('')
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

          // isExist가 true면 기존 PR 존재
          if (data.isExist) {
            setPrCheckResult('exists')
            setExistingPRData(data)
            setErrorMessage('')
            console.log('ValidatePR - 기존 PR 존재:', data)
          } else {
            // isExist가 false면 PR 생성 가능하지만 브랜치 검증 필요
            setPrCheckResult('not_exists')
            setExistingPRData(null)
            setErrorMessage('')
            console.log('ValidatePR - PR 없음, 생성 가능', data)
          }
        } catch (err) {
          console.log('ValidatePR 에러:', err)
          // API 에러는 생성 불가 상태로 처리
          setPrCheckResult('error')
          setExistingPRData(null)
          setErrorMessage('PR 확인 중 오류가 발생했습니다.')
        }
      }

      const timeoutId = setTimeout(() => {
        validatePRData()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [source, target, repoId, setValidationBranches])

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

  console.log('Branch options:', branchOptions)
  console.log('Current source:', source, 'Current target:', target)

  const handleGoToPRReview = () => {
    if (existingPRData && existingPRData.prId) {
      navigate(`/${repoId}/pr/${existingPRData.prId}/review`)
    }
  }

  const handleNextStep = () => {
    // useEffect에서 이미 formData 업데이트됨
    console.log('Current formData:', { source, target })
    goToStep(2)
  }

  // 상태별 UI 결정
  const isSameBranch = source && target && source === target
  const canCreatePR = prCheckResult === 'not_exists'
  const existingPR = prCheckResult === 'exists'
  const hasError = prCheckResult === 'error'
  const canGoNext = validationBranches?.isPossible === true

  // 브랜치 검증 버튼 활성화 조건: PR이 존재하지 않을 때만
  const canValidateBranches = canCreatePR && !isSameBranch && !hasError

  return (
    <div className="mt-8 space-y-6 animate-slide-in-right">
      <Box shadow className="space-y-6 w-full max-w-3xl mx-auto premium-card">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold theme-text mb-2">브랜치 선택</h2>
          <p className="theme-text-secondary">비교할 브랜치를 선택해주세요</p>
        </div>

        {/* 드롭다운 컨테이너 */}
        <div className="space-y-8">
          {/* 소스 브랜치 드롭다운 */}
          <div className="relative">
            <InputBox
              label="소스 브랜치"
              as="select"
              options={branchOptions}
              value={source || ''}
              onChange={(e) => {
                console.log('Source branch selected:', e.target.value)
                setSource(e.target.value)
              }}
              placeholder="소스 브랜치를 선택하세요"
            />
          </div>

          {/* 타겟 브랜치 드롭다운 */}
          <div className="relative">
            <InputBox
              label="타겟 브랜치"
              as="select"
              options={branchOptions}
              value={target || ''}
              onChange={(e) => {
                console.log('Target branch selected:', e.target.value)
                setTarget(e.target.value)
              }}
              placeholder="타겟 브랜치를 선택하세요"
            />
          </div>
        </div>

        {/* 고정된 메시지 영역 */}
        <div className="min-h-[80px] flex items-center justify-center">
          {isSameBranch && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 rounded-lg text-red-800 dark:text-red-300 w-full animate-wiggle shadow-md">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>소스 브랜치와 타겟 브랜치가 동일합니다.</span>
              </div>
            </div>
          )}

          {source &&
            target &&
            !isSameBranch &&
            !existingPR &&
            !hasError &&
            (!validationBranches || validationBranches.isPossible === true)}

          {existingPR && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-4 rounded-lg w-full animate-scale-in shadow-md">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-800 dark:text-green-300">
                  이미 생성된 Pull Request가 있습니다.
                </p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 rounded-lg text-red-800 dark:text-red-300 w-full animate-wiggle shadow-md">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {validationBranches && validationBranches.isPossible === false && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 rounded-lg text-red-800 dark:text-red-300 w-full animate-wiggle shadow-md">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span>PR을 생성할 수 없습니다. 브랜치 정보를 확인해주세요.</span>
              </div>
            </div>
          )}
        </div>

        {/* 고정된 버튼 영역 */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={existingPR ? handleGoToPRReview : handleValidateBranches}
            disabled={existingPR ? false : !canValidateBranches || isValidatingBranches}
            className={`btn-interactive glow-on-hover transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none ${
              existingPR
                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                : ''
            }`}
          >
            {existingPR ? (
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>기존 PR 리뷰하러 가기</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                {isValidatingBranches ? (
                  <>
                    <Settings className="w-4 h-4 animate-spin" />
                    <span>브랜치 검증 중...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>브랜치 검증</span>
                  </>
                )}
              </span>
            )}
          </Button>
        </div>
      </Box>

      {/* 하단 네비게이션 버튼 영역 */}
      <div className="mx-auto">
        <div className="flex justify-center items-center space-x-4">
          <Button
            onClick={() => {
              navigate(`/${repoId}`)
            }}
            variant="secondary"
            className="btn-interactive transform transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center space-x-2">
              <span>←</span>
              <span>이전</span>
            </span>
          </Button>

          <Button
            onClick={handleNextStep}
            variant="primary"
            disabled={!canGoNext}
            className="btn-interactive glow-on-hover transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
          >
            <span className="flex items-center space-x-2">
              <span>다음</span>
              <span>→</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PRCreateStep1
