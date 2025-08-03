const CodeDiff = ({ patch }) => {
  if (!patch) return null

  const lines = patch.split('\n')

  let oldLine = 0
  let newLine = 0

  return (
    <div className="text-xs font-mono whitespace-pre overflow-auto bg-gray-100 p-2">
      {lines.map((line, idx) => {
        const firstChar = line[0]
        const isHeader = line.startsWith('@@')
        const isAdded = firstChar === '+'
        const isRemoved = firstChar === '-'
        const isContext = firstChar === ' '
        const isMeta = line.startsWith('\\')

        // 헤더 처리
        if (isHeader) {
          const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
          if (match) {
            oldLine = parseInt(match[1], 10)
            newLine = parseInt(match[2], 10)
          }
          return (
            <div key={idx} className="text-gray-500 italic">
              {line}
            </div>
          )
        }

        // 줄 번호 계산
        const displayOld = isRemoved || isContext ? oldLine : ''
        const displayNew = isAdded || isContext ? newLine : ''

        if (isRemoved || isContext) oldLine++
        if (isAdded || isContext) newLine++

        const lineClass = isAdded
          ? 'bg-green-100 text-green-700'
          : isRemoved
            ? 'bg-red-100 text-red-700'
            : isContext
              ? 'text-gray-800'
              : isMeta
                ? 'text-gray-400 italic'
                : 'text-gray-700'

        return (
          <div key={idx} className={`flex`}>
            <div className="w-12 text-right pr-2 text-gray-400 select-none space-x-1">
              <span className="inline-block w-5">{displayOld || ''}</span>
              <span className="inline-block w-5">{displayNew || ''}</span>
            </div>
            <div className={`flex-1 ${lineClass}`}>{line}</div>
          </div>
        )
      })}
    </div>
  )
}

export default CodeDiff
