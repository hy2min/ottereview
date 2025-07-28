const RepositoryCard = ({ repo }) => {
  return (
    <div>
      <div>{repo.id}</div>
      <div>repo name : {repo.name}</div>
      <div>repo fullname : {repo.full_name}</div>
    </div>
  )
}

export default RepositoryCard
