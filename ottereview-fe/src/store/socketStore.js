import { Stomp } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { create } from 'zustand'

export const useSocketStore = create((set) => ({
  stompClient: null,
  connect: (roomId, token, onConnect) => {
    const socket = new SockJS('http://localhost:8080/ws') // 🔁 주소는 실제 서버 주소로
    const client = Stomp.over(socket)
    client.connect({ Authorization: `Bearer ${token}` }, () => {
      set({ stompClient: client })
      onConnect?.(client)
    })
  },
}))
