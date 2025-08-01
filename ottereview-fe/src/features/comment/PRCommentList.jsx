import Box from '../../components/Box'
import { useCommentStore } from './commentStore'

const PRCommentList = ({ prId }) => {
  const comments = useCommentStore((state) => state.prComments[prId] || [])

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
