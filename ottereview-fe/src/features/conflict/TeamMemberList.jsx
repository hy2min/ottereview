import React from 'react'

const TeamMemberList = ({ members, selectedMembers, toggleMember }) => {
  if (!members || members.length === 0) {
    return <p>참여 중인 팀원이 없습니다.</p>
  }

  return (
    <div className="flex gap-4 flex-wrap">
      {members.map((member) => (
        <label
          key={member.id}
          className="flex items-center gap-2 border px-3 py-1 cursor-pointer rounded-md"
        >
          <input
            type="checkbox"
            checked={selectedMembers.includes(member.name)}
            onChange={() => toggleMember(member.name)}
          />
          <span>{member.name}</span>
        </label>
      ))}
    </div>
  )
}

export default TeamMemberList
