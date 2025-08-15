import { Edit, Plus, Trash2 } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import CommentForm from '@/features/comment/CommentForm'
import ReviewCommentList from '@/features/comment/ReviewCommentList'
import { useUserStore } from '@/store/userStore'

const CodeDiff = ({
  patch,
  onAddComment,
  onRemoveComment,
  filePath,
  initialSubmittedComments = {},
  existingReviewComments = {},
  descriptions = [],
  prAuthor = {},
  showDiffHunk = false,
  commentMode = 'review', // 'review' 또는 'description' 모드
  onDataRefresh, // PR 데이터 새로고침 콜백
}) => {
  const user = useUserStore((state) => state.user)
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

  // 임시 댓글 편집 관련 상태
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [editingCommentAudio, setEditingCommentAudio] = useState(null)

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

  // initialSubmittedComments가 변경될 때 submittedComments 업데이트
  useEffect(() => {
    setSubmittedComments(initialSubmittedComments)
  }, [initialSubmittedComments])

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
            side: isNew ? 'RIGHT' : lineType === 'removed' ? 'LEFT' : 'RIGHT',
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


  const handleCommentChange = (lineIndex, content, audioFile = null) => {
    setComments((prevComments) => ({
      ...prevComments,
      [lineIndex]: {
        ...prevComments[lineIndex],
        content: audioFile ? '' : content, // 음성 파일이 있으면 텍스트는 빈 문자열로
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

        // 리뷰 모드와 설명 모드 모두 로컬 상태에 추가 (임시 상태 표시)
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

  // 임시 댓글 편집 시작
  const handleEditComment = (lineIndex, comment) => {
    setEditingCommentId(`${lineIndex}-${comment.id}`)
    setEditingCommentContent(comment.content || '')
    setEditingCommentAudio(comment.audioFile || null)
  }

  // 임시 댓글 편집 취소
  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentContent('')
    setEditingCommentAudio(null)
  }

  // 임시 댓글 편집 저장
  const handleSaveEditComment = (lineIndex, comment) => {
    const hasTextContent = editingCommentContent.trim()
    const hasAudioFile = editingCommentAudio

    // 텍스트나 음성 중 하나라도 있어야 저장 가능
    if (hasTextContent || hasAudioFile) {
      setSubmittedComments((prev) => ({
        ...prev,
        [lineIndex]: prev[lineIndex].map((c) =>
          c.id === comment.id
            ? {
                ...c,
                content: hasAudioFile ? '' : editingCommentContent.trim(),
                audioFile: editingCommentAudio,
              }
            : c
        ),
      }))

      // 편집 상태 초기화
      setEditingCommentId(null)
      setEditingCommentContent('')
      setEditingCommentAudio(null)
    }
  }

  // 편집 중 음성 파일 변경 핸들러
  const handleEditCommentAudioChange = (audioFile) => {
    setEditingCommentAudio(audioFile)
    // 음성 파일이 있으면 텍스트 내용 초기화
    if (audioFile) {
      setEditingCommentContent('')
    }
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
                  className={`w-16 text-right pr-2 py-0.5 select-none border-r border-gray-200 cursor-pointer hover:bg-opacity-80 transition-colors ${finalNumBg}`}
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
                    isHovered &&
                    !isDragging &&
                    !activeCommentLines.has(idx) && (
                      <div
                        className="absolute -left-0 z-10 comment-button"
                        style={{ top: '0' }}
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

                  {/* PR 작성자 설명(Descriptions) 표시 - 댓글보다 위에 */}
                  {(() => {
                    const actualLineNumber = currentLineNumber
                    const currentSide = isAdded ? 'RIGHT' : isRemoved ? 'LEFT' : 'RIGHT'

                    // 현재 라인에 해당하는 descriptions 필터링
                    const descriptionsForLine = descriptions.filter((desc) => {
                      // path가 현재 파일과 일치해야 함
                      if (desc.path !== filePath) return false

                      // 단일 라인 description인 경우
                      if (!desc.startLine || desc.startLine === desc.line) {
                        return desc.line === actualLineNumber && desc.side === currentSide
                      }

                      // 멀티 라인 description인 경우 - 마지막 라인(desc.line)에서만 표시
                      return desc.line === actualLineNumber && desc.side === currentSide
                    })

                    return descriptionsForLine.length > 0
                      ? descriptionsForLine.map((desc, index) => (
                          <div
                            key={`desc-${desc.line}-${desc.position}-${index}`}
                            className="mx-2 mb-2 font-sans max-w-4xl"
                          >
                            <Box shadow className="space-y-3 theme-bg-tertiary max-w-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 dark:border-blue-400 flex items-center justify-center">
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                                      {prAuthor.githubUsername?.[0] || 'A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium theme-text text-base">
                                      {prAuthor.githubUsername || 'PR 작성자'}
                                    </span>

                                    <Badge variant="primary" className="ml-2">
                                      📝 설명
                                    </Badge>
                                    {desc.voiceFileUrl && (
                                      <Badge variant="success" className="ml-2">
                                        🎵 음성
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* 설명 내용 (읽기 전용) */}
                              {desc.voiceFileUrl ? (
                                <audio
                                  controls
                                  src={desc.voiceFileUrl}
                                  className="h-8 rounded-full border border-gray-300 "
                                >
                                  브라우저가 오디오를 지원하지 않습니다.
                                </audio>
                              ) : (
                                <p className="theme-text whitespace-pre-wrap text-base font-medium">
                                  {desc.body}
                                </p>
                              )}
                            </Box>
                          </div>
                        ))
                      : null
                  })()}

                  {/* 기존 리뷰 댓글들 표시 */}
                  {(() => {
                    // 실제 라인 번호와 side를 기반으로 댓글 찾기
                    const actualLineNumber = currentLineNumber // 실제 소스 파일의 라인 번호
                    const currentSide = isAdded ? 'RIGHT' : isRemoved ? 'LEFT' : 'RIGHT' // context 라인은 RIGHT로 처리
                    const commentsForLine = existingReviewComments[actualLineNumber] || []

                    // side가 일치하는 댓글만 필터링
                    const filteredComments = commentsForLine
                      ? commentsForLine.filter((comment) => comment.side === currentSide)
                      : []

                    return (
                      <ReviewCommentList
                        comments={filteredComments}
                        onDataRefresh={onDataRefresh}
                      />
                    )
                  })()}

                  {/* 제출된 댓글들 표시 (폼 위쪽) */}
                  {submittedComments[idx] &&
                    submittedComments[idx].map((comment) => (
                      <div key={comment.id} className="mx-2 mb-2 font-sans max-w-4xl">
                        <Box shadow className="space-y-3 theme-bg-tertiary max-w-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 dark:border-blue-400 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                                  {user?.githubUsername?.[0] || 'U'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium theme-text text-base">
                                  {user?.githubUsername || '사용자'}
                                </span>
                                <span className="text-sm theme-text-muted ml-2">
                                  {comment.submittedAt}
                                </span>
                                {commentMode === 'review' && (
                                  <Badge variant="warning" className="ml-2">
                                    임시
                                  </Badge>
                                )}
                                {comment.audioFile && (
                                  <Badge variant="success" className="ml-2">
                                    🎵 음성
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* 수정/삭제 버튼 */}
                            <div className="flex items-center gap-1">
                              {/* 수정 버튼 (텍스트/음성 댓글 모두) */}
                              <button
                                onClick={() => handleEditComment(idx, comment)}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                                title="댓글 수정"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {/* 삭제 버튼 */}
                              {onRemoveComment && (
                                <button
                                  onClick={() => {
                                    // 로컬 상태에서 삭제
                                    setSubmittedComments((prev) => ({
                                      ...prev,
                                      [idx]: (prev[idx] || []).filter((c) => c.id !== comment.id)
                                    }))
                                    // 상위 컴포넌트에도 알림
                                    onRemoveComment(idx, comment.id)
                                  }}
                                  className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                                  title="댓글 삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {/* 편집 모드인지 확인 */}
                            {editingCommentId === `${idx}-${comment.id}` ? (
                              <div className="font-sans">
                                <CommentForm
                                  size="normal"
                                  value={editingCommentContent}
                                  onChange={(e) => setEditingCommentContent(e.target.value)}
                                  onAudioChange={handleEditCommentAudioChange}
                                  onSubmit={() => handleSaveEditComment(idx, comment)}
                                  onCancel={handleCancelEditComment}
                                  enableAudio={true}
                                  mode={commentMode}
                                  audioFile={editingCommentAudio}
                                />
                              </div>
                            ) : (
                              <>
                                {/* 댓글 내용 */}
                                {comment.audioFile ? (
                                  <audio
                                    controls
                                    src={URL.createObjectURL(comment.audioFile)}
                                    className="h-8 rounded-full border border-gray-300"
                                  >
                                    브라우저가 오디오를 지원하지 않습니다.
                                  </audio>
                                ) : (
                                  <p className="theme-text whitespace-pre-wrap text-base">
                                    {comment.content}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </Box>
                      </div>
                    ))}

                  {/* 댓글 추가 영역 */}
                  {activeCommentLines.has(idx) && (
                    <div className="mx-2 mb-2 font-sans max-w-4xl">
                      <CommentForm
                        value={comments[idx]?.content || ''}
                        onChange={(e) => handleCommentChange(idx, e.target.value)}
                        onAudioChange={(file) => handleCommentChange(idx, '', file)}
                        onSubmit={() => handleCommentSubmit(idx)}
                        onCancel={() => closeCommentForm(idx)}
                        enableAudio={true}
                        enableCushion={commentMode === 'review'}
                        mode={commentMode}
                        audioFile={comments[idx]?.audioFile}
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

export default CodeDiff