import { useState } from 'react'

import Box from '../../components/Box'
import InputBox from '../../components/InputBox'
import PRCardCompact from './PRCardCompact'

const PRList = ({ authoredPRs = [], reviewerPRs = [] }) => {
  const [selectedType, setSelectedType] = useState('all')

  // Add the state filter here
  const filteredPRs =
    selectedType === 'authored'
      ? authoredPRs.filter((pr) => pr.state === 'OPEN').map((pr) => ({ ...pr, type: 'authored' }))
      : selectedType === 'reviewed'
        ? reviewerPRs.filter((pr) => pr.state === 'OPEN').map((pr) => ({ ...pr, type: 'reviewed' }))
        : [
            ...authoredPRs
              .filter((pr) => pr.state === 'OPEN')
              .map((pr) => ({ ...pr, type: 'authored' })),
            ...reviewerPRs
              .filter((pr) => pr.state === 'OPEN')
              .map((pr) => ({ ...pr, type: 'reviewed' })),
          ]

  return (
    <Box shadow className="w-full h-[70vh] flex flex-col">
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
          filteredPRs.map((pr) => <PRCardCompact key={pr.id} pr={pr} type={pr.type} />)
        )}
      </div>
    </Box>
  )
}

export default PRList
