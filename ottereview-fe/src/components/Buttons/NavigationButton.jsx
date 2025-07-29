const NavigationButton = ({ onPrev, onNext, prevLabel = '이전', nextLabel = '다음' }) => (
  <div className="flex justify-between mt-4">
    <button className="border px-4 py-1 cursor-pointer" onClick={onPrev}>
      {prevLabel}
    </button>
    <button className="border px-4 py-1 cursor-pointer" onClick={onNext}>
      {nextLabel}
    </button>
  </div>
)

export default NavigationButton
