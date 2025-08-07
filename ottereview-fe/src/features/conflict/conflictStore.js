import { create } from 'zustand'

import { api } from '@/lib/api'

// Conflict 관리를 위한 Zustand 스토어 생성
export const useConflictStore = create((set, get) => ({
  // 상태 변수들
  members: [], // 저장소 멤버 목록
  conflictFiles: [], // 충돌 파일 목록
  selectedMembers: [], // 선택된 멤버 이름 목록
  selectedFiles: [], // 선택된 파일 경로 목록
  loading: false, // 데이터 로딩 상태
  error: null, // 에러 상태

  // 액션: 비동기 데이터 로딩
  fetchConflictData: async (repoId, prId) => {
    // 이미 로딩 중이면 중복 실행 방지
    if (get().loading) return

    // 로딩 시작 및 에러 초기화
    set({ loading: true, error: null })

    try {
      // 멤버 목록과 PR 상세 정보를 동시에 요청
      const [membersRes, prDetailRes] = await Promise.all([
        api.get(`/api/repositories/${repoId}/members`), // 저장소 멤버 목록 API
        api.get(`/api/repositories/${repoId}/pull-requests/${prId}`), // PR 상세 정보 API
      ])

      // 성공 시 상태 업데이트
      set({
        members: membersRes.data, // 멤버 목록 저장
        // PR 상세 정보에서 파일 이름만 추출하여 저장
        conflictFiles: prDetailRes.data.files.map((file) => file.filename),
        loading: false, // 로딩 종료
      })
    } catch (error) {
      // 실패 시 에러 상태 업데이트
      console.error('데이터를 불러오는 중 오류가 발생했습니다:', error)
      set({ error, loading: false })
    }
  },

  // 액션: 멤버 선택/해제
  toggleMember: (memberName) => {
    set((state) => ({
      selectedMembers: state.selectedMembers.includes(memberName)
        ? state.selectedMembers.filter((name) => name !== memberName) // 있으면 제거
        : [...state.selectedMembers, memberName], // 없으면 추가
    }))
  },

  // 액션: 파일 선택/해제
  toggleFile: (fileName) => {
    set((state) => ({
      selectedFiles: state.selectedFiles.includes(fileName)
        ? state.selectedFiles.filter((file) => file !== fileName) // 있으면 제거
        : [...state.selectedFiles, fileName], // 없으면 추가
    }))
  },

  // 액션: 상태 초기화 (컴포넌트 언마운트 시 호출)
  reset: () => {
    set({
      members: [],
      conflictFiles: [],
      selectedMembers: [],
      selectedFiles: [],
      loading: false,
      error: null,
    })
  },
}))
