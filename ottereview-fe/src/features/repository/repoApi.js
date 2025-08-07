import { api } from '@/lib/api'

export const fetchRepoList = async () => {
  const res = await api.get(`/api/users/repositories`)
  return res.data
}

export const fetchBrancheListByRepoId = async ({ accountId, repoId }) => {
  const res = await api.get(`/api/accounts/${accountId}/repositories/${repoId}/branches`)
  return res.data
}
