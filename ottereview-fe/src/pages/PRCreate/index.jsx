import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../../components/Button'
import Section from '../../components/Section'
import StepIndicator from '../../components/StepIndicator'
import { submitPR } from '../../features/pullRequest/prApi'
import PRCreateStep1 from '../../features/pullRequest/PRCreateStep1'
import PRCreateStep2 from '../../features/pullRequest/PRCreateStep2'
import PRCreateStep3 from '../../features/pullRequest/PRCreateStep3'
import PRCreateStep4 from '../../features/pullRequest/PRCreateStep4'
import { usePRCreateStore } from '../../features/pullRequest/stores/prCreateStore'

const PRCreate = () => {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const formData = usePRCreateStore((state) => state.formData)

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
      default:
        return <PRCreateStep1 goToStep={goToStep} />
    }
  }

  return (
    <div className="space-y-4 py-4">
      <StepIndicator currentStep={step} />
      <Section>{renderStepComponent()}</Section>

      <div className="flex justify-between items-center mt-4">
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
            if (step < 4) {
              setStep((prev) => prev + 1)
            } else {
              handleSubmit()
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
