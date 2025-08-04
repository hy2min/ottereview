export const fetchRepo = async () => {
  return [
    {
      id: 1,
      name: 'react-dashboard',
      description: '리액트 기반 관리자 대시보드',
      canCreatePR: true,
    },
    { id: 2, name: 'node-api-server', description: 'Node.js REST API 서버', canCreatePR: false },
    { id: 3, name: 'mobile-app', description: '팀 프로젝트 모바일 앱', canCreatePR: true },
  ]
}
