import { FileText, GitCommit, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import Box from '@/components/Box'
import Button from '@/components/Button'
import CommentForm from '@/features/comment/CommentForm'
import { useCommentStore } from '@/features/comment/commentStore'
import PRCommentList from '@/features/comment/PRCommentList'
import CommitList from '@/features/pullRequest/CommitList'
import { fetchPRDetail } from '@/features/pullRequest/prApi'
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

  const [prDetail, setPrDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadingDots = useLoadingDots(loading)

  const loadPRComments = useCommentStore((state) => state.loadPRComments)
  const submitPRComment = useCommentStore((state) => state.submitPRComment)

  useEffect(() => {
    const existing = useCommentStore.getState().prComments[prId]
    if (!existing || existing.length === 0) {
      loadPRComments(prId)
    }
  }, [prId, loadPRComments])

  useEffect(() => {
    const load = async () => {
      if (!repoId || !prId) return

      setLoading(true)
      try {
        const pr = await fetchPRDetail({ repoId, prId })
        console.log('pr:', pr)
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
    if (!comment.trim()) return
    await submitPRComment(prId, {
      author: user.githubUsername,
      content: comment,
    })
    setComment('')
    setShowCommentForm(false)
  }

  const files =
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

  return (
    <div className="pt-2 space-y-3">
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <Box shadow className="min-h-24 flex-row space-y-1 flex items-center">
          <strong className="w-24">AI요약 : </strong>
          <p className="text-sm">{prDetail.summary}</p>
        </Box>

        <Box shadow className="min-h-24 flex items-center px-4 w-full md:max-w-sm space-y-0">
          <div className="w-full space-y-1">
            <div className="flex justify-between">
              <p className="text-sm">승인 진행률</p>
              <span className="text-xs text-gray-600">2/2</span>
            </div>
            <div className="minecraft-progress">
              <div className="minecraft-progress-fill" />
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
            <div className="absolute top-full -mt-2 right-0 z-10 w-100">
              <CommentForm
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onSubmit={handleSubmit}
              />
            </div>
          )}
        </div>

        {activeTab === 'files' && <PRFileList files={files} />}
        {activeTab === 'comments' && <PRCommentList prId={prId} />}
        {activeTab === 'commits' && <CommitList commits={commits} />}
      </Box>
    </div>
  )
}

export default PRReview
