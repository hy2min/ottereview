import ChatRoomList from '../../features/chat/ChatRoomList'
import PRList from '../../features/pullRequest/PRList'
import RepositoryList from '../../features/repository/RepositoryList'

const Dashboard = () => {
  return (
    <div className="pt-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl mb-1">안녕하세요, 김개발자님! 👋</h1>
          <p className="text-stone-600">오늘도 수달처럼 꼼꼼하게 코드를 리뷰해보세요!</p>
        </div>
        {/* <ChatRoomList /> */}
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-4 py-4 max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
        <RepositoryList />
        <PRList />
      </div>
    </div>
  )
}

export default Dashboard
