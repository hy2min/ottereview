import axios from 'axios'

import { useAuthStore } from '@/features/auth/authStore'

// 인스턴스 생성
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // refresh 요청 시 쿠키 포함
})

// ✅ 요청 시 accessToken 삽입
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ✅ 응답 에러 처리 (401 시 재발급 시도)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // refresh 요청 (쿠키 전송)
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = res.data.accessToken
        useAuthStore.getState().setAccessToken(newAccessToken)

        // Authorization 헤더 갱신 후 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        console.error('🔒 accessToken 재발급 실패:', refreshError)
        // 필요 시: 로그아웃 처리 or 로그인 페이지 이동
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
