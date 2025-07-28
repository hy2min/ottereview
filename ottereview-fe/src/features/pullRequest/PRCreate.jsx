import { Navigate, Route, Routes } from 'react-router-dom'

import PRCreateStep1 from './PRCreateStep1'
import PRCreateStep2 from './PRCreateStep2'
import PRCreateStep3 from './PRCreateStep3'
import PRCreateStep4 from './PRCreateStep4'

const PRCreate = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">PR 생성</h2>

      <Routes>
        <Route index element={<Navigate to="1" replace />} />
        <Route path="1" element={<PRCreateStep1 />} />
        <Route path="2" element={<PRCreateStep2 />} />
        <Route path="3" element={<PRCreateStep3 />} />
        <Route path="4" element={<PRCreateStep4 />} />
      </Routes>
    </div>
  )
}

export default PRCreate
