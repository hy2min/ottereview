import { useNavigate } from 'react-router-dom'

const PRReview = () => {
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 영역 */}
      <div className="flex items-start justify-between">
        {/* 왼쪽: 뒤로가기 + 제목 */}
        <div className="flex items-center gap-4">
          <button className="border px-4 py-1" onClick={() => navigate(-1)}>
            ← 뒤로가기
          </button>
          <h1 className="text-2xl font-bold">사용자 인증 시스템 구현</h1>
        </div>

        {/* 오른쪽: 승인 진행률 + 머지 버튼 */}
        <div className="flex items-center gap-4">
          <div className="w-40 border p-2">
            <div className="flex justify-between mb-1">
              <p className="text-sm font-semibold">승인 진행률</p>
              <span className="text-xs text-gray-600">2/2</span>
            </div>
            <div className="w-full h-4 bg-gray-200">
              <div className="h-full bg-green-500" style={{ width: '100%' }} />
            </div>
          </div>

          <button className="border px-4 py-2">머지</button>
        </div>
      </div>

      {/* AI 요약 */}
      <div className="border p-4">
        <p className="text-sm">
          JWT 기반 인증 시스템을 구현했습니다. 토큰 생성, 검증, 리프레시 로직이 포함되어 있으며,
          보안성이 크게 향상되었습니다. 프론트엔드와 백엔드 모두 수정이 필요한 규모가 큰
          변경사항입니다.
        </p>
      </div>

      {/* 탭 영역 */}
      <div className="flex gap-4 pb-2 border-b">
        <button className="border px-3 py-1">파일</button>
        <button className="border px-3 py-1">댓글</button>
        <button className="border px-3 py-1">커밋</button>
      </div>

      {/* 파일 영역 */}
      <div className="border p-4">
        <p className="text-sm font-semibold mb-2">변경된 파일 목록</p>
        <ul className="list-disc list-inside text-sm">
          <li>auth.js</li>
          <li>jwtUtils.js</li>
          <li>LoginForm.jsx</li>
        </ul>
      </div>
    </div>
  )
}

export default PRReview
