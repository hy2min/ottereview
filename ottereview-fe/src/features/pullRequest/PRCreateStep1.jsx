import { Link } from 'react-router-dom'

const PRCreateStep1 = () => {
  return (
    <div>
      <h2>PR 생성 1</h2>
      <Link to="/pr/create/2">
        <button>다음</button>
      </Link>
    </div>
  )
}

export default PRCreateStep1
