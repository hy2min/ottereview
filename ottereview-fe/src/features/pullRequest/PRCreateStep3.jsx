import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'
import PRFileList from '@/features/pullRequest/PRFileList'
import { usePRCreateStore } from '@/features/pullRequest/stores/prCreateStore'
import useLoadingDots from '@/lib/utils/useLoadingDots'

const PRCreateStep3 = () => {
  const [showPriorities, setShowPriorities] = useState(true)

  const formData = usePRCreateStore((state) => state.formData)
  const setFormData = usePRCreateStore((state) => state.setFormData)
  const aiOthers = usePRCreateStore((state) => state.aiOthers)
  const validationResult = usePRCreateStore((state) => state.validationResult)

  const candidates = aiOthers?.priority?.result?.candidates || []
  const slots = Array.from({ length: 3 }, (_, i) => candidates[i] || null)
  const priorityVariantMap = {
    LOW: 'priorityLow',
    MEDIUM: 'priorityMedium',
    HIGH: 'priorityHigh',
  }

  const isAiTitleLoading = !aiOthers?.title?.result
  const loadingDots = useLoadingDots(isAiTitleLoading, 300)

  return (
    <div className="flex flex-col w-full space-y-3">
      <div className="flex flex-col md:flex-row md:items-stretch space-y-3 md:space-y-0 md:space-x-4">
        <Box shadow className={`w-full ${showPriorities ? 'md:w-2/3' : ''} space-y-3`}>
          <div className="space-y-2 mt-2">
            <div className="relative space-y-1">
              <div className="flex items-center space-x-2">
                <label htmlFor="aiTitle" className="block font-medium">
                  AI 추천 제목
                </label>
                <div className="-mt-[16px]">
                  <Button
                    size="sm"
                    onClick={() => setFormData({ title: aiOthers?.title?.result || '' })}
                  >
                    적용
                  </Button>
                </div>
                <div className="ml-auto -mt-[16px]">
                  <Button size="sm" onClick={() => setShowPriorities(!showPriorities)}>
                    {showPriorities ? '우선순위 숨기기' : '우선순위 보기'}
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
              value={formData.title || ''}
              onChange={(e) => setFormData({ title: e.target.value })}
            />
            <InputBox
              className="h-50"
              label="PR 설명"
              as="textarea"
              value={formData.description || ''}
              onChange={(e) => setFormData({ description: e.target.value })}
            />
          </div>
        </Box>
        <AnimatePresence>
          {showPriorities && (
            <motion.div
              key="priority-boxes"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="w-full md:w-1/3 flex flex-col space-y-3 min-h-0"
            >
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
                            <span className="text-sm text-gray-600 truncate">
                              {candidate.title}
                            </span>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Box shadow>
        <PRFileList files={validationResult?.files || []} />
      </Box>
    </div>
  )
}

export default PRCreateStep3
