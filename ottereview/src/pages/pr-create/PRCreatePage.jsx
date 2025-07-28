import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  X,
  Mic,
  FileText,
  Link as LinkIcon,
  GitBranch,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button, Card, Badge } from "../../shared/ui";

const PRCreatePage = ({ repositories = [] }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    repository: "",
    priority: "medium",
    sourceBranch: "",
    targetBranch: "main",
    reviewers: [],
  });

  const [voiceMemos, setVoiceMemos] = useState([]);
  const [textMemos, setTextMemos] = useState([]);
  const [referenceLinks, setReferenceLinks] = useState([]);

  const availableReviewers = [
    { id: 1, name: "박리뷰어", username: "parkreview" },
    { id: 2, name: "이코드", username: "leecode" },
    { id: 3, name: "최개발", username: "choidev" },
    { id: 4, name: "정테스트", username: "jungtest" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReviewerToggle = (reviewerId) => {
    setFormData((prev) => ({
      ...prev,
      reviewers: prev.reviewers.includes(reviewerId)
        ? prev.reviewers.filter((id) => id !== reviewerId)
        : [...prev.reviewers, reviewerId],
    }));
  };

  const addVoiceMemo = () => {
    setVoiceMemos((prev) => [
      ...prev,
      { id: Date.now(), title: "", duration: "0:00" },
    ]);
  };

  const removeVoiceMemo = (id) => {
    setVoiceMemos((prev) => prev.filter((memo) => memo.id !== id));
  };

  const addTextMemo = () => {
    setTextMemos((prev) => [
      ...prev,
      { id: Date.now(), title: "", content: "" },
    ]);
  };

  const removeTextMemo = (id) => {
    setTextMemos((prev) => prev.filter((memo) => memo.id !== id));
  };

  const addReferenceLink = () => {
    setReferenceLinks((prev) => [
      ...prev,
      { id: Date.now(), title: "", url: "" },
    ]);
  };

  const removeReferenceLink = (id) => {
    setReferenceLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // PR 생성 로직
    console.log("Creating PR:", {
      ...formData,
      voiceMemos,
      textMemos,
      referenceLinks,
    });
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
              새 PR 생성
            </h1>
            <p className="text-stone-600 font-bmjua">
              새로운 Pull Request를 생성하세요
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="soft-container">
          <h2 className="text-lg mb-4">
            <div className="flex items-center">
              <span className="pixel-logo text-lg" style={{ display: "none" }}>
                OtteReview
              </span>
            </div>
            기본 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="PR 제목을 입력하세요"
                className="soft-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                레포지토리 *
              </label>
              <select
                value={formData.repository}
                onChange={(e) =>
                  handleInputChange("repository", e.target.value)
                }
                className="soft-input"
                required
              >
                <option value="">레포지토리 선택</option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                우선순위
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className="soft-input"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                소스 브랜치 *
              </label>
              <input
                type="text"
                value={formData.sourceBranch}
                onChange={(e) =>
                  handleInputChange("sourceBranch", e.target.value)
                }
                placeholder="feature/new-feature"
                className="soft-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                타겟 브랜치
              </label>
              <input
                type="text"
                value={formData.targetBranch}
                onChange={(e) =>
                  handleInputChange("targetBranch", e.target.value)
                }
                placeholder="main"
                className="soft-input"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              설명 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="변경사항에 대한 자세한 설명을 입력하세요..."
              className="soft-input h-32 resize-none"
              rows={6}
            />
          </div>
        </div>

        {/* Reviewer Selection */}
        <div className="soft-container">
          <h2 className="text-lg mb-4">
            <div className="flex items-center">
              <span className="pixel-logo text-lg" style={{ display: "none" }}>
                OtteReview
              </span>
            </div>
            리뷰어 선택
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableReviewers.map((reviewer) => (
              <div
                key={reviewer.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.reviewers.includes(reviewer.id)
                    ? "border-primary-500 bg-primary-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
                onClick={() => handleReviewerToggle(reviewer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-stone-300 border-2 border-black rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {reviewer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">
                        {reviewer.name}
                      </p>
                      <p className="text-sm text-stone-500">
                        @{reviewer.username}
                      </p>
                    </div>
                  </div>
                  {formData.reviewers.includes(reviewer.id) && (
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Memos */}
        <div className="soft-container">
          <h2 className="text-lg">
            <div className="flex items-center">
              <span className="pixel-logo text-lg" style={{ display: "none" }}>
                OtteReview
              </span>
            </div>
            음성 메모
          </h2>
          <div className="space-y-4">
            {voiceMemos.map((memo) => (
              <div
                key={memo.id}
                className="flex items-center space-x-4 p-4 bg-stone-50 border-2 border-black rounded-lg"
              >
                <Mic className="w-5 h-5 text-primary-600" />
                <input
                  type="text"
                  placeholder="음성 메모 제목"
                  className="soft-input flex-1"
                />
                <input
                  type="text"
                  placeholder="0:00"
                  className="soft-input w-20"
                />
                <button
                  type="button"
                  onClick={() => removeVoiceMemo(memo.id)}
                  className="p-2 text-stone-500 hover:text-danger-600 pixel-hover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addVoiceMemo}
              className="soft-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              음성 메모 추가
            </Button>
          </div>
        </div>

        {/* Text Memos */}
        <div className="soft-container">
          <h2 className="text-lg">
            <div className="flex items-center">
              <span className="pixel-logo text-lg" style={{ display: "none" }}>
                OtteReview
              </span>
            </div>
            텍스트 메모
          </h2>
          <div className="space-y-4">
            {textMemos.map((memo) => (
              <div
                key={memo.id}
                className="p-4 bg-stone-50 border-2 border-black rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    placeholder="메모 제목"
                    className="soft-input flex-1 mr-4"
                  />
                  <button
                    type="button"
                    onClick={() => removeTextMemo(memo.id)}
                    className="p-2 text-stone-500 hover:text-danger-600 pixel-hover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  placeholder="메모 내용을 입력하세요..."
                  className="soft-input h-24 resize-none"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addTextMemo}
              className="soft-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              텍스트 메모 추가
            </Button>
          </div>
        </div>

        {/* Reference Links */}
        <div className="soft-container">
          <h2 className="text-lg">
            <div className="flex items-center">
              <span className="pixel-logo text-lg" style={{ display: "none" }}>
                OtteReview
              </span>
            </div>
            참고 링크
          </h2>
          <div className="space-y-4">
            {referenceLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center space-x-4 p-4 bg-stone-50 border-2 border-black rounded-lg"
              >
                <LinkIcon className="w-5 h-5 text-accent-600" />
                <input
                  type="text"
                  placeholder="링크 제목"
                  className="soft-input flex-1"
                />
                <input
                  type="url"
                  placeholder="https://example.com"
                  className="soft-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeReferenceLink(link.id)}
                  className="p-2 text-stone-500 hover:text-danger-600 pixel-hover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addReferenceLink}
              className="soft-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              참고 링크 추가
            </Button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link to="/pr">
            <Button variant="outline" className="soft-btn">
              취소
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            className="soft-btn glow-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            PR 생성하기
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PRCreatePage;
