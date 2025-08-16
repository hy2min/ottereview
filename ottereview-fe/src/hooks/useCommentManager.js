import { useCallback,useState } from 'react'

/**
 * 댓글 관리를 위한 커스텀 훅
 * PR 생성과 리뷰 작성에서 공통으로 사용
 */
export const useCommentManager = () => {
  const [reviewComments, setReviewComments] = useState([])
  const [audioFiles, setAudioFiles] = useState([])
  const [fileComments, setFileComments] = useState({})

  // 라인별 댓글 추가 함수
  const handleAddLineComment = useCallback((commentData) => {
    // 음성 파일이 있는 경우 (fileIndex가 -1인 경우)
    if (commentData.audioFile && commentData.fileIndex === -1) {
      setAudioFiles((prev) => {
        const currentFileIndex = prev.length
        const updatedCommentData = {
          ...commentData,
          fileIndex: currentFileIndex,
          audioFile: undefined, // API 요청에서는 audioFile 제거
        }
        setReviewComments((prevComments) => [...prevComments, updatedCommentData])
        return [...prev, commentData.audioFile]
      })
    } else {
      // 텍스트 댓글인 경우 (fileIndex가 null)
      setReviewComments((prev) => [...prev, commentData])
    }
  }, [])

  // 파일별 라인 댓글 추가 함수
  const handleAddFileLineComment = useCallback((filePath, lineIndex, commentData) => {
    setFileComments((prev) => ({
      ...prev,
      [filePath]: {
        ...prev[filePath],
        submittedComments: {
          ...prev[filePath]?.submittedComments,
          [lineIndex]: [
            ...(prev[filePath]?.submittedComments?.[lineIndex] || []),
            {
              ...commentData,
              id: Date.now() + Math.random(),
              submittedAt: new Date().toLocaleTimeString(),
            },
          ],
        },
      },
    }))

    // 기존 reviewComments에도 추가 (최종 제출을 위해)
    handleAddLineComment(commentData)
  }, [handleAddLineComment])

  // 댓글 삭제 함수 (fileIndex 재정렬 포함)
  const handleRemoveComment = useCallback((filePath, lineIndex, commentId) => {
    // 1. fileComments에서 특정 댓글 제거
    setFileComments((prev) => {
      const updatedFileComments = { ...prev }
      if (updatedFileComments[filePath]?.submittedComments?.[lineIndex]) {
        updatedFileComments[filePath].submittedComments[lineIndex] = 
          updatedFileComments[filePath].submittedComments[lineIndex].filter(
            comment => comment.id !== commentId
          )
        
        // 빈 배열이면 해당 라인 삭제
        if (updatedFileComments[filePath].submittedComments[lineIndex].length === 0) {
          delete updatedFileComments[filePath].submittedComments[lineIndex]
        }
      }
      return updatedFileComments
    })

    // 2. reviewComments에서 해당 댓글 찾아서 제거하고 fileIndex 재정렬
    setReviewComments((prevComments) => {
      // 삭제할 댓글 찾기
      const commentToRemove = prevComments.find(comment => 
        comment.id === commentId || (comment.path === filePath && comment.lineNumber && comment.content)
      )
      
      if (!commentToRemove) return prevComments
      
      const removedFileIndex = commentToRemove.fileIndex
      
      // 댓글 제거
      const filteredComments = prevComments.filter(comment => {
        // ID로 매칭하거나, 음성파일의 경우 복합 매칭
        return !(comment.id === commentId || 
                (comment.path === filePath && 
                 comment.lineNumber === commentToRemove.lineNumber && 
                 comment.content === commentToRemove.content))
      })
      
      // fileIndex 재정렬 (삭제된 파일 이후의 인덱스들을 -1씩 감소)
      if (typeof removedFileIndex === 'number' && removedFileIndex >= 0) {
        return filteredComments.map(comment => ({
          ...comment,
          fileIndex: typeof comment.fileIndex === 'number' && comment.fileIndex > removedFileIndex
            ? comment.fileIndex - 1
            : comment.fileIndex
        }))
      }
      
      return filteredComments
    })

    // 3. audioFiles에서 해당 인덱스의 파일 제거 (있는 경우)
    setAudioFiles((prevFiles) => {
      const commentToRemove = reviewComments.find(comment => 
        comment.id === commentId || (comment.path === filePath && comment.lineNumber && comment.content)
      )
      
      if (commentToRemove && typeof commentToRemove.fileIndex === 'number' && commentToRemove.fileIndex >= 0) {
        const newFiles = [...prevFiles]
        newFiles.splice(commentToRemove.fileIndex, 1) // 해당 인덱스 파일 제거
        return newFiles
      }
      
      return prevFiles
    })
  }, [reviewComments])

  // 상태 초기화 함수
  const resetCommentStates = useCallback(() => {
    setReviewComments([])
    setAudioFiles([])
    setFileComments({})
  }, [])

  return {
    reviewComments,
    audioFiles,
    fileComments,
    setReviewComments,
    setFiles: setAudioFiles,
    setFileComments,
    handleAddLineComment,
    handleAddFileLineComment,
    handleRemoveComment,
    resetCommentStates,
  }
}