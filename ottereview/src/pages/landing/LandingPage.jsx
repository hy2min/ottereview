import { Link } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  Users,
  Shield,
  Clock,
  MessageCircle,
  GitBranch,
  CheckCircle,
  Star,
  TrendingUp,
  Award,
  Code,
} from "lucide-react";
import { Button } from "../../shared/ui";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b-2 border-black shadow-pixel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img
                src="/OtteReview_pixel.png"
                alt="OtteReview"
                className="w-8 h-12"
                style={{ imageRendering: "pixelated" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span
                className="text-white font-bold text-sm"
                style={{ display: "none" }}
              >
                O
              </span>
              <div className="flex items-center">
                <img
                  src="/OtteReview_logo.png"
                  alt="OtteReview"
                  className="h-12"
                  style={{ imageRendering: "pixelated" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <span
                  className="pixel-logo text-lg"
                  style={{ display: "none" }}
                >
                  OtteReview
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="soft-btn">
                  로그인
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button
                  variant="primary"
                  size="sm"
                  className="soft-btn glow-primary"
                >
                  시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 py-20">
        {/* Floating Pixel Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-10 w-4 h-4 bg-primary-300 border border-black animate-pixel-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="absolute top-40 right-20 w-3 h-3 bg-secondary-300 border border-black animate-pixel-bounce"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 left-20 w-5 h-5 bg-accent-300 border border-black animate-pixel-bounce"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-20 right-10 w-2 h-2 bg-primary-400 border border-black animate-pixel-bounce"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl mb-6 leading-tight">
                <div className="flex items-center justify-center lg:justify-start mb-4">
                  <img
                    src="/ottereview_logo.png"
                    alt="OtteReview"
                    className="h-16 lg:h-20"
                    style={{ imageRendering: "pixelated" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <span
                    className="pixel-logo text-4xl lg:text-6xl"
                    style={{ display: "none" }}
                  >
                    OtteReview
                  </span>
                </div>
                AI와 함께하는
                <br />
                <span className="text-primary-600">코드 리뷰</span>
              </h1>
              <p className="text-xl text-stone-700 mb-8 font-bmjua leading-relaxed">
                수달처럼 꼼꼼하게! AI가 도와주는 스마트한 코드 리뷰 플랫폼으로
                <br />더 빠르고 정확한 코드 검토를 경험해보세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/dashboard">
                  <Button
                    variant="primary"
                    size="lg"
                    className="soft-btn glow-primary pixel-hover"
                  >
                    무료로 시작하기
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    size="lg"
                    className="soft-btn pixel-hover"
                  >
                    데모 보기
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                {/* Main Otter Image */}
                <div className="w-80 h-80 bg-gradient-to-br from-stone-200 to-stone-300 border-4 border-black rounded-2xl shadow-pixel-lg relative overflow-hidden flex items-center justify-center">
                  <img
                    src="/OtteReview_pixel.png"
                    alt="OtteReview Pixel Art Otter"
                    className="w-full h-full object-contain p-4"
                    style={{ imageRendering: "pixelated" }}
                    onError={(e) => {
                      console.log("Image failed to load:", e.target.src);
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  {/* Fallback */}
                  <div className="hidden w-full h-full flex items-center justify-center text-stone-500">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-stone-300 border-2 border-black rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">🦦</span>
                      </div>
                      <p className="font-bmjua text-sm">OtteReview Pixel Art</p>
                    </div>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 rounded-2xl blur-xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl mb-4">
              <div className="flex items-center justify-center mb-4">
                <img
                  src="/ottereview_logo.png"
                  alt="OtteReview"
                  className="h-12"
                  style={{ imageRendering: "pixelated" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <span
                  className="pixel-logo text-3xl"
                  style={{ display: "none" }}
                >
                  OtteReview
                </span>
              </div>
              를 선택해야 할까요?
            </h2>
            <p className="text-stone-600 font-bmjua text-lg">
              수달처럼 꼼꼼하고 스마트한 코드 리뷰 경험
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="minecraft-container text-center">
              <div className="w-16 h-16 bg-primary-500 border-2 border-black rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-2">
                AI 기반 자동 분석
              </h3>
              <p className="text-stone-600 font-bmjua">
                AI가 코드를 분석하여 잠재적 문제점과 개선사항을 자동으로
                발견합니다.
              </p>
            </div>

            <div className="minecraft-container text-center">
              <div className="w-16 h-16 bg-secondary-500 border-2 border-black rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-2">
                팀 협업 최적화
              </h3>
              <p className="text-stone-600 font-bmjua">
                실시간 채팅과 음성 메모로 팀원들과 원활한 소통이 가능합니다.
              </p>
            </div>

            <div className="minecraft-container text-center">
              <div className="w-16 h-16 bg-accent-500 border-2 border-black rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-2">보안 강화</h3>
              <p className="text-stone-600 font-bmjua">
                보안 취약점을 사전에 감지하고 방지하여 안전한 코드를 보장합니다.
              </p>
            </div>

            <div className="minecraft-container text-center">
              <div className="w-16 h-16 bg-success-500 border-2 border-black rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-2">빠른 리뷰</h3>
              <p className="text-stone-600 font-bmjua">
                AI의 도움으로 리뷰 시간을 단축하고 개발 속도를 향상시킵니다.
              </p>
            </div>

            <div className="minecraft-container text-center">
              <div className="w-16 h-16 bg-warning-500 border-2 border-black rounded-lg mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-black" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-2">
                스마트 피드백
              </h3>
              <p className="text-stone-600 font-bmjua">
                AI가 제안하는 개선사항과 함께 구체적인 해결방안을 제공합니다.
              </p>
            </div>

            <div className="minecraft-container text-center">
              <div className="w-16 h-16 bg-info-500 border-2 border-black rounded-lg mx-auto mb-4 flex items-center justify-center">
                <GitBranch className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-2">Git 통합</h3>
              <p className="text-stone-600 font-bmjua">
                GitHub, GitLab 등과 완벽하게 통합되어 기존 워크플로우를 그대로
                유지합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="minecraft-container text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                10,000+
              </div>
              <div className="text-stone-600 font-bmjua">활성 사용자</div>
            </div>
            <div className="minecraft-container text-center">
              <div className="text-3xl font-bold text-secondary-600 mb-2">
                50,000+
              </div>
              <div className="text-stone-600 font-bmjua">리뷰 완료</div>
            </div>
            <div className="minecraft-container text-center">
              <div className="text-3xl font-bold text-accent-600 mb-2">95%</div>
              <div className="text-stone-600 font-bmjua">만족도</div>
            </div>
            <div className="minecraft-container text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">
                3배
              </div>
              <div className="text-stone-600 font-bmjua">속도 향상</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl mb-4">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/ottereview_logo.png"
                alt="OtteReview"
                className="h-12"
                style={{ imageRendering: "pixelated" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span className="pixel-logo text-3xl" style={{ display: "none" }}>
                OtteReview
              </span>
            </div>
            와 함께 시작하세요!
          </h2>
          <p className="text-stone-600 font-bmjua text-lg mb-8">
            수달처럼 꼼꼼한 코드 리뷰로 더 나은 코드를 만들어보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button
                variant="primary"
                size="lg"
                className="soft-btn glow-primary"
              >
                무료로 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg" className="soft-btn">
                데모 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 border-t-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary-500 border-2 border-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">O</span>
                </div>
                <div className="flex items-center">
                  <img
                    src="/OtteReview_logo.png"
                    alt="OtteReview"
                    className="h-6"
                    style={{ imageRendering: "pixelated" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <span
                    className="pixel-logo text-lg text-white"
                    style={{ display: "none" }}
                  >
                    OtteReview
                  </span>
                </div>
              </div>
              <p className="text-stone-400 font-bmjua text-sm">
                AI와 함께하는 스마트한 코드 리뷰 플랫폼
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">제품</h4>
              <ul className="space-y-2 text-stone-400 font-bmjua text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    기능
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    가격
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    통합
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">지원</h4>
              <ul className="space-y-2 text-stone-400 font-bmjua text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    문서
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    가이드
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    커뮤니티
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    연락처
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">회사</h4>
              <ul className="space-y-2 text-stone-400 font-bmjua text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    소개
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    블로그
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    채용
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    개인정보
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-700 mt-8 pt-8 text-center">
            <p className="text-stone-400 font-bmjua text-sm">
              © 2024 OtteReview. 모든 권리 보유.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
