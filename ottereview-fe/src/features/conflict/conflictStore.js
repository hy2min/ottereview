import { create } from 'zustand'
import { fetchConflictData } from '@/features/conflict/conflictApi'

const useConflictStore = create((set, get) => ({
  // 상태
  conflictData: null,
  loading: false,
  error: null,
  selectedFiles: [],
  activeFile: null,

  // 액션들
  fetchConflictFiles: async (repoId, prId) => {
    set({ loading: true, error: null })
    try {
      console.log('🔄 충돌 데이터 로딩 시작:', { repoId, prId })
      const data = await fetchConflictData(repoId, prId)

      set({
        conflictData: data,
        loading: false,
        error: null,
      })

      console.log('✅ 충돌 데이터 로딩 완료:', data)
      return data
    } catch (error) {
      console.error('❌ 충돌 데이터 로딩 실패:', error)
      set({
        loading: false,
        error: error.message,
      })
      throw error
    }
  },

  // 파일 선택/해제
  toggleSelectedFile: (filename) => {
    const { selectedFiles, activeFile } = get()
    const newSelectedFiles = selectedFiles.includes(filename)
      ? selectedFiles.filter((f) => f !== filename)
      : [...selectedFiles, filename]

    // 파일이 제거되고 현재 활성 파일이 제거된 파일이라면 activeFile 업데이트
    let newActiveFile = activeFile
    if (selectedFiles.includes(filename) && activeFile === filename) {
      newActiveFile = newSelectedFiles.length > 0 ? newSelectedFiles[0] : null
    }
    // 파일이 새로 추가되고 현재 활성 파일이 없다면 새 파일을 활성화
    else if (!selectedFiles.includes(filename) && !activeFile) {
      newActiveFile = filename
    }

    set({
      selectedFiles: newSelectedFiles,
      activeFile: newActiveFile,
    })

    console.log('📄 파일 선택 변경:', {
      filename,
      action: selectedFiles.includes(filename) ? '제거' : '추가',
      newSelectedFiles,
      newActiveFile,
    })
  },

  // 활성 파일 설정
  setActiveFile: (filename) => {
    set({ activeFile: filename })
  },

  // 파일별 데이터 가져오기 헬퍼 함수들
  getFileConflictContent: (filename) => {
    const { conflictData } = get()
    if (!conflictData || !conflictData.files || !conflictData.conflictFilesContents) {
      return null
    }

    const fileIndex = conflictData.files.indexOf(filename)
    return fileIndex !== -1 ? conflictData.conflictFilesContents[fileIndex] : null
  },

  getFileHeadContent: (filename) => {
    const { conflictData } = get()
    if (!conflictData || !conflictData.headFileContents) {
      return ''
    }
    return conflictData.headFileContents[filename] || ''
  },

  getFileBaseContent: (filename) => {
    const { conflictData } = get()
    if (!conflictData || !conflictData.baseFileContents) {
      return ''
    }
    return conflictData.baseFileContents[filename] || ''
  },

  // 파일 목록 가져오기
  getAvailableFiles: () => {
    const { conflictData } = get()
    return conflictData?.files || []
  },

  // 선택된 파일들의 정보 가져오기
  getSelectedFilesInfo: () => {
    const { selectedFiles } = get()
    const { getFileHeadContent, getFileConflictContent } = get()

    return selectedFiles.map((filename) => ({
      filename,
      headContent: getFileHeadContent(filename),
      conflictContent: getFileConflictContent(filename),
    }))
  },

  // 상태 초기화
  reset: () => {
    set({
      conflictData: null,
      loading: false,
      error: null,
      selectedFiles: [],
      activeFile: null,
    })
  },

  // 특정 파일이 선택되었는지 확인
  isFileSelected: (filename) => {
    const { selectedFiles } = get()
    return selectedFiles.includes(filename)
  },
}))

export default useConflictStore
