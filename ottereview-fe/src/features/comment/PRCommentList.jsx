import Badge from '@/components/Badge'
import Box from '@/components/Box'

// 리뷰 댓글 텍스트 정리 함수
const cleanReviewCommentBody = (body) => {
  if (!body) return ''
  
  // \n을 실제 줄바꿈으로 변환 (백엔드에서 전처리되므로 간단하게)
  return body.replace(/\\n/g, '\n')
}

const PRCommentList = ({ reviews = [] }) => {
  return (
    <div className="space-y-2">
      {reviews.length === 0 ? (
        <Box shadow className="text-center py-8">
          <p className="theme-text-muted">아직 리뷰가 없습니다.</p>
        </Box>
      ) : (
        reviews
          .filter(review => review.body && review.body.trim() !== '')
          .map((review) => (
          <Box key={review.id} shadow className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 dark:border-blue-400 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-200">{review.githubUsername?.[0] || 'U'}</span>
              </div>
              <div>
                <span className="font-medium theme-text text-base">{review.githubUsername || 'Unknown'}</span>
                <span className="text-sm theme-text-muted ml-2">
                  {new Date(review.createdAt).toLocaleString()}
                </span>
                <Badge 
                  variant={
                    review.state === 'APPROVED' ? 'success' :
                    review.state === 'CHANGES_REQUESTED' ? 'danger' :
                    'primary'
                  }
                  className="ml-3"
                >
                  {review.state === 'APPROVED' ? '승인' :
                   review.state === 'CHANGES_REQUESTED' ? '변경 요청' : '리뷰'}
                </Badge>
              </div>
            </div>
            <p className="theme-text whitespace-pre-wrap text-base">{cleanReviewCommentBody(review.body)}</p>
          </Box>
        ))
      )}
    </div>
  )
}

export default PRCommentList
