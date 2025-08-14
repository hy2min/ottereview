import React, { useState } from 'react'

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
  onAddComment,
  onRemoveComment,
  fileComments = {},
  prTitle,
  setPrTitle,
  prBody,
  setPrBody,
}) => {
  // 쿠키로 우선순위 표시 상태 관리
  const [showPriorities, setShowPriorities] = useCookieState('showPriorities', true)
  
  // 툴팁 표시 상태
  const [showTooltip, setShowTooltip] = useState(false)

  // 템플릿 정의
  const templates = [
    {
      value: 'basic',
      label: '기본 템플릿',
      content: `## PR 유형
- [ ] 기능 추가
- [ ] 기능 삭제
- [ ] 버그 수정
- [ ] 리팩토링
- [ ] 의존성, 환경 변수, 빌드 관련 코드 업데이트

## 작업 내용 및 변경 사항
작업 내용 및 변경사항 작성

## 이슈 링크
close #이슈번호

## 참고사항
참고사항. 없을 시 삭제`,
    },
  ]

  // 유저 정보 가져오기
  const user = useUserStore((state) => state.user)

  const candidates = aiOthers?.priority?.result?.priority || []
  const slots = Array.from({ length: 3 }, (_, i) => candidates[i] || null)
  const priorityVariantMap = {
    LOW: 'priorityLow',
    MEDIUM: 'priorityMedium',
    HIGH: 'priorityHigh',
  }

  const isAiTitleLoading = !aiOthers?.title?.result
  // 로딩 중일 때만 애니메이션 활성화
  const loadingDots = useLoadingDots(isAiTitleLoading, isAiTitleLoading ? 300 : 0)
  const isAiTitleError = aiOthers?.title?.result === '분석 중 오류 발생'

  // 따옴표 제거 함수
  const removeQuotes = (str) => {
    if (!str) return str
    return str.replace(/^["']|["']$/g, '')
  }

  const handleApplyAiTitle = () => {
    const aiTitle = aiOthers?.title?.result || ''
    setPrTitle(removeQuotes(aiTitle))
  }

  const handleTogglePriorities = () => {
    setShowPriorities(!showPriorities)
  }

  // 템플릿 선택 처리
  const handleTemplateChange = (selectedValue) => {
    if (selectedValue === 'remove') {
      // 템플릿 제거 - 내용 전체 초기화
      setPrBody('')
    } else if (selectedValue) {
      // 템플릿 적용
      const template = templates.find((t) => t.value === selectedValue)
      if (template) {
        setPrBody(template.content)
      }
    }
  }

  // 다음 버튼 활성화 조건 확인
  const isNextButtonEnabled = prTitle.trim() !== '' && prBody.trim() !== ''
  
  // 툴팁 메시지 생성
  const getDisabledTooltip = () => {
    const missingFields = []
    if (prTitle.trim() === '') missingFields.push('제목')
    if (prBody.trim() === '') missingFields.push('설명')
    
    if (missingFields.length === 0) return ''
    return `${missingFields.join(', ')}을(를) 입력해주세요`
  }

  const handleNextStep = async () => {
    // 타이틀과 설명이 없으면 실행하지 않음
    if (!isNextButtonEnabled) {
      return
    }

    try {
      const formattedDescriptions = reviewComments.map((comment) => ({
        author_id: user?.id,
        path: comment.path,
        body: comment.content || '',
        position: comment.position,
        start_line: comment.startLine,
        start_side: comment.startSide,
        line: comment.lineNumber,
        side: comment.side,
        diff_hunk: comment.diffHunk,
        file_index: comment.fileIndex,
      }))

      // AI 우선순위 데이터를 백엔드 형식으로 변환 (aiOthers가 없어도 빈 배열로 처리)
      const aiPriorities = aiOthers?.priority?.result?.priority || []
      const formattedPriorities = aiPriorities.map((priority) => ({
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
        descriptions: formattedDescriptions,
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
      <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:gap-4">
        {/* 왼쪽 박스 */}
        <div className={`w-full ${showPriorities ? 'md:w-2/3 md:order-1' : 'md:w-full'}`}>
          <Box shadow className="flex flex-col h-full">
            <div className="flex flex-col h-full mt-2">
              <div className="relative space-y-1 mb-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="aiTitle" className="block font-medium">
                    AI 추천 제목
                  </label>
                  <div className="-mt-[16px]">
                    <Button
                      size="sm"
                      onClick={handleApplyAiTitle}
                      disabled={isAiTitleLoading || isAiTitleError}
                    >
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
                    isAiTitleLoading
                      ? `추천받는 중${loadingDots}`
                      : removeQuotes(aiOthers?.title?.result || '')
                  }
                  className="bg-white border-2 border-black rounded-[8px] w-full px-2 py-1"
                />
              </div>
              <div className="mb-2">
                <InputBox
                  label="PR 제목"
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center mb-1 space-x-4">
                  <label className="block font-medium">PR 설명</label>
                  <div className="flex items-center gap-2">
                    <InputBox
                      as="select"
                      value=""
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="text-sm -mt-[4px]"
                      options={[
                        { value: '', label: '템플릿 선택' },
                        ...templates.map((t) => ({ value: t.value, label: t.label })),
                        { value: 'remove', label: '템플릿 제거' },
                      ]}
                    />
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <InputBox
                    className="flex-1 resize-none"
                    as="textarea"
                    markdown={true}
                    value={prBody}
                    onChange={(e) => setPrBody(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Box>
        </div>

        {/* 오른쪽 박스 */}
        {showPriorities && (
          <div className="w-full md:w-1/3 md:order-2">
            <Box shadow className="h-[450px] flex flex-col">
              <div className="font-medium mt-2 mb-3">AI 우선순위 추천</div>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 -mr-2 min-h-0">
                {slots.map((priority, index) => (
                  <Box key={index} className="p-3">
                    {priority ? (
                      <div className="space-y-2 min-h-22">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={priorityVariantMap[priority.priority_level] || 'default'}
                            className="shrink-0"
                          >
                            {priority.priority_level}
                          </Badge>
                          <span className="text-sm text-gray-800 font-medium leading-tight">
                            {priority.title}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{priority.reason}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-22 text-sm text-gray-400">
                        추천 없음
                      </div>
                    )}
                  </Box>
                ))}
              </div>
            </Box>
          </div>
        )}
      </div>

      <Box shadow>
        <PRFileList
          files={validationBranches?.files || []}
          showDiffHunk={true}
          onAddComment={onAddComment}
          onRemoveComment={onRemoveComment}
          fileComments={fileComments}
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

          <div 
            className="relative"
            onMouseEnter={() => !isNextButtonEnabled && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Button 
              onClick={handleNextStep} 
              variant="primary" 
              disabled={!isNextButtonEnabled}
            >
              다음
            </Button>
            {showTooltip && !isNextButtonEnabled && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap z-50">
                {getDisabledTooltip()}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(PRCreateStep3)
