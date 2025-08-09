import React from 'react';

const CodeDiff = ({ patch }) => {
  if (!patch) return null;

  const lines = patch.split('\n');
  let oldLine = 0;
  let newLine = 0;

  return (
    <div className="my-2 text-xs font-mono whitespace-pre min-w-full">
      <div className="inline-grid w-max min-w-full grid-cols-[4rem_1fr] border border-gray-300">
        {lines.map((rawLine, idx) => {
          const line = rawLine ?? '';
          const firstChar = line.charAt(0);

          const isHeader = line.startsWith('@@');
          const isFileHeader =
            line.startsWith('diff ') || line.startsWith('---') || line.startsWith('+++');
          const isMeta = line.startsWith('\\');

          const isAdded = firstChar === '+' && !isFileHeader;
          const isRemoved = firstChar === '-' && !isFileHeader;
          const isContext = firstChar === ' ';

          if (isHeader) {
            const m = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
            if (m) {
              oldLine = parseInt(m[1], 10);
              newLine = parseInt(m[2], 10);
            }
            return (
              <div
                key={idx}
                className="col-span-2 sticky top-0 z-10 bg-gray-200 text-gray-600 py-1 px-4 text-sm font-semibold"
              >
                {line}
              </div>
            );
          }

          const displayOld = isRemoved || isContext ? oldLine : '';
          const displayNew = isAdded || isContext ? newLine : '';

          if (isRemoved || isContext) oldLine++;
          if (isAdded || isContext) newLine++;

          const codeBg = isAdded
            ? 'bg-green-100 text-green-700'
            : isRemoved
            ? 'bg-red-100 text-red-700'
            : 'bg-white text-gray-800';

          const numBg = isAdded
            ? 'bg-green-300'
            : isRemoved
            ? 'bg-red-300'
            : 'bg-white text-gray-500';

          return (
            <React.Fragment key={idx}>
              <div className={`w-16 text-right pr-2 select-none border-r border-gray-200 ${numBg}`}>
                <span className="inline-block w-6 text-right pr-1">{displayOld || ''}</span>
                <span className="inline-block w-6 text-right">{displayNew || ''}</span>
              </div>
              <div className={`${codeBg}`}>
                <div className="px-4 py-0.5">
                  {isMeta || isFileHeader ? (
                    <span className="text-gray-400 italic">{line}</span>
                  ) : (
                    line
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CodeDiff;