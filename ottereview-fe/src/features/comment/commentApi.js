const dummyComments = {
  101: [
    {
      id: 1,
      author: '박리뷰어',
      content: 'JWT 토큰 만료 시간이 너무 짧은 것 같습니다.',
      time: '2시간 전',
    },
    {
      id: 2,
      author: '김개발',
      content: '30분으로 늘리는 방향으로 개선하겠습니다.',
      time: '1시간 전',
    },
  ],
  102: [],
}

export const fetchComments = async (prId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dummyComments[prId] || [])
    }, 300)
  })
}

export const postComment = async (prId, comment) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...comment, id: Date.now(), time: '방금 전' })
    }, 200)
  })
}
