import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import StepIndicator from '@/components/StepIndicator'
import { submitPR } from '@/features/pullRequest/prApi'
import PRCreateStep1 from '@/features/pullRequest/PRCreateStep1'
import PRCreateStep2 from '@/features/pullRequest/PRCreateStep2'
import PRCreateStep3 from '@/features/pullRequest/PRCreateStep3'
import PRCreateStep4 from '@/features/pullRequest/PRCreateStep4'
import PRCreateStep5 from '@/features/pullRequest/PRCreateStep5'
import { usePRCreateStore } from '@/features/pullRequest/stores/prCreateStore'

const PRCreate = () => {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const formData = usePRCreateStore((state) => state.formData)

  const steps = ['컨벤션 확인', '브랜치 선택', 'PR 정보 입력', '리뷰어 선택', '최종 제출']

  const isNextButtonDisabled = useMemo(() => {
    if (step === 2) {
      return (
        !formData.sourceBranch ||
        !formData.targetBranch ||
        formData.sourceBranch === formData.targetBranch
      )
    }
    return false
  }, [step, formData.sourceBranch, formData.targetBranch])

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
    switch (step) {
      case 1:
        return <PRCreateStep1 goToStep={goToStep} />
      case 2:
        return <PRCreateStep2 goToStep={goToStep} />
      case 3:
        return <PRCreateStep3 goToStep={goToStep} />
      case 4:
        return <PRCreateStep4 goToStep={goToStep} />
      case 5:
        return <PRCreateStep5 goToStep={goToStep} />
      default:
        return <PRCreateStep1 goToStep={goToStep} />
    }
  }

  return (
    <div className="relative min-h-screen pb-[100px]">
      <div className="max-w-2xl mx-auto space-y-4 py-4">
        <StepIndicator currentStep={step} steps={steps} />
        <Box shadow>{renderStepComponent()}</Box>

        <div className="fixed bottom-0 left-0 w-full z-10">
          <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
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
                if (!isNextButtonDisabled) {
                  if (step < 5) {
                    setStep((prev) => prev + 1)
                  } else {
                    handleSubmit()
                  }
                }
              }}
              variant="primary"
              disabled={isNextButtonDisabled}
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
