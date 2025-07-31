import ChatRoomList from '../../features/chat/ChatRoomList'
import PRList from '../../features/pullRequest/PRList'
import RepositoryList from '../../features/repository/RepositoryList'

const Dashboard = () => {
  return (
    <div className="pt-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl mb-2">안녕하세요, 김개발자님! 👋</h1>
          <p className="text-stone-600">오늘도 수달처럼 꼼꼼하게 코드를 리뷰해보세요!</p>
        </div>
        <ChatRoomList />
      </div>

      <div className="space-y-4 py-4">
        <RepositoryList />
        <PRList />
      </div>
    </div>
  )
}

export default Dashboard
