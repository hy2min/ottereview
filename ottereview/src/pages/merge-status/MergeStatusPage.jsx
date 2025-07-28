import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  GitMerge,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button, Badge } from "../../shared/ui";

const MergeStatusPage = ({ pullRequests = [] }) => {
  const { id } = useParams();
  const [mergeState, setMergeState] = useState("merging");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);

  const pr = pullRequests.find((p) => p.id === parseInt(id)) || {
    id: parseInt(id),
    title: "사용자 인증 시스템 개선",
    author: { name: "김개발" },
    repository: { name: "auth-service" },
    number: 123,
  };

  useEffect(() => {
    // 머지 진행 상태 시뮬레이션
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setMergeState("completed");
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });

      // 로그 추가
      setLogs((prev) => {
        const newLogs = [...prev];
        if (progress < 30) {
          newLogs.push({
            id: Date.now(),
            message: "브랜치 충돌 검사 중...",
            type: "info",
          });
        } else if (progress < 60) {
          newLogs.push({
            id: Date.now(),
            message: "테스트 실행 중...",
            type: "info",
          });
        } else if (progress < 90) {
          newLogs.push({
            id: Date.now(),
            message: "코드 머지 중...",
            type: "info",
          });
        } else if (progress >= 100) {
          newLogs.push({
            id: Date.now(),
            message: "머지 완료!",
            type: "success",
          });
        }
        return newLogs.slice(-5); // 최근 5개만 유지
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [progress]);

  const getStateTitle = () => {
    switch (mergeState) {
      case "merging":
        return "머지 진행 중";
      case "completed":
        return "머지 완료";
      case "failed":
        return "머지 실패";
      default:
        return "머지 상태";
    }
  };

  const getStateIcon = () => {
    switch (mergeState) {
      case "merging":
        return <Loader2 className="w-6 h-6 animate-spin text-primary-600" />;
      case "completed":
        return <CheckCircle className="w-6 h-6 text-success-600" />;
      case "failed":
        return <XCircle className="w-6 h-6 text-danger-600" />;
      default:
        return <Clock className="w-6 h-6 text-stone-600" />;
    }
  };

  const getStateBadge = () => {
    switch (mergeState) {
      case "merging":
        return (
          <Badge variant="warning" size="sm" className="soft-badge">
            진행중
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success" size="sm" className="soft-badge">
            완료
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="danger" size="sm" className="soft-badge">
            실패
          </Badge>
        );
      default:
        return (
          <Badge variant="info" size="sm" className="soft-badge">
            대기
          </Badge>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
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
              머지 상태
            </h1>
            <p className="text-stone-600 font-bmjua">
              #{pr.number} • {pr.title}
            </p>
          </div>
        </div>
        {getStateBadge()}
      </div>

      {/* Merge Status Card */}
      <div className="soft-container mb-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            {getStateIcon()}
          </div>
          <h2 className="text-xl mb-2">
            <div className="flex items-center justify-center">
              <span className="pixel-logo text-xl" style={{ display: "none" }}>
                OtteReview
              </span>
            </div>
            {getStateTitle()}
          </h2>
          <p className="text-stone-600 font-bmjua">
            {mergeState === "merging" &&
              "머지가 진행 중입니다. 잠시만 기다려주세요."}
            {mergeState === "completed" && "머지가 성공적으로 완료되었습니다!"}
            {mergeState === "failed" && "머지 중 오류가 발생했습니다."}
          </p>
        </div>

        {/* Progress Bar */}
        {mergeState === "merging" && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-stone-700">진행률</span>
              <span className="text-sm text-stone-600">{progress}%</span>
            </div>
            <div className="minecraft-progress">
              <div
                className="minecraft-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* PR Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-stone-50 border-2 border-black rounded-lg">
            <div className="text-lg font-bold text-stone-900">
              {pr.author?.name}
            </div>
            <div className="text-sm text-stone-600 font-bmjua">작성자</div>
          </div>
          <div className="text-center p-4 bg-stone-50 border-2 border-black rounded-lg">
            <div className="text-lg font-bold text-stone-900">
              {pr.repository?.name}
            </div>
            <div className="text-sm text-stone-600 font-bmjua">레포지토리</div>
          </div>
          <div className="text-center p-4 bg-stone-50 border-2 border-black rounded-lg">
            <div className="text-lg font-bold text-stone-900">#{pr.number}</div>
            <div className="text-sm text-stone-600 font-bmjua">PR 번호</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {mergeState === "completed" && (
            <>
              <Link to="/pr">
                <Button variant="primary" className="soft-btn glow-primary">
                  <GitMerge className="w-4 h-4 mr-2" />
                  PR 목록으로
                </Button>
              </Link>
              <Button variant="outline" className="soft-btn">
                <CheckCircle className="w-4 h-4 mr-2" />
                완료 확인
              </Button>
            </>
          )}
          {mergeState === "failed" && (
            <>
              <Link to={`/pr/${pr.id}`}>
                <Button variant="primary" className="soft-btn glow-primary">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  PR 상세보기
                </Button>
              </Link>
              <Button variant="outline" className="soft-btn">
                <GitMerge className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="soft-container">
        <h3 className="font-semibold text-stone-900 mb-4">머지 로그</h3>
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center space-x-3 p-3 bg-stone-50 border-2 border-black rounded-lg"
            >
              <div className="w-2 h-2 rounded-full bg-stone-400"></div>
              <span className="text-sm text-stone-700 font-bmjua">
                {log.message}
              </span>
              <span className="text-xs text-stone-500">
                {new Date(log.id).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-8 text-stone-500">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="font-bmjua">로그가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MergeStatusPage;
