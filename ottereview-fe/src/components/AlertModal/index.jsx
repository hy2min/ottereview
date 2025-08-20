import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

import Button from '@/components/Button'
import Modal from '@/components/Modal'

const AlertModal = ({ 
  isOpen, 
  onClose, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  buttonText = '확인',
  size = 'sm'
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          iconBg: 'bg-green-100 dark:bg-green-900',
          iconColor: 'text-green-600 dark:text-green-400',
          buttonVariant: 'success'
        }
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5" />,
          iconBg: 'bg-red-100 dark:bg-red-900',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonVariant: 'danger'
        }
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          iconBg: 'bg-yellow-100 dark:bg-yellow-900',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonVariant: 'warning'
        }
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonVariant: 'primary'
        }
    }
  }

  const { icon, iconBg, iconColor, buttonVariant } = getIconAndColor()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="alert"
      size={size}
      footer={
        <Button
          variant={buttonVariant}
          onClick={onClose}
          className="min-w-20"
        >
          {buttonText}
        </Button>
      }
    >
      <div className="flex items-center justify-center gap-4">
        <div className={`${iconBg} rounded-full p-2 flex-shrink-0`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default AlertModal