import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../../components/Button'
import Section from '../../components/Section'
import StepIndicator from '../../components/StepIndicator'
import PRCreateStep1 from '../../features/pullRequest/PRCreateStep1'
import PRCreateStep2 from '../../features/pullRequest/PRCreateStep2'
import PRCreateStep3 from '../../features/pullRequest/PRCreateStep3'
import PRCreateStep4 from '../../features/pullRequest/PRCreateStep4'

const PRCreate = () => {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const goToStep = (stepNumber) => {
    setStep(stepNumber)
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
      default:
        return <PRCreateStep1 goToStep={goToStep} />
    }
  }

  return (
    <div className="space-y-4 py-4">
      <StepIndicator currentStep={step} />
      <Section>{renderStepComponent()}</Section>

      {/* 버튼 영역 */}
      <div className="flex justify-between items-center mt-4">
        {/* 이전 버튼 */}
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

        {/* 다음 또는 제출 버튼 */}
        <Button
          onClick={() => {
            if (step < 4) {
              setStep((prev) => prev + 1)
            } else {
              navigate('/dashboard')
            }
          }}
          variant="primary"
        >
          {step === 4 ? '제출' : '다음'}
        </Button>
      </div>
    </div>
  )
}

export default PRCreate
