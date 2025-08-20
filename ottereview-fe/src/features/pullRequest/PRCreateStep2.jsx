import { AlertCircle, CheckCircle, FileText, RotateCcw, Settings, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import Button from '@/components/Button'

import { requestAIConvention, requestAIOthers } from './prApi'

const Box = ({ children, shadow = false, className = '' }) => {
  return (
    <div
      className={`theme-bg-primary theme-border border rounded-lg p-4 ${shadow ? 'shadow-lg' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

const InputBox = ({ label, as = 'input', options = [], value, onChange, ...props }) => {
  if (as === 'select') {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium theme-text">{label}</label>
        <select
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 theme-border border-2 theme-bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 theme-text"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium theme-text">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 theme-border border-2 theme-bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 theme-text"
        {...props}
      />
    </div>
  )
}

const PRCreateStep2 = ({
  goToStep,
  repoId,
  selectedBranches,
  aiConvention,
  setAIConvention,
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

      // 실제 API 호출
      const conventionData = await requestAIConvention({
        repoId,
        source: selectedBranches.source,
        target: selectedBranches.target,
        rules,
      })

      setAIConvention(conventionData)
    } finally {
      setAiLoading(false)
    }
  }

  const renderAIConvention = (text) => {
    if (!text) return null

    // 백틱으로 감싸진 텍스트에서 백틱 제거
    const textWithoutBackticks = text.replace(/`([^`]+)`/g, '$1')

    // 텍스트를 '-' 기준으로 분할하여 각 항목을 리스트로 만듦
    const items = textWithoutBackticks
      .split(/^- /gm) // 줄 시작의 '- '로 분할
      .filter((item) => item.trim()) // 빈 항목 제거
      .map((item) => item.trim())

    if (items.length === 0) return null

    return (
      <div className="space-y-3">
        {items.map((item, index) => {
          // 각 항목에서 파일 경로와 내용 분리
          const lines = item.split('\n').filter((line) => line.trim())

          return (
            <div
              key={index}
              className="theme-bg-secondary rounded-lg p-4 border-l-4 border-orange-400"
            >
              {lines.map((line, lineIndex) => {
                // 파일 경로인지 확인 (경로가 포함된 긴 텍스트)
                const isFilePath = line.includes('/') && line.length > 30
                // 규칙 위반 내용인지 확인 ([함수명], [변수명] 등이 포함된 텍스트)
                const isViolation = line.includes('[') && line.includes(']')

                if (isFilePath) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all">
                        {line}
                      </div>
                    </div>
                  )
                } else if (isViolation) {
                  // [함수명], [변수명] 등을 강조 표시
                  const parts = line.split(/(\[[^\]]+\])/)
                  return (
                    <div key={lineIndex} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        {parts.map((part, partIndex) => {
                          if (part.startsWith('[') && part.endsWith(']')) {
                            return (
                              <span
                                key={partIndex}
                                className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded text-xs font-medium"
                              >
                                {part}
                              </span>
                            )
                          }
                          return <span key={partIndex}>{part}</span>
                        })}
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div key={lineIndex} className="text-sm theme-text-secondary ml-6">
                      {line}
                    </div>
                  )
                }
              })}
            </div>
          )
        })}
      </div>
    )
  }

  const handleNextStep = () => {
    // 즉시 다음 단계로 이동
    goToStep(3)

    // AI Others 요청을 백그라운드에서 시작 (await 없이)

    requestAIOthers({
      repoId,
      source: selectedBranches.source,
      target: selectedBranches.target,
      rules,
    })
      .then((othersData) => {
        setAIOthers(othersData)
      })
      .catch((e) => {})
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold theme-text mb-2">컨벤션 검사</h2>
        <p className="theme-text-secondary">코딩 규칙을 설정하고 AI 피드백을 받아보세요</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-stretch space-y-4 md:space-y-0 md:gap-6">
        <Box shadow className="w-full md:w-1/3 md:order-2 space-y-4">
          <InputBox
            label="파일명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.file_names}
            onChange={(e) =>
              setConventionRules((prev) => ({ ...prev, file_names: e.target.value }))
            }
          />
          <InputBox
            label="함수명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.function_names}
            onChange={(e) =>
              setConventionRules((prev) => ({ ...prev, function_names: e.target.value }))
            }
          />
          <InputBox
            label="변수명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.variable_names}
            onChange={(e) =>
              setConventionRules((prev) => ({ ...prev, variable_names: e.target.value }))
            }
          />
          <InputBox
            label="클래스명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.class_names}
            onChange={(e) =>
              setConventionRules((prev) => ({ ...prev, class_names: e.target.value }))
            }
          />
          <InputBox
            label="상수명 규칙"
            as="select"
            options={conventionOptions}
            value={conventionRules.constant_names}
            onChange={(e) =>
              setConventionRules((prev) => ({ ...prev, constant_names: e.target.value }))
            }
          />
        </Box>

        <Box shadow className="w-full md:w-2/3 md:order-1 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-lg theme-text flex items-center space-x-2">
                <span>🤖</span>
                <span>AI 피드백</span>
              </div>
              <Button
                size="sm"
                onClick={handleRequestAI}
                className="transform transition-all duration-300 hover:scale-105"
                disabled={aiLoading}
              >
                <span className="flex items-center space-x-2">
                  {aiLoading ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{aiLoading ? '분석 중...' : '피드백 받기'}</span>
                </span>
              </Button>
            </div>

            <Box className="h-96 overflow-y-auto theme-bg-secondary">
              <div className="space-y-3 p-2">
                {aiLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center space-y-2">
                      <Settings className="w-8 h-8 animate-spin text-orange-500" />
                      <div className="theme-text-secondary">분석 중...</div>
                    </div>
                  </div>
                ) : aiConvention?.result ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium theme-text">컨벤션 분석 완료</span>
                    </div>
                    {renderAIConvention(aiConvention.result)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full theme-text-muted">
                    피드백 받기 버튼을 클릭하여 AI 분석을 시작하세요
                  </div>
                )}
              </div>
            </Box>
          </div>
        </Box>
      </div>

      <div className="flex justify-center items-center space-x-4 mb-8">
        <Button
          onClick={() => goToStep(1)}
          variant="secondary"
          className="transform transition-all duration-300 hover:scale-105"
        >
          <span className="flex items-center space-x-2">
            <span>←</span>
            <span>이전</span>
          </span>
        </Button>

        <Button
          onClick={handleNextStep}
          variant="primary"
          className="transform transition-all duration-300 hover:scale-105"
        >
          <span className="flex items-center space-x-2">
            <span>다음</span>
            <span>→</span>
          </span>
        </Button>
      </div>
    </div>
  )
}

export default PRCreateStep2
