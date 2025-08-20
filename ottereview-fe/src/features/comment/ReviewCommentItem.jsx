import { Edit, Reply, Trash2 } from 'lucide-react'
import { useState } from 'react'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import { useModalContext } from '@/components/ModalProvider'
import {
  applyCushionLanguage,
  createReviewCommentReply,
  deleteReviewComment,
  updateReviewComment,
} from '@/features/pullRequest/prApi'
import { useUserStore } from '@/store/userStore'

const ReviewCommentItem = ({ comment, replies = [], onDataRefresh }) => {
  const user = useUserStore((state) => state.user)
  const { error, confirmDelete } = useModalContext()

  // 편집 상태
  const [editingReviewCommentId, setEditingReviewCommentId] = useState(null)
  const [editingReviewCommentContent, setEditingReviewCommentContent] = useState('')

  // 답글 상태
  const [replyingToCommentId, setReplyingToCommentId] = useState(null)
  const [replyContent, setReplyContent] = useState('')

  // 쿠션어 모달 상태 관리
  const [isCushionModalOpen, setIsCushionModalOpen] = useState(false)
  const [originalContent, setOriginalContent] = useState('')
  const [cushionedContent, setCushionedContent] = useState('')
  const [isCushionLoading, setIsCushionLoading] = useState(false)
  const [cushionTargetType, setCushionTargetType] = useState('') // 'reply' 또는 'edit'

  // 댓글 본문 정리 함수
  const cleanReviewCommentBody = (body) => {
    if (!body) return ''
    return body.replace(/^\*\*.*?\*\*\s*/, '').trim()
  }

  // 기존 리뷰 댓글 편집 시작
  const handleEditReviewComment = (commentToEdit) => {
    setEditingReviewCommentId(commentToEdit.id)
    setEditingReviewCommentContent(commentToEdit.body || '')
  }

  // 기존 리뷰 댓글 편집 취소
  const handleCancelEditReviewComment = () => {
    setEditingReviewCommentId(null)
    setEditingReviewCommentContent('')
  }

  // 기존 리뷰 댓글 편집 저장
  const handleSaveEditReviewComment = async (commentToEdit) => {
    if (!editingReviewCommentContent.trim()) return

    try {
      const requestBody = {
        body: editingReviewCommentContent.trim(),
      }

      await updateReviewComment(commentToEdit.reviewId, commentToEdit.id, requestBody)

      // 편집 상태 초기화
      setEditingReviewCommentId(null)
      setEditingReviewCommentContent('')

      // PR 데이터 새로고침
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (err) {
      console.error('리뷰 댓글 수정 실패:', err)
      error('댓글 수정에 실패했습니다.')
    }
  }

  // 기존 리뷰 댓글 삭제
  const handleDeleteReviewComment = async (commentToDelete) => {
    const confirmed = await confirmDelete('이 댓글을 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      await deleteReviewComment(commentToDelete.reviewId, commentToDelete.id)

      // PR 데이터 새로고침
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (err) {
      console.error('리뷰 댓글 삭제 실패:', err)
      error('댓글 삭제에 실패했습니다.')
    }
  }

  // 답글 작성 시작
  const handleStartReply = (commentId) => {
    setReplyingToCommentId(commentId)
    setReplyContent('')
  }

  // 답글 작성 취소
  const handleCancelReply = () => {
    setReplyingToCommentId(null)
    setReplyContent('')
  }

  // 답글 제출
  const handleSubmitReply = async (parentComment) => {
    if (!replyContent.trim()) return

    // 즉시 폼 닫기 및 상태 초기화
    setReplyingToCommentId(null)
    setReplyContent('')

    try {
      await createReviewCommentReply(parentComment.reviewId, {
        parentCommentId: parentComment.id,
        body: replyContent.trim(),
      })

      // PR 데이터 새로고침
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (err) {
      console.error('답글 작성 실패:', err)
      error('답글 작성에 실패했습니다.')
    }
  }

  // 쿠션어 적용 처리
  const handleApplyCushion = async (content, targetType) => {
    if (!content?.trim()) return

    setOriginalContent(content)
    setCushionTargetType(targetType)
    setIsCushionModalOpen(true)
    setIsCushionLoading(true)
    setCushionedContent('')

    try {
      const response = await applyCushionLanguage(content)

      if (response?.result) {
        setCushionedContent(response.result)
      }
    } catch (err) {
      console.error('쿠션어 적용 실패:', err)
      setCushionedContent('쿠션어 적용 중 오류가 발생했습니다.')
    } finally {
      setIsCushionLoading(false)
    }
  }

  // 쿠션어 적용 확정
  const handleApplyCushionConfirm = () => {
    if (cushionTargetType === 'reply') {
      setReplyContent(cushionedContent)
    } else if (cushionTargetType === 'edit') {
      setEditingReviewCommentContent(cushionedContent)
    }
    setIsCushionModalOpen(false)
  }

  // 쿠션어 적용 취소
  const handleApplyCushionCancel = () => {
    setIsCushionModalOpen(false)
  }

  return (
    <div className="mx-2 mb-4 font-sans max-w-4xl">
      {/* 부모 댓글 */}
      <div className="mb-2">
        <Box shadow className="space-y-3 max-w-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={`https://github.com/${comment.reviewer}.png`}
                alt={comment.reviewer || 'Reviewer'}
                className="w-8 h-8 rounded-full border-2 border-blue-500 dark:border-blue-400"
                onError={(e) => {
                  e.target.src = 'https://github.com/identicons/jasonlong.png'
                }}
              />
              <div>
                <span className="font-medium theme-text text-base">
                  {comment.reviewer || 'Unknown'}
                </span>
                <span className="text-sm theme-text-muted ml-2">
                  {new Date(comment.submittedAt).toLocaleString()}
                </span>
                <Badge
                  variant={
                    comment.reviewState === 'APPROVED'
                      ? 'success'
                      : comment.reviewState === 'CHANGES_REQUESTED'
                        ? 'danger'
                        : 'primary'
                  }
                  className="ml-3"
                >
                  {comment.reviewState === 'APPROVED'
                    ? '승인'
                    : comment.reviewState === 'CHANGES_REQUESTED'
                      ? '변경 요청'
                      : '코멘트'}
                </Badge>
              </div>
            </div>
            {/* 수정/삭제 버튼 - ReviewComment에 실제 작성자가 있고 현재 사용자와 같을 때만 표시 */}
            {comment.authorName &&
              comment.authorName === user?.githubUsername &&
              !comment.voiceFileUrl && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditReviewComment(comment)}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                    title="댓글 수정"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReviewComment(comment)}
                    className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                    title="댓글 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
          </div>

          {/* 편집 모드인지 확인 */}
          {editingReviewCommentId === comment.id ? (
            <div className="space-y-2">
              <textarea
                value={editingReviewCommentContent}
                onChange={(e) => setEditingReviewCommentContent(e.target.value)}
                className="w-full p-2 border theme-border rounded theme-bg-primary theme-text text-base resize-none"
                rows={3}
                placeholder="댓글을 수정하세요..."
              />
              <div className="flex justify-between items-center">
                {/* 왼쪽: 쿠션어 적용 버튼 */}
                <div>
                  {editingReviewCommentContent.trim() && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyCushion(editingReviewCommentContent, 'edit')}
                      className="hover:!bg-purple-50 dark:hover:!bg-purple-900 hover:!text-purple-700 dark:hover:!text-purple-300"
                    >
                      쿠션어 적용
                    </Button>
                  )}
                </div>

                {/* 오른쪽: 취소/저장 버튼 */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditReviewComment}
                    className="hover:!bg-gray-100 dark:hover:!bg-gray-700 hover:!text-gray-900 dark:hover:!text-gray-100 hover:!shadow-md"
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSaveEditReviewComment(comment)}
                    disabled={!editingReviewCommentContent.trim()}
                    className="hover:!bg-blue-50 dark:hover:!bg-blue-900 hover:!text-blue-700 dark:hover:!text-blue-300"
                  >
                    저장
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 댓글 내용 */}
              {comment.voiceFileUrl ? (
                <audio
                  controls
                  src={comment.voiceFileUrl}
                  className="h-8 rounded-full border border-gray-300"
                >
                  브라우저가 오디오를 지원하지 않습니다.
                </audio>
              ) : (
                <p className="theme-text whitespace-pre-wrap break-words text-base">
                  {cleanReviewCommentBody(comment.body)}
                </p>
              )}
            </>
          )}

          {/* 답글 버튼 (편집 모드가 아니고 답글 작성 폼이 열려있지 않을 때만) */}
          {editingReviewCommentId !== comment.id && replyingToCommentId !== comment.id && (
            <div className="mt-3 pt-2 flex items-center justify-end">
              <button
                onClick={() => handleStartReply(comment.id)}
                className="flex items-center gap-1.5 text-sm font-medium text-orange-700 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-200 px-3 py-1.5 rounded-md bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all duration-200 border border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700"
              >
                <Reply className="w-3.5 h-3.5" />
                답글 달기
              </button>
            </div>
          )}

          {/* 답글 작성 폼 */}
          {replyingToCommentId === comment.id && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 입력하세요..."
                className="w-full p-2 border theme-border rounded theme-bg-primary theme-text text-sm resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center">
                {/* 왼쪽: 쿠션어 적용 버튼 */}
                <div>
                  {replyContent.trim() && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyCushion(replyContent, 'reply')}
                      className="hover:!bg-purple-50 dark:hover:!bg-purple-900 hover:!text-purple-700 dark:hover:!text-purple-300"
                    >
                      쿠션어 적용
                    </Button>
                  )}
                </div>

                {/* 오른쪽: 취소/작성 버튼 */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelReply}
                    className="hover:!bg-gray-100 dark:hover:!bg-gray-700 hover:!text-gray-900 dark:hover:!text-gray-100"
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSubmitReply(comment)}
                    disabled={!replyContent.trim()}
                    className="hover:!bg-blue-50 dark:hover:!bg-blue-900 hover:!text-blue-700 dark:hover:!text-blue-300"
                  >
                    답글 작성
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Box>
      </div>

      {/* 답글들 - 별도의 박스에서 시작 */}
      {replies.length > 0 && (
        <div className="ml-10">
          <Box shadow className="space-y-3 max-w-lg bg-gray-50 dark:bg-gray-800">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="ml-2 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={`https://github.com/${reply.authorName}.png`}
                    alt={reply.authorName || 'Reviewer'}
                    className="w-6 h-6 rounded-full border border-gray-300"
                    onError={(e) => {
                      e.target.src = 'https://github.com/identicons/jasonlong.png'
                    }}
                  />
                  <span className="font-medium theme-text text-sm">
                    {reply.authorName || 'Unknown'}
                  </span>
                  <span className="text-xs theme-text-muted flex items-center gap-1">
                    {new Date(reply.submittedAt).toLocaleString()}
                  </span>
                  {/* 수정/삭제 버튼 - 답글 작성자만 볼 수 있음 */}
                  {reply.authorName &&
                    reply.authorName === user?.githubUsername &&
                    !reply.voiceFileUrl && (
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => handleEditReviewComment(reply)}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                          title="답글 수정"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteReviewComment(reply)}
                          className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                          title="답글 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                </div>

                {/* 답글 내용 */}
                {editingReviewCommentId === reply.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingReviewCommentContent}
                      onChange={(e) => setEditingReviewCommentContent(e.target.value)}
                      className="w-full p-2 border theme-border rounded theme-bg-primary theme-text text-sm resize-none"
                      rows={2}
                      placeholder="답글을 수정하세요..."
                    />
                    <div className="flex justify-between items-center">
                      {/* 왼쪽: 쿠션어 적용 버튼 */}
                      <div>
                        {editingReviewCommentContent.trim() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyCushion(editingReviewCommentContent, 'edit')}
                            className="hover:!bg-purple-50 dark:hover:!bg-purple-900 hover:!text-purple-700 dark:hover:!text-purple-300"
                          >
                            쿠션어 적용
                          </Button>
                        )}
                      </div>

                      {/* 오른쪽: 취소/저장 버튼 */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditReviewComment}
                          className="hover:!bg-gray-100 dark:hover:!bg-gray-700 hover:!text-gray-900 dark:hover:!text-gray-100 hover:!shadow-md"
                        >
                          취소
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSaveEditReviewComment(reply)}
                          disabled={!editingReviewCommentContent.trim()}
                          className="hover:!bg-blue-50 dark:hover:!bg-blue-900 hover:!text-blue-700 dark:hover:!text-blue-300"
                        >
                          저장
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : reply.voiceFileUrl ? (
                  <audio
                    controls
                    src={reply.voiceFileUrl}
                    className="h-6 rounded-full border border-gray-300"
                  >
                    브라우저가 오디오를 지원하지 않습니다.
                  </audio>
                ) : (
                  <p className="theme-text whitespace-pre-wrap break-words text-sm">
                    {cleanReviewCommentBody(reply.body)}
                  </p>
                )}
              </div>
            ))}
          </Box>
        </div>
      )}

      {/* 쿠션어 적용 모달 */}
      <Modal
        isOpen={isCushionModalOpen}
        onClose={handleApplyCushionCancel}
        title="쿠션어 적용 결과"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleApplyCushionCancel}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleApplyCushionConfirm}
              disabled={isCushionLoading || !cushionedContent}
            >
              적용
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* 원본 내용 */}
          <div>
            <h4 className="font-medium mb-2 theme-text">원본 내용</h4>
            <Box className="max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm theme-text-secondary">
                {originalContent}
              </pre>
            </Box>
          </div>

          {/* 쿠션어 적용 결과 */}
          <div>
            <h4 className="font-medium mb-2 theme-text">쿠션어 적용 결과</h4>
            <Box className="max-h-40 overflow-y-auto">
              {isCushionLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-sm theme-text-secondary">변환 중...</div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm theme-text-secondary">
                  {cushionedContent}
                </pre>
              )}
            </Box>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ReviewCommentItem
