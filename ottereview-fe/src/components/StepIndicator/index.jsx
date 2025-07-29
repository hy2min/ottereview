const steps = ['컨벤션 확인', 'PR 정보 입력', '리뷰어 선택', '최종 제출']

const StepIndicator = ({ currentStep = 1 }) => {
  const progressPercent = (currentStep / steps.length) * 100

  return (
    <div className="mb-6 space-y-2">
      {/* 텍스트 인디케이터 */}
      <div className="flex justify-between text-sm">
        {steps.map((label, index) => {
          const step = index + 1
          const isActive = step === currentStep
          const isCompleted = step < currentStep

          return (
            <div key={label} className="flex-1 text-center">
              <span
                className={`${
                  isActive
                    ? 'text-blue-600 font-bold'
                    : isCompleted
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}
              >
                {step}. {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* 애니메이션 진행 바 */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

export default StepIndicator
