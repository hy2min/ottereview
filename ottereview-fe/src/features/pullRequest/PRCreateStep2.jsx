import { useMemo, useState } from 'react'
import { Sparkles, Settings, RotateCcw, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import { requestAIConvention, requestAIOthers } from './prApi'

const Box = ({ children, shadow = false, className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${shadow ? 'shadow-lg' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

const InputBox = ({ label, as = 'input', options = [], value, onChange, ...props }) => {
  if (as === 'select') {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <select
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        {...props}
      />
    </div>
  )
}

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
  selectedBranches,
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
        rules: rules,
      })

      console.log('AI 컨벤션 응답:', conventionData)
      setAIConvention(conventionData)
    } catch (e) {
      console.error('AI 컨벤션 요청 에러:', e)
      // 에러 발생 시 사용자에게 알림
      setAIConvention({
        error: true,
        message: '컨벤션 분석 중 오류가 발생했습니다. 다시 시도해주세요.',
      })
    } finally {
      setAiLoading(false)
    }
  }

  const renderAIConvention = (data) => {
    if (!data) return null

    // 에러 상태 처리
    if (data.error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center space-y-2 text-red-500">
            <AlertCircle className="w-8 h-8" />
            <div className="text-sm text-center">{data.message}</div>
          </div>
        </div>
      )
    }

    const text = data.result || data
    if (!text || typeof text !== 'string') return null

    // 텍스트를 줄 단위로 분할하고 '-' 로 시작하는 항목들을 찾음
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
    const items = []
    let currentItem = null

    for (const line of lines) {
      if (line.startsWith('-') || line.startsWith('•')) {
        // 새로운 항목 시작
        if (currentItem) {
          items.push(currentItem)
        }
        currentItem = [line.replace(/^[-•]\s*/, '')]
      } else if (currentItem && line.trim()) {
        // 기존 항목에 추가 정보
        currentItem.push(line)
      } else if (!currentItem && line.trim()) {
        // 첫 번째 항목이 '-'로 시작하지 않는 경우
        currentItem = [line]
      }
    }

    if (currentItem) {
      items.push(currentItem)
    }

    if (items.length === 0) return null

    return (
      <div className="space-y-3">
        {items.map((itemLines, index) => {
          return (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-orange-400"
            >
              {itemLines.map((line, lineIndex) => {
                // 파일 경로인지 확인 (확장자가 있고 경로 구분자가 있는 경우)
                const isFilePath =
                  (line.includes('/') || line.includes('\\')) &&
                  (line.includes('.java') ||
                    line.includes('.js') ||
                    line.includes('.py') ||
                    line.includes('.ts') ||
                    line.includes('.jsx') ||
                    line.includes('.tsx') ||
                    (line.includes('.') && line.length > 20))

                // 규칙 위반 내용인지 확인 ([함수명], [변수명] 등이 포함된 텍스트)
                const isViolation =
                  line.includes('[') &&
                  line.includes(']') &&
                  (line.includes('함수명') ||
                    line.includes('변수명') ||
                    line.includes('클래스명') ||
                    line.includes('파일명') ||
                    line.includes('상수명'))

                if (isFilePath) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all">
                        파일: {line}
                      </div>
                    </div>
                  )
                } else if (isViolation) {
                  // [함수명], [변수명] 등을 강조 표시하고 백틱 제거
                  const renderTextWithFormatting = (text) => {
                    // 백틱 제거
                    const textWithoutBackticks = text.replace(/`([^`]+)`/g, '$1')

                    // [함수명], [변수명] 등의 태그를 처리
                    const tagParts = textWithoutBackticks.split(/(\[[^\]]+\])/)

                    return tagParts.map((tagPart, tagIndex) => {
                      if (tagPart.startsWith('[') && tagPart.endsWith(']')) {
                        return (
                          <span
                            key={tagIndex}
                            className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded text-xs font-medium mr-1"
                          >
                            {tagPart}
                          </span>
                        )
                      }
                      return <span key={tagIndex}>{tagPart}</span>
                    })
                  }

                  return (
                    <div key={lineIndex} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <div className="text-sm">{renderTextWithFormatting(line)}</div>
                    </div>
                  )
                } else {
                  // 일반 텍스트에서 백틱 제거
                  const textWithoutBackticks = line.replace(/`([^`]+)`/g, '$1')

                  return (
                    <div key={lineIndex} className="text-sm text-gray-600 dark:text-gray-300 ml-6">
                      {textWithoutBackticks}
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

  const handleNextStep = async () => {
    // AI Others 요청을 백그라운드에서 시작
    console.log('Step2에서 AI Others 요청 시작...')
    // Mock API call for others
    setTimeout(() => {
      const othersData = { result: '기타 AI 분석 결과' }
      console.log('AI Others 응답:', othersData)
      setAIOthers(othersData)
    }, 3000)

    // 즉시 다음 단계로 이동
    goToStep(3)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">컨벤션 검사</h2>
        <p className="text-gray-600 dark:text-gray-400">
          코딩 규칙을 설정하고 AI 피드백을 받아보세요
        </p>
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
              <div className="font-semibold text-lg text-gray-900 dark:text-white flex items-center space-x-2">
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

            <Box className="h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800">
              <div className="space-y-3 p-2">
                {aiLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center space-y-2">
                      <Settings className="w-8 h-8 animate-spin text-orange-500" />
                      <div className="text-gray-600 dark:text-gray-400">분석 중...</div>
                    </div>
                  </div>
                ) : aiConvention?.result ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        컨벤션 분석 완료
                      </span>
                    </div>
                    {renderAIConvention(aiConvention.result)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    피드백 받기 버튼을 클릭하여 AI 분석을 시작하세요
                  </div>
                )}
              </div>
            </Box>
          </div>
        </Box>
      </div>

      <div className="flex justify-center items-center space-x-4">
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
