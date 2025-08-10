import { useEffect, useState } from 'react'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'
import PRFileList from '@/features/pullRequest/PRFileList'
import useLoadingDots from '@/lib/utils/useLoadingDots'

const PRCreateStep3 = ({ goToStep, formData, updateFormData, aiOthers, validationBranches }) => {
  const [showPriorities, setShowPriorities] = useState(true)

  // 로컬 상태로 제목과 설명을 관리
  const [localTitle, setLocalTitle] = useState('')
  const [localDescription, setLocalDescription] = useState('')

  const candidates = aiOthers?.priority?.result?.candidates || []
  const slots = Array.from({ length: 3 }, (_, i) => candidates[i] || null)
  const priorityVariantMap = {
    LOW: 'priorityLow',
    MEDIUM: 'priorityMedium',
    HIGH: 'priorityHigh',
  }

  const isAiTitleLoading = !aiOthers?.title?.result
  const loadingDots = useLoadingDots(isAiTitleLoading, 300)

  // 컴포넌트 마운트 시 기존 formData로 로컬 상태 초기화
  useEffect(() => {
    setLocalTitle(formData.title || '')
    setLocalDescription(formData.description || '')
  }, [formData.title, formData.description])

  const handleApplyAiTitle = () => {
    setLocalTitle(aiOthers?.title?.result || '')
  }

  const handleNextStep = () => {
    // 다음 단계로 넘어갈 때 로컬 상태를 formData에 반영
    updateFormData({
      title: localTitle,
      description: localDescription,
    })
    console.log({ title: localTitle, description: localDescription })
    goToStep(4)
  }

  return (
    <div className="flex flex-col w-full space-y-3">
      <div className="flex flex-col md:flex-row md:items-stretch space-y-3 md:space-y-0 md:space-x-4">
        {/* 왼쪽 박스 */}
        <div className={`w-full ${showPriorities ? 'md:w-2/3' : 'md:w-full'} space-y-3`}>
          <Box shadow>
            <div className="space-y-2 mt-2">
              <div className="relative space-y-1">
                <div className="flex items-center space-x-2">
                  <label htmlFor="aiTitle" className="block font-medium">
                    AI 추천 제목
                  </label>
                  <div className="-mt-[16px]">
                    <Button size="sm" onClick={handleApplyAiTitle}>
                      적용
                    </Button>
                  </div>
                  <div className="ml-auto -mt-[16px]">
                    <Button size="sm" onClick={() => setShowPriorities(!showPriorities)}>
                      {showPriorities ? '우선순위 숨김' : '우선순위 보기'}
                    </Button>
                  </div>
                </div>
                <input
                  id="aiTitle"
                  type="text"
                  readOnly
                  value={
                    isAiTitleLoading ? `추천받는 중${loadingDots}` : aiOthers?.title?.result || ''
                  }
                  className="bg-white border-2 border-black rounded-[8px] w-full px-2 py-1"
                />
              </div>
              <InputBox
                label="PR 제목"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
              />
              <InputBox
                className="h-50"
                label="PR 설명"
                as="textarea"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
              />
            </div>
          </Box>
        </div>

        {/* 오른쪽 박스 */}
        {showPriorities && (
          <div className="w-full md:w-1/3 flex flex-col space-y-3 min-h-0">
            {slots.map((candidate, index) => (
              <Box key={index} shadow className="flex flex-1">
                <div className="flex flex-col h-full min-h-0 w-full">
                  {candidate ? (
                    <div className="space-y-2 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={priorityVariantMap[candidate.priority_level] || 'default'}
                          >
                            {candidate.priority_level}
                          </Badge>
                          <span className="text-sm text-gray-600 truncate">{candidate.title}</span>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-5">{candidate.reason}</p>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      추천 없음
                    </div>
                  )}
                </div>
              </Box>
            ))}
          </div>
        )}
      </div>

      <Box shadow>
        <PRFileList files={validationBranches?.files || []} />
      </Box>
      <div className="mx-auto z-10">
        <div className="flex justify-center items-center space-x-3">
          <Button
            onClick={() => {
              goToStep(2)
            }}
            variant="secondary"
          >
            이전
          </Button>

          <Button onClick={handleNextStep} variant="primary">
            다음
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PRCreateStep3
