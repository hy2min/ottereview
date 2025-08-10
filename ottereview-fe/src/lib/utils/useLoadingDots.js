import { useEffect, useState } from 'react'

const useLoadingDots = (isLoading, intervalTime = 300) => {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setDots((prevDots) => {
          if (prevDots.length >= 3) {
            return ''
          }
          return prevDots + '.'
        })
      }, intervalTime)

      return () => clearInterval(interval)
    } else {
      // 로딩이 끝나면 점을 초기화합니다.
      setDots('')
    }
  }, [isLoading, intervalTime])

  return dots
}

export default useLoadingDots
