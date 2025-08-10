import { useState } from 'react'
import { useParams } from 'react-router-dom'

import StepIndicator from '@/components/StepIndicator'
import PRCreateStep1 from '@/features/pullRequest/PRCreateStep1'
import PRCreateStep2 from '@/features/pullRequest/PRCreateStep2'
import PRCreateStep3 from '@/features/pullRequest/PRCreateStep3'
import PRCreateStep4 from '@/features/pullRequest/PRCreateStep4'
import PRCreateStep5 from '@/features/pullRequest/PRCreateStep5'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const PRCreate = () => {
  const { repoId } = useParams()
  const repo = useRepoStore((state) => state.repos.find((r) => String(r.repoId) === String(repoId)))
  const accountId = repo?.accountId
  const [step, setStep] = useState(1)

  // 모든 상태를 PRCreate에서 관리
  const [formData, setFormData] = useState({
    source: '',
    target: '',
    title: '',
    description: '',
    reviewers: [],
  })
  const [validationPR, setValidationPR] = useState(null)
  const [validationBranches, setValidationBranches] = useState(null)
  const [aiConvention, setAIConvention] = useState(null)
  const [aiOthers, setAIOthers] = useState(null)

  const updateFormData = (partial) => {
    setFormData((prev) => ({ ...prev, ...partial }))
  }

  const goToStep = (stepNumber) => {
    setStep(stepNumber)
  }

  const steps = ['브랜치 선택', '컨벤션 확인', 'PR 정보 입력', '리뷰어 선택', '최종 제출']

  const stepProps = {
    goToStep,
    repoId,
    accountId,
    formData,
    updateFormData,
    validationPR,
    setValidationPR,
    validationBranches,
    setValidationBranches,
    aiConvention,
    setAIConvention,
    aiOthers,
    setAIOthers,
  }

  const renderStepComponent = () => {
    switch (step) {
      case 1:
        return <PRCreateStep1 {...stepProps} />
      case 2:
        return <PRCreateStep2 {...stepProps} />
      case 3:
        return <PRCreateStep3 {...stepProps} />
      case 4:
        return <PRCreateStep4 {...stepProps} />
      case 5:
        return <PRCreateStep5 {...stepProps} />
      default:
        return <PRCreateStep1 {...stepProps} />
    }
  }

  return (
    <div className="relative min-h-screen pb-[100px]">
      <div className="max-w-4xl mx-auto space-y-4 py-4">
        <StepIndicator currentStep={step} steps={steps} />
        <div>{renderStepComponent()}</div>
      </div>
    </div>
  )
}

export default PRCreate
