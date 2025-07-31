import Box from '../../components/Box'

const PRCommentList = () => {
  // 나중에 prId를 이용해 서버에서 댓글 fetch하거나 store에서 가져오기
  const comments = [
    {
      id: 1,
      author: '박리뷰어',
      content: 'JWT 토큰 만료 시간이 너무 짧은 것 같습니다.',
      time: '2시간 전',
    },
    {
      id: 2,
      author: '김개발',
      content: '30분으로 늘리는 방향으로 개선하겠습니다.',
      time: '1시간 전',
    },
  ]

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
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
      ))}
    </div>
  )
}

export default PRCommentList
