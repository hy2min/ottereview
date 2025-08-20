import MDEditor from '@uiw/react-md-editor'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  FolderCode,
  GitBranch,
  GitCommit,
  GitMerge,
  Info,
  MessageCircle,
  Settings,
  Users,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import CommentForm from '@/features/comment/CommentForm'
import PRCommentList from '@/features/comment/PRCommentList'
import CommitList from '@/features/pullRequest/CommitList'
import {
  closePR,
  doMerge,
  fetchPRDetail,
  fetchReviews,
  IsMergable,
  reopenPR,
  submitReview,
} from '@/features/pullRequest/prApi'
import PRFileList from '@/features/pullRequest/PRFileList'
import { useCommentManager } from '@/hooks/useCommentManager'
import useLoadingDots from '@/lib/utils/useLoadingDots'
import { useUserStore } from '@/store/userStore'

const PRReview = () => {
  const { repoId, prId } = useParams()
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)

  const tabs = [
    { id: 'files', label: '파일', icon: FileText },
    { id: 'comments', label: '리뷰', icon: MessageCircle },
    { id: 'commits', label: '커밋', icon: GitCommit },
  ]

  const [activeTab, setActiveTab] = useState('files')
  const [comment, setComment] = useState('')
  const [showCommentForm, setShowCommentForm] = useState(false)

  // 댓글 관리 훅 사용
  const {
    reviewComments,
    audioFiles: files,
    fileComments,
    setReviewComments,
    setFiles,
    setFileComments,
    handleAddFileLineComment,
    handleRemoveComment,
  } = useCommentManager()

  const [prDetail, setPrDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reviewState, setReviewState] = useState('COMMENT') // 리뷰 상태 관리
  const [closingPR, setClosingPR] = useState(false) // PR 닫기 로딩
  const [reopeningPR, setReopeningPR] = useState(false) // PR 재오픈 로딩
  const [selectedPriorityIndex, setSelectedPriorityIndex] = useState(null) // 선택된 우선순위 인덱스
  const [apiMergeable, setApiMergeable] = useState(null) // API 응답에서 받은 mergeable 상태
  const [isMerging, setIsMerging] = useState(false) // 병합 로딩 상태
  const [expandedFiles, setExpandedFiles] = useState([]) // 파일 탭에서 열린 파일들 관리

  const loadingDots = useLoadingDots(loading, loading ? 300 : 0) // 로딩 중일 때만 애니메이션

  // 페이지 이탈 방지 (새로고침, 브라우저 닫기 등)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (reviewComments.length > 0) {
        e.preventDefault()
        e.returnValue = '작성 중인 임시 댓글이 있습니다. 페이지를 나가시겠습니까?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [reviewComments.length])

  // 브라우저 뒤로가기 방지
  useEffect(() => {
    const handlePopState = (event) => {
      if (reviewComments.length > 0) {
        const confirmed = window.confirm('작성 중인 임시 댓글이 있습니다. 페이지를 나가시겠습니까?')
        if (!confirmed) {
          // 현재 페이지로 다시 이동
          window.history.pushState(null, '', window.location.pathname)
          event.preventDefault()
          return
        }
      }
    }

    // 임시 댓글이 있을 때만 이벤트 리스너 추가
    if (reviewComments.length > 0) {
      // 브라우저 히스토리에 현재 상태 추가 (뒤로가기 감지용)
      window.history.pushState(null, '', window.location.pathname)
      window.addEventListener('popstate', handlePopState)
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [reviewComments.length])

  useEffect(() => {
    const load = async () => {
      if (!repoId || !prId) return

      setLoading(true)
      try {
        const pr = await fetchPRDetail({ repoId, prId })
        setPrDetail(pr)
        console.log(pr)
      } catch (err) {
        setPrDetail(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [repoId, prId])

  const handleSubmit = async () => {
    if (!comment.trim() && reviewComments.length === 0) {
      alert('리뷰 내용 또는 라인별 댓글을 작성해주세요.')
      return
    }

    try {
      // 백엔드에서 필요한 속성들만 추출
      const cleanedReviewComments = reviewComments.map((comment) => ({
        path: comment.path,
        body: comment.content || '',
        position: comment.position,
        line: comment.line || comment.lineNumber, // reviewCommentData.line을 우선 사용
        side: comment.side,
        startLine: comment.startLine,
        startSide: comment.startSide,
        fileIndex: comment.fileIndex,
      }))

      const reviewData = {
        reviewRequest: {
          state: reviewState, // 선택된 리뷰 상태 사용
          body: comment.trim(),
          commitSha: prDetail?.commits?.[0]?.sha || '',
          reviewComments: cleanedReviewComments,
        },
        files: files, // 녹음 파일들
      }

      const response = await submitReview({
        accountId: prDetail?.repo.accountId,
        repoId,
        prId,
        reviewData,
      })

      // 상태 초기화 (beforeunload 이벤트 방지)
      setReviewComments([])
      setFiles([])
      setFileComments({})
      setComment('') // 리뷰 텍스트도 초기화
      setShowCommentForm(false) // 제출폼 닫기
      setReviewState('COMMENT') // 리뷰 상태도 초기화

      alert('리뷰가 성공적으로 제출되었습니다!')

      // 리뷰 데이터만 새로 받아오기
      try {
        const updatedReviews = await fetchReviews(prDetail?.repo.accountId, repoId, prId)
        setPrDetail((prev) => ({
          ...prev,
          reviews: updatedReviews,
        }))
      } catch (err) {
        // 실패하면 전체 PR 데이터 다시 불러오기
        try {
          const pr = await fetchPRDetail({ repoId, prId })
          setPrDetail(pr)
        } catch (error) {
          window.location.reload()
        }
      }
    } catch (error) {}
  }

  const handleCancel = () => {
    setComment('')
    setShowCommentForm(false)
    setReviewState('COMMENT') // 리뷰 상태도 초기화
  }

  const handleClosePR = async () => {
    if (!confirm('PR을 닫으시겠습니까?')) return

    setClosingPR(true)
    try {
      await closePR({ repoId, prId })

      // PR 데이터 새로고침
      const pr = await fetchPRDetail({ repoId, prId })
      setPrDetail(pr)
    } catch (error) {
      alert('PR 닫기에 실패했습니다.')
    } finally {
      setClosingPR(false)
    }
  }

  const handleReopenPR = async () => {
    if (!confirm('PR을 다시 여시겠습니까?')) return

    setReopeningPR(true)
    try {
      await reopenPR({ repoId, prId })

      // PR 데이터 새로고침
      const pr = await fetchPRDetail({ repoId, prId })
      setPrDetail(pr)
    } catch (error) {
      alert('PR 재오픈에 실패했습니다.')
    } finally {
      setReopeningPR(false)
    }
  }

  // 병합 관련 함수들
  const handleIsMergable = async () => {
    if (isMerging) return // 이미 진행 중이면 중복 실행 방지
    
    setIsMerging(true)
    try {
      const mergeState = await IsMergable({ repoId, prId })

      // API 응답의 mergeable 값을 저장 (우선순위가 높음)
      setApiMergeable(mergeState.mergeable)

      if (mergeState.mergeable) {
        await handleMerge()
      } else {
        // 충돌 상황 안내
        alert('충돌이 발생했습니다. 충돌을 해결한 후 다시 시도해주세요.')
        // 충돌 해결 페이지로 이동
        navigate(`/${repoId}/pr/${prId}/conflict`)
      }
    } catch (err) {
      console.error('병합 가능성 확인 실패:', err)
      alert('병합 가능성을 확인하는 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsMerging(false)
    }
  }

  const handleMerge = async () => {
    try {
      const data = await doMerge({ repoId, prId })

      // PR 데이터 새로고침
      const pr = await fetchPRDetail({ repoId, prId })
      setPrDetail(pr)

      alert('PR이 성공적으로 병합되었습니다!')
    } catch (err) {
      console.error('병합 실패:', err)
      alert('병합 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  // 댓글 작성/수정/삭제 후 리뷰 데이터만 새로고침하는 함수
  const handleDataRefresh = async () => {
    try {
      const updatedReviews = await fetchReviews(prDetail?.repo.accountId, repoId, prId)
      setPrDetail((prev) => ({
        ...prev,
        reviews: updatedReviews,
      }))
    } catch (err) {
      console.error('리뷰 데이터 새로고침 실패:', err)
      // 실패하면 전체 PR 데이터 다시 불러오기
      try {
        const pr = await fetchPRDetail({ repoId, prId })
        setPrDetail(pr)
      } catch (error) {
        console.error('전체 PR 데이터 새로고침도 실패:', error)
      }
    }
  }

  // 파일 클릭 시 파일 탭으로 이동하고 해당 파일만 열기
  const handleFileClick = (filePath, lineNumber) => {
    setActiveTab('files')
    // 다른 모든 파일 닫고 선택된 파일만 열기
    setExpandedFiles([filePath])
    
    // 특정 라인으로 스크롤하기 위해 약간의 지연 후 실행
    if (lineNumber) {
      setTimeout(() => {
        // 라인 번호에 해당하는 요소 찾기 (CodeDiff 컴포넌트 내부의 라인)
        const lineElement = document.querySelector(`[data-line-number="${lineNumber}"]`)
        if (lineElement) {
          lineElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          // 해당 라인을 하이라이트하기 위해 잠시 클릭 효과 주기
          lineElement.click()
        }
      }, 200) // 파일이 열릴 시간을 기다림
    }
  }

  // 전체 파일 목록
  const allPrFiles =
    prDetail?.files?.map(({ filename, additions, deletions, patch }) => ({
      filename,
      additions,
      deletions,
      patch,
    })) ?? []

  // 선택된 우선순위에 따라 필터링된 파일 목록
  const prFiles =
    selectedPriorityIndex !== null
      ? allPrFiles.filter((file) =>
          prDetail.priorities[selectedPriorityIndex]?.related_files?.includes(file.filename)
        )
      : allPrFiles

  const commits = prDetail?.commits ?? []

  // 리뷰 댓글을 파일별/라인별로 분류
  const existingReviewComments = {}
  if (prDetail?.reviews) {
    prDetail.reviews.forEach((review) => {
      if (review.reviewComments) {
        review.reviewComments.forEach((comment) => {
          const filePath = comment.path
          const lineNumber = comment.line // 실제 라인 번호를 키로 사용

          if (!existingReviewComments[filePath]) {
            existingReviewComments[filePath] = {}
          }
          if (!existingReviewComments[filePath][lineNumber]) {
            existingReviewComments[filePath][lineNumber] = []
          }

          existingReviewComments[filePath][lineNumber].push({
            ...comment,
            reviewState: review.state,
            reviewer: review.githubUsername || 'Unknown', // Review 작성자
            reviewerUserId: review.reviewerId, // 리뷰어 사용자 ID 추가
            submittedAt: review.createdAt,
            reviewId: review.id, // 리뷰 ID 추가
            id: comment.id || Math.random(),
            // ReviewComment 자체의 작성자 정보 추가 (githubUsername만 사용)
            commentAuthor: comment.githubUsername || null,
          })
        })
      }
    })
  }

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="theme-text text-xl">PR 정보를 불러오는 중{loadingDots}</p>
        </div>
      </div>
    )
  }

  // PR 정보가 없을 때 표시
  if (!prDetail) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="theme-text-secondary text-lg">PR 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  // Summary가 있는지 확인하고 표시할 내용 결정
  const getSummaryContent = () => {
    if (prDetail.summary && prDetail.summary.trim()) {
      return prDetail.summary
    }
    return '아직 AI 요약이 생성되지 않았습니다.'
  }

  // 모든 리뷰어가 승인했는지 확인하는 함수
  const isAllReviewersApproved = () => {
    if (!prDetail?.reviewers || prDetail.reviewers.length === 0) {
      return false // 리뷰어가 없으면 승인된 것으로 간주하지 않음
    }
    return prDetail.reviewers.every((reviewer) => reviewer.state === 'APPROVED')
  }

  return (
    <div className="pt-1 pb-2 space-y-3">
      {/* PR 제목과 설명 박스 */}
      <Box shadow className="p-4">
        {/* 레포지토리 정보와 PR 버튼 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm theme-text-secondary">
              <FolderCode className="w-4 h-4" />
              <span className="font-medium">{prDetail.repo?.fullName}</span>
              <Badge variant="default" size="xs" className="font-mono">
                #{prDetail.githubPrNumber}
              </Badge>
            </div>
            <Badge variant="primary">
              <div className="flex items-center space-x-1">
                <GitBranch className="w-4 h-4 mb-[2px]" />
                <span>{prDetail.headBranch?.name || 'unknown'}</span>
                <ArrowRight className="w-4 h-4 text-gray-800" />
                <span>{prDetail.baseBranch?.name || 'unknown'}</span>
              </div>
            </Badge>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            {prDetail.state === 'OPEN' && (
              <>
                {/* 병합 버튼 */}
                {(() => {
                  // API 응답이 있으면 그걸 우선, 없으면 기존 mergeable 사용
                  const effectiveMergeable =
                    apiMergeable !== null ? apiMergeable : prDetail.mergeable
                  const isApproved = isAllReviewersApproved()

                  if (!effectiveMergeable) {
                    // 병합 불가능한 경우 (충돌) - 충돌 해결 버튼
                    return (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => navigate(`/${repoId}/pr/${prId}/conflict`)}
                      >
                        충돌 해결
                      </Button>
                    )
                  } else {
                    // 병합 가능한 경우 - 승인 여부에 따라 활성화/비활성화
                    return (
                      <div className="relative group">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleIsMergable}
                          disabled={!isApproved || isMerging}
                        >
                          {isMerging ? (
                            <>
                              <Settings className="w-4 h-4 mr-1 animate-spin" />
                              병합 중...
                            </>
                          ) : (
                            <>
                              <GitMerge className="w-4 h-4 mr-1" />
                              병합
                            </>
                          )}
                        </Button>
                        {!isApproved && !isMerging && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg border border-gray-200 dark:border-gray-700">
                            모든 리뷰어 승인 필요
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
                          </div>
                        )}
                      </div>
                    )
                  }
                })()}

                {/* PR 닫기 버튼 */}
                <Button
                  variant="danger"
                  size="sm"
                  className="px-4 py-2"
                  onClick={handleClosePR}
                  disabled={closingPR}
                >
                  {closingPR ? 'PR 닫는 중...' : 'PR 닫기'}
                </Button>
              </>
            )}

            {prDetail.state === 'CLOSED' && (
              <Button
                variant="success"
                size="sm"
                className="px-4 py-2"
                onClick={handleReopenPR}
                disabled={reopeningPR}
              >
                {reopeningPR ? 'PR 여는 중...' : 'PR 재오픈'}
              </Button>
            )}
          </div>
        </div>

        {/* PR 제목과 내용 */}
        <div className="space-y-3">
          <h1 className="text-xl md:text-2xl font-bold theme-text leading-tight">
            {prDetail.title}
          </h1>
          {prDetail.author && (
            <div className="flex items-center gap-2 text-sm theme-text-secondary">
              <span>작성자:</span>
              <span className="font-medium bg-orange-50 dark:bg-orange-900 px-2 py-1 rounded text-orange-700 dark:text-orange-300">
                {prDetail.author.githubUsername}
              </span>
            </div>
          )}
          {prDetail.body && prDetail.body.trim() && (
            <div className="rounded-lg border-l-4 border-orange-500 overflow-hidden">
              <MDEditor.Markdown
                source={prDetail.body}
                style={{
                  backgroundColor: 'transparent',
                  padding: '12px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'inherit',
                }}
                className="markdown-content"
              />
            </div>
          )}
        </div>
      </Box>

      <div className="flex gap-3">
        {/* AI 요약 */}
        <div className="flex-1 min-w-0">
          <Box shadow className="p-3 h-60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h4 className="font-medium theme-text">AI 요약</h4>
            </div>
            <div className="min-w-0 flex-1 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto max-h-44">
                <p
                  className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${prDetail.summary?.trim() ? 'theme-text-muted italic' : 'theme-text-secondary'}`}
                >
                  {getSummaryContent()}
                </p>
              </div>
            </div>
          </Box>
        </div>

        {/* 리뷰어 목록 */}
        <div className="w-56 flex-shrink-0">
          <Box shadow className="p-3 h-60">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h3 className="font-medium theme-text">리뷰어</h3>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1">
                {prDetail.reviewers && prDetail.reviewers.length > 0 ? (
                  prDetail.reviewers.map((reviewer) => {
                    const getStatusInfo = (state) => {
                      switch (state) {
                        case 'APPROVED':
                          return {
                            icon: <CheckCircle className="w-4 h-4 text-green-500" />,
                            text: '승인',
                            bgColor: 'bg-green-50 dark:bg-green-900',
                            textColor: 'text-green-700 dark:text-green-300',
                            borderColor: 'border-green-200 dark:border-green-700',
                          }
                        case 'CHANGES_REQUESTED':
                          return {
                            icon: <XCircle className="w-4 h-4 text-red-500" />,
                            text: '변경요청',
                            bgColor: 'bg-red-50 dark:bg-red-900',
                            textColor: 'text-red-700 dark:text-red-300',
                            borderColor: 'border-red-200 dark:border-red-700',
                          }
                        case 'NONE':
                        default:
                          return {
                            icon: <Clock className="w-4 h-4 text-gray-500" />,
                            text: '대기중',
                            bgColor: 'bg-orange-50 dark:bg-orange-900',
                            textColor: 'text-orange-700 dark:text-orange-300',
                            borderColor: 'border-orange-200 dark:border-orange-700',
                          }
                      }
                    }

                    const statusInfo = getStatusInfo(reviewer.state)

                    return (
                      <div
                        key={reviewer.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${statusInfo.bgColor} ${statusInfo.textColor} border ${statusInfo.borderColor}`}
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{reviewer.githubUsername}</span>
                        </div>
                        <div className="flex items-center ml-2 flex-shrink-0">
                          {statusInfo.icon}
                          <span className="ml-1 text-xs font-medium">{statusInfo.text}</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex items-start justify-start h-full text-gray-500 dark:text-gray-400 text-sm italic pt-2">
                    지정된 리뷰어가 없습니다
                  </div>
                )}
              </div>
            </div>
          </Box>
        </div>
      </div>

      {/* 우선순위 별개 섹션 */}
      <Box shadow className="p-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <h3 className="font-medium theme-text">우선순위</h3>
        </div>
        {prDetail.priorities && prDetail.priorities.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto p-2">
            {prDetail.priorities.slice(0, 3).map((priority, index) => {
              const getPriorityIcon = (level) => {
                switch (level?.toLowerCase()) {
                  case 'high':
                  case '높음':
                    return <AlertCircle className="w-4 h-4 text-red-500" />
                  case 'medium':
                  case '보통':
                    return <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  case 'low':
                  case '낮음':
                    return <Info className="w-4 h-4 text-blue-500" />
                  default:
                    return <Info className="w-4 h-4 text-gray-500" />
                }
              }

              const getPriorityBadgeStyle = (level, isSelected) => {
                const baseStyle = isSelected ? 'ring-2 ring-orange-500 dark:ring-orange-400' : ''
                switch (level?.toLowerCase()) {
                  case 'high':
                  case '높음':
                    return `bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-950 cursor-pointer ${baseStyle}`
                  case 'medium':
                  case '보통':
                    return `bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-800 cursor-pointer ${baseStyle}`
                  case 'low':
                  case '낮음':
                    return `bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer ${baseStyle}`
                  default:
                    return `bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${baseStyle}`
                }
              }

              const relatedFilesCount = priority.related_files?.length || 0
              const isSelected = selectedPriorityIndex === index

              return (
                <div key={index} className="flex-shrink-0 w-83.5">
                  <div
                    className={`flex flex-col gap-2 p-3 rounded-lg border transition-all h-48 shadow-sm ${getPriorityBadgeStyle(priority.level, isSelected)}`}
                    onClick={() => setSelectedPriorityIndex(isSelected ? null : index)}
                  >
                    <div className="flex-shrink-0 space-y-2">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(priority.level)}
                        <h4 className="font-medium text-sm">{priority.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            priority.level?.toLowerCase() === 'high' || priority.level === '높음'
                              ? 'danger'
                              : priority.level?.toLowerCase() === 'medium' ||
                                  priority.level === '보통'
                                ? 'warning'
                                : 'default'
                          }
                          size="xs"
                        >
                          {priority.level}
                        </Badge>
                        {relatedFilesCount > 0 && (
                          <Badge variant="sky" size="xs">
                            파일 {relatedFilesCount}개
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <p className="text-xs opacity-80 leading-relaxed">{priority.content}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-start justify-start py-2 text-gray-500 dark:text-gray-400 text-sm italic">
            AI 우선순위가 생성되지 않았습니다
          </div>
        )}
      </Box>

      <Box shadow className="p-3">
        <div className="relative">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-full sm:w-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant=""
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 flex-1 sm:flex-initial justify-center sm:justify-start ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm font-medium'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Button>
                )
              })}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {reviewComments.length > 0 && (
                <Badge variant="warning">임시 댓글 {reviewComments.length}개</Badge>
              )}
              <Button
                variant="primary"
                size="sm"
                className="px-4 py-2"
                onClick={() => setShowCommentForm(!showCommentForm)}
              >
                리뷰 작성
              </Button>
            </div>
          </div>

          {showCommentForm && (
            <div className="absolute top-full right-0 z-50 mt-2 w-120">
              <CommentForm
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                enableAudio={false}
                enableCushion={true}
                reviewState={reviewState}
                onReviewStateChange={setReviewState}
                showReviewState={true}
                disableReviewOptions={prDetail?.author?.id === user?.id}
              />
            </div>
          )}
        </div>

        {activeTab === 'files' && (
          <PRFileList
            files={prFiles}
            onAddComment={handleAddFileLineComment}
            onRemoveComment={handleRemoveComment}
            fileComments={fileComments}
            existingReviewComments={existingReviewComments}
            descriptions={prDetail?.descriptions || []}
            prAuthor={prDetail?.author || {}}
            showDiffHunk={false}
            prId={prId}
            onDataRefresh={handleDataRefresh}
            expandedFiles={expandedFiles}
            setExpandedFiles={setExpandedFiles}
          />
        )}
        {activeTab === 'comments' && <PRCommentList reviews={prDetail?.reviews || []} files={prDetail?.files || []} onFileClick={handleFileClick} onDataRefresh={handleDataRefresh} />}
        {activeTab === 'commits' && <CommitList commits={commits} />}
      </Box>
    </div>
  )
}

export default PRReview
