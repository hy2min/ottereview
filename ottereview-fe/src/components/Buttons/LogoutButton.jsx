import { useUserStore } from '../../store/userStore'

const LogoutButton = () => {
  const logout = useUserStore((state) => state.logout)

  return (
    <button onClick={logout} className="text-sm border px-4 py-1 hover:bg-gray-100">
      로그아웃
    </button>
  )
}

export default LogoutButton
