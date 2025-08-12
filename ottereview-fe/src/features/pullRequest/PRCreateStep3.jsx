import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'
import { savePRAdditionalInfo } from '@/features/pullRequest/prApi'
import PRFileList from '@/features/pullRequest/PRFileList'
import useCookieState from '@/lib/utils/useCookieState'
import useLoadingDots from '@/lib/utils/useLoadingDots'
import { useUserStore } from '@/store/userStore'

const PRCreateStep3 = ({
  goToStep,
  repoId,
  aiOthers,
  validationBranches,
  reviewComments,
  audioFiles,
  onAddComment,
  prTitle,
  setPrTitle,
  prBody,
  setPrBody,
}) => {
  // 쿠키로 우선순위 표시 상태 관리
  const [showPriorities, setShowPriorities] = useCookieState('showPriorities', true)

  // 유저 정보 가져오기
  const user = useUserStore((state) => state.user)
  console.log('현재 유저 정보:', user)

  const candidates = aiOthers?.priority?.result?.priority || []
  const slots = Array.from({ length: 3 }, (_, i) => candidates[i] || null)
  const priorityVariantMap = {
    LOW: 'priorityLow',
    MEDIUM: 'priorityMedium',
    HIGH: 'priorityHigh',
  }

  const isAiTitleLoading = !aiOthers?.title?.result
  const loadingDots = useLoadingDots(isAiTitleLoading, 300)

  const handleApplyAiTitle = () => {
    setPrTitle(aiOthers?.title?.result || '')
  }

  const handleTogglePriorities = () => {
    setShowPriorities(!showPriorities)
  }

  const handleNextStep = async () => {
    try {
      const formattedDescriptions = reviewComments.map((comment) => ({
        ...comment,
        id: user?.id,
        recordKey: comment.recordKey || '',
      }))

      // AI 우선순위 데이터를 백엔드 형식으로 변환
      const aiPriorities = aiOthers?.priority?.result?.priority || []
      const formattedPriorities = aiPriorities.map(priority => ({
        level: priority.priority_level,
        title: priority.title,
        content: priority.reason,
      }))

      // 전체 추가 정보 구성
      const additionalInfo = {
        source: validationBranches?.source,
        target: validationBranches?.target,
        title: prTitle,
        body: prBody,
        description: formattedDescriptions,
        priorities: formattedPriorities,
      }

      // PR 준비 정보 저장 API 호출
      await savePRAdditionalInfo(repoId, additionalInfo)

      goToStep(4)
    } catch (error) {
      console.error('PR 추가 정보 저장 실패:', error)
    }
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
                    <Button size="sm" onClick={handleTogglePriorities}>
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
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
              />
              <InputBox
                className="h-50"
                label="PR 설명"
                as="textarea"
                value={prBody}
                onChange={(e) => setPrBody(e.target.value)}
              />
            </div>
          </Box>
        </div>

        {/* 오른쪽 박스 */}
        {showPriorities && (
          <div className="w-full md:w-1/3 flex flex-col space-y-3 min-h-0">
            {slots.map((priority, index) => (
              <Box key={index} shadow className="flex flex-1">
                <div className="flex flex-col h-full min-h-0 w-full">
                  {priority ? (
                    <div className="space-y-2 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={priorityVariantMap[priority.priority_level] || 'default'}>
                            {priority.priority_level}
                          </Badge>
                          <span className="text-sm text-gray-600 truncate">{priority.title}</span>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-5">{priority.reason}</p>
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
        <PRFileList
          files={validationBranches?.files || []}
          showDiffHunk={true}
          onAddComment={onAddComment}
        />
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
