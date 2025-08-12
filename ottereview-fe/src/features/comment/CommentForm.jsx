import { Mic, MicOff } from 'lucide-react'
import { useState } from 'react'

import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'

const CommentForm = ({ 
  value, 
  onChange, 
  onSubmit, 
  onCancel, 
  disabled = false, 
  size = 'normal',
  onAudioChange, // 음성 파일 변경 콜백
  enableAudio = true // 음성 기능 활성화 여부
}) => {
  const [audioFile, setAudioFile] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  // size에 따른 클래스 설정
  const sizeConfig = {
    small: {
      textareaHeight: 'h-16',
      gap: 'gap-1',
      buttonSize: 'xs'
    },
    normal: {
      textareaHeight: 'h-30',
      gap: 'gap-2',
      buttonSize: 'md'
    },
    large: {
      textareaHeight: 'h-40',
      gap: 'gap-3',
      buttonSize: 'md'
    }
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
            type: 'audio/webm' 
          })
          
          setAudioFile(audioFile)
          onAudioChange?.(audioFile)
          setIsRecording(false)
          setMediaRecorder(null)
          
          // 스트림 정리
          stream.getTracks().forEach(track => track.stop())
        }
        
        recorder.start()
        setMediaRecorder(recorder)
        setIsRecording(true)
        setAudioChunks(chunks)
        
        // 텍스트 입력 초기화
        onChange?.({ target: { value: '' } })
        
      } catch (error) {
        console.error('마이크 접근 실패:', error)
        alert('마이크 접근 권한이 필요합니다.')
      }
    }
  }

  // 음성 파일 삭제
  const handleRemoveAudio = () => {
    setAudioFile(null)
    setIsRecording(false)
    setMediaRecorder(null)
    setAudioChunks([])
    onAudioChange?.(null)
  }

  // 텍스트 입력이 비활성화되어야 하는지 확인
  const isTextDisabled = disabled || (enableAudio && (audioFile || isRecording))

  return (
    <div className={`${size === 'mdall' ? 'p-2 max-w-sm' : size === 'large' ? 'p-6 max-w-lg' : 'p-4 max-w-md'}`}>
      <Box shadow>
        <InputBox
          className={config.textareaHeight}
          as="textarea"
          label="리뷰"
          value={value}
          onChange={onChange}
          placeholder={isTextDisabled ? "음성 녹음 중이거나 음성 파일이 있어서 텍스트 입력이 비활성화됩니다." : "리뷰를 입력하세요..."}
          disabled={isTextDisabled}
        />
        
        {/* 음성 녹음 컨트롤 */}
        {enableAudio && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant={isRecording ? "primary" : "outline"}
              onClick={handleRecordToggle}
              disabled={disabled}
              className="flex items-center gap-1"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecording ? "녹음 중지" : "음성 녹음"}
            </Button>
            
            {audioFile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-600">음성 파일 준비됨</span>
                <audio controls className="h-8">
                  <source src={URL.createObjectURL(audioFile)} type={audioFile.type} />
                  브라우저가 오디오를 지원하지 않습니다.
                </audio>
                <Button size="sm" variant="outline" onClick={handleRemoveAudio}>
                  삭제
                </Button>
              </div>
            )}
          </div>
        )}

        <div className={`flex justify-end ${config.gap} mt-2`}>
          <Button size={config.buttonSize} variant="outline" onClick={onCancel} disabled={disabled}>
            취소
          </Button>
          <Button 
            size={config.buttonSize} 
            variant="secondary" 
            onClick={onSubmit} 
            disabled={disabled || (!value?.trim() && (!enableAudio || !audioFile))}
          >
            제출
          </Button>
        </div>
      </Box>
    </div>
  )
}

export default CommentForm