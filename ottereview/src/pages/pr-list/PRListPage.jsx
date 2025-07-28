import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Clock,
  Eye,
  GitMerge,
  GitBranch,
  Users,
  MessageCircle,
} from "lucide-react";
import { Button, Card, Badge } from "../../shared/ui";

const PRListPage = ({ repository, pullRequests = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPRs = pullRequests.filter((pr) => {
    const matchesFilter =
      selectedFilter === "all" || pr.status === selectedFilter;
    const matchesSearch =
      pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // 승인 조건 확인
  const requiredApprovals = 2; // 필요한 승인 수

  const getStatusBadge = (pr) => {
    if (pr.conflicts) {
      return (
        <Badge variant="danger" size="sm" className="soft-badge">
          충돌
        </Badge>
      );
    }

    const currentApprovals = pr.reviews || 0;
    const isReadyToMerge =
      currentApprovals >= requiredApprovals && !pr.conflicts;

    if (isReadyToMerge) {
      return (
        <Badge variant="success" size="sm" className="soft-badge">
          머지대기
        </Badge>
      );
    }
    if (pr.isUnderReview) {
      return (
        <Badge variant="warning" size="sm" className="soft-badge">
          리뷰중
        </Badge>
      );
    }
    return (
      <Badge variant="info" size="sm" className="soft-badge">
        승인대기
      </Badge>
    );
  };

  const getApprovalStatus = (pr) => {
    const currentApprovals = pr.reviews || 0;
    const isReadyToMerge =
      currentApprovals >= requiredApprovals && !pr.conflicts;

    if (isReadyToMerge) {
      return "승인 완료";
    }
    return `${currentApprovals}/${requiredApprovals} 승인`;
  };

  const isReadyToMerge = (pr) => {
    const currentApprovals = pr.reviews || 0;
    return currentApprovals >= requiredApprovals && !pr.conflicts;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="soft-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl mb-1">
              <div className="flex items-center">
                <span
                  className="pixel-logo text-2xl"
                  style={{ display: "none" }}
                >
                  OtteReview
                </span>
              </div>
              {repository ? `${repository.name} PR 목록` : "전체 PR 목록"}
            </h1>
            <p className="text-stone-600 font-bmjua">
              {filteredPRs.length}개의 Pull Request
            </p>
          </div>
        </div>
        <Link to="/pr/create">
          <Button
            variant="primary"
            size="lg"
            className="soft-btn pixel-hover glow-primary"
          >
            <Plus className="w-4 h-4 mr-2" />새 PR 생성하기
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="soft-container mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-stone-600" />
              <span className="text-sm font-medium text-stone-700">필터:</span>
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="soft-input text-sm w-auto"
            >
              <option value="all">전체</option>
              <option value="open">열린 PR</option>
              <option value="closed">닫힌 PR</option>
              <option value="merged">머지된 PR</option>
            </select>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="PR 제목 또는 설명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="soft-input pl-10"
            />
          </div>
        </div>
      </div>

      {/* PR List */}
      <div className="space-y-4">
        {filteredPRs.map((pr) => (
          <div key={pr.id} className="soft-card pixel-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500 border-2 border-black rounded-lg flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">
                    {pr.title}
                  </h3>
                  <p className="text-sm text-stone-600 line-clamp-2">
                    {pr.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(pr)}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-stone-500">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{pr.author?.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{pr.updatedAt}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{pr.comments || 0} 댓글</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-stone-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {getApprovalStatus(pr)}
                </span>
                <Link to={`/pr/${pr.id}`}>
                  <Button variant="outline" size="sm" className="soft-btn">
                    <Eye className="w-4 h-4 mr-1" />
                    리뷰하기
                  </Button>
                </Link>
                {isReadyToMerge(pr) && (
                  <Link to={`/merge/${pr.id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      className="soft-btn glow-primary"
                    >
                      <GitMerge className="w-4 h-4 mr-1" />
                      머지
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center space-x-4">
                <span>#{pr.number}</span>
                <span>{pr.repository?.name}</span>
                <span>
                  +{pr.additions} -{pr.deletions}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {pr.reviewers?.slice(0, 3).map((reviewer) => (
                  <div
                    key={reviewer.id}
                    className="w-6 h-6 bg-stone-300 border-2 border-white rounded-full flex items-center justify-center text-xs font-medium"
                  >
                    {reviewer.name.charAt(0)}
                  </div>
                ))}
                {pr.reviewers && pr.reviewers.length > 3 && (
                  <span className="text-xs">+{pr.reviewers.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredPRs.length === 0 && (
          <div className="soft-container text-center py-12">
            <div className="w-16 h-16 bg-stone-100 border-2 border-black rounded-full mx-auto mb-4 flex items-center justify-center">
              <GitBranch className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">
              PR이 없습니다
            </h3>
            <p className="text-stone-600 mb-4 font-bmjua">
              {searchTerm
                ? "검색 결과가 없습니다."
                : "아직 생성된 Pull Request가 없습니다."}
            </p>
            <Link to="/pr/create">
              <Button variant="primary" className="soft-btn">
                <Plus className="w-4 h-4 mr-2" />첫 번째 PR 생성하기
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PRListPage;
