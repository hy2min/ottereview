const StepIndicator = ({ currentStep = 1, steps = [] }) => {
  const progressPercent = (currentStep / steps.length) * 100

  return (
    <div className="px-40 mb-6 space-y-4 text-sm">
      {/* 텍스트 인디케이터 */}
      <div className="flex justify-between">
        {steps.map((label, index) => {
          const step = index + 1
          const isActive = step === currentStep
          const isCompleted = step < currentStep

          return (
            <div key={label} className="flex-1 text-center">
              <span
                className={`inline-block px-2 py-1 border-2 border-black rounded-pixel shadow-pixel ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : isCompleted
                      ? 'bg-white text-black'
                      : 'bg-white text-black'
                }`}
              >
                {step}. {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* 픽셀 스타일 진행 바 */}
      <div className="relative h-5 border-2 border-black bg-white rounded-[8px] shadow-pixel overflow-hidden">
        <div
          className={
            'absolute top-0 left-0 h-full bg-purple-600 transition-all duration-500 ease-out'
          }
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

export default StepIndicator
