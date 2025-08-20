import { Clock, MessageSquare, Reply } from 'lucide-react'
import { useState } from 'react'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import { createReviewCommentReply } from '@/features/pullRequest/prApi'
import { useModalContext } from '@/components/ModalProvider'

// 상수 정의
const LINE_HIGHLIGHT_CLASSES = {
  removed: 'px-1.5 rounded-md bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200',
  added: 'px-1.5 rounded-md bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
}

const CODE_COLORS = {
  added: {
    num: 'bg-normal-added-num text-gray-900',
    code: 'bg-normal-added-code text-gray-900'
  },
  removed: {
    num: 'bg-normal-removed-num text-gray-900', 
    code: 'bg-normal-removed-code text-gray-900'
  },
  context: {
    num: 'bg-white text-gray-500',
    code: 'bg-white text-gray-900'
  }
}

// 리뷰 댓글 텍스트 정리 함수
const cleanReviewCommentBody = (body) => {
  if (!body) return ''
  return body.replace(/\\n/g, '\n')
}

// 파일에서 특정 라인 주변 코드 추출 함수
const getCodeContext = (patch, comment) => {
  if (!patch) return null

  const lines = patch.split('\n')
  let oldLine = 0
  let newLine = 0
  let codeLines = []

  lines.forEach((line) => {
    const isHeader = line.startsWith('@@')
    const isFileHeader = line.startsWith('+++') || line.startsWith('--')
    const isMeta = line.startsWith('\\')

    if (isHeader) {
      const m = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
      if (m) {
        oldLine = parseInt(m[1], 10)
        newLine = parseInt(m[2], 10)
      }
      return // 헤더 라인은 여기서 처리 종료
    }

    // 메타 정보 라인은 건너뛰기
    if (isFileHeader || isMeta) {
      return
    }

    const firstChar = line.charAt(0)
    const lineIsAdded = firstChar === '+'
    const lineIsRemoved = firstChar === '-'
    const lineIsContext = firstChar === ' '

    if (lineIsAdded || lineIsRemoved || lineIsContext) {
      const content = line.substring(1)
      const currentSide = lineIsAdded ? 'RIGHT' : lineIsRemoved ? 'LEFT' : 'RIGHT'

      codeLines.push({
        oldLineNumber: lineIsRemoved || lineIsContext ? oldLine : null,
        newLineNumber: lineIsAdded || lineIsContext ? newLine : null,
        content,
        type: lineIsAdded ? 'added' : lineIsRemoved ? 'removed' : 'context',
        side: currentSide,
      })
    }

    if (lineIsRemoved || lineIsContext) oldLine++
    if (lineIsAdded || lineIsContext) newLine++
  })

  const { line, startLine, side: endSide, startSide } = comment

  // Ensure line numbers are integers for comparison
  const numEndLine = parseInt(line, 10)
  const numStartLine = startLine ? parseInt(startLine, 10) : null

  const isMultiLine = numStartLine && (numStartLine !== numEndLine || startSide !== endSide)

  if (isMultiLine) {
    // 여러 줄 코멘트 처리
    const startIndex = codeLines.findIndex((l) => {
      const targetLine = startSide === 'LEFT' ? l.oldLineNumber : l.newLineNumber
      return targetLine === numStartLine && l.side === startSide
    })

    const endIndex = codeLines.findIndex((l) => {
      const targetLine = endSide === 'LEFT' ? l.oldLineNumber : l.newLineNumber
      return targetLine === numEndLine && l.side === endSide
    })

    if (startIndex !== -1 && endIndex !== -1) {
      const min = Math.min(startIndex, endIndex)
      const max = Math.max(startIndex, endIndex)
      return codeLines.slice(min, max + 1)
    }

    // Fallback: side를 무시하고 line number로만 찾기
    const fallbackStartIndex = codeLines.findIndex(
      (l) => l.oldLineNumber === numStartLine || l.newLineNumber === numStartLine,
    )
    const fallbackEndIndex = codeLines.findIndex(
      (l) => l.oldLineNumber === numEndLine || l.newLineNumber === numEndLine,
    )

    if (fallbackStartIndex !== -1 && fallbackEndIndex !== -1) {
      const min = Math.min(fallbackStartIndex, fallbackEndIndex)
      const max = Math.max(fallbackStartIndex, fallbackEndIndex)
      return codeLines.slice(min, max + 1)
    }

    return [] // 최종적으로 못찾으면 빈 배열 반환
  } else {
    // 단일 라인 코멘트 처리
    const targetLineIndex = codeLines.findIndex((l) => {
      const targetLine = endSide === 'LEFT' ? l.oldLineNumber : l.newLineNumber
      return targetLine === numEndLine && l.side === endSide
    })

    if (targetLineIndex !== -1) {
      // User's requested logic: show the line and the 4 before it.
      const endIndex = targetLineIndex + 1
      const startIndex = Math.max(0, endIndex - 5)
      return codeLines.slice(startIndex, endIndex)
    }
    return []
  }
}

