import * as yorkie from '@yorkie-js/sdk'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Badge from '@/components/Badge'
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
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  // 로딩 메시지 배열
  const loadingMessages = [
    '멤버 목록과 충돌 파일을 불러오는 중입니다…',
    '팀 협업을 위한 환경을 준비하고 있습니다…',
    '코드 리뷰 데이터를 분석하고 있습니다…',
    '실시간 코딩 공간을 준비하고 있습니다…',
    '충돌 해결을 위한 도구를 설정하고 있습니다…',
  ]

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
        } catch (err) {}
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

  // 로딩 메시지 로테이션
  useEffect(() => {
    if (loading && !conflictData) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
      }, 2000) // 2초마다 메시지 변경

      return () => clearInterval(interval)
    }
  }, [loading, conflictData, loadingMessages.length])

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
      toggleMember(member.githubUsername)
    },
    [toggleMember, selectedMembers]
  )

  const handleToggleFile = useCallback(
    (filename) => {
      toggleFile(filename)
    },
    [toggleFile, selectedFiles]
  )

  // Yorkie 문서 생성 및 초기 코드 설정 함수
  const createYorkieDocuments = async (roomId) => {
    try {
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
              const fileHeadContent = getFileConflictContent(fileName)

              let initialCode = ''
              if (fileHeadContent) {
                initialCode = fileHeadContent
              } else {
                initialCode = `// 파일: ${fileName}
// 충돌 해결용 코드 편집기
// 실시간으로 다른 사용자와 함께 편집할 수 있습니다

function hello() {
  console.log("Hello, collaborative coding!");
}

// TODO: 충돌을 해결하고 올바른 코드를 작성하세요
`
              }

              root.content.edit(0, 0, initialCode)
            }
          })

          await client.sync()
          createdDocs.push({ fileName, documentKey })

          // 문서 연결 해제 (ChatRoom에서 다시 연결할 예정)
          await client.detach(doc)
        } catch {
          // 개별 파일 실패는 전체 프로세스를 중단하지 않음
        }
      }

      await client.deactivate()

      return createdDocs
    } catch (error) {
      throw error
    } finally {
      setYorkieInitializing(false)
    }
  }

  const handleCreateChat = async () => {
    try {
      // 유효성 검사
      const trimmedRoomName = roomName.trim()
      if (!trimmedRoomName) {
        alert('채팅방 이름을 입력해주세요.')
        return
      }

      if (selectedFiles.length === 0) {
        alert('충돌 파일을 최소 1개 이상 선택해주세요.')
        return
      }

      // 현재 사용자를 포함한 선택된 멤버들의 ID 추출
      const allSelectedMembers = user ? [user.githubUsername, ...selectedMembers] : selectedMembers
      const selectedMemberIds = members
        .filter((member) => allSelectedMembers.includes(member.githubUsername))
        .map((member) => member.id)

      if (selectedMemberIds.length !== allSelectedMembers.length) {
        console.warn('일부 멤버의 ID를 찾을 수 없습니다.')
      }

      // 채팅방 생성 API 호출
      const result = await createChat({
        prId: Number(prId),
        roomName: trimmedRoomName,
        inviteeIds: selectedMemberIds,
        files: selectedFiles,
      })

      // API 응답에서 채팅방 ID 추출
      const roomId = result.roomId || result.id || result.chatRoomId
      if (!roomId) {
        throw new Error('채팅방 ID를 받지 못했습니다.')
      }

      // Yorkie 문서들 생성 및 초기 코드 설정
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
      } catch (storageError) {}

      // 채팅방 페이지로 이동
      navigate(`/chatroom/${roomId}`)
    } catch (err) {
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
        <div className="w-full max-w-4xl">
          <LoadingOtter
            shells={5} // 조개 개수 줄임
            frameWidth={120} // 너비 더 줄임
            frameHeight={120} // 높이 더 줄임
            cycle={true} // 반복
            stepMs={500} // 빠른 이동
            pickMs={350} // 빠른 줍기
            pauseMs={200} // 짧은 멈춤
            background="transparent" // 페이지 배경과 자연스럽게
          />
        </div>

        {/* 로테이션 메시지 */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600 font-medium transition-opacity duration-500">
            {loadingMessages[loadingMessageIndex]}
          </div>
          <div className="mt-2 flex justify-center items-center space-x-1">
            {loadingMessages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === loadingMessageIndex ? 'bg-orange-400 w-3' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-4">
      {/* 페이지 헤더 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full mb-3">
          <span className="text-xl text-white">🦦</span>
        </div>
        <h1 className="text-2xl font-bold text-primary mb-1">실시간 협업 채팅방 생성</h1>
        <p className="text-muted text-sm">팀원들과 함께 충돌을 해결하고 코드를 개선해보세요</p>
      </div>

      {/* Yorkie 초기화 상태 표시 */}
      {yorkieInitializing && (
        <div className="bg-primary rounded-lg border border-primary p-6">
          <div className="w-full flex flex-col items-center justify-center">
            {/* Yorkie 초기화 로딩 수달 */}
            <div className="w-full max-w-3xl">
              <LoadingOtter
                shells={4}
                frameWidth={100}
                frameHeight={100}
                cycle={true}
                stepMs={400}
                pickMs={300}
                pauseMs={150}
                background="transparent"
              />
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-medium text-primary mb-1">🔄 협업 공간 준비 중...</div>
              <div className="text-muted text-sm">
                파일별 협업 문서를 생성하고 초기 코드를 설정하고 있습니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-lg">⚠️</span>
            <div className="flex-1">
              <div className="text-red-800 font-medium">데이터 로딩 실패</div>
              <div className="text-red-600 text-sm">
                {error.message || '알 수 없는 오류가 발생했습니다.'}
              </div>
            </div>
            <button
              onClick={() => memoizedFetchConflictData(repoId, prId)}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {!yorkieInitializing && (
        <>
          {/* 채팅방 이름 입력 */}
          <div className="bg-primary rounded-lg border border-primary p-6">
            <div className="mb-2 font-medium text-primary">채팅방 이름</div>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="예: PR #123 충돌 해결 회의"
              className="border border-primary px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading || yorkieInitializing}
              maxLength={50}
            />
            <div className="mt-1 text-right text-xs text-muted">{roomName.length}/50</div>
          </div>

          {/* 참여자 선택 */}
          <div className="bg-primary rounded-lg border border-primary p-6">
            <div className="mb-2 font-medium text-primary">참여자 선택</div>

            {loading && !members.length && (
              <div className="text-sm text-muted mb-2">멤버 목록을 불러오는 중...</div>
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
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-900">
                      {user.githubUsername} (나)
                    </span>
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
                        className={`group flex items-center gap-2 border px-3 py-2 cursor-pointer rounded-md transition-colors ${
                          selectedMembers.includes(member.githubUsername)
                            ? 'border-blue-300'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.githubUsername)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleReviewer(member)
                          }}
                          disabled={loading || yorkieInitializing}
                          className="w-4 h-4 disabled:opacity-50"
                        />
                        <span className="text-sm">{member.githubUsername}</span>
                      </label>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted">사용 가능한 멤버가 없습니다.</div>
            )}
          </div>

          {/* 충돌 파일 선택 */}
          <div className="bg-primary rounded-lg border border-primary p-6">
            <div className="mb-2 font-medium text-primary">충돌 파일 목록 (필수)</div>

            {conflictFiles.length > 0 ? (
              <div className="flex gap-4 flex-wrap">
                {conflictFiles.map((file) => (
                  <label
                    key={file}
                    className={`flex items-center gap-2 border px-3 py-2 cursor-pointer rounded-md transition-colors ${
                      selectedFiles.includes(file)
                        ? 'border-green-300'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file)}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleToggleFile(file)
                      }}
                      disabled={loading || yorkieInitializing}
                      className="w-4 h-4 disabled:opacity-50"
                    />
                    <span className="text-sm font-mono">{file}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted">충돌 파일이 없습니다.</div>
            )}

            <div className="mt-3">
              {selectedFiles.length > 0 ? (
                <div></div>
              ) : (
                <div className="text-sm text-red-600 bg-red-50 rounded-md p-2">
                  충돌 파일을 최소 1개 이상 선택해주세요.
                </div>
              )}
            </div>
          </div>

          {/* 선택된 파일들의 내용 표시 */}
          {selectedFiles.length > 0 && conflictData && (
            <div className="bg-primary rounded-lg border border-primary p-6">
              <div className="mb-4 font-medium text-primary">선택된 파일 충돌 내용 미리보기</div>

              {/* 파일 탭 버튼들 */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {selectedFiles.map((filename) => (
                  <Button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    variant={activeFile === filename ? 'primary' : 'secondary'}
                    size="sm"
                    className="font-mono"
                  >
                    {filename}
                  </Button>
                ))}
              </div>

              {/* 선택된 파일의 충돌 내용 표시 */}
              {activeFile && (
                <div className="border border-primary rounded-lg p-4">
                  <div className="font-semibold text-sm mb-3 text-primary flex items-center gap-2">
                    <span>📄 {activeFile}</span>
                    <span className="text-xs text-muted font-normal">충돌 내용</span>
                  </div>

                  {(() => {
                    const fileContent = getFileConflictContent(activeFile)

                    return fileContent ? (
                      <div className="bg-secondary p-4 rounded-md text-sm border border-primary max-h-60 overflow-y-auto">
                        <pre className="whitespace-pre-wrap overflow-x-auto text-xs font-mono leading-relaxed">
                          {fileContent}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-muted text-sm bg-secondary p-4 rounded-md border border-primary">
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
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md'
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
