import { Clock, FileText, MessageSquare, Reply } from 'lucide-react'
import { useState } from 'react'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import { createReviewCommentReply } from '@/features/pullRequest/prApi'

// 리뷰 댓글 텍스트 정리 함수
const cleanReviewCommentBody = (body) => {
  if (!body) return ''
  
  // \n을 실제 줄바꿈으로 변환 (백엔드에서 전처리되므로 간단하게)
  return body.replace(/\\n/g, '\n')
}

// 파일에서 특정 라인 주변 코드 추출 함수
const getCodeContext = (patch, startLine, endLine, contextLines = 5, side = 'RIGHT') => {
  if (!patch) return null
  
  const lines = patch.split('\n')
  let oldLine = 0
  let newLine = 0
  let codeLines = []
  
  lines.forEach((line) => {
    const isHeader = line.startsWith('@@')
    const isFileHeader = line.startsWith('+++') || line.startsWith('---')
    const isMeta = line.startsWith('\\')
    
    if (isHeader) {
      const m = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
      if (m) {
        oldLine = parseInt(m[1], 10)
        newLine = parseInt(m[2], 10)
      }
      return
    }
    
    if (isFileHeader || isMeta || isHeader) return
    
    const firstChar = line.charAt(0)
    const lineIsAdded = firstChar === '+'
    const lineIsRemoved = firstChar === '-'
    const lineIsContext = firstChar === ' '
    
    if (lineIsAdded || lineIsRemoved || lineIsContext) {
      const currentLineNumber = lineIsAdded ? newLine : oldLine
      const content = line.substring(1) // 첫 번째 문자(+, -, ' ') 제거
      const currentSide = lineIsAdded ? 'RIGHT' : lineIsRemoved ? 'LEFT' : 'RIGHT'
      
      codeLines.push({
        lineNumber: currentLineNumber,
        oldLineNumber: lineIsRemoved || lineIsContext ? oldLine : null,
        newLineNumber: lineIsAdded || lineIsContext ? newLine : null,
        content,
        type: lineIsAdded ? 'added' : lineIsRemoved ? 'removed' : 'context',
        side: currentSide
      })
    }
    
    if (lineIsRemoved || lineIsContext) oldLine++
    if (lineIsAdded || lineIsContext) newLine++
  })
  
  // 요청된 라인 범위에 해당하는 코드와 컨텍스트 반환
  const targetStart = Math.min(startLine, endLine || startLine)
  const targetEnd = Math.max(startLine, endLine || startLine)
  
  if (endLine && endLine !== startLine) {
    // 여러줄 선택인 경우: 해당 범위만 정확히 반환
    return codeLines.filter(line => 
      line.lineNumber >= targetStart && line.lineNumber <= targetEnd
    )
  } else {
    // 단일 라인인 경우: side를 고려해서 정확한 타겟 라인 찾기
    let targetLineIndex = codeLines.findIndex(line => 
      line.lineNumber === targetStart && line.side === side
    )
    
    // 정확한 매치를 찾지 못했을 때 side 없이 라인 번호만으로 찾기
    if (targetLineIndex === -1) {
      targetLineIndex = codeLines.findIndex(line => line.lineNumber === targetStart)
    }
    
    if (targetLineIndex === -1) {
      // 그래도 타겟 라인을 찾을 수 없으면 빈 배열 반환
      return []
    }
    
    // 타겟 라인을 중심으로 더 제한적으로 가져오기 (타겟 라인 + 앞 1개 + 뒤 3개)
    const startIndex = Math.max(0, targetLineIndex - 1)
    const endIndex = Math.min(codeLines.length, startIndex + 5)
    return codeLines.slice(startIndex, endIndex)
  }
}

