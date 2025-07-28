import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  GitMerge,
  MessageCircle,
  FileText,
  GitCommit,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Link as LinkIcon,
  Download,
  Eye,
  Code,
} from "lucide-react";
import { Button, Card, Badge } from "../../shared/ui";

const PRDetailPage = ({ pullRequests = [] }) => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [comment, setComment] = useState("");

  const pr = pullRequests.find((p) => p.id === parseInt(id)) || {
    id: parseInt(id),
    title: "사용자 인증 시스템 개선",
    description:
      "JWT 토큰 기반 인증 시스템을 구현하고 보안을 강화했습니다. 기존 세션 기반 인증에서 토큰 기반으로 변경하여 확장성을 높였습니다.",
    author: { name: "김개발", username: "kimdev" },
    repository: { name: "auth-service" },
    number: 123,
    status: "open",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-16",
    additions: 245,
    deletions: 89,
    filesChanged: 12,
    comments: 8,
    reviews: 1,
    isUnderReview: true,
    isReadyToMerge: false,
    conflicts: false,
    aiSummary:
      "이 PR은 JWT 토큰 기반 인증 시스템을 구현하여 보안을 강화하고 확장성을 높이는 중요한 변경사항입니다. 기존 세션 기반 인증에서 토큰 기반으로 변경하여 마이크로서비스 아키텍처에 적합한 인증 방식을 제공합니다.",
    reviewers: [
      { id: 1, name: "박리뷰어", status: "approved" },
      { id: 2, name: "이코드", status: "pending" },
      { id: 3, name: "최개발", status: "pending" },
    ],
    voiceMemos: [
      { id: 1, title: "JWT 구현 설명", duration: "2:30" },
      { id: 2, title: "보안 고려사항", duration: "1:45" },
    ],
    textMemos: [
      {
        id: 1,
        title: "토큰 만료 시간 설정",
        content: "access token: 15분, refresh token: 7일로 설정했습니다.",
      },
      {
        id: 2,
        title: "에러 처리",
        content: "토큰 만료 시 자동 갱신 로직을 추가했습니다.",
      },
    ],
    referenceLinks: [
      { id: 1, title: "JWT 공식 문서", url: "https://jwt.io/" },
      { id: 2, title: "보안 가이드라인", url: "https://example.com/security" },
    ],
  };

  const requiredApprovals = 2;
  const currentApprovals = pr.reviews || 0;
  const isReadyToMerge = currentApprovals >= requiredApprovals && !pr.conflicts;
  const canUserMerge =
    pr.author?.id === 1 || pr.reviewers?.some((r) => r.id === 1);

  const tabs = [
    { id: "overview", label: "개요", icon: Eye },
    { id: "files", label: "파일", icon: FileText },
    { id: "comments", label: "댓글", icon: MessageCircle },
    { id: "commits", label: "커밋", icon: GitCommit },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/pr">
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
              {pr.title}
            </h1>
            <p className="text-stone-600 font-bmjua">
              #{pr.number} • {pr.author?.name} • {pr.repository?.name}
            </p>
          </div>
        </div>

        {isReadyToMerge && canUserMerge && (
          <Link to={`/merge/${pr.id}`}>
            <Button
              variant="primary"
              size="lg"
              className="soft-btn glow-primary"
            >
              <GitMerge className="w-4 h-4 mr-2" />
              머지
            </Button>
          </Link>
        )}
      </div>

      {/* PR Stats */}
      <div className="soft-container mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              +{pr.additions}
            </div>
            <div className="text-sm text-stone-600 font-bmjua">추가</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-danger-600">
              -{pr.deletions}
            </div>
            <div className="text-sm text-stone-600 font-bmjua">삭제</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-info-600">
              {pr.filesChanged}
            </div>
            <div className="text-sm text-stone-600 font-bmjua">파일</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-600">
              {pr.comments}
            </div>
            <div className="text-sm text-stone-600 font-bmjua">댓글</div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="soft-container mb-8 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-primary-500 border-2 border-black rounded-lg flex items-center justify-center">
            <Code className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-stone-900">AI 요약</h3>
        </div>
        <p className="text-stone-700 leading-relaxed">{pr.aiSummary}</p>
      </div>

      {/* Tabs */}
      <div className="soft-container mb-8">
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-500 text-white"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Approval Status */}
              <div>
                <h3 className="font-semibold text-stone-900 mb-3">승인 현황</h3>
                <div className="soft-container bg-stone-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-stone-700">
                      승인 진행률
                    </span>
                    <span className="text-sm text-stone-600">
                      {currentApprovals}/{requiredApprovals}
                    </span>
                  </div>
                  <div className="minecraft-progress mb-4">
                    <div
                      className="minecraft-progress-fill"
                      style={{
                        width: `${
                          (currentApprovals / requiredApprovals) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    {pr.reviewers?.map((reviewer) => (
                      <div
                        key={reviewer.id}
                        className="flex items-center justify-between p-3 bg-white border-2 border-black rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-stone-300 border-2 border-black rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {reviewer.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-stone-900">
                            {reviewer.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {reviewer.status === "approved" ? (
                            <Badge
                              variant="success"
                              size="sm"
                              className="soft-badge"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              승인
                            </Badge>
                          ) : reviewer.status === "rejected" ? (
                            <Badge
                              variant="danger"
                              size="sm"
                              className="soft-badge"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              거부
                            </Badge>
                          ) : (
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="soft-btn"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="soft-btn"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Attached Resources */}
              <div>
                <h3 className="font-semibold text-stone-900 mb-3">
                  첨부된 자료
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Voice Memos */}
                  <div className="soft-container">
                    <div className="flex items-center space-x-2 mb-3">
                      <Mic className="w-4 h-4 text-primary-600" />
                      <h4 className="font-medium text-stone-900">음성 메모</h4>
                    </div>
                    <div className="space-y-2">
                      {pr.voiceMemos?.map((memo) => (
                        <div
                          key={memo.id}
                          className="flex items-center justify-between p-2 bg-stone-50 border border-stone-200 rounded-lg"
                        >
                          <span className="text-sm text-stone-700">
                            {memo.title}
                          </span>
                          <span className="text-xs text-stone-500">
                            {memo.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Text Memos */}
                  <div className="soft-container">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-4 h-4 text-secondary-600" />
                      <h4 className="font-medium text-stone-900">
                        텍스트 메모
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {pr.textMemos?.map((memo) => (
                        <div
                          key={memo.id}
                          className="p-2 bg-stone-50 border border-stone-200 rounded-lg"
                        >
                          <div className="font-medium text-sm text-stone-900 mb-1">
                            {memo.title}
                          </div>
                          <div className="text-xs text-stone-600">
                            {memo.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reference Links */}
                  <div className="soft-container">
                    <div className="flex items-center space-x-2 mb-3">
                      <LinkIcon className="w-4 h-4 text-accent-600" />
                      <h4 className="font-medium text-stone-900">참고 링크</h4>
                    </div>
                    <div className="space-y-2">
                      {pr.referenceLinks?.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
                        >
                          <span className="text-sm text-stone-700">
                            {link.title}
                          </span>
                          <Download className="w-3 h-3 text-stone-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-3">
              {[
                {
                  name: "src/auth/jwt.js",
                  additions: 45,
                  deletions: 12,
                  status: "modified",
                },
                {
                  name: "src/middleware/auth.js",
                  additions: 23,
                  deletions: 8,
                  status: "modified",
                },
                {
                  name: "src/utils/token.js",
                  additions: 67,
                  deletions: 0,
                  status: "added",
                },
                {
                  name: "tests/auth.test.js",
                  additions: 89,
                  deletions: 15,
                  status: "modified",
                },
              ].map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-stone-50 border-2 border-black rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-stone-600" />
                    <span className="font-medium text-stone-900">
                      {file.name}
                    </span>
                    <Badge
                      variant={file.status === "added" ? "success" : "info"}
                      size="sm"
                      className="soft-badge"
                    >
                      {file.status === "added" ? "추가" : "수정"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-stone-600">
                    <span className="text-success-600">+{file.additions}</span>
                    <span className="text-danger-600">-{file.deletions}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  author: "박리뷰어",
                  content:
                    "JWT 토큰 만료 시간이 너무 짧은 것 같습니다. 15분은 사용자 경험에 좋지 않을 수 있어요.",
                  time: "2시간 전",
                },
                {
                  id: 2,
                  author: "김개발",
                  content:
                    "좋은 지적입니다. 30분으로 늘리고 refresh token을 활용하는 방식으로 개선하겠습니다.",
                  time: "1시간 전",
                },
              ].map((comment) => (
                <div key={comment.id} className="soft-container">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-stone-300 border-2 border-black rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {comment.author.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-stone-900">
                        {comment.author}
                      </span>
                      <span className="text-sm text-stone-500 ml-2">
                        {comment.time}
                      </span>
                    </div>
                  </div>
                  <p className="text-stone-700">{comment.content}</p>
                </div>
              ))}

              <div className="soft-container">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="soft-input w-full h-24 resize-none"
                />
                <div className="flex justify-end mt-3">
                  <Button variant="primary" className="soft-btn">
                    댓글 작성
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "commits" && (
            <div className="space-y-3">
              {[
                {
                  id: "abc123",
                  message: "JWT 토큰 구현",
                  author: "김개발",
                  time: "2일 전",
                },
                {
                  id: "def456",
                  message: "인증 미들웨어 추가",
                  author: "김개발",
                  time: "2일 전",
                },
                {
                  id: "ghi789",
                  message: "토큰 유틸리티 함수 구현",
                  author: "김개발",
                  time: "3일 전",
                },
              ].map((commit) => (
                <div
                  key={commit.id}
                  className="flex items-center justify-between p-3 bg-stone-50 border-2 border-black rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <GitCommit className="w-4 h-4 text-stone-600" />
                    <div>
                      <div className="font-medium text-stone-900">
                        {commit.message}
                      </div>
                      <div className="text-sm text-stone-500">
                        {commit.author} • {commit.time}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-stone-500 font-mono">
                    {commit.id.substring(0, 7)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PRDetailPage;
