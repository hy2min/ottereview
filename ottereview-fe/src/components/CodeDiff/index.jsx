import { Plus } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import CommentForm from '@/features/comment/CommentForm'

// 리뷰 댓글 텍스트 정리 함수
const cleanReviewCommentBody = (body) => {
  if (!body) return ''

  // \n을 실제 줄바꿈으로 변환 (백엔드에서 전처리되므로 간단하게)
  return body.replace(/\\n/g, '\n')
}

const CodeDiff = ({
  patch,
  onAddComment,
  filePath,
  initialSubmittedComments = {},
  existingReviewComments = {},
  showDiffHunk = false,
}) => {
  const [activeCommentLines, setActiveCommentLines] = useState(new Set())
  const [comments, setComments] = useState({})
  const [submittedComments, setSubmittedComments] = useState(initialSubmittedComments)
  const [hoveredLine, setHoveredLine] = useState(null)
  const [selectedLines, setSelectedLines] = useState(new Set())
  const [clickedLine, setClickedLine] = useState(null)
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)

  // initialSubmittedComments가 변경될 때 submittedComments 업데이트
  useEffect(() => {
    setSubmittedComments(initialSubmittedComments)
  }, [initialSubmittedComments])

  if (!patch) return null

  const lines = patch.split('\n')
  let oldLine = 0
  let newLine = 0
  let position = 0

  // 댓글 폼 닫기
  const closeCommentForm = (lineIndex) => {
    setActiveCommentLines((prev) => {
      const newSet = new Set(prev)
      newSet.delete(lineIndex)
      return newSet
    })
    setComments((prevComments) => {
      const newComments = { ...prevComments }
      delete newComments[lineIndex]
      return newComments
    })
  }

  // 댓글 버튼 클릭
  const handleLineClick = (lineIndex, lineNumber, isNew, lineType, currentPosition) => {
    const lineId = `${isNew ? 'new' : 'old'}-${lineNumber}`

    setActiveCommentLines((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(lineIndex)) {
        closeCommentForm(lineIndex)
        return prev
      } else {
        newSet.add(lineIndex)
        setComments((prevComments) => ({
          ...prevComments,
          [lineIndex]: {
            content: '',
            lineNumber,
            isNew,
            lineType,
            id: lineId,
            position: currentPosition,
            diffHunk: patch,
            side: isNew ? 'RIGHT' : (lineType === 'removed' ? 'LEFT' : 'RIGHT'),
            path: filePath,
            fileIndex: null,
          },
        }))
        return newSet
      }
    })
  }

  // 드래그 시작
  const handleMouseDown = (lineIndex, event) => {
    if (event.target.closest('.comment-button')) return

    setSelectedLines(new Set())
    setClickedLine(null)
    setIsDragging(true)
    setDragStart(lineIndex)
    setDragEnd(lineIndex)
    event.preventDefault()
  }

  // 드래그 중
  const handleMouseEnter = (lineIndex) => {
    if (isDragging) {
      setDragEnd(lineIndex)
    }
  }

  // 코드 영역 클릭
  const handleCodeClick = (lineIndex) => {
    setClickedLine(clickedLine === lineIndex ? null : lineIndex)
  }

  // 전역 마우스업 이벤트 핸들러
  const handleGlobalMouseUp = useCallback(() => {
    // 드래그 상태일 때만 처리
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd)
      const end = Math.max(dragStart, dragEnd)

      setSelectedLines((prev) => {
        const newSet = new Set(prev)
        for (let i = start; i <= end; i++) {
          newSet.add(i)
        }
        return newSet
      })
    }

    // 드래그 상태 초기화
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, dragEnd])

  // 전역 마우스업 이벤트
  useEffect(() => {
    // 드래깅 중일 때만 이벤트 리스너 추가
    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, handleGlobalMouseUp])

  const handleCommentChange = (lineIndex, content, audioFile = null) => {
    setComments((prevComments) => ({
      ...prevComments,
      [lineIndex]: {
        ...prevComments[lineIndex],
        content,
        audioFile,
      },
    }))
  }

  const handleCommentSubmit = (lineIndex) => {
    const commentData = comments[lineIndex]
    const hasTextContent = commentData?.content?.trim()
    const hasAudioFile = commentData?.audioFile

    // 텍스트나 음성 중 하나라도 있어야 제출 가능
    if (hasTextContent || hasAudioFile) {
      // 선택된 라인들 정보 수집
      const allSelectedLines = new Set([...selectedLines])
      if (clickedLine !== null) {
        allSelectedLines.add(clickedLine)
      }
      
      // 선택된 라인이 없으면 + 버튼을 누른 라인만 사용 (단일 라인 댓글)
      if (allSelectedLines.size === 0) {
        allSelectedLines.add(lineIndex)
      }

      // 선택된 라인들을 인덱스 순으로 정렬
      const sortedSelectedLines = Array.from(allSelectedLines).sort((a, b) => a - b)
      


      // 각 라인의 실제 정보를 수집하기 위해 diff를 다시 파싱
      let tempOldLine = 0
      let tempNewLine = 0
      let tempPosition = 0
      const lineData = new Map() // lineIndex -> {lineNumber, position, side}

      lines.forEach((rawLine, idx) => {
        const line = rawLine ?? ''
        const isHeader = line.startsWith('@@')
        const isFileHeader =
          line.startsWith('diff ') || line.startsWith('---') || line.startsWith('+++')
        const isMeta = line.startsWith('\\')

        if (isHeader) {
          const m = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
          if (m) {
            tempOldLine = parseInt(m[1], 10)
            tempNewLine = parseInt(m[2], 10)
          }
          return
        }

        // position 계산 (실제 코드 라인만)
        if (!isFileHeader && !isMeta && !isHeader) {
          tempPosition++
        }

        const firstChar = line.charAt(0)
        const lineIsAdded = firstChar === '+' && !isFileHeader
        const lineIsRemoved = firstChar === '-' && !isFileHeader
        const lineIsContext = firstChar === ' '

        // 댓글 가능한 라인의 정보 저장
        if (lineIsAdded || lineIsRemoved || lineIsContext) {
          const currentLineNumber = lineIsAdded ? tempNewLine : tempOldLine
          const side = lineIsAdded ? 'RIGHT' : 'LEFT'

          lineData.set(idx, {
            lineNumber: currentLineNumber,
            position: tempPosition,
            side: side,
          })
        }

        // 라인 번호 증가
        if (lineIsRemoved || lineIsContext) tempOldLine++
        if (lineIsAdded || lineIsContext) tempNewLine++
      })

      // 선택된 라인들의 정보 추출
      const selectedLinesInfo = sortedSelectedLines.map((idx) => lineData.get(idx)).filter(Boolean) // undefined 제거

      // 음성 파일이 있으면 fileIndex는 임시로 -1로 설정 (PRReview에서 실제 인덱스로 변경됨)
      // 텍스트만 있으면 fileIndex는 null이고 body는 텍스트 내용
      const fileIndex = hasAudioFile ? -1 : null // PRReview에서 실제 인덱스로 업데이트됨
      const bodyText = hasAudioFile ? '' : commentData.content?.trim() || ''

      if (selectedLinesInfo.length === 0) {
        // 선택된 라인 정보가 없으면 원래 댓글 데이터 사용 (단일 라인)
        const reviewCommentData = {
          path: commentData.path,
          body: bodyText,
          position: commentData.position,
          line: commentData.lineNumber,
          side: commentData.side,
          startLine: undefined, // 단일 라인은 startLine 없음
          startSide: undefined, // 단일 라인은 startSide 없음
          fileIndex: fileIndex,
          ...(showDiffHunk && { diffHunk: commentData.diffHunk }),
        }

        // 상위 컴포넌트에 댓글 추가 알림 (파일별 상태 관리를 위해)
        onAddComment?.(lineIndex, {
          ...commentData,
          ...reviewCommentData, // reviewCommentData 정보도 포함
        })


        // 로컬 상태에도 추가 (즉시 UI 업데이트를 위해)
        setSubmittedComments((prev) => ({
          ...prev,
          [lineIndex]: [
            ...(prev[lineIndex] || []),
            {
              ...commentData,
              id: Date.now(), // 임시 ID
              submittedAt: new Date().toLocaleTimeString(),
            },
          ],
        }))
      } else {
        // 첫 번째와 마지막 라인 정보 사용
        const firstLine = selectedLinesInfo[0]
        const lastLine = selectedLinesInfo[selectedLinesInfo.length - 1]

        // startLine은 line보다 작아야 함 (GitHub API 요구사항)
        const actualStartLine = Math.min(firstLine.lineNumber, lastLine.lineNumber)
        const actualEndLine = Math.max(firstLine.lineNumber, lastLine.lineNumber)

        const reviewCommentData = {
          path: commentData.path,
          body: bodyText,
          position: lastLine.position, // 마지막 라인의 position
          line: actualEndLine, // 실제 끝 라인 번호
          side: lastLine.side, // 마지막 라인의 side
          startLine: actualStartLine !== actualEndLine ? actualStartLine : undefined, // 멀티라인인 경우만 startLine 설정
          startSide: actualStartLine !== actualEndLine ? firstLine.side : undefined, // 멀티라인인 경우만 startSide 설정
          fileIndex: fileIndex,
          ...(showDiffHunk && { diffHunk: commentData.diffHunk }),
        }
        

        // 마지막 선택된 라인의 인덱스 찾기 (임시 댓글 표시 위치)
        const lastLineIndex = sortedSelectedLines[sortedSelectedLines.length - 1]

        // 상위 컴포넌트에 댓글 추가 알림 (파일별 상태 관리를 위해)
        onAddComment?.(lastLineIndex, {
          ...commentData,
          ...reviewCommentData, // reviewCommentData 정보도 포함
        })


        // 로컬 상태에도 추가 (마지막 라인 위치에 표시)
        setSubmittedComments((prev) => ({
          ...prev,
          [lastLineIndex]: [
            ...(prev[lastLineIndex] || []),
            {
              ...commentData,
              id: Date.now() + Math.random(), // 임시 ID (두 번째 케이스)
              submittedAt: new Date().toLocaleTimeString(),
            },
          ],
        }))
      }

      // 댓글 제출 성공 후 폼 닫기 (+ 버튼이 있던 원래 위치)
      closeCommentForm(lineIndex)

      // 선택 상태 초기화
      setSelectedLines(new Set())
      setClickedLine(null)
    }
  }

  // 드래그 중인 라인 확인
  const isDraggedLine = (lineIndex) => {
    if (!isDragging || dragStart === null || dragEnd === null) return false
    const start = Math.min(dragStart, dragEnd)
    const end = Math.max(dragStart, dragEnd)
    return lineIndex >= start && lineIndex <= end
  }

  return (
    <div className="my-2 text-xs font-mono whitespace-pre min-w-full">
      <div className="inline-grid w-max min-w-full grid-cols-[4rem_1fr] border border-gray-300">
        {lines
          .filter((line) => {
            const trimmedLine = line?.trim() || ''
            return !trimmedLine.includes('No newline at end of file')
          })
          .map((rawLine, idx) => {
            const line = rawLine ?? ''
            const firstChar = line.charAt(0)

            const isHeader = line.startsWith('@@')
            const isFileHeader =
              line.startsWith('diff ') || line.startsWith('---') || line.startsWith('+++')
            const isMeta = line.startsWith('\\')

            const isAdded = firstChar === '+' && !isFileHeader
            const isRemoved = firstChar === '-' && !isFileHeader
            const isContext = firstChar === ' '

            if (isHeader) {
              const m = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
              if (m) {
                oldLine = parseInt(m[1], 10)
                newLine = parseInt(m[2], 10)
              }
              return (
                <div
                  key={idx}
                  className="col-span-2 sticky top-0 bg-gray-200 text-gray-600 py-1 px-4 text-sm font-semibold"
                >
                  {line}
                </div>
              )
            }

            // position 계산 (1부터 시작)
            if (!isFileHeader && !isMeta && !isHeader) {
              position++
            }

            const displayOld = isRemoved || isContext ? oldLine : ''
            const displayNew = isAdded || isContext ? newLine : ''
            const currentLineNumber = isAdded ? newLine : oldLine
            const currentPosition = position

            if (isRemoved || isContext) oldLine++
            if (isAdded || isContext) newLine++

            const lineType = isAdded ? 'added' : isRemoved ? 'removed' : 'context'

            // 배경색 설정
            const codeBg = isAdded
              ? 'bg-normal-added-code text-gray-900'
              : isRemoved
                ? 'bg-normal-removed-code text-gray-900'
                : 'bg-white text-gray-900'

            const numBg = isAdded
              ? 'bg-normal-added-num text-gray-900'
              : isRemoved
                ? 'bg-normal-removed-num text-gray-900'
                : 'bg-white text-gray-500'

            // 상태 확인
            const canComment = isAdded || isContext || isRemoved
            const isHovered = hoveredLine === idx
            const isSelected = selectedLines.has(idx)
            const isDragged = isDraggedLine(idx)
            const isClicked = clickedLine === idx

            // 선택된 라인의 배경색
            const finalCodeBg =
              isSelected || isDragged
                ? isAdded
                  ? 'bg-selected-added-code text-gray-900'
                  : isRemoved
                    ? 'bg-selected-removed-code text-gray-900'
                    : 'bg-selected-normal-code text-gray-900'
                : codeBg

            const finalNumBg =
              isSelected || isDragged
                ? isAdded
                  ? 'bg-selected-added-num text-gray-900'
                  : isRemoved
                    ? 'bg-selected-removed-num text-gray-900'
                    : 'bg-selected-normal-num text-gray-900'
                : numBg

            return (
              <React.Fragment key={idx}>
                {/* 라인 번호 */}
                <div
                  className={`w-16 text-right pr-2 select-none border-r border-gray-200 cursor-pointer hover:bg-opacity-80 transition-colors ${finalNumBg}`}
                  onMouseDown={(e) => handleMouseDown(idx, e)}
                  onMouseEnter={() => handleMouseEnter(idx)}
                >
                  <span className="inline-block w-6 text-right pr-1">{displayOld || ''}</span>
                  <span className="inline-block w-6 text-right">{displayNew || ''}</span>
                </div>

                {/* 코드 영역 */}
                <div
                  className={`${finalCodeBg} relative transition-colors ${
                    isClicked
                      ? 'shadow-[inset_0_0_0_2px] shadow-indigo-500'
                      : isSelected || isDragged
                        ? 'shadow-[inset_2px_0_0] shadow-indigo-500'
                        : ''
                  }`}
                  onClick={() => handleCodeClick(idx)}
                  onMouseEnter={() => {
                    if (isDragging) {
                      handleMouseEnter(idx)
                    } else if (canComment && hoveredLine !== idx) {
                      setHoveredLine(idx)
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isDragging && hoveredLine === idx) {
                      setHoveredLine(null)
                    }
                  }}
                >
                  {/* 댓글 추가 버튼 */}
                  {canComment &&
                    (isHovered || isClicked) &&
                    !isDragging &&
                    !activeCommentLines.has(idx) && (
                      <div
                        className="absolute -left-0 top-1/2 transform -translate-y-1/2 z-10 comment-button"
                        onClick={() =>
                          handleLineClick(
                            idx,
                            currentLineNumber,
                            isAdded,
                            lineType,
                            currentPosition
                          )
                        }
                      >
                        <div className="w-5 h-5 bg-blue-600 flex items-center justify-center rounded-[3px] border border-gray-200">
                          <Plus className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}

                  <div className="px-2 py-0.5">
                    {isMeta || isFileHeader ? (
                      <span className="text-gray-400 italic">{line}</span>
                    ) : (
                      <div className="flex">
                        {isAdded && <span className="w-4 text-gray-900">+</span>}
                        {isRemoved && <span className="w-4 text-gray-900">-</span>}
                        {isContext && <span className="w-4"></span>}
                        <span className="flex-1">{line.slice(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* 기존 리뷰 댓글들 표시 */}
                  {(() => {
                    // 실제 라인 번호와 side를 기반으로 댓글 찾기
                    const actualLineNumber = currentLineNumber // 실제 소스 파일의 라인 번호
                    const currentSide = isAdded ? 'RIGHT' : isRemoved ? 'LEFT' : 'RIGHT' // context 라인은 RIGHT로 처리
                    const commentsForLine = existingReviewComments[actualLineNumber] || []
                    
                    
                    // side가 일치하는 댓글만 필터링
                    const filteredComments = commentsForLine ? commentsForLine.filter(comment => 
                      comment.side === currentSide
                    ) : []
                    
                    
                    return filteredComments.length > 0 ? filteredComments.map((comment) => (
                      <div key={comment.id} className="mx-2 mb-2 font-sans">
                        <Box shadow className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-300 border-2 border-black flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {comment.reviewer?.[0] || 'R'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-stone-900 text-base">
                                {comment.reviewer || 'Unknown'}
                              </span>
                              <span className="text-sm text-stone-500 ml-2">
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
                          <p className="text-stone-700 whitespace-pre-wrap text-base">
                            {cleanReviewCommentBody(comment.body)}
                          </p>
                        </Box>
                      </div>
                    )) : null
                  })()}

                  {/* 제출된 댓글들 표시 (폼 위쪽) */}
                  {submittedComments[idx] &&
                    submittedComments[idx].map((comment) => (
                      <div key={comment.id} className="mx-2 mb-2 font-sans">
                        <Box shadow className="space-y-3 bg-sky-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-300 border-2 border-black flex items-center justify-center">
                              <span className="text-sm font-medium">나</span>
                            </div>
                            <div>
                              <span className="font-medium text-stone-900 text-base">내 댓글</span>
                              <span className="text-sm text-stone-500 ml-2">
                                {comment.submittedAt}
                              </span>
                              <Badge variant="warning" className="ml-2">
                                임시
                              </Badge>
                              {comment.audioFile && (
                                <Badge variant="success" className="ml-2">
                                  🎵 음성
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-stone-700 text-base">{comment.content || ''}</p>
                            {comment.audioFile && (
                              <div className="flex items-center gap-2">
                                <audio
                                  controls
                                  className="h-8 rounded-full border border-gray-300 "
                                >
                                  <source
                                    src={URL.createObjectURL(comment.audioFile)}
                                    type={comment.audioFile.type}
                                  />
                                  브라우저가 오디오를 지원하지 않습니다.
                                </audio>
                              </div>
                            )}
                          </div>
                        </Box>
                      </div>
                    ))}

                  {/* 댓글 폼 */}
                  {activeCommentLines.has(idx) && (
                    <div
                      className="font-sans"
                      onMouseEnter={(e) => e.stopPropagation()}
                      onMouseLeave={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CommentForm
                        size="normal"
                        value={comments[idx]?.content || ''}
                        onChange={(e) => handleCommentChange(idx, e.target.value)}
                        onAudioChange={(audioFile) =>
                          handleCommentChange(idx, comments[idx]?.content || '', audioFile)
                        }
                        onSubmit={() => handleCommentSubmit(idx)}
                        onCancel={() => closeCommentForm(idx)}
                        enableAudio={true}
                      />
                    </div>
                  )}
                </div>
              </React.Fragment>
            )
          })}
      </div>
    </div>
  )
}

export default React.memo(CodeDiff)
