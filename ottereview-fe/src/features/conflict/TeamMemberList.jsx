import React, { useState, useEffect } from 'react';
import axios from 'axios';

const containerStyle = {
  padding: '20px',
  fontFamily: 'sans-serif',
};

const userListStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
};

const userBoxStyle = {
  padding: '10px 20px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background-color 0.3s, border-color 0.3s',
};

const selectedUserBoxStyle = {
  ...userBoxStyle,
  backgroundColor: '#d1e7fd',
  borderColor: '#0d6efd',
};

const TeamMemberList = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    // TODO: Replace with actual account_id and repo_id from your app's state or props
    const accountId = 'your_account_id';
    const repoId = 'your_repo_id';

    axios.get(`/api/accounts/${accountId}/repositories/${repoId}/users`)
      .then(response => {
        setUsers(response.data);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        // Mock data for development purposes
        setUsers([
          { id: 1, githubUsername: 'user-alpha' },
          { id: 2, githubUsername: 'user-beta' },
          { id: 3, githubUsername: 'user-gamma' },
          { id: 4, githubUsername: 'user-delta' },
        ]);
      });
  }, []);

  const handleUserSelect = (userId) => {
    setSelectedUsers(prevSelectedUsers => {
      if (prevSelectedUsers.includes(userId)) {
        return prevSelectedUsers.filter(id => id !== userId);
      } else {
        return [...prevSelectedUsers, userId];
      }
    });
  };

  return (
    <div style={containerStyle}>
      <h2>Team Members</h2>
      <div style={userListStyle}>
        {users.map(user => (
          <div
            key={user.id}
            style={selectedUsers.includes(user.id) ? selectedUserBoxStyle : userBoxStyle}
            onClick={() => handleUserSelect(user.id)}
          >
            {user.githubUsername}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamMemberList;