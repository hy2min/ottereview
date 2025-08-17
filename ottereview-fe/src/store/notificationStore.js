import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      
      // 알림 추가
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: notification.id || Date.now() + Math.random(),
            timestamp: notification.timestamp || new Date(),
            isRead: false,
          },
          ...state.notifications
        ]
      })),
      
      // 개별 알림 삭제
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notification => notification.id !== id)
      })),
      
      // 모든 알림 삭제
      clearAllNotifications: () => set({ notifications: [] }),
      
      // 알림 읽음 처리
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      })),
      
      // 모든 알림 읽음 처리
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(notification => ({ ...notification, isRead: true }))
      })),
      
      // 읽지 않은 알림 개수
      getUnreadCount: () => {
        const { notifications } = get()
        return notifications.filter(notification => !notification.isRead).length
      }
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
)