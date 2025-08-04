import { api } from '../../lib/api'

export const fetchRepoListByAccountId = async (accountId) => {
  const res = await api.get(`/api/accounts/${accountId}/repositories`)
  return res.data
}
