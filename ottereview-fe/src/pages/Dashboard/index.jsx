import { useNavigate } from 'react-router-dom'

import PRList from '../../features/pullRequest/PRList'
import RepositoryList from '../../features/repository/RepositoryList'

const Dashboard = () => {
  const navigate = useNavigate()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* PR 생성 버튼은 추후 repo에서 PR생성가능 여부에 따라 abled/disabled 되게 할 예정 */}
      <div className="flex justify-end">
        <button className="border px-4 py-1" onClick={() => navigate('/pr/create/')}>
          PR 생성
        </button>
      </div>

      <div className="space-y-4 py-4">
        <RepositoryList />
        <PRList />
      </div>
    </div>
  )
}

export default Dashboard
