import { useNavigate } from 'react-router-dom'

const PRCreateStep1 = ({ goToStep }) => {
  const navigate = useNavigate()
  return (
    <div className="space-y-4">
      <div className="p-4 border">
        <h2 className="text-xl font-bold mb-4">PR 생성 1</h2>

        <div className="space-y-2">
          {/* 컨벤션 선택 드롭다운 1 */}
          <div>
            <label>컨벤션 선택지 1</label>
            <select className="w-full border px-2 py-1">
              <option value="">선택하세요</option>
              <option value="a">옵션 A</option>
              <option value="b">옵션 B</option>
            </select>
          </div>

          {/* 컨벤션 선택 드롭다운 2 */}
          <div>
            <label>컨벤션 선택지 2</label>
            <select className="w-full border px-2 py-1">
              <option value="">선택하세요</option>
              <option value="c">옵션 C</option>
              <option value="d">옵션 D</option>
            </select>
          </div>

          {/* 컨벤션 선택 드롭다운 3 */}
          <div>
            <label>컨벤션 선택지 3</label>
            <select className="w-full border px-2 py-1">
              <option value="">선택하세요</option>
              <option value="e">옵션 E</option>
              <option value="f">옵션 F</option>
            </select>
          </div>

          {/* 컨벤션 체크 버튼 */}
          <div>
            <button className="border px-4 py-1">컨벤션 체크</button>
          </div>
        </div>
      </div>

      {/* 이동 버튼 */}
      <div className="flex justify-between">
        <button className="border px-4 py-1" onClick={() => navigate(-1)}>
          이전
        </button>
        <button className="border px-4 py-1" onClick={() => goToStep(2)}>
          다음
        </button>
      </div>
    </div>
  )
}

export default PRCreateStep1
