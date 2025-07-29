import LogoutButton from '../../components/Buttons/LogoutButton'
import ChatRoomList from '../../features/chat/ChatRoomList'
import PRList from '../../features/pullRequest/PRList'
import RepositoryList from '../../features/repository/RepositoryList'

const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <LogoutButton />

        <div className="flex justify-end items-center">
          <ChatRoomList />
        </div>
      </div>

      <div className="space-y-4 py-4">
        <RepositoryList />
        <PRList />
      </div>
    </div>
  )
}

export default Dashboard
