import { create } from 'zustand'

import { api } from '@/lib/api'

// Conflict 관리를 위한 Zustand 스토어 생성
const useConflictStore = create((set, get) => ({
  // 상태 변수들 - 초기값 명시적 설정
  members: [], // 저장소 멤버 목록
  conflictFiles: [], // 충돌 파일 목록 - 빈 배열로 초기화
  selectedMembers: [], // 선택된 멤버 이름 목록
  selectedFiles: [], // 선택된 파일 경로 목록
  loading: false, // 데이터 로딩 상태
  error: null, // 에러 상태

  // 충돌 코드 데이터 (새로 추가)
  conflictData: null, // 충돌 상세 데이터 (headFileContents, conflictFilesContents 등)

  // 액션: 비동기 데이터 로딩
  fetchConflictData: async (repoId, prId) => {
    // 이미 로딩 중이면 중복 실행 방지
    if (get().loading) return

    // 로딩 시작 및 에러 초기화
    set({ loading: true, error: null })

    try {
      // 멤버 목록과 PR 상세 정보, 충돌 데이터를 동시에 요청
      const [membersRes, prDetailRes, conflictRes] = await Promise.all([
        api.get(`/api/accounts/repositories/${repoId}/users`), // 저장소 멤버 목록 API
        api.get(`/api/repositories/${repoId}/pull-requests/${prId}`), // PR 상세 정보 API
        api.get(`/api/repositories/${repoId}/pull-requests/${prId}/merges/conflicts`), // 충돌 데이터 API
      ])

      // 안전한 데이터 추출
      const members = membersRes?.data || []
      const files = prDetailRes?.data?.files || []
      const conflictData = conflictRes?.data || null

      // 파일명 추출 시 안전성 확보
      const conflictFiles = files.map((file) => file?.filename).filter(Boolean)

      // 성공 시 상태 업데이트
      set({
        members, // 멤버 목록 저장
        conflictFiles, // 안전하게 추출된 파일 목록
        conflictData, // 충돌 데이터 저장
        loading: false, // 로딩 종료
      })

      console.log('📄 충돌 데이터 로딩 완료:', {
        members: members.length,
        conflictFiles: conflictFiles.length,
        conflictData: !!conflictData,
      })
    } catch (error) {
      // 실패 시 에러 상태 업데이트
      console.error('데이터를 불러오는 중 오류가 발생했습니다:', error)
      set({
        loading: false,
        error,
        // 에러 발생 시에도 기본값 보장
        members: [],
        conflictFiles: [],
        conflictData: null,
      })
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

  // 헬퍼: 특정 파일의 headFileContents 가져오기
  getFileHeadContent: (filename) => {
    const { conflictData } = get()
    if (!conflictData || !conflictData.headFileContents) {
      return ''
    }
    return conflictData.headFileContents[filename] || ''
  },

  // 헬퍼: 특정 파일의 충돌 내용 가져오기
  getFileConflictContent: (filename) => {
    const { conflictData } = get()
    if (!conflictData || !conflictData.files || !conflictData.conflictFilesContents) {
      return null
    }

    const fileIndex = conflictData.files.indexOf(filename)
    return fileIndex !== -1 ? conflictData.conflictFilesContents[fileIndex] : null
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
      conflictData: null, // 충돌 데이터도 초기화
    })
  },
}))

// 기본 export와 명명된 export 모두 제공
export default useConflictStore
