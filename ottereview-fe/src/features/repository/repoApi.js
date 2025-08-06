import { api } from '@/lib/api'
// AccountId = user.id
export const fetchRepoList = async (accountId) => {
  const res = await api.get(`/api/accounts/${accountId}/repositories`)
  return res.data
}
