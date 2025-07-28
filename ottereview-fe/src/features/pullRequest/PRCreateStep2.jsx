import { Link } from 'react-router-dom'

const PRCreateStep2 = () => {
  return (
    <div>
      <h2>PR 생성 2</h2>
      <Link to="/pr/create/1">
        <button>이전</button>
      </Link>
      <Link to="/pr/create/3">
        <button>다음</button>
      </Link>
    </div>
  )
}

export default PRCreateStep2
