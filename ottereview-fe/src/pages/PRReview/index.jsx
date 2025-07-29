const PRReview = () => {
  return (
    <div className="space-y-4 py-4">
      {/* 헤더 영역 */}
      <div className="flex items-start justify-between">
        {/* 오른쪽: 승인 진행률 + 머지 버튼 */}
        <div className="flex items-center gap-4">
          <div className="w-40 border p-2">
            <div className="flex justify-between mb-1">
              <p className="text-sm">승인 진행률</p>
              <span className="text-xs text-gray-600">2/2</span>
            </div>
            <div className="w-full h-4 bg-gray-200">
              <div className="h-full bg-green-500" style={{ width: '100%' }} />
            </div>
          </div>
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

      <div className="border">
        {/* 탭 영역 */}

        <div className="flex gap-4 pb-2 m-4">
          <button className="border px-3 py-1">파일</button>
          <button className="border px-3 py-1">댓글</button>
          <button className="border px-3 py-1">커밋</button>
        </div>

        {/* 파일 영역 */}
        <div className="border p-4 m-4">
          <p className="text-sm mb-2 ">변경된 파일 목록</p>
          <ul className="list-disc list-inside text-sm">
            <li>auth.js</li>
            <li>jwtUtils.js</li>
            <li>LoginForm.jsx</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default PRReview
