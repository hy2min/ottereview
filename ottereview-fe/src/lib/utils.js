// 날짜를 "x일 전" 형태로 포맷
export function formatRelativeTime(isoString) {
  const now = new Date()
  const then = new Date(isoString)
  const diff = Math.floor((now - then) / 1000)

  const minute = 60
  const hour = 60 * 60
  const day = 60 * 60 * 24

  if (diff < minute) return `${diff}초 전`
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`
  return `${Math.floor(diff / day)}일 전`
}
