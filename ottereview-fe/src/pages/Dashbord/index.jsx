import RepositoryList from '../components/RepositoryList'

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <RepositoryList />
    </div>
  )
}

export default Dashboard
