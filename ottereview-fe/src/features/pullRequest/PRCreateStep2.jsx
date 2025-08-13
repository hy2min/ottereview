import { useMemo, useState } from 'react'

import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'
import { requestAIConvention, requestAIOthers } from '@/features/pullRequest/prApi'

const PRCreateStep2 = ({
  goToStep,
  repoId,
  validationBranches,
  aiConvention,
  setAIConvention,
  aiOthers,
  setAIOthers,
  conventionRules,
  setConventionRules,
}) => {
  const [aiLoading, setAiLoading] = useState(false)

  const conventionOptions = [
    { label: '선택 안 함', value: '' },
    { label: 'camelCase', value: 'camelCase' },
    { label: 'PascalCase', value: 'PascalCase' },
    { label: 'snake_case', value: 'snake_case' },
    { label: 'kebab-case', value: 'kebab-case' },
    { label: 'CONSTANT_CASE', value: 'CONSTANT_CASE' },
  ]

  const rules = useMemo(() => {
    const picked = {}
    if (conventionRules.file_names) picked.file_names = conventionRules.file_names
    if (conventionRules.function_names) picked.function_names = conventionRules.function_names
    if (conventionRules.variable_names) picked.variable_names = conventionRules.variable_names
    if (conventionRules.class_names) picked.class_names = conventionRules.class_names
    if (conventionRules.constant_names) picked.constant_names = conventionRules.constant_names
    return picked
  }, [conventionRules])

  const handleRequestAI = async () => {
    try {
      setAiLoading(true)

      // 두 요청을 동시에 시작
      // AI 컨벤션 요청만 수행
      const conventionData = await requestAIConvention({
        repoId,
        source: validationBranches.source,
        target: validationBranches.target,
        rules,
      })

      console.log('AI 컨벤션 응답:', conventionData)
      setAIConvention(conventionData)
    } catch (e) {
      console.error('AI 컨벤션 요청 에러:', e)
    } finally {
      setAiLoading(false)
    }
  }

  const renderAIConvention = (text) => {
    if (!text) return null

    return text.split('\n\n').map((paragraph, pIndex) => (
      <p key={pIndex} className="whitespace-pre-wrap">
        {paragraph.split('\n').map((line, lIndex) => (
          <span key={lIndex}>
            {line} {lIndex < paragraph.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
    ))
  }

  const handleNextStep = async () => {
    // AI Others 요청을 백그라운드에서 시작
    console.log('Step2에서 AI Others 요청 시작...')
    requestAIOthers({
      repoId,
      source: validationBranches.source,
      target: validationBranches.target,
      rules,
    })
      .then((othersData) => {
        console.log('AI Others 응답:', othersData)
        setAIOthers(othersData)
      })
      .catch((e) => {
        console.error('AI Others 요청 에러:', e)
      })
    
    // 즉시 다음 단계로 이동
    goToStep(3)
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-stretch space-y-3 md:space-y-0 md:gap-4">
        <Box shadow className="w-full md:w-1/3 md:order-2 space-y-4">
          <InputBox
            label="파일명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.file_names}
            onChange={(e) => setConventionRules(prev => ({ ...prev, file_names: e.target.value }))}
          />
          <InputBox
            label="함수명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.function_names}
            onChange={(e) => setConventionRules(prev => ({ ...prev, function_names: e.target.value }))}
          />
          <InputBox
            label="변수명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.variable_names}
            onChange={(e) => setConventionRules(prev => ({ ...prev, variable_names: e.target.value }))}
          />
          <InputBox
            label="클래스명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.class_names}
            onChange={(e) => setConventionRules(prev => ({ ...prev, class_names: e.target.value }))}
          />
          <InputBox
            label="상수명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.constant_names}
            onChange={(e) => setConventionRules(prev => ({ ...prev, constant_names: e.target.value }))}
          />
        </Box>
        <Box shadow className="w-full md:w-2/3 md:order-1 space-y-3">
          <div className='space-y-1'>
            <div className="flex items-center justify-between mt-2">
              <div className="font-medium">AI 피드백</div>
              <div className="-mt-[16px]">
                <Button size="sm" onClick={handleRequestAI}>
                  {aiLoading ? '분석 중...' : '피드백 받기'}
                </Button>
              </div>
            </div>
            <Box className='h-87.75'>
              <div className="space-y-2">{renderAIConvention(aiConvention?.result)}</div>
            </Box>
          </div>
        </Box>
      </div>
      <div className="mx-auto z-10">
        <div className="flex justify-center items-center space-x-3">
          <Button
            onClick={() => {
              goToStep(1)
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

export default PRCreateStep2
