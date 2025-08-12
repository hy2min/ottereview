import Box from '@/components/Box'

const PRCommentList = ({ prId }) => {
  // TODO: GitHub API를 통해 실제 PR 댓글 데이터를 가져오는 로직 구현 예정
  const comments = []

  return (
    <div className="space-y-2">
      {comments.length === 0 ? (
        <Box shadow className="text-center py-8">
          <p className="text-stone-500">아직 리뷰가 없습니다.</p>
        </Box>
      ) : (
        comments.map((comment) => (
          <Box key={comment.id} shadow className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-300 border-2 border-black flex items-center justify-center">
                <span className="text-sm font-medium">{comment.author[0]}</span>
              </div>
              <div>
                <span className="font-medium text-stone-900">{comment.author}</span>
                <span className="text-sm text-stone-500 ml-2">{comment.time}</span>
              </div>
            </div>
            <p className="text-stone-700">{comment.content}</p>
          </Box>
        ))
      )}
    </div>
  )
}

export default PRCommentList
