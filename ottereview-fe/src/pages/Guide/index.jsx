import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle,
  Github,
  GitPullRequest,
  Heart,
  MessageSquare,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import Button from '@/components/Button'
import PreSetupChecklist from '@/components/onboarding/PreSetupChecklist'

const Guide = () => {
  const [visibleSections, setVisibleSections] = useState(new Set())
  const [scrollY, setScrollY] = useState(0)
  const observerRef = useRef(null)

  const handleLogin = () => {
    const githubLoginUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`
    window.location.href = githubLoginUrl
  }

  useEffect(() => {
    // 부드러운 스크롤을 위한 CSS 추가
    document.documentElement.style.scrollBehavior = 'smooth'

    // 스크롤 위치 추적 (throttled)
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }

    // Intersection Observer 설정 (더 부드러운 애니메이션을 위해)
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]))
          } else {
            // 스크롤 시 요소가 화면에서 벗어나면 다시 애니메이션이 가능하도록
            setVisibleSections((prev) => {
              const newSet = new Set(prev)
              newSet.delete(entry.target.id)
              return newSet
            })
          }
        })
      },
      {
        threshold: [0, 0.1, 0.2, 0.3],
        rootMargin: '0px 0px -50px 0px',
      }
    )

    const sections = document.querySelectorAll('[data-animate]')
    sections.forEach((section) => observerRef.current?.observe(section))

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observerRef.current?.disconnect()
      window.removeEventListener('scroll', handleScroll)
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-white dark:from-gray-900 dark:via-gray-800 dark:to-black">
        {/* 배경 장식 요소 with parallax */}
        <div
          className="absolute inset-0 opacity-5 transition-transform duration-1000 ease-out"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          <div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-400 rounded-full blur-3xl transition-transform duration-1000"
            style={{
              transform: `translateY(${scrollY * 0.3}px) rotate(${scrollY * 0.1}deg)`,
            }}
          ></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-secondary-400 rounded-full blur-3xl transition-transform duration-1000"
            style={{
              transform: `translateY(${scrollY * -0.2}px) rotate(${scrollY * -0.05}deg)`,
            }}
          ></div>
          <div
            className="absolute top-3/4 left-1/3 w-24 h-24 bg-accent-400 rounded-full blur-2xl transition-transform duration-1000"
            style={{
              transform: `translateY(${scrollY * 0.4}px)`,
            }}
          ></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div
            className="space-y-8 animate-fade-in-up transition-transform duration-700 ease-out"
            style={{
              transform: `translateY(${scrollY * -0.1}px)`,
            }}
          >
            <div className="inline-block">
              <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/95 backdrop-blur-sm border border-primary-200/50 dark:border-gray-600/50 rounded-full px-4 py-2 shadow-lg shadow-primary-500/10">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium theme-text-secondary">
                  AI 기반 코드 리뷰 플랫폼
                </span>
              </div>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-primary-700 to-slate-800 dark:from-white dark:via-primary-300 dark:to-slate-200 bg-clip-text text-transparent">
              코드 리뷰의
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text">
                새로운 패러다임
              </span>
            </h1>

            <p className="text-xl theme-text-secondary leading-relaxed max-w-lg">
              GitHub 기반의 지능형 코드 리뷰 플랫폼으로
              <br />
              <span className="font-semibold theme-text">개발 워크플로우를 혁신하세요</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                className="shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all flex items-center gap-2"
                onClick={handleLogin}
              >
                <Target className="w-5 h-5" />
                지금 시작하기
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 hover:border-primary-300 hover:bg-primary-50/50 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />더 알아보기
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2"></div>
            </div>
          </div>

          <div
            className="relative animate-fade-in-up animate-delay-200 transition-transform duration-700 ease-out"
            style={{
              transform: `translateY(${scrollY * -0.15}px) rotateY(${scrollY * 0.02}deg)`,
            }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 rounded-3xl blur-2xl transform rotate-6 transition-transform duration-1000"
              style={{
                transform: `rotate(${6 + scrollY * 0.02}deg)`,
              }}
            ></div>
            <div className="relative bg-white/80 dark:bg-gray-900/95 backdrop-blur-sm border border-white/50 dark:border-gray-600/50 rounded-3xl p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/50">
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10"></div>
                <div className="relative text-center space-y-3">
                  <div className="theme-text-secondary font-medium text-lg">실시간 협업</div>
                  <div className="theme-text-muted text-sm">코드 리뷰 & 토론</div>
                  <div className="flex justify-center gap-1">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-accent-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub 연동 섹션 */}
      <section
        className="relative py-32 bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-black overflow-hidden"
        id="github-section"
        data-animate
      >
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div
            className={`relative transition-all duration-1000 ${
              visibleSections.has('github-section')
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-20'
            }`}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white/80 dark:bg-gray-900/95 backdrop-blur-sm border border-slate-200/60 dark:border-gray-600/60 rounded-2xl p-8 shadow-2xl shadow-slate-900/5 dark:shadow-black/50">
              <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5"></div>
                <div className="relative text-center space-y-4">
                  <div className="flex justify-center mb-2">
                    <Github className="w-20 h-20 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 font-medium text-lg">GitHub 연동 데모</div>
                  <div className="flex justify-center gap-2 mt-4">
                    <div className="w-3 h-3 bg-primary-400 rounded-full animate-ping"></div>
                    <div
                      className="w-3 h-3 bg-secondary-400 rounded-full animate-ping"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-3 h-3 bg-accent-400 rounded-full animate-ping"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`space-y-8 transition-all duration-1000 delay-200 ${
              visibleSections.has('github-section')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-2xl">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
                  STEP 01
                </span>
                <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">연동 설정</div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent leading-tight">
                GitHub와
                <br />
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text">
                  간편하게 연결
                </span>
              </h2>

              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                복잡한 설정 없이{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">GitHub 계정으로 간편 로그인</span>
                <br />
                모든 리포지토리와 PR 정보를 자동으로 동기화합니다.
              </p>

              <PreSetupChecklist />
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white/60 dark:bg-gray-900/95 rounded-2xl border border-slate-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                <div className="p-2 bg-primary-100 rounded-xl shrink-0">
                  <CheckCircle className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">원클릭 GitHub OAuth 로그인</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    복잡한 인증 과정 없이 간단하게 시작
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/60 dark:bg-gray-900/95 rounded-2xl border border-slate-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                <div className="p-2 bg-secondary-100 rounded-xl shrink-0">
                  <CheckCircle className="w-4 h-4 text-secondary-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">자동 리포지토리 동기화</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    모든 리포지토리 정보를 실시간으로 동기화
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/60 dark:bg-gray-900/95 rounded-2xl border border-slate-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                <div className="p-2 bg-accent-100 rounded-xl shrink-0">
                  <CheckCircle className="w-4 h-4 text-accent-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">실시간 브랜치 정보 업데이트</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    브랜치 변경사항을 즉시 반영하여 표시
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI 스마트 기능 섹션 */}
      <section
        className="relative py-32 bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-black overflow-hidden"
        id="ai-section"
        data-animate
      >
        {/* AI 배경 장식 with parallax */}
        <div
          className="absolute inset-0 opacity-5 transition-transform duration-1000 ease-out"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        >
          <div
            className="absolute top-1/3 right-1/4 w-36 h-36 bg-primary-400 rounded-full blur-3xl animate-pulse transition-transform duration-1000"
            style={{
              transform: `translateX(${scrollY * 0.1}px) scale(${1 + scrollY * 0.0001})`,
            }}
          ></div>
          <div
            className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-secondary-400 rounded-full blur-3xl animate-pulse transition-transform duration-1000"
            style={{
              animationDelay: '1s',
              transform: `translateX(${scrollY * -0.05}px) scale(${1 + scrollY * 0.0001})`,
            }}
          ></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div
            className={`space-y-8 transition-all duration-1000 ${
              visibleSections.has('ai-section')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
            style={{
              transform: `translateY(${visibleSections.has('ai-section') ? scrollY * -0.05 : 10}px)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative p-3 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl">
                <GitPullRequest className="w-6 h-6 text-primary-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-accent-400 to-accent-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
                  STEP 02
                </span>
                <div className="text-slate-400 text-xs mt-0.5">AI 기능</div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  AI가 도와주는
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
                  스마트한 PR 관리
                </span>
              </h2>

              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
                  <span className="text-slate-600 dark:text-slate-400">GPT-4 기반</span>
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-full"></div>
                  <span className="text-slate-600 dark:text-slate-400">실시간 분석</span>
                </div>
              </div>
            </div>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              AI가{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200 bg-gradient-to-r from-primary-600/10 to-secondary-600/10 dark:from-primary-400/20 dark:to-secondary-400/20 px-2 py-1 rounded-lg">
                PR 제목과 설명을 자동 생성
              </span>
              하고, 우선순위까지 추천합니다.
              <br />
              개발자는 코딩에만 집중하세요.
            </p>
            <div className="space-y-4">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-start gap-4 p-4 bg-white/80 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-600/60 hover:border-primary-300/50 dark:hover:border-primary-500/50 transition-all">
                  <div className="p-2 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl shrink-0">
                    <CheckCircle className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      AI 기반 PR 제목/설명 자동 생성
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      코드 변경사항을 분석하여 의미 있는 제목과 설명 생성
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-500/10 to-accent-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-start gap-4 p-4 bg-white/80 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-600/60 hover:border-secondary-300/50 dark:hover:border-secondary-500/50 transition-all">
                  <div className="p-2 bg-gradient-to-r from-secondary-100 to-secondary-200 rounded-xl shrink-0">
                    <CheckCircle className="w-4 h-4 text-secondary-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">우선순위 자동 추천</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      프로젝트 상황과 변경 내용을 고려한 스마트한 우선순위 분류
                    </div>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 to-primary-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-start gap-4 p-4 bg-white/80 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-600/60 hover:border-accent-300/50 dark:hover:border-accent-500/50 transition-all">
                  <div className="p-2 bg-gradient-to-r from-accent-100 to-accent-200 rounded-xl shrink-0">
                    <CheckCircle className="w-4 h-4 text-accent-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">최적 리뷰어 추천 시스템</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      과거 리뷰 데이터와 전문 영역을 분석하여 베스트 리뷰어 매칭
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`relative transition-all duration-1000 delay-200 ${
              visibleSections.has('ai-section')
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-20'
            }`}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-3xl blur-2xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-gray-900/95 dark:to-black/95 backdrop-blur-sm border border-slate-200/60 dark:border-gray-600/60 rounded-2xl p-8 shadow-2xl shadow-slate-900/5 dark:shadow-black/50">
              <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/5 to-accent-500/10"></div>
                <div className="relative text-center space-y-6">
                  <div className="flex justify-center items-center gap-2">
                    <Bot className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-slate-700 dark:text-slate-200 font-semibold text-lg">AI 기능 데모</div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm">스마트한 코드 리뷰 어시스턴트</div>
                  </div>

                  {/* AI 사고 중 애니메이션 */}
                  <div className="flex justify-center items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-accent-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">분석 중...</span>
                  </div>

                  {/* 에너지 표시 */}
                  <div className="absolute top-4 right-4 flex gap-1">
                    <div className="w-1 h-1 bg-primary-400 rounded-full animate-ping"></div>
                    <div
                      className="w-1 h-1 bg-secondary-400 rounded-full animate-ping"
                      style={{ animationDelay: '0.3s' }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-accent-400 rounded-full animate-ping"
                      style={{ animationDelay: '0.6s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 실시간 협업 섹션 */}
      <section
        className="relative py-32 bg-gradient-to-br from-slate-50 to-secondary-50/10 dark:from-gray-900 dark:to-black overflow-hidden"
        id="collab-section"
        data-animate
      >
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div
            className={`bg-stone-200 dark:bg-gray-800 rounded-2xl aspect-[4/3] flex items-center justify-center transition-all duration-1000 ${
              visibleSections.has('collab-section')
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-20'
            }`}
          >
            <span className="text-stone-500 dark:text-slate-400 text-lg">실시간 협업 이미지</span>
          </div>
          <div
            className={`space-y-6 transition-all duration-1000 delay-200 ${
              visibleSections.has('collab-section')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary-600" />
              <span className="text-primary-600 font-semibold">STEP 03</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
              팀원들과
              <br />
              <span className="text-primary-600">실시간으로 소통</span>
            </h2>
            <p className="text-xl text-stone-600 dark:text-slate-300 leading-relaxed">
              실시간 채팅, 음성 댓글, 공유 화이트보드로
              <br />
              효율적인 협업과 빠른 피드백을 경험하세요.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span className="text-slate-700 dark:text-slate-300">실시간 채팅 및 알림</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span className="text-slate-700 dark:text-slate-300">음성 댓글 지원</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span className="text-slate-700 dark:text-slate-300">공유 화이트보드</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 충돌 해결 섹션 */}
      <section className="py-24 bg-stone-50 dark:bg-gray-900" id="conflict-section" data-animate>
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div
            className={`space-y-6 transition-all duration-1000 ${
              visibleSections.has('conflict-section')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary-600" />
              <span className="text-primary-600 font-semibold">STEP 04</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
              머지 충돌도
              <br />
              <span className="text-primary-600">함께 해결</span>
            </h2>
            <p className="text-xl text-stone-600 dark:text-slate-300 leading-relaxed">
              머지 충돌 발생 시 팀원들과 실시간으로 협력하여
              <br />
              안전하고 효율적으로 문제를 해결할 수 있습니다.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span className="text-slate-700 dark:text-slate-300">시각적 충돌 해결 인터페이스</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span className="text-slate-700 dark:text-slate-300">실시간 협업 편집</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span className="text-slate-700 dark:text-slate-300">안전한 머지 프로세스</span>
              </div>
            </div>
          </div>
          <div
            className={`bg-stone-200 dark:bg-gray-800 rounded-2xl aspect-[4/3] flex items-center justify-center transition-all duration-1000 delay-200 ${
              visibleSections.has('conflict-section')
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-20'
            }`}
          >
            <span className="text-stone-500 dark:text-slate-400 text-lg">충돌 해결 이미지</span>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section
        className="relative py-32 bg-gradient-to-br from-slate-900 via-primary-900 to-secondary-900 overflow-hidden"
        id="cta-section"
        data-animate
      >
        {/* CTA 배경 장식 with parallax */}
        <div
          className="absolute inset-0 opacity-10 transition-transform duration-1000 ease-out"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
          }}
        >
          <div
            className="absolute top-1/4 left-1/3 w-40 h-40 bg-primary-400 rounded-full blur-3xl animate-pulse transition-transform duration-1000"
            style={{
              transform: `translateY(${scrollY * 0.1}px) scale(${1 + scrollY * 0.0002})`,
            }}
          ></div>
          <div
            className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-secondary-400 rounded-full blur-3xl animate-pulse transition-transform duration-1000"
            style={{
              animationDelay: '1s',
              transform: `translateY(${scrollY * -0.1}px) scale(${1 + scrollY * 0.0002})`,
            }}
          ></div>
          <div
            className="absolute top-2/3 left-1/5 w-28 h-28 bg-accent-400 rounded-full blur-2xl animate-pulse transition-transform duration-1000"
            style={{
              animationDelay: '2s',
              transform: `translateY(${scrollY * 0.15}px)`,
            }}
          ></div>
        </div>

        <div
          className={`relative max-w-4xl mx-auto px-6 text-center text-white transition-all duration-1000 ${
            visibleSections.has('cta-section')
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3">
                <span className="text-lg font-semibold">Ottereview</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                지금 바로 시작해보세요!
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                  더 스마트한 코드 리뷰 경험
                </span>
              </h2>

              <p className="text-xl text-slate-200 leading-relaxed max-w-2xl mx-auto">
                전 세계 개발팀들이 선택한
                <br />
                <span className="font-semibold text-white">차세대 코드 리뷰 플랫폼</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-black/20 flex items-center gap-2"
                onClick={handleLogin}
              >
                <Github className="w-5 h-5" />
                GitHub으로 시작하기
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                문서 보기
              </Button>
            </div>

            <div className="flex justify-center items-center gap-8 pt-8 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>무료로 시작</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>5분만에 설정</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>AI 기능 포함</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Guide
