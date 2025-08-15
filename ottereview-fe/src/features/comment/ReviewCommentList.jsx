import ReviewCommentItem from './ReviewCommentItem'

const ReviewCommentList = ({ comments = [], onDataRefresh }) => {
  // body나 voiceFileUrl이 있는 댓글만 필터링
  const validComments = comments.filter(
    (comment) =>
      (comment.body !== null &&
        comment.body !== undefined &&
        comment.body !== '') ||
      comment.voiceFileUrl
  )

  // parentCommentId 기준으로 그룹핑
  const parentComments = validComments.filter(comment => comment.parentCommentId === null)
  const replyComments = validComments.filter(comment => comment.parentCommentId !== null)

  // 각 부모 댓글의 답글들을 찾는 함수
  const getRepliesForComment = (parentId) => {
    return replyComments.filter(reply => reply.parentCommentId === parentId)
  }

  if (parentComments.length === 0) {
    return null
  }

  return (
    <>
      {parentComments.map((comment) => {
        const replies = getRepliesForComment(comment.id)
        return (
          <ReviewCommentItem
            key={`parent-${comment.id}`}
            comment={comment}
            replies={replies}
            onDataRefresh={onDataRefresh}
          />
        )
      })}
    </>
  )
}

export default ReviewCommentList