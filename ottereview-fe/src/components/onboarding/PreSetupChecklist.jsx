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
              <span className="theme-text font-medium">
                GitHub Public Email 설정 필요
              </span>
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
      </div>
    </div>
  )
}

export default PreSetupChecklist