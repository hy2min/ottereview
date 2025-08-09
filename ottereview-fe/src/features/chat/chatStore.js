import { create } from 'zustand'

// idCounter는 DB에 저장하면서 DB의 CHATROOM 번호와 연동할 것임.
let idCounter = 1

export const useChatStore = create((set) => ({
  rooms: [],

  setRooms: (fetchedRooms) =>
    set(() => ({
      rooms: fetchedRooms,
    })),

  addRoom: (roomData) =>
    // const newRoom = { id: idCounter++, createdAt: Date.now(), ...roomData }
    set((state) => ({
      rooms: [...state.rooms, roomData],
    })),
  // return newRoom.id

  removeRoom: (id) =>
    set((state) => ({
      rooms: state.rooms.filter((room) => room.id !== id),
    })),
}))