const PRCommentList = ({ reviews = [], files = [], onFileClick, onDataRefresh }) => {
  const { error } = useModalContext()
  
  // 답글 작성 상태 관리
  const [replyingToCommentId, setReplyingToCommentId] = useState(null)
  const [replyContent, setReplyContent] = useState('')

  // 답글 관련 핸들러들
  const handleStartReply = (commentId) => {
    setReplyingToCommentId(commentId)
    setReplyContent('')
  }

  const handleCancelReply = () => {
    setReplyingToCommentId(null)
    setReplyContent('')
  }

  const handleSubmitReply = async (parentComment) => {
    if (!replyContent.trim()) return

    setReplyingToCommentId(null)
    setReplyContent('')

    try {
      await createReviewCommentReply(parentComment.reviewId, {
        parentCommentId: parentComment.id,
        body: replyContent.trim(),
      })
      
      onDataRefresh?.()
    } catch (err) {
      console.error('답글 작성 실패:', err)
      error('답글 작성에 실패했습니다.')
    }
  }

  // 유틸리티 함수들
  const getFilePatch = (filePath) => files.find(f => f.filename === filePath)?.patch
  
  const handleFileClickInternal = (filePath, lineNumber) => {
    onFileClick?.(filePath, lineNumber)
  }

  // 라인 하이라이트 클래스 결정
  const getLineHighlight = (codeContext, lineNum, side) => {
    const targetLine = codeContext.find(line => {
      const targetLineNumber = side === 'LEFT' ? line.oldLineNumber : line.newLineNumber
      return targetLineNumber === parseInt(lineNum, 10) && line.side === side
    })
    
    if (!targetLine) return null
    return targetLine.type === 'removed' ? LINE_HIGHLIGHT_CLASSES.removed
         : targetLine.type === 'added' ? LINE_HIGHLIGHT_CLASSES.added
         : null
  }

  // 라인 번호 렌더링
  const renderLineNumbers = (comment, codeContext) => {
    if (comment.startLine && comment.startLine !== comment.line) {
      // 멀티라인인 경우
      const startHighlight = getLineHighlight(codeContext, comment.startLine, comment.startSide)
      const endHighlight = getLineHighlight(codeContext, comment.line, comment.side)
      
      return (
        <>
          {startHighlight ? (
            <span className={startHighlight}>{comment.startLine}</span>
          ) : (
            <span>{comment.startLine}</span>
          )}
          -
          {endHighlight ? (
            <span className={endHighlight}>{comment.line}</span>
          ) : (
            <span>{comment.line}</span>
          )}
        </>
      )
    } else {
      // 단일라인인 경우
      const highlight = getLineHighlight(codeContext, comment.line, comment.side)
      return highlight ? (
        <span className={highlight}>{comment.line}</span>
      ) : (
        <span>{comment.line}</span>
      )
    }
  }

  // 코드 라인 렌더링
  const renderCodeLine = (codeLine, idx) => {
    const colors = CODE_COLORS[codeLine.type]
    const displayOld = (codeLine.type === 'removed' || codeLine.type === 'context') 
      ? codeLine.oldLineNumber || '' : ''
    const displayNew = (codeLine.type === 'added' || codeLine.type === 'context')
      ? codeLine.newLineNumber || codeLine.lineNumber : ''

    return [
      // 라인 번호
      <div key={`line-${idx}`} className={`w-16 text-right pr-2 py-1 border-r border-gray-300 select-none ${colors.num}`}>
        <span className="inline-block w-6 text-right pr-1">{displayOld}</span>
        <span className="inline-block w-6 text-right">{displayNew}</span>
      </div>,
      // 코드 내용
      <div key={`content-${idx}`} className={`px-2 py-1 ${colors.code}`}>
        <div className="flex">
          {codeLine.type === 'added' && <span className="w-4 text-gray-900">+</span>}
          {codeLine.type === 'removed' && <span className="w-4 text-gray-900">-</span>}
          {codeLine.type === 'context' && <span className="w-4"></span>}
          <span className="flex-1">{codeLine.content}</span>
        </div>
      </div>
    ]
  }

  // 리뷰 중심으로 구조화 (리뷰 안에 코멘트들 포함)
  const organizeReviews = () => {
    return reviews
      .map((review) => {
        // 리뷰 코멘트들을 부모-답글 구조로 정리
        const comments = review.reviewComments || []
        const parentComments = []
        const repliesMap = new Map()

        // 부모 댓글과 답글 분류
        comments.forEach((comment) => {
          if (comment.parentCommentId) {
            // 답글인 경우
            if (!repliesMap.has(comment.parentCommentId)) {
              repliesMap.set(comment.parentCommentId, [])
            }
            repliesMap.get(comment.parentCommentId).push({
              ...comment,
              reviewer: review.githubUsername || 'Unknown',
              reviewState: review.state,
            })
          } else {
            // 부모 댓글인 경우
            parentComments.push({
              ...comment,
              reviewer: review.githubUsername || 'Unknown',
              reviewState: review.state,
              replies: [],
            })
          }
        })

        // 답글을 부모 댓글에 연결
        parentComments.forEach((comment) => {
          if (repliesMap.has(comment.id)) {
            comment.replies = repliesMap.get(comment.id)
          }
        })

        return {
          ...review,
          organizedComments: parentComments,
        }
      })
      .filter(
        (review) =>
          // 리뷰 본문이 있거나 코멘트가 있는 리뷰만 표시
          (review.body && review.body.trim()) ||
          (review.organizedComments && review.organizedComments.length > 0)
      )
  }

  const organizedReviews = organizeReviews()

  // 답글 렌더링 (라인 정보 없이)
  const renderReply = (reply) => (
    <div
      key={`reply-${reply.id}`}
      className="ml-6 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-2 mb-2">
        <img
          src={`https://github.com/${reply.githubUsername || reply.reviewer}.png`}
          alt={reply.githubUsername || reply.reviewer}
          className="w-6 h-6 rounded-full border border-gray-300"
          onError={(e) => {
            e.target.src = 'https://github.com/identicons/jasonlong.png'
          }}
        />
        <span className="font-medium theme-text text-sm">
          {reply.githubUsername || reply.reviewer}
        </span>
        <span className="text-xs theme-text-muted flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(reply.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="theme-text text-sm whitespace-pre-wrap break-words">
        {cleanReviewCommentBody(reply.body)}
      </p>
    </div>
  )

  return (
    <div className="space-y-4">
      {organizedReviews.length === 0 ? (
        <Box shadow className="text-center py-8">
          <p className="theme-text-muted">아직 리뷰가 없습니다.</p>
        </Box>
      ) : (
        organizedReviews.map((review) => (
          <Box key={`review-${review.id}`} shadow className="space-y-4">
            {/* 리뷰 헤더 */}
            <div className="flex items-center gap-3">
              <img
                src={`https://github.com/${review.githubUsername || 'Unknown'}.png`}
                alt={review.githubUsername || 'Unknown'}
                className="w-8 h-8 rounded-full border-2 border-blue-500 dark:border-blue-400"
                onError={(e) => {
                  e.target.src = 'https://github.com/identicons/jasonlong.png'
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium theme-text">
                    {review.githubUsername || 'Unknown'}
                  </span>
                  <Badge
                    variant={
                      review.state === 'APPROVED'
                        ? 'success'
                        : review.state === 'CHANGES_REQUESTED'
                          ? 'danger'
                          : 'primary'
                    }
                  >
                    {review.state === 'APPROVED'
                      ? '승인'
                      : review.state === 'CHANGES_REQUESTED'
                        ? '변경 요청'
                        : '리뷰'}
                  </Badge>
                  <span className="text-sm theme-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(review.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 리뷰 본문 */}
            {review.body && review.body.trim() && (
              <div className="ml-11">
                <p className="theme-text whitespace-pre-wrap">
                  {cleanReviewCommentBody(review.body)}
                </p>
              </div>
            )}

            {/* 리뷰 코멘트들 */}
            {review.organizedComments && review.organizedComments.length > 0 && (
              <div className="ml-11 space-y-4 ">
                {review.organizedComments.map((comment) => {
                  const patch = getFilePatch(comment.path)

                  const codeContext = getCodeContext(patch, comment) || []

                  return (
                    <div key={`comment-${comment.id}`} className="space-y-3 pt-3 px-3 pb-5 border theme-border rounded-xl">
                      {/* 코멘트 헤더 */}
                      <div className="flex items-center gap-2 ">
                        <MessageSquare className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">commented on</span>
                        <code className="text-xs text-slate-900 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                          {comment.path}
                        </code>
                      </div>

                      {/* 코드 컨텍스트 */}
                      {codeContext.length > 0 && (
                        <div className="my-2 text-xs font-mono whitespace-pre min-w-full overflow-x-auto">
                          <div className="inline-grid w-max min-w-full grid-cols-[4rem_1fr] border border-gray-300">
                            {/* 헤더 */}
                            <div className="col-span-2 sticky top-0 bg-gray-200 dark:bg-gray-700 py-1 px-4 text-sm font-semibold">
                              <span className="text-gray-600">
                                <button
                                  onClick={() => handleFileClickInternal(comment.path, comment.line)}
                                  className="text-gray-600 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                                >
                                  {comment.path}
                                </button>{' '}
                                - Line {renderLineNumbers(comment, codeContext)}
                              </span>
                            </div>

                            {/* 코드 라인들 */}
                            {codeContext.map((codeLine, idx) => renderCodeLine(codeLine, idx)).flat()}
                          </div>
                        </div>
                      )}

                      {/* 코멘트 내용 */}
                      <p className="theme-text whitespace-pre-wrap break-words">
                        {cleanReviewCommentBody(comment.body)}
                      </p>

                      {/* 답글 버튼 (답글 작성 폼이 열려있지 않을 때만) */}
                      {replyingToCommentId !== comment.id && (
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
                          <div className="flex gap-2 justify-end">
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
                      )}

                      {/* 답글들 */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="space-y-2">
                          {comment.replies.map((reply) => renderReply(reply))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Box>
        ))
      )}
    </div>
  )
}

export default PRCommentList
