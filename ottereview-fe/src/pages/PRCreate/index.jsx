import { FolderCode } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import Box from '@/components/Box'
import StepIndicator from '@/components/StepIndicator'
import PRCreateStep1 from '@/features/pullRequest/PRCreateStep1'
import PRCreateStep2 from '@/features/pullRequest/PRCreateStep2'
import PRCreateStep3 from '@/features/pullRequest/PRCreateStep3'
import PRCreateStep4 from '@/features/pullRequest/PRCreateStep4'
import PRCreateStep5 from '@/features/pullRequest/PRCreateStep5'
import { fetchBrancheListByRepoId } from '@/features/repository/repoApi'
import { useCommentManager } from '@/hooks/useCommentManager'

const PRCreate = () => {
  const { repoId } = useParams()
  const [searchParams] = useSearchParams()
  const repoName = searchParams.get('repoName')
  const [step, setStep] = useState(1)

  // 선택된 브랜치 정보 관리 (Step1에서 선택, 최종 PR 생성시 사용)
  const [selectedBranches, setSelectedBranches] = useState({
    source: '',
    target: '',
  })

  // PR 제목과 설명을 별도로 관리
  const [prTitle, setPrTitle] = useState('')
  const [prBody, setPrBody] = useState('')
  const [validationBranches, setValidationBranches] = useState(null)
  const [aiConvention, setAIConvention] = useState(null)
  const [aiOthers, setAIOthers] = useState(null)

  // 브랜치 정보를 PRCreate에서 관리
  const [branches, setBranches] = useState([])

  // 컨벤션 규칙들을 PRCreate에서 관리
  const [conventionRules, setConventionRules] = useState({
    file_names: '',
    function_names: '',
    variable_names: '',
    class_names: '',
    constant_names: '',
  })

  // 브랜치 목록 로드
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const fetched = await fetchBrancheListByRepoId(repoId)
        setBranches(fetched)
      } catch (err) {
        console.error('브랜치 목록 불러오기 실패:', err)
        setBranches([]) // 에러 시 빈 배열로 초기화
      }
    }

    if (repoId) {
      loadBranches()
    }
  }, [repoId])

  // 댓글 관리 훅 사용
  const {
    reviewComments,
    audioFiles,
    fileComments,
    handleAddFileLineComment,
    handleRemoveComment,
    resetCommentStates,
  } = useCommentManager()

  // 선택된 리뷰어들 (객체 배열로 관리)
  const [selectedReviewers, setSelectedReviewers] = useState([])

  const updateSelectedBranches = useCallback((partial) => {
    setSelectedBranches((prev) => ({ ...prev, ...partial }))
  }, [])

  const goToStep = useCallback((stepNumber) => {
    setStep(stepNumber)
  }, [])

  const [aiSummary, setAISummary] = useState('')

  const steps = ['브랜치 선택', '컨벤션 확인', 'PR 정보 입력', '리뷰어 선택', '최종 제출']

  // Step3 props를 별도로 메모이제이션
  const step3Props = useMemo(
    () => ({
      goToStep,
      repoId,
      validationBranches,
      aiOthers,
      setAIOthers,
      reviewComments,
      onAddComment: handleAddFileLineComment,
      onRemoveComment: handleRemoveComment,
      fileComments,
      prTitle,
      setPrTitle,
      prBody,
      setPrBody,
    }),
    [
      goToStep,
      repoId,
      validationBranches,
      aiOthers,
      setAIOthers,
      reviewComments,
      handleAddFileLineComment,
      handleRemoveComment,
      fileComments,
      prTitle,
      setPrTitle,
      prBody,
      setPrBody,
    ]
  )

  const getStepProps = (stepNumber) => {
    const baseProps = { goToStep, repoId }

    switch (stepNumber) {
      case 1:
        return {
          ...baseProps,
          selectedBranches,
          updateSelectedBranches,
          validationBranches,
          setValidationBranches,
          branches,
        }
      case 2:
        return {
          ...baseProps,
          validationBranches,
          aiConvention,
          setAIConvention,
          aiOthers,
          setAIOthers,
          conventionRules,
          setConventionRules,
          selectedBranches,
        }
      case 3:
        return step3Props
      case 4:
        return {
          ...baseProps,
          validationBranches,
          aiOthers,
          selectedReviewers,
          setSelectedReviewers,
          setAISummary,
        }
      case 5:
        return {
          ...baseProps,
          validationBranches,
          prTitle,
          prBody,
          selectedReviewers,
          resetCommentStates,
          reviewComments,
          audioFiles,
          aiSummary,
        }
      default:
        return baseProps
    }
  }

  const renderStepComponent = () => {
    switch (step) {
      case 1:
        return <PRCreateStep1 {...getStepProps(1)} />
      case 2:
        return <PRCreateStep2 {...getStepProps(2)} />
      case 3:
        return <PRCreateStep3 {...getStepProps(3)} />
      case 4:
        return <PRCreateStep4 {...getStepProps(4)} />
      case 5:
        return <PRCreateStep5 {...getStepProps(5)} />
      default:
        return <PRCreateStep1 {...getStepProps(1)} />
    }
  }

  return (
    <div className="relative min-h-screen pb-[100px] theme-bg-primary">
      <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold theme-text mb-2 text-gradient-animated">
            Pull Request 생성
          </h1>
          <p className="theme-text-secondary text-lg">
            단계별로 진행하여 완벽한 PR을 만들어보세요
          </p>
        </div>
        
        <StepIndicator currentStep={step} steps={steps} />
        
        <div className="relative z-20">
          <div className="step-transition-container">
            {renderStepComponent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PRCreate
