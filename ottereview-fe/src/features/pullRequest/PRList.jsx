import { useEffect, useState } from 'react'

import { fetchPR } from './prApi'
import PRCard from './PRCard'

const PRList = () => {
  const [prs, setPrs] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchPR()
      setPrs(data)
    }
    fetchData()
  }, [])

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">📦 PR 목록</h2>
      <div className="space-y-2">
        {prs.map((pr) => (
          <PRCard key={pr.id} pr={pr} />
        ))}
      </div>
    </section>
  )
}

export default PRList
