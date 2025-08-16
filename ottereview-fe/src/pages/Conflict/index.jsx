import * as yorkie from '@yorkie-js/sdk'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import LoadingOtter from '@/components/Loader'
import { createChat } from '@/features/chat/chatApi'
import useConflictStore from '@/features/conflict/conflictStore'
import { useUserStore } from '@/store/userStore'

const Conflict = () => {
  const { repoId, prId } = useParams()
  const navigate = useNavigate()

  // 로컬 상태들
  const [roomName, setRoomName] = useState('')
  const [activeFile, setActiveFile] = useState(null)
  const [yorkieInitializing, setYorkieInitializing] = useState(false)

  // Zustand store 사용
  const {
    members,
    conflictFiles,
    selectedMembers,
    selectedFiles,
    loading,
    error,
    conflictData,
    fetchConflictData,
    toggleMember,
    toggleFile,
    getFileHeadContent,
    getFileConflictContent,
    reset,
  } = useConflictStore()

  // 현재 로그인한 사용자 정보
  const user = useUserStore((state) => state.user)

  // fetchConflictData를 useCallback으로 메모이제이션
  const memoizedFetchConflictData = useCallback(fetchConflictData, [])

  useEffect(() => {
    const fetchData = async () => {
      if (repoId && prId) {
        try {
          await memoizedFetchConflictData(repoId, prId)
        } catch (err) {
          console.error('Failed to fetch conflict data:', err)
        }
      }
    }

    fetchData()

    // 컴포넌트 언마운트 시 상태 초기화
    return () => {
      reset()
    }
  }, [repoId, prId, memoizedFetchConflictData, reset])

  // activeFile 자동 설정 로직을 별도 useEffect로 분리
  useEffect(() => {
    if (selectedFiles.length > 0 && !activeFile) {
      setActiveFile(selectedFiles[0])
    } else if (selectedFiles.length === 0 && activeFile) {
      setActiveFile(null)
    } else if (activeFile && !selectedFiles.includes(activeFile)) {
      setActiveFile(selectedFiles.length > 0 ? selectedFiles[0] : null)
    }
  }, [selectedFiles, activeFile])

  // 현재 사용자 자동 선택 로직
  useEffect(() => {
    if (user && members.length > 0 && !selectedMembers.includes(user.githubUsername)) {
      const currentUserInMembers = members.find(
        (member) => member.githubUsername === user.githubUsername
      )
      if (currentUserInMembers) {
        toggleMember(user.githubUsername)
      }
    }
  }, [user, members, selectedMembers, toggleMember])

  const toggleReviewer = useCallback(
    (member) => {
      console.log('🔄 토글 멤버:', member.githubUsername, '현재 선택:', selectedMembers)
      toggleMember(member.githubUsername)
    },
    [toggleMember, selectedMembers]
  )

  const handleToggleFile = useCallback(
    (filename) => {
      console.log('📁 토글 파일:', filename, '현재 선택:', selectedFiles)
      toggleFile(filename)
    },
    [toggleFile, selectedFiles]
  )

  // Yorkie 문서 생성 및 초기 코드 설정 함수
  const createYorkieDocuments = async (roomId) => {
    try {
      console.log('🚀 Yorkie 문서 생성 시작...')
      setYorkieInitializing(true)

      // 환경변수 확인
      const rpcAddr = import.meta.env.VITE_YORKIE_API_ADDR
      const apiKey = import.meta.env.VITE_YORKIE_API_KEY

      if (!rpcAddr || !apiKey) {
        throw new Error('Yorkie 환경변수가 설정되지 않았습니다.')
      }

      // 1. Yorkie 클라이언트 생성
      const client = new yorkie.Client({
        rpcAddr,
        apiKey,
        syncLoopDuration: 50,
        reconnectStreamDelay: 1000,
      })

      await client.activate()

      // 2. 선택된 각 파일별로 Yorkie 문서 생성
      const createdDocs = []

      for (const fileName of selectedFiles) {
        const documentKey = `${roomId}_${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`
        console.log(`📄 문서 생성 중: ${documentKey}`)

        try {
          // Yorkie 문서 생성
          const doc = new yorkie.Document(documentKey, {
            enableDevtools: true,
          })

          await client.attach(doc)

          // 초기 코드 설정
          doc.update((root) => {
            if (!root.content) {
              root.content = new yorkie.Text()

              // conflictStore에서 해당 파일의 headContent 가져오기
              const fileHeadContent = getFileHeadContent(fileName)

              let initialCode = ''
              if (fileHeadContent) {
                initialCode = fileHeadContent
                console.log(`✅ ${fileName}: 원본 코드 설정 (${fileHeadContent.length}자)`)
              } else {
                initialCode = `// 파일: ${fileName}
// 충돌 해결용 코드 편집기
// 실시간으로 다른 사용자와 함께 편집할 수 있습니다

function hello() {
  console.log("Hello, collaborative coding!");
}

// TODO: 충돌을 해결하고 올바른 코드를 작성하세요
`
                console.log(`✅ ${fileName}: 기본 템플릿 설정`)
              }

              root.content.edit(0, 0, initialCode)
            }
          })

          await client.sync()
          createdDocs.push({ fileName, documentKey })

          // 문서 연결 해제 (ChatRoom에서 다시 연결할 예정)
          await client.detach(doc)
        } catch (docError) {
          console.error(`❌ 문서 ${fileName} 생성 실패:`, docError)
          // 개별 파일 실패는 전체 프로세스를 중단하지 않음
        }
      }

      await client.deactivate()

      console.log('🎉 Yorkie 문서 생성 완료:', createdDocs)
      return createdDocs
    } catch (error) {
      console.error('❌ Yorkie 문서 생성 실패:', error)
      throw error
    } finally {
      setYorkieInitializing(false)
    }
  }

  const handleCreateChat = async () => {
    try {
      console.log('🚀 채팅방 생성 시작')

      // 유효성 검사
      const trimmedRoomName = roomName.trim()
      if (!trimmedRoomName) {
        alert('채팅방 이름을 입력해주세요.')
        return
      }

      // 현재 사용자는 항상 포함되므로 추가 참여자 체크는 선택사항
      // if (selectedMembers.length === 0) {
      //   alert('참여자를 최소 1명 이상 선택해주세요.')
      //   return
      // }

      if (selectedFiles.length === 0) {
        alert('충돌 파일을 최소 1개 이상 선택해주세요.')
        return
      }
      console.log(selectedFiles)

      // 현재 사용자를 포함한 선택된 멤버들의 ID 추출
      const allSelectedMembers = user ? [user.githubUsername, ...selectedMembers] : selectedMembers
      const selectedMemberIds = members
        .filter((member) => allSelectedMembers.includes(member.githubUsername))
        .map((member) => member.id)

      if (selectedMemberIds.length !== allSelectedMembers.length) {
        console.warn('일부 멤버의 ID를 찾을 수 없습니다.')
      }

      console.log('📤 API 요청 데이터:', {
        prId: Number(prId),
        roomName: trimmedRoomName,
        inviteeIds: selectedMemberIds,
        selectedMemberUsernames: allSelectedMembers,
      })

      // 채팅방 생성 API 호출
      const result = await createChat({
        prId: Number(prId),
        roomName: trimmedRoomName,
        inviteeIds: selectedMemberIds,
        files: selectedFiles,
      })

      console.log('✅ API 응답:', result)

      // API 응답에서 채팅방 ID 추출
      const roomId = result.roomId || result.id || result.chatRoomId
      if (!roomId) {
        throw new Error('채팅방 ID를 받지 못했습니다.')
      }

      // Yorkie 문서들 생성 및 초기 코드 설정
      console.log('📄 Yorkie 문서 생성 중...')
      const yorkieDocs = await createYorkieDocuments(roomId)

      // 채팅방 정보를 sessionStorage에 저장
      const roomInfo = {
        roomId,
        roomName: trimmedRoomName,
        repoId,
        prId,
        conflictFiles: selectedFiles,
        members: allSelectedMembers,
        yorkieDocs,
        createdAt: Date.now(),
      }

      try {
        sessionStorage.setItem(`room_${roomId}`, JSON.stringify(roomInfo))
        console.log('💾 채팅방 정보 저장:', roomInfo)
      } catch (storageError) {
        console.warn('sessionStorage 저장 실패:', storageError)
      }

      // 채팅방 페이지로 이동
      navigate(`/chatroom/${roomId}`)

      console.log('✅ 채팅방 생성 완료, 페이지 이동 중...')
    } catch (err) {
      console.error('❌ 채팅방 생성 실패:', err)
      const errorMessage = err.message || '알 수 없는 오류가 발생했습니다.'
      alert(`채팅방 생성에 실패했습니다: ${errorMessage}`)
    }
  }

  // 생성 버튼 활성화 조건 (현재 사용자는 항상 포함되므로 멤버 수 체크 제거)
  const isCreateButtonDisabled =
    !roomName.trim() || selectedFiles.length === 0 || yorkieInitializing || loading

  if (loading && !conflictData) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10">
        {/* 로딩 수달 */}
        <div className="w-full max-w-5xl">
          <LoadingOtter
            shells={7} // 조개 개수
            frameWidth={160} // 너비 줄임
            frameHeight={160} // 높이 줄임
            cycle={true} // 반복
            stepMs={600} // 한 칸 이동 시간
            pickMs={450} // 줍는 모션 시간
            pauseMs={250} // 칸 사이 멈춤
            background="transparent" // 페이지 배경과 자연스럽게
          />
        </div>

        {/* 안내 문구 */}
        <div className="mt-4 text-sm text-gray-500">멤버 목록과 충돌 파일을 불러오는 중입니다…</div>
      </div>
      //     <div className="text-lg">🔄 데이터를 불러오는 중...</div>
      //     <div className="text-sm text-gray-500 mt-2">
      //       멤버 목록과 충돌 파일을 가져오고 있습니다.
      //     </div>
      //   </div>
      // </div>
    )
  }

  return (
    <div className="space-y-4 py-4">
      {/* Yorkie 초기화 상태 표시 */}
      {yorkieInitializing && (
        <div className="text-center py-8">
          <div className="text-lg">🔄 Yorkie 문서 생성 중...</div>
          <div className="text-sm text-gray-500 mt-2">
            파일별 협업 문서를 생성하고 초기 코드를 설정하고 있습니다.
          </div>
        </div>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">❌ 데이터 로딩 실패</div>
          <div className="text-red-600 text-sm mt-1">
            {error.message || '알 수 없는 오류가 발생했습니다.'}
          </div>
          <button
            onClick={() => memoizedFetchConflictData(repoId, prId)}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {!yorkieInitializing && (
        <>
          {/* 채팅방 이름 입력 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-2 font-medium text-gray-700">채팅방 이름</div>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="채팅방 이름을 입력하세요"
              className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || yorkieInitializing}
              maxLength={50}
            />
          </div>

          {/* 참여자 선택 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-2 font-medium text-gray-700">참여자 선택</div>

            {loading && !members.length && (
              <div className="text-sm text-gray-500 mb-2">멤버 목록을 불러오는 중...</div>
            )}

            {members.length > 0 ? (
              <div className="space-y-3">
                {/* 현재 사용자 표시 (항상 포함) */}
                {user && (
                  <div className="flex items-center gap-2 border px-3 py-2 bg-green-50 border-green-300 rounded-md">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{user.githubUsername} (나)</span>
                    <Badge variant="success" size="xs">
                      항상 포함
                    </Badge>
                  </div>
                )}

                {/* 다른 멤버들 */}
                <div className="flex gap-4 flex-wrap">
                  {members
                    .filter((member) => member.githubUsername !== user?.githubUsername)
                    .map((member) => (
                      <label
                        key={member.githubUsername}
                        className={`flex items-center gap-2 border px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors ${
                          selectedMembers.includes(member.githubUsername)
                            ? 'bg-blue-50 border-blue-300'
                            : 'border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.githubUsername)}
                          onChange={(e) => {
                            e.stopPropagation()
                            console.log(
                              '🔄 체크박스 클릭:',
                              member.githubUsername,
                              'checked:',
                              e.target.checked
                            )
                            toggleReviewer(member)
                          }}
                          disabled={loading || yorkieInitializing}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                        />
                        <span className="text-sm">{member.githubUsername}</span>
                      </label>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">사용 가능한 멤버가 없습니다.</div>
            )}

            {(user || selectedMembers.length > 0) && (
              <div className="mt-3 text-sm text-blue-600 bg-blue-50 rounded-md p-2">
                선택된 참여자:{' '}
                {user
                  ? `${user.githubUsername} (나)${selectedMembers.length > 0 ? `, ${selectedMembers.join(', ')}` : ''}`
                  : selectedMembers.join(', ')}
              </div>
            )}
          </div>

          {/* 충돌 파일 선택 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-2 font-medium text-gray-700">충돌 파일 목록 (필수)</div>

            {conflictFiles.length > 0 ? (
              <div className="flex gap-4 flex-wrap">
                {conflictFiles.map((file) => (
                  <label
                    key={file}
                    className={`flex items-center gap-2 border px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors ${
                      selectedFiles.includes(file)
                        ? 'bg-green-50 border-green-300'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file)}
                      onChange={(e) => {
                        e.stopPropagation()
                        console.log('📁 파일 체크박스 클릭:', file, 'checked:', e.target.checked)
                        handleToggleFile(file)
                      }}
                      disabled={loading || yorkieInitializing}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50"
                    />
                    <span className="text-sm font-mono">{file}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">충돌 파일이 없습니다.</div>
            )}

            <div className="mt-3">
              {selectedFiles.length > 0 ? (
                <div className="text-sm text-green-600 bg-green-50 rounded-md p-2">
                  선택된 파일: {selectedFiles.join(', ')}
                </div>
              ) : (
                <div className="text-sm text-red-600 bg-red-50 rounded-md p-2">
                  충돌 파일을 최소 1개 이상 선택해주세요.
                </div>
              )}
            </div>
          </div>

          {/* 선택된 파일들의 내용 표시 */}
          {selectedFiles.length > 0 && conflictData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4 font-medium text-gray-700">선택된 파일 충돌 내용 미리보기</div>

              {/* 파일 탭 버튼들 */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {selectedFiles.map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`px-3 py-2 rounded-md text-sm border transition-colors font-mono ${
                      activeFile === filename
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {filename}
                  </button>
                ))}
              </div>

              {/* 선택된 파일의 충돌 내용 표시 */}
              {activeFile && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                    <span>📄 {activeFile}</span>
                    <span className="text-xs text-gray-500 font-normal">충돌 내용</span>
                  </div>

                  {(() => {
                    const fileContent = getFileConflictContent(activeFile)

                    return fileContent ? (
                      <div className="bg-gray-50 p-4 rounded-md text-sm border border-gray-200 max-h-60 overflow-y-auto">
                        <pre className="whitespace-pre-wrap overflow-x-auto text-xs font-mono leading-relaxed">
                          {fileContent}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm bg-gray-50 p-4 rounded-md border border-gray-200">
                        해당 파일의 충돌 내용을 찾을 수 없습니다.
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* 생성 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={handleCreateChat}
              disabled={isCreateButtonDisabled}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isCreateButtonDisabled
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {yorkieInitializing ? '문서 생성 중...' : '채팅방 개설'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Conflict
