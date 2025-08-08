import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '@/components/Button'
import StepIndicator from '@/components/StepIndicator'
import { submitPR } from '@/features/pullRequest/prApi'
import PRCreateStep1 from '@/features/pullRequest/PRCreateStep1'
import PRCreateStep2 from '@/features/pullRequest/PRCreateStep2'
import PRCreateStep3 from '@/features/pullRequest/PRCreateStep3'
import PRCreateStep4 from '@/features/pullRequest/PRCreateStep4'
import PRCreateStep5 from '@/features/pullRequest/PRCreateStep5'
import { usePRCreateStore } from '@/features/pullRequest/stores/prCreateStore'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const PRCreate = () => {
  const { repoId } = useParams()
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const repo = useRepoStore((state) => state.repos.find((r) => String(r.repoId) === String(repoId)))
  const accountId = repo?.accountId
  const validationResult = usePRCreateStore((state) => state.validationResult)

  const formData = usePRCreateStore((state) => state.formData)

  const steps = ['브랜치 선택', '컨벤션 확인', 'PR 정보 입력', '리뷰어 선택', '최종 제출']

  const goToStep = (stepNumber) => {
    setStep(stepNumber)
  }

  const handleSubmit = async () => {
    try {
      await submitPR(formData)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      alert('제출 실패')
    }
  }

  const renderStepComponent = () => {
    const stepProps = { goToStep, repoId, accountId }

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
      <div className="max-w-3xl mx-auto space-y-4 py-4">
        <StepIndicator currentStep={step} steps={steps} />
        <div>{renderStepComponent()}</div>

        <div className="w-1/5 mx-auto z-10">
          <div className="mx-auto flex justify-between items-center">
            <Button
              onClick={() => {
                if (step > 1) {
                  setStep((prevStep) => prevStep - 1)
                } else {
                  navigate('/dashboard')
                }
              }}
              variant="secondary"
            >
              이전
            </Button>

            <Button
              onClick={() => {
                if (step < 5) {
                  setStep((prev) => prev + 1)
                } else {
                  handleSubmit()
                }
              }}
              variant="primary"
              disabled={step === 1 && !validationResult.isValid}
            >
              {step === 5 ? '제출' : '다음'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PRCreate
