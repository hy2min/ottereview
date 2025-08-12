// lib/utils/useCookieState.js
import { useCallback, useState } from 'react'

/**
 * 쿠키를 사용해 상태를 관리하는 커스텀 훅
 * @param {string} key - 쿠키 키 이름
 * @param {any} defaultValue - 기본값
 * @param {number} days - 쿠키 만료일 (기본: 365일)
 * @returns {[any, function]} - [값, 세터함수]
 */
const useCookieState = (key, defaultValue, days = 365) => {
  // 쿠키 읽기 함수
  const getCookie = useCallback((name) => {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  }, [])

  // 쿠키 설정 함수
  const setCookie = useCallback((name, value, days) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }, [])

  // 초기값 설정 (쿠키에서 읽거나 기본값 사용)
  const getInitialValue = useCallback(() => {
    const saved = getCookie(key)
    if (saved === null) return defaultValue

    // 불린값 처리
    if (typeof defaultValue === 'boolean') {
      return saved === 'true'
    }

    // 숫자값 처리
    if (typeof defaultValue === 'number') {
      const parsed = parseFloat(saved)
      return isNaN(parsed) ? defaultValue : parsed
    }

    // 객체/배열 처리
    if (typeof defaultValue === 'object') {
      try {
        return JSON.parse(saved)
      } catch {
        return defaultValue
      }
    }

    // 문자열 처리
    return saved
  }, [key, defaultValue, getCookie])

  const [value, setValue] = useState(getInitialValue)

  // 값 업데이트 함수 (상태와 쿠키 동시 업데이트)
  const updateValue = useCallback(
    (newValue) => {
      setValue(newValue)

      // 쿠키에 저장할 값 변환
      let cookieValue = newValue
      if (typeof newValue === 'object') {
        cookieValue = JSON.stringify(newValue)
      } else {
        cookieValue = String(newValue)
      }

      setCookie(key, cookieValue, days)
    },
    [key, days, setCookie]
  )

  return [value, updateValue]
}

export default useCookieState
