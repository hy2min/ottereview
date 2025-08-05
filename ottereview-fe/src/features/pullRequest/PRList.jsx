import { useState } from 'react'

import Box from '../../components/Box'
import InputBox from '../../components/InputBox'
import PRCardCompact from './PRCardCompact'
import { usePRStore } from './stores/prStore'

const PRList = () => {
  const authored = usePRStore((state) => state.authoredPRs)
  const reviewed = usePRStore((state) => state.reviewerPRs)
  const [selectedType, setSelectedType] = useState('all') // all | authored | reviewed

  const filteredPRs =
    selectedType === 'authored'
      ? authored
      : selectedType === 'reviewed'
        ? reviewed
        : [...authored, ...reviewed]

  return (
    <Box shadow className="w-full h-[70vh] flex flex-col pl-4 pr-2">
      <div className="flex mb-2 space-x-4">
        <h2 className="text-xl mr-8">진행중인 PR</h2>

        {/* 타입 필터 드롭다운 */}
        <div className="w-40 -my-[9px] mr-7">
          <InputBox
            as="select"
            options={[
              { label: '전체 PR', value: 'all' },
              { label: '내가 작성한 PR', value: 'authored' },
              { label: '내가 리뷰어인 PR', value: 'reviewed' },
            ]}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {filteredPRs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl text-gray-500">작성된 PR이 없습니다.</p>
          </div>
        ) : (
          filteredPRs.map((pr) => <PRCardCompact key={pr.id} pr={pr} />)
        )}
      </div>
    </Box>
  )
}

export default PRList
