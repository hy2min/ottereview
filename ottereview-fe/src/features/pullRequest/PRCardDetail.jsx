import { Clock, Eye, GitBranch, GitMerge, MessageCircle, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Badge from '../../components/Badge'
import Box from '../../components/Box'
import Button from '../../components/Button'

const PRCardDetail = ({ pr }) => {
  const navigate = useNavigate()

  const title = pr.title
  const description = pr.body || '(내용 없음)'
  const updatedAt = pr.githubUpdatedAt || '(업데이트 시간 없음)'
  const authorName = pr.author?.name || pr.author?.githubUsername || '(알 수 없음)'
  const commentCount = pr.commentCnt || 0
  const repoId = pr.repo?.id
  const prId = pr.id
  const mergeable = pr.mergeable
  const state = pr.state

  return (
    <Box shadow>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 border-2 border-black rounded-lg flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 mb-1">{title}</h3>
            <p className="text-sm text-stone-600 line-clamp-2">{description}</p>
          </div>
        </div>

        <Badge variant={state === 'OPEN' ? 'info' : state === 'CLOSED' ? 'danger' : 'default'}>
          {state}
        </Badge>
      </div>

      {/* 메타 정보 + 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-stone-500">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 mb-[3px]" />
            <span>{authorName}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 mb-[3px]" />
            <span>{updatedAt}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4 mb-[3px]" />
            <span>{commentCount} 댓글</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => navigate(`/${repoId}/pr/${prId}/review`)}
            variant="outline"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-1 mb-[2px]" />
            리뷰하기
          </Button>
          <Button
            onClick={() => navigate(`/${repoId}/pr/${prId}/conflict`)}
            variant="primary"
            size="sm"
            disabled={mergeable || !state === 'OPEN'}
          >
            <GitMerge className="w-4 h-4 mr-1 mb-[2px]" />
            충돌해결
          </Button>
        </div>
      </div>
    </Box>
  )
}

export default PRCardDetail
