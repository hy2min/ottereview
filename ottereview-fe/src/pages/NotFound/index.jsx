import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-800">
      <div className="text-center">
        <img 
          src="/OtteReview.png" 
          alt="OtteReview Logo" 
          className="w-96 h-auto mx-auto mb-8 opacity-80"
        />
        <h1 className="text-9xl font-bold text-gray-400 dark:text-white mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-600 dark:text-white mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-lg text-gray-500 dark:text-white mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link 
          to="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default NotFound
