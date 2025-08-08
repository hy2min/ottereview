import { api } from '@/lib/api'

export const fetchRepoList = async () => {
  const res = await api.get(`/api/users/repositories`)
  return res.data
}

export const fetchBrancheListByRepoId = async (repoId) => {
  const res = await api.get(`/api/repositories/${repoId}/branches`)
  return res.data
}
