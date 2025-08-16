import '@/styles/Loader.css'

import { useEffect, useMemo, useRef, useState } from 'react'

import f1 from '@/assets/otter_1.png' // 이동 기본 포즈
import f2 from '@/assets/otter_2.png' // 줍는 포즈
import f3 from '@/assets/otter_3.png' // 들고 일어남
import f4 from '@/assets/otter_4.png' // 들고 이동 준비
import f5 from '@/assets/otter_5.png' // 행복(중간 피드백)
import f6 from '@/assets/otter_6.png' // 만세(완료)
// 이미지 임포트
import shellsRow from '@/assets/shells_row.png'

const FRAMES = { walk: f1, pick1: f2, pick2: f3, hold: f4, happy: f5, done: f6 }

export default function LoadingOtter({
  shells = 7,
  cycle = true,
  stepMs = 600,
  pickMs = 450,
  pauseMs = 250,
  background = 'transparent',
  // 프레임 박스 크기(필요시 조절)
  frameWidth = 200,
  frameHeight = 200,
}) {
  const [frame, setFrame] = useState(FRAMES.walk)

  // LTR 고정: 0% → 100%
  const [percentX, setPercentX] = useState(0)
  const cancelled = useRef(false)

  // 정지점: 균등분배 (0 → 100)
  const stops = useMemo(() => {
    if (shells <= 1) return [0]
    return Array.from({ length: shells }, (_, i) => (i / (shells - 1)) * 100)
  }, [shells])

  useEffect(() => {
    cancelled.current = false
    const run = async () => {
      while (!cancelled.current) {
        for (let i = 0; i < stops.length; i++) {
          if (cancelled.current) return

          // 이동
          setFrame(FRAMES.walk)
          setPercentX(stops[i])
          await wait(stepMs)

          // 줍기
          setFrame(FRAMES.pick1)
          await wait(Math.floor(pickMs * 0.55))
          setFrame(FRAMES.pick2)
          await wait(Math.floor(pickMs * 0.45))

          // 들고 일어남
          setFrame(FRAMES.hold)
          await wait(pauseMs)

          if (i !== stops.length - 1) {
            setFrame(FRAMES.happy)
            await wait(160)
          }
        }

        // 완료 포즈
        setFrame(FRAMES.done)
        await wait(700)

        if (!cycle) break

        // 시작점으로 점프
        setFrame(FRAMES.walk)
        setPercentX(0)
        await wait(200)
      }
    }

    run()
    return () => {
      cancelled.current = true
    }
  }, [stops, stepMs, pickMs, pauseMs, cycle])

  // 왼쪽→오른쪽이니까 좌우반전 없음
  const flip = false

  return (
    <div className="otter-loader" style={{ background }} role="status" aria-label="Loading">
      <img className="shells-row" src={shellsRow} alt="" draggable={false} />

      {/* 고정 크기의 프레임 박스: 이미지 높이 들쭉 해결 */}
      <div
        className="otter"
        style={{ left: `${percentX}%`, transitionDuration: `${Math.max(120, stepMs)}ms` }}
      >
        <div
          className="otter-frame"
          style={{ width: `${frameWidth}px`, height: `${frameHeight}px` }}
        >
          <img
            className={`otter-img ${flip ? 'flip-x' : ''}`}
            src={frame}
            alt="otter"
            draggable={false}
          />
        </div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  )
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms))
}
