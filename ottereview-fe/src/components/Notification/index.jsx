import { Bell, GitBranch, GitPullRequest, Trash2, X } from 'lucide-react'
import React from 'react'
import { useNotificationStore } from '@/store/notificationStore'
import { useNavigate } from 'react-router-dom'

const NotificationItem = ({ notification, onRemove }) => {
  const navigate = useNavigate()
  const markAsRead = useNotificationStore((state) => state.markAsRead)

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
  }

  const handlePRCreate = (e) => {
    e.stopPropagation()
    if (notification.data?.prCreateUrl) {
      navigate(notification.data.prCreateUrl)
    }
  }

  const formatTime = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  return (
    <div className={`
      group relative border-b theme-border last:border-b-0 p-3 hover:theme-bg-tertiary transition-colors
      ${!notification.isRead ? 'theme-bg-secondary' : ''}
    `}>
      <div className="flex items-start gap-3" onClick={handleClick}>
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-lg flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm theme-text truncate">
              {notification.title}
            </p>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs theme-text-secondary mt-0.5 truncate">
            {notification.message}
          </p>
          
          <p className="text-xs theme-text-muted mt-1">
            {formatTime(notification.timestamp)}
          </p>
          
          {/* PR 생성 버튼 */}
          <button
            onClick={handlePRCreate}
            className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded transition-colors duration-200 cursor-pointer"
          >
            <GitPullRequest className="w-3 h-3" />
            PR 생성
          </button>
        </div>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(notification.id)
        }}
        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:theme-bg-tertiary rounded transition-all duration-200 cursor-pointer"
      >
        <X className="w-3 h-3 theme-text-secondary" />
      </button>
    </div>
  )
}

const NotificationPanel = ({ isOpen, onClose }) => {
  const notifications = useNotificationStore((state) => state.notifications)
  const removeNotification = useNotificationStore((state) => state.removeNotification)
  const clearAllNotifications = useNotificationStore((state) => state.clearAllNotifications)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const getUnreadCount = useNotificationStore((state) => state.getUnreadCount)

  const unreadCount = getUnreadCount()

  // 알림창이 열리면 자동으로 모든 알림을 읽음 처리
  React.useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead()
    }
  }, [isOpen, markAllAsRead, unreadCount])

  if (!isOpen) return null

  return (
    <div className="absolute top-full right-0 mt-2 w-80 max-h-96 theme-bg-primary border theme-border rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/30 backdrop-blur-sm z-50 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b theme-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 theme-text" />
          <h3 className="font-semibold theme-text">알림</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="p-1 hover:theme-bg-tertiary rounded transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 theme-text-secondary" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:theme-bg-tertiary rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 theme-text-secondary" />
          </button>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 theme-text-muted mx-auto mb-3" />
            <p className="theme-text-muted text-sm">새로운 알림이 없습니다</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationPanel