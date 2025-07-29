import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'

import StepIndicator from '../../components/StepIndicator'
import PRCreateStep1 from '../../features/pullRequest/PRCreateStep1'
import PRCreateStep2 from '../../features/pullRequest/PRCreateStep2'
import PRCreateStep3 from '../../features/pullRequest/PRCreateStep3'
import PRCreateStep4 from '../../features/pullRequest/PRCreateStep4'

const PRCreate = () => {
  const navigate = useNavigate()
  const { repoId } = useParams()

  const goToStep = (stepNumber) => {
    navigate(`/${repoId}/pr/create/${stepNumber}`)
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">PR 생성 페이지</h2>

      <StepIndicator />

      <Routes>
        <Route index element={<Navigate to="1" replace />} />
        <Route path="1" element={<PRCreateStep1 goToStep={goToStep} />} />
        <Route path="2" element={<PRCreateStep2 goToStep={goToStep} />} />
        <Route path="3" element={<PRCreateStep3 goToStep={goToStep} />} />
        <Route path="4" element={<PRCreateStep4 goToStep={goToStep} />} />
      </Routes>
    </div>
  )
}

export default PRCreate
