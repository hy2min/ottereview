import { Clock, Eye, GitBranch, GitMerge, MessageCircle, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Box from '../../components/Box'
import Button from '../../components/Button'

const PRCardDetail = ({ pr }) => {
  const navigate = useNavigate()

  return (
    <Box shadow>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 border-2 border-black rounded-lg flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-1">{pr.title}</h3>
            <p className="text-sm text-stone-600 line-clamp-2">{pr.description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 text-sm text-stone-500">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 mb-[3px]" />
            <span>{pr.author.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 mb-[3px]" />
            <span>{pr.updatedAt || '시간을 추가할 수 있을까..?'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4 mb-[3px]" />
            <span>{pr.comments || 0} 댓글</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/review`)}
            variant="outline"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-1 mb-[2px]" />
            리뷰하기
          </Button>
          <Button
            onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/conflict`)}
            variant="primary"
            size="sm"
          >
            <GitMerge className="w-4 h-4 mr-1 mb-[2px]" />
            머지
          </Button>
        </div>
      </div>
    </Box>
  )
}

export default PRCardDetail
