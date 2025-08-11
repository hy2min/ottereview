import { FileText, GitCommit, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import CommentForm from '@/features/comment/CommentForm'
import PRCommentList from '@/features/comment/PRCommentList'
import CommitList from '@/features/pullRequest/CommitList'
import { fetchPRDetail, submitReview, fetchPRReviews } from '@/features/pullRequest/prApi'
import PRFileList from '@/features/pullRequest/PRFileList'
import useLoadingDots from '@/lib/utils/useLoadingDots'
import { useUserStore } from '@/store/userStore'

const PRReview = () => {
  const { repoId, prId } = useParams()
  const user = useUserStore((state) => state.user)

  const tabs = [
    { id: 'files', label: '파일', icon: FileText },
    { id: 'comments', label: '리뷰', icon: MessageCircle },
    { id: 'commits', label: '커밋', icon: GitCommit },
  ]

  const [activeTab, setActiveTab] = useState('files')
  const [comment, setComment] = useState('')
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [reviewComments, setReviewComments] = useState([]) // 라인별 댓글들 보관
  const [files, setFiles] = useState([]) // 녹음 파일들 보관
  const [prReviews, setPrReviews] = useState([]) // 기존 리뷰 목록 (아직 미사용, 저장만)

  const [prDetail, setPrDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadingDots = useLoadingDots(loading)

  useEffect(() => {
    const load = async () => {
      if (!repoId || !prId) return

      setLoading(true)
      try {
        const pr = await fetchPRDetail({ repoId, prId })
        console.log('pr:', pr)
        setPrDetail(pr)

        // 리뷰 목록도 함께 가져오기 (아직 미사용, 저장만)
        try {
          const reviews = await fetchPRReviews({ 
            accountId: pr.repo.accountId, 
            repoId, 
            prId 
          })
          setPrReviews(reviews)
          console.log('reviews:', reviews)
        } catch (reviewErr) {
          console.error('❌ PR 리뷰 목록 로딩 실패:', reviewErr)
        }
      } catch (err) {
        console.error('❌ PR 상세 정보 로딩 실패:', err)
        setPrDetail(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [repoId, prId])

  // 라인별 댓글 추가 함수
  const handleAddLineComment = (commentData) => {
    // 음성 파일이 있는 경우 (fileIndex가 -1인 경우)
    if (commentData.audioFile && commentData.fileIndex === -1) {
      const currentFileIndex = files.length
      setFiles((prev) => [...prev, commentData.audioFile])

      // fileIndex를 실제 인덱스로 업데이트
      const updatedCommentData = {
        ...commentData,
        fileIndex: currentFileIndex,
        audioFile: undefined, // API 요청에서는 audioFile 제거
      }
      setReviewComments((prev) => [...prev, updatedCommentData])
    } else {
      // 텍스트 댓글인 경우 (fileIndex가 null)
      setReviewComments((prev) => [...prev, commentData])
    }
  }

  const handleSubmit = async () => {
    if (!comment.trim() && reviewComments.length === 0) {
      alert('리뷰 내용 또는 라인별 댓글을 작성해주세요.')
      return
    }

    try {
      const reviewData = {
        reviewRequest: {
          state: 'COMMENT',
          body: comment.trim(),
          commitSha: prDetail?.commits?.[0]?.sha || '',
          reviewComments: reviewComments,
        },
        files: files, // 녹음 파일들
      }

      console.log('=== 최종 리뷰 제출 데이터 ===')
      console.log('reviewData:', JSON.stringify(reviewData, null, 2))
      console.log('reviewComments 개수:', reviewComments.length)
      console.log('files 개수:', files.length)
      console.log('===========================')

      const response = await submitReview({
        accountId: prDetail?.repo.accountId,
        repoId,
        prId,
        reviewData,
      })

      console.log('✅ 리뷰 제출 성공!', response)
      alert('리뷰가 성공적으로 제출되었습니다!')

      // 페이지 새로고침으로 리뷰 목록 갱신
      window.location.reload()
    } catch (error) {
      console.error('❌ 리뷰 제출 실패:', error)
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

  // 로딩 중일 때 표시
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <p className="text-stone-600 text-2xl">PR 정보를 불러오는 중{loadingDots}</p>
      </div>
    )
  }

  // PR 정보가 없을 때 표시
  if (!prDetail) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
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
      <Box shadow className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">{prDetail.title}</h1>
        {prDetail.body && prDetail.body.trim() && (
          <div className="text-sm text-gray-600 whitespace-pre-wrap">{prDetail.body}</div>
        )}
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
          <Button
            variant="primary"
            size="sm"
            className="flex ml-auto px-4 py-2"
            onClick={() => setShowCommentForm(!showCommentForm)}
          >
            리뷰 작성
          </Button>

          {showCommentForm && (
            <div className="absolute top-full -mt-6 -right-12 z-10 w-120">
              <CommentForm
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onSubmit={handleSubmit}
                enableAudio={false}
              />
            </div>
          )}
        </div>

        {activeTab === 'files' && (
          <PRFileList files={prFiles} onAddComment={handleAddLineComment} showDiffHunk={false} />
        )}
        {activeTab === 'comments' && <PRCommentList prId={prId} />}
        {activeTab === 'commits' && <CommitList commits={commits} />}
      </Box>
    </div>
  )
}

export default PRReview
