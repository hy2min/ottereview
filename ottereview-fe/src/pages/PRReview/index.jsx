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
import { usePRStore } from '@/features/pullRequest/stores/prStore'
import { useUserStore } from '@/store/userStore'

const PRReview = () => {
  const { repoId, prId } = useParams()
  const user = useUserStore((state) => state.user)

  const tabs = [
    { id: 'files', label: '파일', icon: FileText },
    { id: 'comments', label: '댓글', icon: MessageCircle },
    { id: 'commits', label: '커밋', icon: GitCommit },
  ]

  const [activeTab, setActiveTab] = useState('files')
  const [comment, setComment] = useState('')

  const prDetail = usePRStore((state) => state.prDetails[prId])
  const setPRDetail = usePRStore((state) => state.setPRDetail)

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

      try {
        const pr = await fetchPRDetail({ repoId, prId })
        console.log('pr:', pr)
        setPRDetail(prId, pr)
      } catch (err) {
        console.error('❌ PR 상세 정보 로딩 실패:', err)
      }
    }

    load()
  }, [repoId, prId, prDetail, setPRDetail])

  const handleSubmit = async () => {
    if (!comment.trim()) return
    await submitPRComment(prId, {
      author: user.githubUsername,
      content: comment,
    })
    setComment('')
  }

  const files =
    prDetail?.files?.map(({ filename, additions, deletions, patch }) => ({
      filename,
      additions,
      deletions,
      patch,
    })) ?? []

  const commits = prDetail?.commits ?? []

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-start justify-between">
        <div className="flex items-stretch gap-4">
          <Box shadow className="flex">
            <strong className="w-24">AI요약 : </strong>
            <p className="text-sm">
              JWT 기반 인증 시스템을 구현했습니다. 토큰 생성, 검증, 리프레시 로직이 포함되어 있으며,
              보안성이 크게 향상되었습니다. 프론트엔드와 백엔드 모두 수정이 필요한 규모가 큰
              변경사항입니다.
            </p>
          </Box>
          <Box shadow className="w-100">
            <div className="flex justify-between mb-1">
              <p className="text-sm">승인 진행률</p>
              <span className="text-xs text-gray-600">2/2</span>
            </div>
            <div className="minecraft-progress">
              <div className="minecraft-progress-fill" />
            </div>
          </Box>
        </div>
      </div>

      <Box shadow>
        <div className="flex gap-3 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant=""
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 px-4 py-2 rounded-md transition-colors ${
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
        </div>

        {activeTab === 'files' && <PRFileList files={files} />}
        {activeTab === 'comments' && <PRCommentList prId={prId} />}
        {activeTab === 'commits' && <CommitList commits={commits} />}
      </Box>

      <CommentForm
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default PRReview
