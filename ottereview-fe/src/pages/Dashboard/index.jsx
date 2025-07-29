import ChatRoomList from '../../features/chat/ChatRoomList'
import PRList from '../../features/pullRequest/PRList'
import RepositoryList from '../../features/repository/RepositoryList'

const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>

        <div className="flex justify-end items-center">
          <ChatRoomList />
          {/* PR 생성 버튼은 추후 repo에서 PR생성가능 여부에 따라 abled/disabled 되게 할 예정 */}
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
