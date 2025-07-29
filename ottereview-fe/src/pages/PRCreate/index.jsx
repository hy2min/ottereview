import { useState } from 'react'

import StepIndicator from '../../components/StepIndicator'
import PRCreateStep1 from '../../features/pullRequest/PRCreateStep1'
import PRCreateStep2 from '../../features/pullRequest/PRCreateStep2'
import PRCreateStep3 from '../../features/pullRequest/PRCreateStep3'
import PRCreateStep4 from '../../features/pullRequest/PRCreateStep4'

const PRCreate = () => {
  const [step, setStep] = useState(1)

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
      {renderStepComponent()}
    </div>
  )
}

export default PRCreate
