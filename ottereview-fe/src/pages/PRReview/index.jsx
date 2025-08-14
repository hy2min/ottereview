import { FileText, FolderCode, GitCommit, MessageCircle, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import Badge from '@/components/Badge'
import Box from '@/components/Box'
import Button from '@/components/Button'
import CommentForm from '@/features/comment/CommentForm'
import PRCommentList from '@/features/comment/PRCommentList'
import CommitList from '@/features/pullRequest/CommitList'
import { closePR, fetchPRDetail, reopenPR, submitReview, updatePRDescription, deletePRDescription } from '@/features/pullRequest/prApi'
import PRFileList from '@/features/pullRequest/PRFileList'
import { useCommentManager } from '@/hooks/useCommentManager'
import useLoadingDots from '@/lib/utils/useLoadingDots'

const PRReview = () => {
  const { repoId, prId } = useParams()

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
  } = useCommentManager()

  const [prDetail, setPrDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reviewState, setReviewState] = useState('COMMENT') // 리뷰 상태 관리
  const [closingPR, setClosingPR] = useState(false) // PR 닫기 로딩
  const [reopeningPR, setReopeningPR] = useState(false) // PR 재오픈 로딩

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
        console.log('pr', pr)
        setPrDetail(pr)
      } catch (err) {
        console.error('❌ PR 상세 정보 로딩 실패:', err)
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

      console.log('=== 리뷰 제출 데이터 ===', JSON.stringify(reviewData, null, 2))

      const response = await submitReview({
        accountId: prDetail?.repo.accountId,
        repoId,
        prId,
        reviewData,
      })

      console.log('=== 리뷰 제출 응답 ===', response)

      // 상태 초기화 (beforeunload 이벤트 방지)
      setReviewComments([])
      setFiles([])
      setFileComments({})
      setComment('') // 리뷰 텍스트도 초기화
      setShowCommentForm(false) // 제출폼 닫기
      setReviewState('COMMENT') // 리뷰 상태도 초기화

      alert('리뷰가 성공적으로 제출되었습니다!')

      // 새로고침 대신 PR 데이터만 다시 불러오기
      try {
        const pr = await fetchPRDetail({ repoId, prId })
        setPrDetail(pr)
      } catch (err) {
        console.error('PR 데이터 새로고침 실패:', err)
        // 실패하면 페이지 새로고침
        window.location.reload()
      }
    } catch (error) {
      console.error('❌ 리뷰 제출 실패:', error)
    }
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
      console.error('❌ PR 닫기 실패:', error)
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
      console.error('❌ PR 재오픈 실패:', error)
      alert('PR 재오픈에 실패했습니다.')
    } finally {
      setReopeningPR(false)
    }
  }

  // Description 수정 핸들러
  const handleDescriptionUpdate = async (descriptionId, data) => {
    try {
      await updatePRDescription(prId, descriptionId, data)
      
      // PR 데이터 새로고침하여 수정된 description 반영
      const pr = await fetchPRDetail({ repoId, prId })
      setPrDetail(pr)
    } catch (error) {
      console.error('❌ Description 수정 실패:', error)
      throw error // CodeDiff에서 에러 처리하도록
    }
  }

  // Description 삭제 핸들러
  const handleDescriptionDelete = async (descriptionId) => {
    try {
      await deletePRDescription(prId, descriptionId)
      
      // PR 데이터 새로고침하여 삭제된 description 반영
      const pr = await fetchPRDetail({ repoId, prId })
      setPrDetail(pr)
    } catch (error) {
      console.error('❌ Description 삭제 실패:', error)
      throw error // CodeDiff에서 에러 처리하도록
    }
  }

  const prFiles =
    prDetail?.files?.map(({ filename, additions, deletions, patch }) => ({
      filename,
      additions,
      deletions,
      patch,
    })) ?? []

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
            reviewer: review.githubUsername || 'Unknown',
            submittedAt: review.createdAt,
            id: `${review.id}-${comment.id || Math.random()}`,
          })
        })
      }
    })
  }

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-600 text-2xl">PR 정보를 불러오는 중{loadingDots}</p>
      </div>
    )
  }

  // PR 정보가 없을 때 표시
  if (!prDetail) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-600 text-lg">PR 정보를 찾을 수 없습니다.</p>
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

  return (
    <div className="pt-2 space-y-3">
      {/* PR 제목과 설명 박스 */}
      <Box shadow className="flex justify-between">
        {/* 레포지토리 정보 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-1 text-sm text-stone-600">
            <FolderCode className="w-4 h-4 mb-[2px]" />
            <span className="font-medium">{prDetail.repo?.fullName}</span>
            <span>#{prDetail.githubPrNumber}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{prDetail.title}</h1>
          {prDetail.author && (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <span>작성자:</span>
              <span className="font-medium">@{prDetail.author.githubUsername}</span>
            </div>
          )}
          {prDetail.body && prDetail.body.trim() && (
            <div className="text-sm text-gray-600 whitespace-pre-wrap">{prDetail.body}</div>
          )}
        </div>
        {/* PR 상태별 버튼 */}
        <div>
          {prDetail.state === 'OPEN' ? (
            <Button 
              variant="danger" 
              size="sm" 
              className="flex px-4 py-2" 
              onClick={handleClosePR}
              disabled={closingPR}
            >
              {closingPR ? 'PR 닫는 중...' : 'PR 닫기'}
            </Button>
          ) : prDetail.state === 'CLOSED' ? (
            <Button 
              variant="success" 
              size="sm" 
              className="flex px-4 py-2" 
              onClick={handleReopenPR}
              disabled={reopeningPR}
            >
              {reopeningPR ? 'PR 여는 중...' : 'PR 재오픈'}
            </Button>
          ) : null}
        </div>
      </Box>

      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <Box shadow className="min-h-24 flex-row space-y-1 flex items-center">
          <strong className="mr-2">AI요약 : </strong>
          <p className={`text-sm ${!prDetail.summary?.trim() ? 'text-stone-400 italic' : ''}`}>
            {getSummaryContent()}
          </p>
        </Box>

        <Box shadow className="min-h-24 flex items-center px-4 w-full md:max-w-sm space-y-0">
          <div className="w-full space-y-1">
            <div className="flex justify-between">
              <p className="text-sm">승인 진행률</p>
              {prDetail.headBranch?.minApproveCnt === 0 ? (
                <span className="text-sm text-green-600 font-medium">승인 불필요</span>
              ) : (
                <span className="text-sm text-gray-600">
                  {prDetail.approveCnt || 0}/{prDetail.headBranch?.minApproveCnt || 0}
                </span>
              )}
            </div>
            <div className="minecraft-progress">
              {prDetail.headBranch?.minApproveCnt === 0 ? (
                <div className="minecraft-progress-fill w-full bg-green-500" />
              ) : (
                <div
                  className="minecraft-progress-fill"
                  style={{
                    width: `${
                      prDetail.headBranch?.minApproveCnt
                        ? Math.min(
                            ((prDetail.approveCnt || 0) / prDetail.headBranch.minApproveCnt) * 100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              )}
            </div>
          </div>
        </Box>
      </div>

      {/* 리뷰어 목록 */}
      {prDetail.reviewers && prDetail.reviewers.length > 0 && (
        <Box shadow className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-700">리뷰어</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {prDetail.reviewers.map((reviewer) => (
              <div
                key={reviewer.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                <span>@{reviewer.githubUsername}</span>
              </div>
            ))}
          </div>
        </Box>
      )}

      <Box shadow>
        <div className="relative flex gap-3 pb-4 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant=""
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 px-4 py-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4 mb-[2px]" />
                <span>{tab.label}</span>
              </Button>
            )
          })}
          <div className="flex items-center gap-2 ml-auto">
            {reviewComments.length > 0 && (
              <Badge variant="warning">임시 댓글 {reviewComments.length}개</Badge>
            )}

            <Button
              variant="primary"
              size="sm"
              className="flex px-4 py-2"
              onClick={() => setShowCommentForm(!showCommentForm)}
            >
              리뷰 작성
            </Button>
          </div>

          {showCommentForm && (
            <div className="absolute top-full -mt-6 -right-12 z-10 w-120">
              <CommentForm
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                enableAudio={false}
                reviewState={reviewState}
                onReviewStateChange={setReviewState}
                showReviewState={true}
              />
            </div>
          )}
        </div>

        {activeTab === 'files' && (
          <PRFileList
            files={prFiles}
            onAddComment={handleAddFileLineComment}
            fileComments={fileComments}
            existingReviewComments={existingReviewComments}
            descriptions={prDetail?.descriptions || []}
            prAuthor={prDetail?.author || {}}
            showDiffHunk={false}
            prId={prId}
            onDescriptionUpdate={handleDescriptionUpdate}
            onDescriptionDelete={handleDescriptionDelete}
          />
        )}
        {activeTab === 'comments' && <PRCommentList reviews={prDetail?.reviews || []} />}
        {activeTab === 'commits' && <CommitList commits={commits} />}
      </Box>
    </div>
  )
}

export default PRReview
