import { Link } from 'react-router-dom'

const PRCreateStep4 = () => {
  return (
    <div>
      <h2>PR 생성 4</h2>
      <Link to="/pr/create/3">
        <button>이전</button>
      </Link>
      <Link to="/dashboard">
        <button>제출</button>
      </Link>
    </div>
  )
}

export default PRCreateStep4