const PRCommentList = ({ reviews = [], files = [], onFileClick, onDataRefresh }) => {
  // 답글 작성 상태 관리
  const [replyingToCommentId, setReplyingToCommentId] = useState(null)
  const [replyContent, setReplyContent] = useState('')

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
    } catch (error) {
      console.error('답글 작성 실패:', error)
      alert('답글 작성에 실패했습니다.')
    }
  }

  // 파일 경로로 patch 찾기
  const getFilePatch = (filePath) => {
    const file = files.find(f => f.filename === filePath)
    return file?.patch
  }
  
  // 파일명 클릭 시 파일 탭으로 이동
  const handleFileClick = (filePath, lineNumber) => {
    if (onFileClick) {
      onFileClick(filePath, lineNumber)
    }
  }
  
  // 리뷰 중심으로 구조화 (리뷰 안에 코멘트들 포함)
  const organizeReviews = () => {
    return reviews.map(review => {
      // 리뷰 코멘트들을 부모-답글 구조로 정리
      const comments = review.reviewComments || []
      const parentComments = []
      const repliesMap = new Map()
      
      // 부모 댓글과 답글 분류
      comments.forEach(comment => {
        if (comment.parentCommentId) {
          // 답글인 경우
          if (!repliesMap.has(comment.parentCommentId)) {
            repliesMap.set(comment.parentCommentId, [])
          }
          repliesMap.get(comment.parentCommentId).push({
            ...comment,
            reviewer: review.githubUsername || 'Unknown',
            reviewState: review.state
          })
        } else {
          // 부모 댓글인 경우
          parentComments.push({
            ...comment,
            reviewer: review.githubUsername || 'Unknown',
            reviewState: review.state,
            replies: []
          })
        }
      })
      
      // 답글을 부모 댓글에 연결
      parentComments.forEach(comment => {
        if (repliesMap.has(comment.id)) {
          comment.replies = repliesMap.get(comment.id)
        }
      })
      
      return {
        ...review,
        organizedComments: parentComments
      }
    }).filter(review => 
      // 리뷰 본문이 있거나 코멘트가 있는 리뷰만 표시
      (review.body && review.body.trim()) || 
      (review.organizedComments && review.organizedComments.length > 0)
    )
  }
  
  const organizedReviews = organizeReviews()
  
  // 답글 렌더링 (라인 정보 없이)
  const renderReply = (reply) => (
    <div key={`reply-${reply.id}`} className="ml-6 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <img
          src={`https://github.com/${reply.githubUsername || reply.reviewer}.png`}
          alt={reply.githubUsername || reply.reviewer}
          className="w-6 h-6 rounded-full border border-gray-300"
          onError={(e) => {
            e.target.src = 'https://github.com/identicons/jasonlong.png'
          }}
        />
        <span className="font-medium theme-text text-sm">{reply.githubUsername || reply.reviewer}</span>
        <span className="text-xs theme-text-muted flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(reply.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="theme-text text-sm whitespace-pre-wrap break-words">{cleanReviewCommentBody(reply.body)}</p>
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
                  <span className="font-medium theme-text">{review.githubUsername || 'Unknown'}</span>
                  <Badge 
                    variant={
                      review.state === 'APPROVED' ? 'success' :
                      review.state === 'CHANGES_REQUESTED' ? 'danger' :
                      'primary'
                    }
                  >
                    {review.state === 'APPROVED' ? '승인' :
                     review.state === 'CHANGES_REQUESTED' ? '변경 요청' : '리뷰'}
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
                <p className="theme-text whitespace-pre-wrap">{cleanReviewCommentBody(review.body)}</p>
              </div>
            )}
            
            {/* 리뷰 코멘트들 */}
            {review.organizedComments && review.organizedComments.length > 0 && (
              <div className="ml-11 space-y-4 pt-2 border-t border-gray-300 dark:border-gray-800">
                {review.organizedComments.map((comment) => {
                  const patch = getFilePatch(comment.path)

                  const codeContext = getCodeContext(patch, comment.line, comment.startLine, 5, comment.side) || []
                  
                  return (
                    <div key={`comment-${comment.id}`} className="space-y-3">
                      {/* 코멘트 헤더 */}
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">commented on</span>
                        <code className="text-xs text-slate-900 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{comment.path}</code>
                      </div>
                      
                      {/* 코드 컨텍스트 */}
                      {codeContext.length > 0 && (
                        <div className="my-2 text-xs font-mono whitespace-pre min-w-full overflow-x-auto">
                          <div className="inline-grid w-max min-w-full grid-cols-[4rem_1fr] border border-gray-300">
                            {/* 헤더 */}
                            <div className="col-span-2 sticky top-0 bg-gray-200 dark:bg-gray-700 py-1 px-4 text-sm font-semibold">
                              <span className="text-gray-600">
                                <button 
                                  onClick={() => handleFileClick(comment.path, comment.line)}
                                  className="text-gray-600 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                                >
                                  {comment.path}
                                </button>
                                {' '}- Line {comment.startLine && comment.startLine !== comment.line 
                                  ? `${Math.min(comment.startLine, comment.line)}-${Math.max(comment.startLine, comment.line)}`
                                  : comment.line
                                }
                              </span>
                            </div>
                            
                            {/* 코드 라인들 */}
                            {codeContext.map((codeLine, idx) => {
                              // CodeDiff와 동일한 색상 로직
                              const numBg = codeLine.type === 'added' 
                                ? 'bg-normal-added-num text-gray-900'
                                : codeLine.type === 'removed'
                                ? 'bg-normal-removed-num text-gray-900'
                                : 'bg-white text-gray-500'
                                
                              const codeBg = codeLine.type === 'added'
                                ? 'bg-normal-added-code text-gray-900'
                                : codeLine.type === 'removed'
                                ? 'bg-normal-removed-code text-gray-900'
                                : 'bg-white text-gray-900'
                              
                              // 라인 번호 표시 로직 (CodeDiff와 동일)
                              const displayOld = codeLine.type === 'removed' || codeLine.type === 'context' ? codeLine.oldLineNumber || '' : ''
                              const displayNew = codeLine.type === 'added' || codeLine.type === 'context' ? codeLine.newLineNumber || codeLine.lineNumber : ''
                              
                              return [
                                // 라인 번호 (CodeDiff와 동일한 구조)
                                <div 
                                  key={`line-${idx}`}
                                  className={`w-16 text-right pr-2 py-1 border-r border-gray-300 select-none ${numBg}`}
                                >
                                  <span className="inline-block w-6 text-right pr-1">{displayOld}</span>
                                  <span className="inline-block w-6 text-right">{displayNew}</span>
                                </div>,
                                // 코드 내용
                                <div 
                                  key={`content-${idx}`}
                                  className={`px-2 py-1 ${codeBg}`}
                                >
                                  <div className="flex">
                                    {codeLine.type === 'added' && <span className="w-4 text-gray-900">+</span>}
                                    {codeLine.type === 'removed' && <span className="w-4 text-gray-900">-</span>}
                                    {codeLine.type === 'context' && <span className="w-4"></span>}
                                    <span className="flex-1">{codeLine.content}</span>
                                  </div>
                                </div>
                              ]
                            }).flat()}
                          </div>
                        </div>
                      )}
                      
                      {/* 코멘트 내용 */}
                      <p className="theme-text whitespace-pre-wrap break-words">{cleanReviewCommentBody(comment.body)}</p>
                      
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
                          {comment.replies.map(reply => renderReply(reply))}
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