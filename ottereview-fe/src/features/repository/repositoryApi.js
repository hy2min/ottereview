export const fetchRepo = async () => {
  return [
    { id: 1, name: 'ottereview-fe', full_name: 'heejoo/ottereview-fe', canCreatePR: true },
    { id: 2, name: 'ottereview-be', full_name: 'heejoo/ottereview-be', canCreatePR: false },
    { id: 3, name: 'ottereview-ai', full_name: 'heejoo/ottereview-ai', canCreatePR: true },
  ]
}
