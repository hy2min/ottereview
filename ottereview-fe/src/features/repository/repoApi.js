import { api } from '@/lib/api'

export const fetchRepoList = async () => {
  const res = await api.get(`/api/accounts/1/repositories/users`)
  return res.data
}
