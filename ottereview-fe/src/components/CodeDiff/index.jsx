import { Plus } from 'lucide-react'
import React, { useState } from 'react'

import CommentForm from '@/features/comment/CommentForm'

const CodeDiff = ({ patch, onAddComment }) => {
  const [activeCommentLines, setActiveCommentLines] = useState(new Set())
  const [comments, setComments] = useState({})
  const [hoveredLine, setHoveredLine] = useState(null)
  const [selectedLines, setSelectedLines] = useState(new Set())
  const [clickedLine, setClickedLine] = useState(null)

  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)

  if (!patch) return null

  const lines = patch.split('\n')
  let oldLine = 0
  let newLine = 0

  // 댓글 관련 상태를 한번에 처리하는 헬퍼 함수
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

  const handleLineClick = (lineIndex, lineNumber, isNew, lineType) => {
    const lineId = `${isNew ? 'new' : 'old'}-${lineNumber}`

    setActiveCommentLines((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(lineIndex)) {
        // 이미 열려있으면 닫기
        closeCommentForm(lineIndex)
        return prev // 상태는 closeCommentForm에서 처리
      } else {
        // 새로 열기
        newSet.add(lineIndex)
        setComments((prevComments) => ({
          ...prevComments,
          [lineIndex]: {
            content: '',
            lineNumber,
            isNew,
            lineType,
            id: lineId,
          },
        }))
        return newSet
      }
    })
  }

  // 드래그 시작
  const handleMouseDown = (lineIndex, event) => {
    // 댓글 버튼 클릭인 경우 드래그 시작하지 않음
    if (event.target.closest('.comment-button')) {
      return
    }

    // 새로운 드래그 시작 시 기존 선택 초기화
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

  // 코드 영역 클릭 핸들러
  const handleCodeClick = (lineIndex) => {
    setClickedLine(clickedLine === lineIndex ? null : lineIndex)
  }

  // 드래그 종료
  const handleMouseUp = () => {
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

    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  // 전역 마우스업 이벤트 처리
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging, dragStart, dragEnd])

  const handleCommentChange = (lineIndex, content) => {
    setComments((prevComments) => ({
      ...prevComments,
      [lineIndex]: {
        ...prevComments[lineIndex],
        content,
      },
    }))
  }

  const handleCommentSubmit = (lineIndex) => {
    const commentData = comments[lineIndex]
    if (commentData?.content?.trim()) {
      onAddComment?.({
        line: commentData.lineNumber,
        isNewLine: commentData.isNew,
        content: commentData.content.trim(),
        lineId: commentData.id,
      })

      closeCommentForm(lineIndex)
    }
  }

  const handleCommentCancel = (lineIndex) => {
    closeCommentForm(lineIndex)
  }

  // 드래그 중인 라인인지 확인
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

            const displayOld = isRemoved || isContext ? oldLine : ''
            const displayNew = isAdded || isContext ? newLine : ''
            const currentLineNumber = isAdded ? newLine : oldLine

            if (isRemoved || isContext) oldLine++
            if (isAdded || isContext) newLine++

            const lineType = isAdded ? 'added' : isRemoved ? 'removed' : 'context'

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

            const canComment = isAdded || isContext || isRemoved
            const isHovered = hoveredLine === idx
            const isSelected = selectedLines.has(idx)
            const isDragged = isDraggedLine(idx)
            const isClicked = clickedLine === idx

            // 선택된 라인의 배경색 처리
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
                {/* 라인 번호 영역 */}
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
                    canComment && setHoveredLine(idx)
                    if (isDragging) {
                      handleMouseEnter(idx)
                    }
                  }}
                  onMouseLeave={() => setHoveredLine(null)}
                >
                  {/* 댓글 추가 버튼 */}
                  {canComment &&
                    (isHovered || isClicked) &&
                    !isDragging &&
                    !activeCommentLines.has(idx) && (
                      <div
                        className="absolute -left-0 top-1/2 transform -translate-y-1/2 z-10 comment-button"
                        onClick={() => handleLineClick(idx, currentLineNumber, isAdded, lineType)}
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
                        {/* +/- 기호 영역 */}
                        {isAdded && <span className="w-4 text-gray-900">+</span>}
                        {isRemoved && <span className="w-4 text-gray-900">-</span>}
                        {isContext && <span className="w-4"></span>}

                        {/* 실제 코드 영역 - 중복 제거 */}
                        <span className="flex-1">{line.slice(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* 댓글 폼 */}
                  {activeCommentLines.has(idx) && (
                    <div
                      className="p-4"
                      onMouseEnter={(e) => e.stopPropagation()}
                      onMouseLeave={(e) => e.stopPropagation()}
                    >
                      <CommentForm
                        value={comments[idx]?.content || ''}
                        onChange={(e) => handleCommentChange(idx, e.target.value)}
                        onSubmit={() => handleCommentSubmit(idx)}
                        onCancel={() => handleCommentCancel(idx)}
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
