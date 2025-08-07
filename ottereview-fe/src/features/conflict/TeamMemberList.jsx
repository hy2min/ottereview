import React, { useState } from 'react'

import Box from '@/components/Box'

const TeamMemberList = ({ usernames }) => {
  const [selected, setSelected] = useState([])

  const toggleReviewer = (name) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  return (
    <Box shadow>
      <div className="flex gap-4 flex-wrap">
        {usernames.map((name) => (
          <label key={name} className="flex items-center gap-2 border px-3 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(name)}
              onChange={() => toggleReviewer(name)}
            />
            <span>{name}</span>
          </label>
        ))}
      </div>
    </Box>
  )
}

export default TeamMemberList
