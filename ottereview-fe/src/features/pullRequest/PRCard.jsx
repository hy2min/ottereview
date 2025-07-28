const PRCard = ({ pr }) => {
  return (
    <div>
      <div>{pr.id}</div>
      <div>pr title : {pr.title}</div>
      <div>pr author : {pr.author}</div>
    </div>
  )
}

export default PRCard
