import { ArrowRight, CheckCircle, Code, Github, GitPullRequest, MessageSquare, Sparkles, Star, Users, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const Landing = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [visibleElements, setVisibleElements] = useState(new Set())
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const statsRef = useRef(null)
  const ctaRef = useRef(null)

  const handleLogin = () => {
    const githubLoginUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`
    window.location.href = githubLoginUrl
  }

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Scroll-triggered animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleElements(prev => new Set([...prev, entry.target.id]))
          
          // Add special effects for specific sections
          if (entry.target.id === 'stats-section') {
            // Trigger counter animations with stagger
            const counters = entry.target.querySelectorAll('.stat-card')
            counters.forEach((counter, index) => {
              setTimeout(() => {
                counter.style.transform = 'scale(1.05)'
                counter.style.boxShadow = '0 25px 50px -12px rgba(59, 130, 246, 0.25)'
                setTimeout(() => {
                  counter.style.transform = 'scale(1)'
                }, 300)
              }, index * 150)
            })
          }
        }
      })
    }, observerOptions)

    const refs = [statsRef, featuresRef, ctaRef]
    refs.forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      icon: <Github className="w-7 h-7" />,
      title: "깊이 있는 GitHub 통합",
      description: "기존 워크플로우를 방해하지 않으면서 강력한 기능을 제공합니다",
      color: "from-orange-500 to-red-500",
      delay: "0ms"
    },
    {
      icon: <MessageSquare className="w-7 h-7" />,
      title: "실시간 협업 환경",
      description: "팀원들과 즉시 소통하며 효율적으로 코드를 리뷰하세요",
      color: "from-orange-600 to-red-600",
      delay: "100ms"
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: "AI 기반 인사이트",
      description: "코드 품질을 향상시키는 지능형 분석과 제안을 받아보세요",
      color: "from-purple-500 to-pink-500",
      delay: "200ms"
    }
  ]

  const stats = [
    { number: "10,000+", label: "활성 사용자", icon: <Users className="w-5 h-5" /> },
    { number: "50,000+", label: "리뷰된 PR", icon: <GitPullRequest className="w-5 h-5" /> },
    { number: "99.9%", label: "업타임", icon: <Zap className="w-5 h-5" /> },
    { number: "4.9", label: "사용자 평점", icon: <Star className="w-5 h-5" /> }
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950/20 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-400/10 to-purple-400/10 blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            top: '10%',
            left: '10%'
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-orange-400/10 to-red-400/10 blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px)`,
            bottom: '20%',
            right: '15%'
          }}
        />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section ref={heroRef} className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            {/* Hero Content */}
            <div className="space-y-8 mb-16">
              {/* Animated Logo */}
              <div className="flex justify-center mb-8">
                <div className="group relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-all duration-500 animate-pulse" />
                  <div className="relative w-32 h-32 hover:scale-110 transition-all duration-500 cursor-pointer">
                    <img 
                      src="/otter_logo.png" 
                      alt="Ottereview Logo" 
                      className="w-full h-full object-contain drop-shadow-2xl hover:drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-500"
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'rotate(360deg) scale(1.1)';
                        e.target.style.transition = 'transform 1s ease-in-out';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'rotate(0deg) scale(1)';
                        e.target.style.transition = 'transform 0.5s ease-in-out';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-600/10 backdrop-blur-sm border border-orange-500/20 rounded-full shadow-2xl hover:scale-105 hover:shadow-orange-500/25 transition-all duration-500 group">
                <div className="relative">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 bg-orange-500 rounded-full animate-ping" />
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent group-hover:from-red-600 group-hover:to-orange-700 transition-all duration-300">
                    새로운 AI 리뷰 기능이 출시되었습니다!
                  </span>
                </div>
              </div>

              {/* Main Title */}
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight">
                  <span className="inline-block hover:scale-110 transition-transform duration-300 text-gray-900 dark:text-white">
                    코드 리뷰의
                  </span>
                  <br />
                  <span className="inline-block bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 bg-clip-text text-transparent hover:from-red-600 hover:via-orange-600 hover:to-orange-700 transition-all duration-1000 hover:scale-105 cursor-pointer">
                    새로운 기준
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  GitHub 기반의 스마트한 코드 리뷰 플랫폼으로
                  <br className="hidden sm:block" />
                  개발 워크플로우를 혁신하고 팀 협업을 강화하세요.
                </p>
              </div>

              {/* CTA Section */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <button
                  onClick={handleLogin}
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 hover:from-red-600 hover:via-orange-600 hover:to-orange-700 text-white font-bold px-10 py-5 rounded-2xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-500 hover:scale-110 overflow-hidden transform-gpu"
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 0 50px rgba(249, 115, 22, 0.8), 0 0 100px rgba(251, 146, 60, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                  }}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 transform -skew-x-12" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <Github className="w-6 h-6 z-10 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="z-10 text-lg tracking-wide">GitHub으로 시작하기</span>
                  <ArrowRight className="w-6 h-6 z-10 group-hover:translate-x-2 group-hover:scale-110 transition-transform duration-300" />
                  
                  {/* Ripple effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-ping bg-white/20" />
                </button>
                
                <button 
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm border-2 border-gray-300/20 dark:border-slate-600/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-xl overflow-hidden"
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.05)';
                    e.target.style.backdropFilter = 'blur(20px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '';
                    e.target.style.backdropFilter = 'blur(4px)';
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Code className="w-5 h-5 z-10 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="z-10">데모 보기</span>
                  <div className="absolute inset-0 border-2 border-blue-500/0 group-hover:border-blue-500/30 rounded-2xl transition-all duration-300" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-8 pt-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  무료 시작
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  설치 불필요
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  5분 내 설정 완료
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {stats.map((stat, index) => {
                const colors = [
                  'from-orange-500 to-red-500',
                  'from-orange-600 to-red-600', 
                  'from-purple-500 to-pink-500',
                  'from-yellow-500 to-orange-500'
                ];
                return (
                  <div
                    key={index}
                    className="group relative p-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-gray-200/30 dark:border-slate-700/30 rounded-3xl hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-500 hover:scale-110 hover:shadow-2xl cursor-pointer overflow-hidden"
                    style={{ animationDelay: `${index * 150}ms` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15) rotateY(5deg)';
                      e.currentTarget.style.boxShadow = `0 25px 80px -15px ${index === 0 ? 'rgba(59, 130, 246, 0.4)' : index === 1 ? 'rgba(34, 197, 94, 0.4)' : index === 2 ? 'rgba(147, 51, 234, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotateY(0deg)';
                      e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                    }}
                  >
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors[index]} opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-3xl`} />
                    
                    {/* Glowing border effect */}
                    <div className={`absolute inset-0 border-2 border-transparent group-hover:border-gradient-to-r group-hover:${colors[index]} rounded-3xl opacity-0 group-hover:opacity-30 transition-all duration-500`} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-center mb-6">
                        <div className={`p-4 bg-gradient-to-r ${colors[index]} text-white rounded-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg group-hover:shadow-2xl`}>
                          <div className="group-hover:animate-pulse">
                            {stat.icon}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                        <span className="tabular-nums">{stat.number}</span>
                      </div>
                      
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                        {stat.label}
                      </div>
                    </div>
                    
                    {/* Sparkle effects */}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300" />
                    <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-pulse transition-all duration-500" style={{ animationDelay: '0.2s' }} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                핵심 기능
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                효율적인 코드 리뷰를 위한 필수 기능들
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative p-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/30 dark:border-slate-700/30 rounded-3xl hover:bg-white/95 dark:hover:bg-slate-800/95 transition-all duration-700 cursor-pointer overflow-hidden"
                  style={{ 
                    animationDelay: `${index * 200}ms`,
                    transformStyle: 'preserve-3d'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08) translateY(-15px) rotateX(5deg) rotateY(-5deg)';
                    e.currentTarget.style.boxShadow = `0 40px 100px -20px ${feature.color.includes('blue') ? 'rgba(59, 130, 246, 0.4)' : feature.color.includes('green') ? 'rgba(34, 197, 94, 0.4)' : 'rgba(147, 51, 234, 0.4)'}, 0 0 0 1px rgba(255,255,255,0.1)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0px) rotateX(0deg) rotateY(0deg)';
                    e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                  }}
                >
                  {/* Multiple animated backgrounds */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-15 transition-all duration-700 rounded-3xl`} />
                  <div className={`absolute inset-0 bg-gradient-to-tl ${feature.color} opacity-0 group-hover:opacity-5 transition-all duration-500 rounded-3xl blur-xl`} />
                  
                  {/* Animated border glow */}
                  <div className={`absolute -inset-px bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-60 blur-sm transition-all duration-700 rounded-3xl`} />
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-1000">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  </div>
                  
                  <div className="relative z-10">
                    {/* Animated icon container */}
                    <div className="relative mb-8">
                      <div className={`absolute -inset-2 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500 rounded-2xl animate-pulse`} />
                      <div className={`relative inline-flex p-5 bg-gradient-to-r ${feature.color} text-white rounded-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-xl group-hover:shadow-2xl`}>
                        <div className="group-hover:animate-bounce">
                          {feature.icon}
                        </div>
                        {/* Icon glow effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-50 blur-md rounded-2xl transition-all duration-500`} />
                      </div>
                      
                      {/* Floating particles around icon */}
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300" />
                      <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white rounded-full opacity-0 group-hover:opacity-80 group-hover:animate-pulse transition-all duration-500" style={{ animationDelay: '0.3s' }} />
                      <div className="absolute top-1 left-8 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-60 group-hover:animate-ping transition-all duration-400" style={{ animationDelay: '0.6s' }} />
                    </div>
                    
                    {/* Enhanced title */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:scale-105 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-all duration-300">
                      <span className="group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 dark:group-hover:from-white dark:group-hover:to-gray-200 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500">
                        {feature.title}
                      </span>
                    </h3>
                    
                    {/* Enhanced description */}
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-all duration-300 group-hover:scale-105">
                      {feature.description}
                    </p>
                    
                    {/* Arrow indicator that appears on hover */}
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className={`bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                        자세히 알아보기
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                  
                  {/* Corner decorations */}
                  <div className="absolute top-4 right-4 w-16 h-16 opacity-0 group-hover:opacity-20 transition-all duration-700">
                    <div className={`w-full h-full bg-gradient-to-br ${feature.color} rounded-full blur-2xl animate-pulse`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="group relative p-16 bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 rounded-3xl shadow-2xl overflow-hidden cursor-pointer"
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = 'scale(1.02) translateY(-5px)';
                   e.currentTarget.style.boxShadow = '0 50px 100px -20px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = 'scale(1) translateY(0px)';
                   e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                 }}
            >
              {/* Animated background layers */}
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-orange-600/20 group-hover:from-orange-400/30 group-hover:via-red-400/30 group-hover:to-orange-500/30 transition-all duration-700" />
              
              {/* Moving gradient overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-1000">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1500 ease-in-out" />
              </div>
              
              {/* Floating elements */}
              <div className="absolute top-8 right-8 w-4 h-4 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500" style={{ animationDelay: '0.2s' }} />
              <div className="absolute bottom-12 left-12 w-3 h-3 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700" style={{ animationDelay: '0.5s' }} />
              <div className="absolute top-16 left-1/4 w-2 h-2 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-600" style={{ animationDelay: '0.8s' }} />
              
              <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl sm:text-5xl font-bold text-white group-hover:scale-105 transition-transform duration-300">
                    <span className="inline-block group-hover:animate-pulse">더 나은</span>{' '}
                    <span className="inline-block group-hover:animate-pulse" style={{ animationDelay: '0.1s' }}>코드 리뷰를</span>{' '}
                    <span className="inline-block group-hover:animate-pulse" style={{ animationDelay: '0.2s' }}>시작하세요</span>
                  </h2>
                  <p className="text-xl text-blue-100 max-w-2xl mx-auto group-hover:text-blue-50 transition-colors duration-300 group-hover:scale-105">
                    개발팀의 생산성과 코드 품질을 한 번에 향상시키는 솔루션
                  </p>
                </div>
                
                <button
                  onClick={handleLogin}
                  className="group/btn relative inline-flex items-center gap-4 bg-white hover:bg-gray-50 text-gray-900 font-bold text-lg px-12 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-110 overflow-hidden"
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 0 50px rgba(255, 255, 255, 0.8), 0 0 100px rgba(255, 255, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                  }}
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-full transition-all duration-700 transform -skew-x-12" />
                  
                  <Github className="w-6 h-6 z-10 group-hover/btn:rotate-360 transition-transform duration-700" />
                  <span className="z-10 tracking-wide">지금 시작하기</span>
                  <ArrowRight className="w-6 h-6 z-10 group-hover/btn:translate-x-2 group-hover/btn:scale-125 transition-transform duration-300" />
                  
                  {/* Button glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 bg-gradient-to-r from-orange-400/20 via-red-400/20 to-orange-500/20 blur-sm transition-all duration-500" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Landing