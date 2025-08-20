import { Mic, MicOff, Settings } from 'lucide-react'
import { useState } from 'react'

import Box from '@/components/Box'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import { applyCushionLanguage } from '@/features/pullRequest/prApi'
import { useModalContext } from '@/components/ModalProvider'

const CommentForm = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  disabled = false,
  size = 'normal',
  onAudioChange, // 음성 파일 변경 콜백
  enableAudio = true, // 음성 기능 활성화 여부
  reviewState = 'COMMENT', // 리뷰 상태
  onReviewStateChange, // 리뷰 상태 변경 콜백
  showReviewState = false, // 리뷰 상태 선택 UI 표시 여부
  mode = 'review', // 'review' 또는 'description' 모드
  disableReviewOptions = false, // 리뷰 옵션 비활성화 여부
  audioFile: initialAudioFile = null, // 초기 음성 파일 (편집 모드용)
  enableCushion = false, // 쿠션어 기능 활성화 여부
}) => {
  const { warning } = useModalContext()
  
  const [audioFile, setAudioFile] = useState(initialAudioFile)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 쿠션어 모달 상태 관리
  const [isCushionModalOpen, setIsCushionModalOpen] = useState(false)
  const [originalContent, setOriginalContent] = useState('')
  const [cushionedContent, setCushionedContent] = useState('')
  const [isCushionLoading, setIsCushionLoading] = useState(false)

  // 리뷰 상태 옵션들
  const reviewStates = [
    { value: 'COMMENT', label: '댓글만', description: '승인 없이 의견만 남기기' },
    { value: 'APPROVE', label: '승인', description: '변경사항을 승인' },
    { value: 'REQUEST_CHANGES', label: '변경 요청', description: '수정이 필요함' },
  ]

  // size에 따른 클래스 설정
  const sizeConfig = {
    small: {
      textareaHeight: 'h-16',
      gap: 'gap-1',
    },
    normal: {
      textareaHeight: 'h-30',
      gap: 'gap-2',
    },
    large: {
      textareaHeight: 'h-40',
      gap: 'gap-3',
    },
  }

  const config = sizeConfig[size] || sizeConfig.normal

  // 음성 녹음 토글
  const handleRecordToggle = async () => {
    if (!enableAudio) return

    if (isRecording) {
      // 녹음 중지
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
    } else {
      // 녹음 시작
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        const chunks = []

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }

        recorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' })
          const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
            type: 'audio/webm',
          })

          setAudioFile(audioFile)
          onAudioChange?.(audioFile)
          setIsRecording(false)
          setMediaRecorder(null)

          // 스트림 정리
          stream.getTracks().forEach((track) => track.stop())
        }

        recorder.start()
        setMediaRecorder(recorder)
        setIsRecording(true)

        // 텍스트 입력 초기화
        onChange?.({ target: { value: '' } })
      } catch (error) {
        console.error('마이크 접근 실패:', error)
        warning('마이크 접근 권한이 필요합니다.')
      }
    }
  }

  // 음성 관련 상태 초기화
  const resetAudioState = () => {
    setAudioFile(initialAudioFile)
    setIsRecording(false)
    setMediaRecorder(null)
  }

  // 음성 파일 삭제
  const handleRemoveAudio = () => {
    resetAudioState()
    onAudioChange?.(null)
  }

  // 제출 핸들러
  const handleSubmit = async () => {
    if (isSubmitting) return // 이미 제출 중이면 중복 실행 방지

    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 쿠션어 적용 처리
  const handleApplyCushion = async () => {
    if (!value?.trim()) return

    setOriginalContent(value)
    setIsCushionModalOpen(true)
    setIsCushionLoading(true)
    setCushionedContent('')

    try {
      const response = await applyCushionLanguage(value)

      if (response?.result) {
        setCushionedContent(response.result)
      }
    } catch (error) {
      console.error('쿠션어 적용 실패:', error)
      setCushionedContent('쿠션어 적용 중 오류가 발생했습니다.')
    } finally {
      setIsCushionLoading(false)
    }
  }

  // 쿠션어 적용 확정
  const handleApplyCushionConfirm = () => {
    onChange?.({ target: { value: cushionedContent } })
    setIsCushionModalOpen(false)
  }

  // 쿠션어 적용 취소
  const handleApplyCushionCancel = () => {
    setIsCushionModalOpen(false)
  }

  return (
    <Box
      shadow
      className={`${size === 'small' ? 'p-2 max-w-md' : size === 'large' ? 'p-6 max-w-2xl' : 'p-4 max-w-xl'}`}
    >
      {/* 음성 파일이 있을 때는 음성 재생 컨트롤만 표시 */}
      {audioFile ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium theme-text">
              음성 {mode === 'description' ? '설명' : '댓글'}
            </div>
            <span className="text-sm text-green-600 dark:text-green-400">🎵 음성 파일 준비됨</span>
          </div>
          <div className="flex items-center gap-3">
            <audio
              controls
              className="flex-1 h-10 border rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
            >
              <source 
                src={audioFile instanceof File ? URL.createObjectURL(audioFile) : audioFile} 
                type={audioFile instanceof File ? audioFile.type : 'audio/webm'} 
              />
              브라우저가 오디오를 지원하지 않습니다.
            </audio>
            <Button size="sm" variant="outline" onClick={handleRemoveAudio}>
              삭제
            </Button>
          </div>
        </div>
      ) : (
        /* 음성 파일이 없을 때는 텍스트 입력 폼 표시 */
        <>
          <div className="space-y-1">
            <label className="block font-medium mb-1 text-base theme-text">
              {mode === 'description' ? '설명' : '리뷰'}
            </label>
            <textarea
              className={`theme-bg-primary border-2 theme-border rounded-[8px] w-full px-2 py-1 resize-none min-h-20 text-base placeholder:text-base theme-text placeholder:theme-text-muted ${config.textareaHeight}`}
              placeholder={
                isRecording
                  ? '음성 녹음 중...'
                  : mode === 'description'
                    ? '설명을 입력하세요...'
                    : '리뷰를 입력하세요...'
              }
              value={value}
              onChange={onChange}
              disabled={disabled || isRecording}
            />
          </div>
        </>
      )}

      {/* 리뷰 상태 선택 - showReviewState가 true일 때만 표시 */}
      {showReviewState && (
        <div className="space-y-2">
          <label className="block font-medium text-base theme-text">리뷰 상태</label>
          <div className="flex gap-6">
            {reviewStates.map((state) => {
              const isDisabled =
                disableReviewOptions &&
                (state.value === 'APPROVE' || state.value === 'REQUEST_CHANGES')

              return (
                <label
                  key={state.value}
                  className={`flex items-start gap-2 ${
                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name="reviewState"
                    value={state.value}
                    checked={reviewState === state.value}
                    onChange={(e) => onReviewStateChange?.(e.target.value)}
                    disabled={isDisabled}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-base theme-text">{state.label}</div>
                    <div className="text-sm theme-text-muted">{state.description}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* 하단 버튼들 - 음성녹음과 취소/제출을 같은 라인에 */}
      <div className={`flex items-center justify-between ${config.gap} mt-2`}>
        {/* 왼쪽: 음성 녹음 버튼 & 쿠션어 적용 버튼 */}
        <div className="flex items-center gap-2">
          {enableAudio && !audioFile && (
            <Button
              size="sm"
              variant={isRecording ? 'primary' : 'outline'}
              onClick={handleRecordToggle}
              disabled={disabled}
              className="flex items-center gap-1"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecording ? '녹음 중지' : '음성 녹음'}
            </Button>
          )}
          {enableCushion && !audioFile && value?.trim() && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleApplyCushion}
              disabled={disabled || isSubmitting}
              className="hover:!bg-purple-50 dark:hover:!bg-purple-900 hover:!text-purple-700 dark:hover:!text-purple-300"
            >
              쿠션어 적용
            </Button>
          )}
        </div>

        {/* 오른쪽: 취소/제출 버튼 */}
        <div className={`flex ${config.gap}`}>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={disabled || isSubmitting}
            className="hover:!bg-gray-100 dark:hover:!bg-gray-700 hover:!text-gray-900 dark:hover:!text-gray-100 hover:!shadow-md"
          >
            취소
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSubmit}
            disabled={disabled || isSubmitting || (!value?.trim() && (!enableAudio || !audioFile))}
            className="hover:!bg-blue-50 dark:hover:!bg-blue-900 hover:!text-blue-700 dark:hover:!text-blue-300 hover:!shadow-md"
          >
{isSubmitting ? (
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 animate-spin" />
                제출 중...
              </div>
            ) : (
              '제출'
            )}
          </Button>
        </div>
      </div>
      
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
    </Box>
  )
}

export default CommentForm
