import { AlertTriangle, HelpCircle, Info, Trash2 } from 'lucide-react'

import Button from '@/components/Button'
import Modal from '@/components/Modal'

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title, 
  message, 
  type = 'default', // 'default', 'danger', 'warning'
  confirmText = '확인',
  cancelText = '취소',
  size = 'sm'
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-5 h-5" />,
          iconBg: 'bg-red-100 dark:bg-red-900',
          iconColor: 'text-red-600 dark:text-red-400',
          confirmVariant: 'danger'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          iconBg: 'bg-yellow-100 dark:bg-yellow-900',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          confirmVariant: 'warning'
        }
      default:
        return {
          icon: <HelpCircle className="w-5 h-5" />,
          iconBg: 'bg-orange-100 dark:bg-orange-900',
          iconColor: 'text-orange-600 dark:text-orange-400',
          confirmVariant: 'primary'
        }
    }
  }

  const { icon, iconBg, iconColor, confirmVariant } = getIconAndColor()

  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="confirm"
      size={size}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            className="min-w-20"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            className="min-w-20"
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-4">
        <div className={`${iconBg} rounded-full p-2 flex-shrink-0`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal