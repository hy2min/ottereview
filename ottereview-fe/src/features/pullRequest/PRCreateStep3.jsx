import { Link } from 'react-router-dom'

const PRCreateStep3 = () => {
  return (
    <div>
      <h2>PR 생성 3</h2>
      <Link to="/pr/create/2">
        <button>이전</button>
      </Link>
      <Link to="/pr/create/4">
        <button>다음</button>
      </Link>
    </div>
  )
}

export default PRCreateStep3