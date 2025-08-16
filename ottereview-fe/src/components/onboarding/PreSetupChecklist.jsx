import { ExternalLink } from 'lucide-react'
import React from 'react'

const PreSetupChecklist = () => {
  return (
    <div className="theme-bg-secondary border theme-border p-6 rounded-lg mb-6 theme-shadow">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">🚀</span>
        <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">
          시작하기 전 확인사항
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="theme-text font-medium">GitHub Public Email 설정 필요</span>
              <a
                href="https://github.com/settings/profile"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm underline underline-offset-2 transition-colors"
              >
                설정하러 가기
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-sm theme-text-secondary mt-1">
              Settings → Public profile → Public email에서 이메일 주소를 공개로 설정해주세요
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="theme-text font-medium">GitHub Organization 소속 필수</span>
              <a
                href="https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/about-organizations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm underline underline-offset-2 transition-colors"
              >
                더 알아보기
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-sm theme-text-secondary mt-1">
              <span className="font-medium text-orange-600 dark:text-orange-400">⚠️ 중요:</span>{' '}
              개인 계정이 아닌 Organization에 속한 리포지토리만 협업 기능을 사용할 수 있습니다
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="theme-text font-medium">Organization 권한 승인 필요</span>
              <a
                href="https://docs.github.com/en/apps/using-github-apps/authorizing-github-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm underline underline-offset-2 transition-colors"
              >
                가이드 보기
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-sm theme-text-secondary mt-1">
              Organization 관리자가 GitHub App 설치 및 권한을 허용해야 서비스 이용이 가능합니다
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mt-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 dark:text-blue-400 text-lg">💡</span>
            <div className="flex-1">
              <div className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-1">
                Organization이 없다면?
              </div>
              <div className="text-blue-700 dark:text-blue-300 text-sm">
                GitHub에서 새로운 Organization을 생성하거나, 기존 Organization에 참여 요청을
                보내세요. Organization 생성은 무료이며, 팀 협업을 위한 필수 요소입니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreSetupChecklist
