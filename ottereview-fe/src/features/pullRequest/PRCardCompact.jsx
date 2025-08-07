import { useNavigate } from 'react-router-dom'

import Badge from '../../components/Badge'
import Box from '../../components/Box'

const PRCardCompact = ({ pr }) => {
  const navigate = useNavigate()

  return (
    <Box
      shadow
      pixelHover
      className="m-3 cursor-pointer"
      onClick={() => navigate(`/${pr.repo.id}/pr/${pr.id}/review`)}
    >
      <div className="space-y-1">
        {/* 제목 + 뱃지 영역 */}
        <div className="flex items-center justify-between">
          <p className="font-semibold text-stone-900 line-clamp-1">{pr.title}</p>

          <div className="flex gap-1 flex-wrap">
            {pr.mergeable ? (
              <Badge variant="success">병합 가능</Badge>
            ) : (
              <Badge variant="danger">병합 불가</Badge>
            )}
            {<Badge variant="success">승인 {pr.approveCnt}</Badge>}
            {<Badge variant="warning">리뷰 {pr.reviewCommentCnt}</Badge>}
          </div>
        </div>

        {/* 작성자 / 레포 */}
        <p className="text-sm text-stone-600">
          {pr.author.githubUsername} / {pr.repo.fullName}
        </p>

        {/* 병합 가능, 커밋 수, 변경 파일 수 */}
        <p className="text-sm text-stone-500">
          커밋 수: {pr.commitCnt} · 변경 파일: {pr.changedFilesCnt}
        </p>
      </div>
    </Box>
  )
}

export default PRCardCompact
