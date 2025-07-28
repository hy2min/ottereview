import { useNavigate } from 'react-router-dom'

import PRList from '../../features/pullRequest/PRList'
import RepositoryList from '../../features/repository/RepositoryList'

const Dashboard = () => {
  const navigate = useNavigate()
  return (
    <div>
      <h1 className="text-2xl font-bold">대시보드</h1>
      <div className="p-6 space-y-6">
        <RepositoryList />
        <PRList />
      </div>
      <button onClick={() => navigate('/pr/create/')}>PR 생성</button>
    </div>
  )
}

export default Dashboard
