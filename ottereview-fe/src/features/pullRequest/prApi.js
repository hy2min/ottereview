import { api } from '../../lib/api'

export const fetchPRsByRepoId = async (repoId) => {
  const res = await api.get(`/api/repositories/${repoId}/pull-requests`)
  return res.data
}

export const submitPR = async (prData) => {
  return
}
