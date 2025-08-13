import { useState } from 'react'

import Box from '../../components/Box'
import CustomSelect from '../../components/InputBox/CustomSelect'
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
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl">진행중인 PR</h2>
        
        <div className="w-48">
          <CustomSelect
            options={[
              { label: '전체 PR', value: 'all' },
              { label: '내가 작성한 PR', value: 'authored' },
              { label: '내가 리뷰어인 PR', value: 'reviewed' },
            ]}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            placeholder="PR 유형 선택"
          />
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {filteredPRs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl text-gray-500">진행중인 PR이 없습니다.</p>
          </div>
        ) : (
          filteredPRs.map((pr) => <PRCardCompact key={pr.id} pr={pr} type={pr.type} />)
        )}
      </div>
    </Box>
  )
}

export default PRList
