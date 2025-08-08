import { useNavigate } from 'react-router-dom'

import Badge from '../../components/Badge'
import Box from '../../components/Box'

const PRCardCompact = ({ pr, type }) => {
  const navigate = useNavigate()

  return (
    <Box
      shadow
      pixelHover
      className="m-3 cursor-pointer"
      onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/review`)}
    >
      <div className="flex justify-between overflow-hidden items-center space-x-2">
        <p className="font-semibold text-stone-900 truncate min-w-0">{pr.title}</p>
        {type === 'authored' && (
          <Badge variant="purple" className="shrink-0">
            내 PR
          </Badge>
        )}
        {type === 'reviewed' && (
          <Badge variant="cyan" className="shrink-0">
            리뷰 요청됨
          </Badge>
        )}
      </div>
      <div className="flex jusfify-between space-x-4">
        <p className="text-sm text-stone-600">{pr.repo.fullName}</p>
        <p className="text-sm text-stone-600">작성자 : {pr.author.githubUsername}</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          커밋 수: {pr.commitCnt} · 변경 파일: {pr.changedFilesCnt}
        </p>

        <div className="flex gap-1 flex-wrap">
          {pr.mergeable ? (
            <Badge variant="primary">병합 가능</Badge>
          ) : (
            <Badge variant="danger">병합 불가</Badge>
          )}
          {<Badge variant="emerald">승인 {pr.approveCnt}</Badge>}
          {<Badge variant="amber">리뷰 {pr.reviewCommentCnt}</Badge>}
        </div>
      </div>
    </Box>
  )
}

export default PRCardCompact
