const StepIndicator = ({ currentStep = 1, steps = [] }) => {
  const progressPercent = (currentStep / steps.length) * 100

  return (
    <div className="pt-4 mb-8 space-y-6 text-sm animate-fade-in-up">
      {/* 텍스트 인디케이터 */}
      <div className="flex justify-between items-center relative">
        {/* 배경 연결선 */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0" />
        
        {steps.map((label, index) => {
          const step = index + 1
          const isActive = step === currentStep
          const isCompleted = step < currentStep
          const animationDelay = `animate-delay-${index * 200}`

          return (
            <div key={label} className="flex-1 text-center relative z-10">
              <div className={`animate-scale-in ${animationDelay}`}>
                <div className="mb-2">
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-orange-600 dark:bg-orange-500 text-white border-orange-600 dark:border-orange-500 shadow-lg scale-110 animate-pulse'
                        : isCompleted
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 shadow-md'
                          : 'theme-bg-secondary theme-text-muted border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isCompleted ? '✓' : step}
                  </span>
                </div>
                <div className={`text-xs font-medium transition-colors duration-300 ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400'
                    : isCompleted
                      ? 'text-orange-700 dark:text-orange-300'
                      : 'theme-text-muted'
                }`}>
                  {label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 모던 스타일 진행 바 */}
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-500 transition-all duration-700 ease-out rounded-full shadow-sm"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  )
}

export default StepIndicator
