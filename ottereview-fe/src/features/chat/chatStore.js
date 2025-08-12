import { create } from 'zustand'

// idCounter는 DB에 저장하면서 DB의 CHATROOM 번호와 연동할 것임.
let idCounter = 1

export const useChatStore = create((set, get) => ({
  rooms: [],

  setRooms: (fetchedRooms) =>
    set(() => ({
      rooms: fetchedRooms,
    })),

  addRoom: (roomData) =>
    // const newRoom = { id: idCounter++, createdAt: Date.now(), ...roomData }
    set((state) => ({
      rooms: [
        ...state.rooms,
        {
          ...roomData,
          yorkieDocumentKey: roomData.yorkieDocumentKey || null, // Yorkie 문서 키 추가
          conflictFiles: roomData.conflictFiles || [], // 충돌 파일 목록
          members: roomData.members || [], // 멤버 목록
          createdAt: roomData.createdAt || Date.now(), // 생성 시간
        },
      ],
    })),
  // return newRoom.id

  removeRoom: (id) =>
    set((state) => ({
      rooms: state.rooms.filter((room) => room.id !== id),
    })),

  // 특정 채팅방 정보 가져오기 (새로 추가)
  getRoomById: (roomId) => {
    const state = get()
    return state.rooms.find((room) => room.id === roomId)
  },

  // Yorkie 문서 키로 채팅방 찾기 (새로 추가)
  getRoomByDocumentKey: (documentKey) => {
    const state = get()
    return state.rooms.find((room) => room.yorkieDocumentKey === documentKey)
  },

  // 채팅방 정보 업데이트 (새로 추가)
  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((room) => (room.id === roomId ? { ...room, ...updates } : room)),
    })),

  // 채팅방의 Yorkie 문서 키 업데이트 (새로 추가)
  updateRoomDocumentKey: (roomId, yorkieDocumentKey) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, yorkieDocumentKey } : room
      ),
    })),
}))
