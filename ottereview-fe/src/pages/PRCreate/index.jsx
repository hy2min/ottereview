import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import StepIndicator from '@/components/StepIndicator'
import PRCreateStep1 from '@/features/pullRequest/PRCreateStep1'
import PRCreateStep2 from '@/features/pullRequest/PRCreateStep2'
import PRCreateStep3 from '@/features/pullRequest/PRCreateStep3'
import PRCreateStep4 from '@/features/pullRequest/PRCreateStep4'
import PRCreateStep5 from '@/features/pullRequest/PRCreateStep5'
import { fetchBrancheListByRepoId } from '@/features/repository/repoApi'
import { useRepoStore } from '@/features/repository/stores/repoStore'

const PRCreate = () => {
  const { repoId } = useParams()
  const repo = useRepoStore((state) => state.repos.find((r) => String(r.repoId) === String(repoId)))
  const accountId = repo?.accountId
  const [step, setStep] = useState(1)

  // 선택된 브랜치 정보 관리 (Step1에서 선택, 최종 PR 생성시 사용)
  const [selectedBranches, setSelectedBranches] = useState({
    source: '',
    target: '',
  })
  
  // PR 제목과 설명을 별도로 관리
  const [prTitle, setPrTitle] = useState('')
  const [prBody, setPrBody] = useState('')
  const [validationPR, setValidationPR] = useState(null)
  const [validationBranches, setValidationBranches] = useState(null)
  const [aiConvention, setAIConvention] = useState(null)
  const [aiOthers, setAIOthers] = useState(null)
  
  // 브랜치 정보를 PRCreate에서 관리
  const [branches, setBranches] = useState([])
  
  // 컨벤션 규칙들을 PRCreate에서 관리
  const [conventionRules, setConventionRules] = useState({
    file_names: '',
    function_names: '',
    variable_names: '',
    class_names: '',
    constant_names: '',
  })

  // 브랜치 목록 로드
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const fetched = await fetchBrancheListByRepoId(repoId)
        setBranches(fetched)
      } catch (err) {
        console.error('브랜치 목록 불러오기 실패:', err)
        setBranches([]) // 에러 시 빈 배열로 초기화
      }
    }

    if (repoId) {
      loadBranches()
    }
  }, [repoId])

  // PR 생성 과정에서 작성된 댓글들 (모든 step에서 유지됨)
  const [reviewComments, setReviewComments] = useState([])
  const [audioFiles, setAudioFiles] = useState([])
  
  // 선택된 리뷰어들 (객체 배열로 관리)
  const [selectedReviewers, setSelectedReviewers] = useState([])

  const updateSelectedBranches = (partial) => {
    setSelectedBranches((prev) => ({ ...prev, ...partial }))
  }

  // 라인별 댓글 추가 함수
  const handleAddLineComment = (commentData) => {
    // 음성 파일이 있는 경우 (fileIndex가 -1인 경우)
    if (commentData.audioFile && commentData.fileIndex === -1) {
      const currentFileIndex = audioFiles.length
      setAudioFiles((prev) => [...prev, commentData.audioFile])

      // fileIndex를 실제 인덱스로 업데이트
      const updatedCommentData = {
        ...commentData,
        fileIndex: currentFileIndex,
        audioFile: undefined, // API 요청에서는 audioFile 제거
      }
      setReviewComments((prev) => [...prev, updatedCommentData])
    } else {
      // 텍스트 댓글인 경우 (fileIndex가 null)
      setReviewComments((prev) => [...prev, commentData])
    }
  }

  const goToStep = (stepNumber) => {
    setStep(stepNumber)
  }

  const steps = ['브랜치 선택', '컨벤션 확인', 'PR 정보 입력', '리뷰어 선택', '최종 제출']

  const stepProps = {
    goToStep,
    repoId,
    accountId,
    selectedBranches,
    updateSelectedBranches,
    validationPR,
    setValidationPR,
    validationBranches,
    setValidationBranches,
    aiConvention,
    setAIConvention,
    aiOthers,
    setAIOthers,
    // 브랜치 정보 추가
    branches,
    // 컨벤션 규칙 추가
    conventionRules,
    setConventionRules,
    // PR 제목과 설명 추가
    prTitle,
    setPrTitle,
    prBody,
    setPrBody,
    // 댓글 관련 props 추가
    reviewComments,
    audioFiles,
    onAddComment: handleAddLineComment,
    // 리뷰어 관련 props 추가
    selectedReviewers,
    setSelectedReviewers,
  }


  const renderStepComponent = () => {
    switch (step) {
      case 1:
        return <PRCreateStep1 {...stepProps} />
      case 2:
        return <PRCreateStep2 {...stepProps} />
      case 3:
        return <PRCreateStep3 {...stepProps} />
      case 4:
        return <PRCreateStep4 {...stepProps} />
      case 5:
        return <PRCreateStep5 {...stepProps} />
      default:
        return <PRCreateStep1 {...stepProps} />
    }
  }

  return (
    <div className="relative min-h-screen pb-[100px]">
      <div className="max-w-4xl mx-auto space-y-4 py-4">
        <StepIndicator currentStep={step} steps={steps} />
        <div>{renderStepComponent()}</div>
      </div>
    </div>
  )
}

export default PRCreate
