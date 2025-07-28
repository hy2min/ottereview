import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  GitBranch,
  GitMerge,
  Users,
  MessageCircle,
  Clock,
  TrendingUp,
  Star,
  Award,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button, Card, Badge } from "../../shared/ui";

const Dashboard = ({
  user,
  repositories = [],
  pullRequests = [],
  chatRooms = [],
}) => {
  const [selectedRepository, setSelectedRepository] = useState("all");

  const filteredPRs =
    selectedRepository === "all"
      ? pullRequests
      : pullRequests.filter((pr) => pr.repository?.id === selectedRepository);

  const inProgressPRs = filteredPRs.filter(
    (pr) => pr.status === "open" && !pr.isReadyToMerge
  );
  const readyToMergePRs = filteredPRs.filter((pr) => pr.isReadyToMerge);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl mb-2">
            안녕하세요, {user?.name || "개발자"}님! 👋
          </h1>
          <p className="text-stone-600 font-bmjua">
            오늘도 수달처럼 꼼꼼하게 코드를 리뷰해보세요!
          </p>
        </div>

        <Link to="/pr/create">
          <Button
            variant="primary"
            size="lg"
            className="soft-btn glow-primary pixel-hover"
          >
            <Plus className="w-5 h-5 mr-2" />새 PR 생성하기
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="minecraft-container text-center">
          <div className="text-2xl font-bold text-primary-600 mb-1">
            {inProgressPRs.length}
          </div>
          <div className="text-stone-600 font-bmjua text-sm">진행중인 PR</div>
        </div>
        <div className="minecraft-container text-center">
          <div className="text-2xl font-bold text-success-600 mb-1">
            {readyToMergePRs.length}
          </div>
          <div className="text-stone-600 font-bmjua text-sm">머지 대기</div>
        </div>
        <div className="minecraft-container text-center">
          <div className="text-2xl font-bold text-info-600 mb-1">
            {repositories.length}
          </div>
          <div className="text-stone-600 font-bmjua text-sm">레포지토리</div>
        </div>
        <div className="minecraft-container text-center">
          <div className="text-2xl font-bold text-accent-600 mb-1">
            {chatRooms.length}
          </div>
          <div className="text-stone-600 font-bmjua text-sm">활성 채팅</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* In Progress PRs */}
          <div className="minecraft-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl mb-1">진행중인 PR</h2>
              <select
                value={selectedRepository}
                onChange={(e) => setSelectedRepository(e.target.value)}
                className="soft-input text-sm w-auto"
              >
                <option value="all">전체 레포</option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {inProgressPRs.slice(0, 5).map((pr) => (
                <Link key={pr.id} to={`/pr/${pr.id}`} className="block">
                  <div className="p-4 bg-stone-50 border-2 border-black rounded-lg hover:bg-stone-100 transition-colors pixel-hover">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-stone-900">
                        {pr.title}
                      </h3>
                      <Badge
                        variant={pr.priority === "high" ? "danger" : "info"}
                        size="sm"
                        className="soft-badge"
                      >
                        {pr.priority === "high" ? "높음" : "보통"}
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-600 mb-3 line-clamp-2">
                      {pr.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <div className="flex items-center space-x-4">
                        <span>{pr.author?.name}</span>
                        <span>{pr.repository?.name}</span>
                        <span>{pr.updatedAt}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-3 h-3" />
                        <span>{pr.reviews || 0}/2 승인</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {inProgressPRs.length === 0 && (
                <div className="text-center py-8 text-stone-500">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                  <p className="font-bmjua">진행중인 PR이 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* Repositories */}
          <div className="minecraft-container">
            <h2 className="text-lg mb-1">레포지토리</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repositories.map((repo) => (
                <Link
                  key={repo.id}
                  to={`/pr?repo=${repo.id}`}
                  className="block"
                >
                  <div className="p-4 bg-stone-50 border-2 border-black rounded-lg hover:bg-stone-100 transition-colors pixel-hover">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-500 border-2 border-black rounded-lg flex items-center justify-center">
                        <GitBranch className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-900">
                          {repo.name}
                        </h3>
                        <p className="text-sm text-stone-600">
                          {repo.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-stone-500">
                      <span>{repo.openPRs} 열린 PR</span>
                      <span>{repo.lastUpdated}</span>
                    </div>
                  </div>
                </Link>
              ))}

              {repositories.length === 0 && (
                <div className="text-center py-8 text-stone-500">
                  <div className="w-12 h-12 bg-stone-100 border-2 border-black rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <GitBranch className="w-6 h-6 text-stone-300" />
                  </div>
                  <p className="font-bmjua">연결된 레포지토리가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="minecraft-container">
            <h2 className="text-lg">빠른 작업</h2>
            <div className="space-y-3 mt-4">
              <Link to="/pr/create">
                <Button variant="primary" size="sm" className="soft-btn w-full">
                  <Plus className="w-4 h-4 mr-2" />새 PR 생성
                </Button>
              </Link>
              <Link to="/pr">
                <Button variant="outline" size="sm" className="soft-btn w-full">
                  <GitMerge className="w-4 h-4 mr-2" />
                  PR 목록 보기
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="soft-btn w-full">
                <Users className="w-4 h-4 mr-2" />
                팀원 초대
              </Button>
            </div>
          </div>

          {/* Real-time Chat Rooms */}
          <div className="minecraft-container">
            <h2 className="text-lg">실시간 채팅방</h2>
            <div className="space-y-3 mt-4">
              {chatRooms.slice(0, 3).map((room) => (
                <div
                  key={room.id}
                  className="p-3 bg-stone-50 border-2 border-black rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-stone-900">{room.name}</h3>
                    <span className="text-xs text-stone-500">
                      {room.onlineCount}명
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mb-2">
                    {room.lastMessage}
                  </p>
                  <div className="flex -space-x-1">
                    {room.participants.slice(0, 3).map((participant) => (
                      <div
                        key={participant.id}
                        className="w-6 h-6 bg-stone-300 border-2 border-white rounded-full flex items-center justify-center text-xs font-medium"
                      >
                        {participant.name.charAt(0)}
                      </div>
                    ))}
                    {room.participants.length > 3 && (
                      <span className="text-xs text-stone-500 ml-1">
                        +{room.participants.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {chatRooms.length === 0 && (
                <div className="text-center py-4 text-stone-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                  <p className="font-bmjua text-sm">활성 채팅방이 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* Today's Stats */}
          <div className="minecraft-container">
            <h2 className="text-lg">오늘의 통계</h2>
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">리뷰 완료</span>
                <span className="font-semibold text-stone-900">12건</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">평균 리뷰 시간</span>
                <span className="font-semibold text-stone-900">15분</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">코드 품질 점수</span>
                <span className="font-semibold text-success-600">95점</span>
              </div>
            </div>
          </div>

          {/* Achievement */}
          <div className="minecraft-container bg-gradient-to-br from-accent-100 to-accent-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent-500 border-2 border-black rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">수달 마스터</h3>
                <p className="text-xs text-stone-600 font-bmjua">
                  이번 주 최고 리뷰어!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
