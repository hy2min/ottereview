import { useState } from 'react'

import Box from '../../components/Box'
import InputBox from '../../components/InputBox'
import PRCardCompact from './PRCardCompact'

const PRList = ({ authoredPRs = [], reviewerPRs = [] }) => {
  const [selectedType, setSelectedType] = useState('all')

  const filteredPRs =
    selectedType === 'authored'
      ? authoredPRs.map((pr) => ({ ...pr, type: 'authored' }))
      : selectedType === 'reviewed'
        ? reviewerPRs.map((pr) => ({ ...pr, type: 'reviewed' }))
        : [
            ...authoredPRs.map((pr) => ({ ...pr, type: 'authored' })),
            ...reviewerPRs.map((pr) => ({ ...pr, type: 'reviewed' })),
          ]

  return (
    <Box shadow className="w-full h-[70vh] flex flex-col">
      <div className="flex mb-2 space-x-8">
        <div className="flex-1">
          <h2 className="text-xl">진행중인 PR</h2>
        </div>

        <div className="w-40 -my-[9px] mr-4">
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
