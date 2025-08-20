import { useCallback, useState } from 'react'

export const useModal = () => {
  const [alerts, setAlerts] = useState([])
  const [confirms, setConfirms] = useState([])

  // Alert 모달 표시
  const showAlert = useCallback((config) => {
    const id = Date.now() + Math.random()
    const alertConfig = {
      id,
      isOpen: true,
      title: '알림',
      type: 'info',
      buttonText: '확인',
      ...config,
      onClose: () => {
        setAlerts(prev => prev.filter(alert => alert.id !== id))
        config.onClose?.()
      }
    }
    
    setAlerts(prev => [...prev, alertConfig])
    return id
  }, [])

  // Confirm 모달 표시
  const showConfirm = useCallback((config) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random()
      const confirmConfig = {
        id,
        isOpen: true,
        title: '확인',
        type: 'default',
        confirmText: '확인',
        cancelText: '취소',
        ...config,
        onConfirm: () => {
          setConfirms(prev => prev.filter(confirm => confirm.id !== id))
          config.onConfirm?.()
          resolve(true)
        },
        onClose: () => {
          setConfirms(prev => prev.filter(confirm => confirm.id !== id))
          config.onClose?.()
          resolve(false)
        }
      }
      
      setConfirms(prev => [...prev, confirmConfig])
    })
  }, [])

  // 편의 메서드들
  const success = useCallback((message, title = '성공', config = {}) => {
    return showAlert({ message, title, type: 'success', ...config })
  }, [showAlert])

  const error = useCallback((message, title = '오류', config = {}) => {
    return showAlert({ message, title, type: 'error', ...config })
  }, [showAlert])

  const warning = useCallback((message, title = '경고', config = {}) => {
    return showAlert({ message, title, type: 'warning', ...config })
  }, [showAlert])

  const info = useCallback((message, title = '알림', config = {}) => {
    return showAlert({ message, title, type: 'info', ...config })
  }, [showAlert])

  const confirmDelete = useCallback((message = '정말로 삭제하시겠습니까?', title = '삭제 확인') => {
    return showConfirm({ 
      message, 
      title, 
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소'
    })
  }, [showConfirm])

  const confirmAction = useCallback((message, title = '확인') => {
    return showConfirm({ message, title })
  }, [showConfirm])

  return {
    alerts,
    confirms,
    showAlert,
    showConfirm,
    success,
    error,
    warning,
    info,
    confirmDelete,
    confirmAction
  }
}