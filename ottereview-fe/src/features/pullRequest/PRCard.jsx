const PRCard = ({ pr }) => {
  return (
    <div className="border p-4 space-y-1">
      <div>
        <strong>ID:</strong> {pr.id}
      </div>
      <div>
        <strong>PR 제목:</strong> {pr.title}
      </div>
      <div>
        <strong>작성자:</strong> {pr.author}
      </div>
    </div>
  )
}

export default PRCard
