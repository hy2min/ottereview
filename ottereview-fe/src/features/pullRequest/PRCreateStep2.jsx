import { usePRCreateStore } from './prCreateStore'

const PRCreateStep2 = ({ goToStep }) => {
  const { formData, setFormData } = usePRCreateStore()

  return (
    <div className="space-y-4">
      <div className="p-4 border">
        <h2 className="text-xl font-bold mb-4">PR 생성 2</h2>

        <div className="space-y-2">
          {/* PR 제목 */}
          <div>
            <label>PR 제목</label>
            <input
              className="w-full border px-2 py-1"
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ title: e.target.value })}
            />
          </div>

          {/* PR 설명 */}
          <div>
            <label>PR 설명</label>
            <textarea
              className="w-full border px-2 py-1 resize-none"
              value={formData.description || ''}
              onChange={(e) => setFormData({ description: e.target.value })}
            />
          </div>

          {/* 타겟 브랜치 선택 */}
          <div>
            <label>타겟 브랜치</label>
            <select
              className="w-full border px-2 py-1"
              value={formData.targetBranch || ''}
              onChange={(e) => setFormData({ targetBranch: e.target.value })}
            >
              <option value="">브랜치를 선택하세요</option>
              <option value="main">main</option>
              <option value="develop">develop</option>
            </select>
          </div>
        </div>
      </div>
      {/* 파일별 코드 미리보기 박스 */}
      <div className="bg-white border p-4 mt-4">파일별 코드 미리보기 박스 (mock)</div>

      {/* 이동 버튼 */}
      <div className="flex justify-between mt-4">
        <button className="border px-4 py-1" onClick={() => goToStep(1)}>
          이전
        </button>
        <button className="border px-4 py-1" onClick={() => goToStep(3)}>
          다음
        </button>
      </div>
    </div>
  )
}

export default PRCreateStep2
