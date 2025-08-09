import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'
import { requestAIConvention, requestAIOthers } from '@/features/pullRequest/prApi'
import { usePRCreateStore } from '@/features/pullRequest/stores/prCreateStore'

const PRCreateStep2 = () => {
  const { repoId } = useParams()
  const formData = usePRCreateStore((state) => state.formData)
  const setFormData = usePRCreateStore((state) => state.setFormData)
  const setAIConvention = usePRCreateStore((state) => state.setAIConvention)
  const aiConvention = usePRCreateStore((state) => state.aiConvention)
  const setAIOthers = usePRCreateStore((state) => state.setAIOthers)

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
    if (formData.file_names) picked.file_names = formData.file_names
    if (formData.function_names) picked.function_names = formData.function_names
    if (formData.variable_names) picked.variable_names = formData.variable_names
    if (formData.class_names) picked.class_names = formData.class_names
    if (formData.constant_names) picked.constant_names = formData.constant_names
    return picked
  }, [formData])

  const handleRequestAI = async () => {
    try {
      setAiLoading(true)

      // 두 요청을 동시에 시작
      const conventionPromise = requestAIConvention({
        repoId,
        source: formData.sourceBranch,
        target: formData.targetBranch,
        rules,
      })
      const othersPromise = requestAIOthers({
        repoId,
        source: formData.sourceBranch,
        target: formData.targetBranch,
        rules,
      })

      // AI 컨벤션 요청이 완료될 때까지 기다림
      const conventionData = await conventionPromise

      console.log('AI 컨벤션 응답:', conventionData)
      setAIConvention(conventionData)

      // 주요 요청이 끝났으므로 로딩 상태 해제
      setAiLoading(false)

      // AI 기타 요청은 백그라운드에서 완료되면 스토어에 저장
      othersPromise
        .then((othersData) => {
          console.log('AI 기타 응답:', othersData)
          setAIOthers(othersData)
        })
        .catch((e) => {
          console.error('AI 기타 요청 에러:', e)
        })
    } catch (e) {
      console.error('AI 컨벤션 요청 에러:', e)
    } finally {
      // 로딩 상태는 컨벤션 요청 직후 해제되므로 이 블록은 필요 없음
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

  return (
    <div className="flex w-full mx-auto space-x-4">
      <Box shadow className="w-2/3 space-y-3">
      <div>
        <div className="flex items-center justify-between mt-2">
          <div className="font-medium">AI 피드백</div>
          <div className="-mt-[16px]">
            <Button size="sm" onClick={handleRequestAI}>
              {aiLoading ? '분석 중...' : '피드백 받기'}
            </Button>
          </div>
        </div>
        <div className="space-y-2">{renderAIConvention(aiConvention?.result)}</div>
        </div>
      </Box>
      <Box shadow className="w-1/3 space-y-4">
        <InputBox
          label="파일명 규칙"
          as="select"
          options={conventionOptions}
          value={formData.file_names || ''}
          onChange={(e) => setFormData({ file_names: e.target.value })}
        />
        <InputBox
          label="함수명 규칙"
          as="select"
          options={conventionOptions}
          value={formData.function_names || ''}
          onChange={(e) => setFormData({ function_names: e.target.value })}
        />
        <InputBox
          label="변수명 규칙"
          as="select"
          options={conventionOptions}
          value={formData.variable_names || ''}
          onChange={(e) => setFormData({ variable_names: e.target.value })}
        />
        <InputBox
          label="클래스명 규칙"
          as="select"
          options={conventionOptions}
          value={formData.class_names || ''}
          onChange={(e) => setFormData({ class_names: e.target.value })}
        />
        <InputBox
          label="상수명 규칙"
          as="select"
          options={conventionOptions}
          value={formData.constant_names || ''}
          onChange={(e) => setFormData({ constant_names: e.target.value })}
        />
      </Box>
    </div>
  )
}

export default PRCreateStep2
