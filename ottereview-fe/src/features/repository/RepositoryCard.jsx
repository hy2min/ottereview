import { useNavigate } from 'react-router-dom'

import Button from '../../components/Button'
import Card from '../../components/Card'

const RepositoryCard = ({ repo, onClick, createEnabled = false }) => {
  const navigate = useNavigate()

  return (
    <Card onClick={onClick}>
      <div>
        <p>ID: {repo.id}</p>
        <p>이름: {repo.name}</p>
        <p>전체 이름: {repo.full_name}</p>
      </div>
      <Button
        onClick={(e) => {
          e.stopPropagation()
          if (createEnabled) {
            navigate(`/${repo.id}/pr/create`)
          }
        }}
        disabled={!createEnabled}
        variant="success"
        size="sm"
      >
        PR 생성
      </Button>
    </Card>
  )
}

export default RepositoryCard
