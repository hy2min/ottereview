const RepositoryCard = ({ repo, onClick }) => {
  return (
    <div onClick={onClick} className="border p-4 space-y-1 cursor-pointer hover:bg-gray-100">
      <div>
        <strong>ID:</strong> {repo.id}
      </div>
      <div>
        <strong>이름:</strong> {repo.name}
      </div>
      <div>
        <strong>전체 이름:</strong> {repo.full_name}
      </div>
    </div>
  )
}

export default RepositoryCard
