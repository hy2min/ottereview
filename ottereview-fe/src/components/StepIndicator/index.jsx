const StepIndicator = ({ currentStep = 1, steps = [] }) => {
  const progressPercent = (currentStep / steps.length) * 100

  return (
    <div className="pt-4 mb-6 space-y-4 text-sm">
      {/* 텍스트 인디케이터 */}
      <div className="flex justify-between">
        {steps.map((label, index) => {
          const step = index + 1
          const isActive = step === currentStep
          const isCompleted = step < currentStep

          return (
            <div key={label} className="flex-1 text-center">
              <span
                className={`inline-block px-3 py-2 border rounded-lg transition-colors duration-200 font-medium ${
                  isActive
                    ? 'bg-orange-600 dark:bg-orange-500 text-white border-orange-600 dark:border-orange-500 shadow-sm'
                    : isCompleted
                      ? 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                      : 'theme-bg-secondary theme-text-secondary border-gray-200 dark:border-gray-700'
                }`}
              >
                {step}. {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* 모던 스타일 진행 바 */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={
            'absolute top-0 left-0 h-full bg-orange-600 dark:bg-orange-500 transition-all duration-500 ease-out rounded-full'
          }
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

export default StepIndicator
