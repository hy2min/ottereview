import { useState } from 'react'

import InputBox from '@/components/InputBox'

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
      <div className="flex mb-4 space-x-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🔍</span>
            <h2 className="text-2xl font-semibold theme-text">Pull Request</h2>
          </div>
          <p className="text-sm theme-text-muted">리뷰가 필요한 PR들을 확인하세요</p>
        </div>

        <div className="w-44 flex flex-col gap-1">
          <label className="text-xs theme-text-muted">필터</label>
          <InputBox
            as="select"
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
            <p className="text-2xl theme-text-muted">진행중인 PR이 없습니다.</p>
          </div>
        ) : (
          filteredPRs.map((pr) => <PRCardCompact key={pr.id} pr={pr} type={pr.type} />)
        )}
      </div>
    </Box>
  )
}

export default PRList
