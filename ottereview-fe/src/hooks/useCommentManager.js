import { useState, useCallback } from 'react'

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
    resetCommentStates,
  }
}