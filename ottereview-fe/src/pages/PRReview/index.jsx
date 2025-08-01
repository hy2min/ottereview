import {
  Code,
  FileText,
  GitCommit,
  GitMerge,
  MessageCircle,
  Mic,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import Box from '../../components/Box'
import Button from '../../components/Button'
import CommentForm from '../../features/comment/CommentForm'
import { useCommentStore } from '../../features/comment/commentStore'
import PRCommentList from '../../features/comment/PRCommentList'
import { fetchPR } from '../../features/pullRequest/prApi'

const PRReview = () => {
  const { prId } = useParams()
  const [files, setFiles] = useState([])
  const [expandedFile, setExpandedFile] = useState(null)
  const [activeTab, setActiveTab] = useState('files')
  const [comment, setComment] = useState('')

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
      const prList = await fetchPR()
      const pr = prList.find((p) => String(p.id) === prId)
      if (!pr || !pr.files) {
        setFiles([])
        return
      }
      const filesArr = Object.entries(pr.files).map(
        ([filename, { additions, deletions, patch }]) => ({
          filename,
          additions,
          deletions,
          patch,
        })
      )
      setFiles(filesArr)
    }
    load()
  }, [prId])

  const toggle = (filename) => setExpandedFile(expandedFile === filename ? null : filename)

  const handleSubmit = async () => {
    if (!comment.trim()) return
    await submitPRComment(prId, {
      author: '김개발',
      content: comment,
    })
    setComment('')
  }

  return (
    <div className="space-y-4 py-4">
      {/* 헤더 영역 */}
      <div className="flex items-start justify-between">
        {/* 오른쪽: 승인 진행률 + 머지 버튼 */}
        <div className="flex items-center gap-4">
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
      {/* AI 요약 */}
      <Box shadow>
        <p className="text-sm">
          JWT 기반 인증 시스템을 구현했습니다. 토큰 생성, 검증, 리프레시 로직이 포함되어 있으며,
          보안성이 크게 향상되었습니다. 프론트엔드와 백엔드 모두 수정이 필요한 규모가 큰
          변경사항입니다.
        </p>
      </Box>

      <Box shadow>
        <div className="flex gap-4 pb-4">
          <Button variant="" size="sm" onClick={() => setActiveTab('files')}>
            파일
          </Button>
          <Button variant="" size="sm" onClick={() => setActiveTab('comments')}>
            댓글
          </Button>
          <Button variant="" size="sm" onClick={() => setActiveTab('commits')}>
            커밋
          </Button>
        </div>

        {activeTab === 'files' && (
          <div>
            <ul className="space-y-2 text-sm">
              {files.map((f) => (
                <li key={f.filename}>
                  <Box
                    shadow
                    className="flex justify-between items-center cursor-pointer p-2 bg-gray-50"
                    onClick={() => toggle(f.filename)}
                  >
                    <span>{f.filename}</span>
                    <div className="space-x-2">
                      <span className="text-green-600">+{f.additions}</span>
                      <span className="text-red-600">-{f.deletions}</span>
                    </div>
                  </Box>
                  {expandedFile === f.filename && (
                    <Box
                      shadow
                      className="whitespace-pre-wrap overflow-auto bg-gray-100 p-2 mt-2 text-xs"
                    >
                      {f.patch}
                    </Box>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            <PRCommentList prId={prId} />
          </div>
        )}

        {activeTab === 'commits' && <div>{/* 커밋 영역 구현 */}</div>}
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
