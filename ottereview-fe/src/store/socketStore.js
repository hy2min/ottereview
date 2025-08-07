import { Stomp } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { create } from 'zustand'

export const useSocketStore = create((set) => ({
  roomId: '',
  userId: crypto.randomUUID(),
  color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 40%)`,
  stompClient: null,

  setRoomId: (id) => set({ roomId: id }),

  connect: (roomId, token, onConnect) => {
    const socket = new SockJS('http://i13c108.p.ssafy.io:8080/ws')
    const client = Stomp.over(socket)
    client.connect({ Authorization: `Bearer ${token}` }, () => {
      set({ stompClient: client, roomId })
      onConnect?.(client)
    })
  },
}))
