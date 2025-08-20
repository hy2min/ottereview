import React, { createContext, useContext } from 'react'

import AlertModal from '@/components/AlertModal'
import ConfirmModal from '@/components/ConfirmModal'
import { useModal } from '@/hooks/useModal'

const ModalContext = createContext()

export const useModalContext = () => {
  const context = useContext(ModalContext)
  if (!context) {
    // ModalProvider가 없는 경우 fallback으로 기본 alert/confirm 사용
    console.warn(
      'useModalContext must be used within a ModalProvider. Falling back to browser alerts.'
    )
    return {
      alerts: [],
      confirms: [],
      showAlert: (config) => {
        if (typeof config === 'string') {
          alert(config)
        } else {
          alert(config.message || 'Alert')
        }
      },
      showConfirm: (config) => {
        const message = typeof config === 'string' ? config : config.message
        return Promise.resolve(confirm(message))
      },
      success: (message, config) => {
        alert(message)
        config?.onClose?.()
      },
      error: (message, config) => {
        alert(message)
        config?.onClose?.()
      },
      warning: (message, config) => {
        alert(message)
        config?.onClose?.()
      },
      info: (message, config) => {
        alert(message)
        config?.onClose?.()
      },
      confirmDelete: (message) => Promise.resolve(confirm(message)),
      confirmAction: (message) => Promise.resolve(confirm(message)),
    }
  }
  return context
}

const ModalProvider = ({ children }) => {
  const modalMethods = useModal()
  const { alerts, confirms } = modalMethods

  return (
    <ModalContext.Provider value={modalMethods}>
      {children}

      {/* Alert 모달들 */}
      {alerts.map((alert) => (
        <AlertModal key={alert.id} {...alert} />
      ))}

      {/* Confirm 모달들 */}
      {confirms.map((confirm) => (
        <ConfirmModal key={confirm.id} {...confirm} />
      ))}
    </ModalContext.Provider>
  )
}

export default ModalProvider
