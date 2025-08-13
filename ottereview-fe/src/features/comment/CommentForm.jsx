import { Mic, MicOff } from 'lucide-react'
import { useState } from 'react'

import Box from '@/components/Box'
import Button from '@/components/Button'

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
}) => {
  const [audioFile, setAudioFile] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)

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
        alert('마이크 접근 권한이 필요합니다.')
      }
    }
  }

  // 음성 관련 상태 초기화
  const resetAudioState = () => {
    setAudioFile(null)
    setIsRecording(false)
    setMediaRecorder(null)
  }

  // 음성 파일 삭제
  const handleRemoveAudio = () => {
    resetAudioState()
    onAudioChange?.(null)
  }


  return (
    <div
      className={`${size === 'small' ? 'p-2 max-w-md' : size === 'large' ? 'p-6 max-w-2xl' : 'p-4 max-w-xl'}`}
    >
      <Box shadow>
        {/* 음성 파일이 있을 때는 음성 재생 컨트롤만 표시 */}
        {audioFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">음성 댓글</div>
              <span className="text-sm text-green-600">🎵 음성 파일 준비됨</span>
            </div>
            <div className="flex items-center gap-3">
              <audio
                controls
                className="flex-1 h-10 border rounded-full border-gray-300 bg-gray-50"
              >
                <source src={URL.createObjectURL(audioFile)} type={audioFile.type} />
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
              <label className="block font-medium mb-1 text-base">리뷰</label>
              <textarea
                className={`bg-white border-2 border-black rounded-[8px] w-full px-2 py-1 resize-none min-h-20 text-base placeholder:text-base ${config.textareaHeight}`}
                placeholder={isRecording ? '음성 녹음 중...' : '리뷰를 입력하세요...'}
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
            <label className="block font-medium text-base">리뷰 상태</label>
            <div className="flex gap-6">
              {reviewStates.map((state) => (
                <label key={state.value} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reviewState"
                    value={state.value}
                    checked={reviewState === state.value}
                    onChange={(e) => onReviewStateChange?.(e.target.value)}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-base">{state.label}</div>
                    <div className="text-sm text-gray-500">{state.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 하단 버튼들 - 음성녹음과 취소/제출을 같은 라인에 */}
        <div className={`flex items-center justify-between ${config.gap} mt-2`}>
          {/* 왼쪽: 음성 녹음 버튼 */}
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
          </div>

          {/* 오른쪽: 취소/제출 버튼 */}
          <div className={`flex ${config.gap}`}>
            <Button size="sm" variant="outline" onClick={onCancel} disabled={disabled}>
              취소
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onSubmit}
              disabled={disabled || (!value?.trim() && (!enableAudio || !audioFile))}
            >
              제출
            </Button>
          </div>
        </div>
      </Box>
    </div>
  )
}

export default CommentForm
