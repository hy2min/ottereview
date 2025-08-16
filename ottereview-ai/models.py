from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Any, Union
from datetime import datetime


class DiffLine(BaseModel):
    """diff hunk의 각 라인 정보"""
    oldLine: Optional[int] = None
    newLine: Optional[int] = None
    type: str  # context, addition, deletion
    content: str
    position: Optional[int] = None


class DiffHunk(BaseModel):
    """diff hunk 정보"""
    oldStart: int
    oldLines: int
    newStart: int
    newLines: int
    context: str
    lines: List[DiffLine]


class FileChangeInfo(BaseModel):
    """파일 변경 정보 - 자바 FileChangeInfo 기반"""
    filename: str
    status: str  # modified, added, deleted
    additions: int
    deletions: int
    changes: int
    patch: Optional[str] = None
    rawUrl: str
    blobUrl: str
    diffHunks: Optional[List[DiffHunk]] = None


class DescriptionInfo(BaseModel):
    """설명 정보 - 자바 DescriptionInfo 기반"""
    id: Optional[int] = None
    path: Optional[str] = None
    body: Optional[str] = None
    fileIndex: Optional[int] = None
    position: Optional[int] = None
    startLine: Optional[int] = None
    startSide: Optional[str] = None
    line: Optional[int] = None
    side: Optional[str] = None
    diffHunk: Optional[str] = None


class CommitInfo(BaseModel):
    """커밋 정보 - 자바 CommitInfo 기반"""
    sha: str
    message: str
    authorName: str
    authorEmail: str
    authorDate: str
    committerName: str
    committerEmail: str
    committerDate: str
    url: str
    htmlUrl: str
    additions: Optional[int] = None
    deletions: Optional[int] = None
    totalChanges: Optional[int] = None


class RepoInfo(BaseModel):
    """저장소 정보 - 자바 RepoInfo 기반"""
    id: int
    fullName: str

class RepoResponse(BaseModel):
    id: int
    repoId: int
    fullName: str
    accountId: int
    private: bool  # Java에서 'private'로 보내고 있음
    cushion: bool  # Java에서 'cushion'으로 보내고 있음

class PrUserInfo(BaseModel):
    """사용자 정보 - 자바 PrUserInfo 기반"""
    id: int
    githubId: int
    githubUsername: str
    githubEmail: Optional[str] = None

class PriorityInfo(BaseModel):
    """우선순위 정보 - 머지용"""
    id: int
    level: str
    title: str
    content: str

class PriorityInfoPre(BaseModel):
    """우선순위 정보 - 자바 PriorityInfo 기반"""
    level: str
    title: str
    content: str


# Java Info 클래스들과 정확히 일치하는 모델들
class PullRequestFileInfo(BaseModel):
    """Java PullRequestFileInfo와 정확히 일치"""
    filename: str
    status: str
    additions: int
    deletions: int
    changes: int
    patch: Optional[str] = None
    previousFilename: Optional[str] = None
    sha: Optional[str] = None
    blobUrl: Optional[str] = None
    rawUrl: Optional[str] = None


class PullRequestCommitInfo(BaseModel):
    """Java PullRequestCommitInfo와 정확히 일치"""
    sha: str
    message: str
    url: str
    authorName: str
    authorEmail: Optional[str] = None
    authorDate: Union[str, List[int]]
    committerName: str
    committerEmail: Optional[str] = None
    committerDate: Union[str, List[int]]
    
    @field_validator('authorDate', 'committerDate')
    @classmethod
    def validate_date(cls, v):
        if isinstance(v, list) and len(v) >= 6:
            # Java LocalDateTime 배열을 ISO 문자열로 변환
            year, month, day, hour, minute, second = v[:6]
            return f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:{second:02d}"
        return str(v) if v is not None else ""


class PullRequestUserInfo(BaseModel):
    """Java PullRequestUserInfo와 정확히 일치"""
    id: int
    githubUsername: str
    githubEmail: Optional[str] = None


class PullRequestReviewerInfo(BaseModel):
    """Java PullRequestReviewerInfo와 정확히 일치"""
    id: int
    userId: int
    githubUsername: str
    githubEmail: Optional[str] = None
    state: str


class PullRequestPriorityInfo(BaseModel):
    """Java PullRequestPriorityInfo와 정확히 일치"""
    id: int
    level: str
    title: str
    content: str
    relatedFiles: Optional[List[str]] = None

# PreparationResult에 맞춘 주요 데이터 모델
class PreparationResult(BaseModel):
    """PreparationResult - 자바 PreparationResult와 완전히 일치하는 모델"""
    source: str
    target: str
    url: str
    htmlUrl: str
    permalinkUrl: str
    diffUrl: str
    patchUrl: str
    status: str  # GitHub Compare Status
    aheadBy: int
    behindBy: int
    totalCommits: int
    baseCommit: CommitInfo
    mergeBaseCommit: CommitInfo
    commits: List[CommitInfo]
    files: List[FileChangeInfo]
    summary: Optional[str] = None
    preReviewers: Optional[List[PrUserInfo]] = None
    reviewers: Optional[List[PrUserInfo]] = None
    descriptions: Optional[List[DescriptionInfo]] = None
    priorities: Optional[List[PriorityInfoPre]] = None
    author: Optional[PrUserInfo] = None
    repository: Optional[RepoInfo] = None
    title: Optional[str] = None
    body: Optional[str] = None
    isPossible: Optional[bool] = None


# PreparationResult의 별칭으로 PRData 사용 (하위 호환성)
class PRData(PreparationResult):
    """PreparationResult와 동일한 구조 - 하위 호환성을 위해 유지"""
    pass

# MergedPullRequestInfo와 완전히 일치하는 모델
class PRDetailData(BaseModel):
    """MergedPullRequestInfo와 완전히 일치하는 데이터 모델 - 백엔드에서 vector db에 저장용"""
    # PR 기본 정보
    id: int
    githubId: int
    githubPrNumber: int
    title: str
    body: Optional[str] = None
    state: str
    merged: bool
    base: str
    head: str
    mergeable: Optional[bool] = None
    githubCreatedAt: Union[str, List[int]]
    githubUpdatedAt: Union[str, List[int]]
    commitCnt: int
    changedFilesCnt: int
    commentCnt: int
    reviewCommentCnt: int
    htmlUrl: str
    patchUrl: Optional[str] = None
    issueUrl: Optional[str] = None
    diffUrl: Optional[str] = None
    summary: Optional[str] = None
    approveCnt: int
    
    # 객체 정보 - MergedPullRequestInfo 순서대로
    author: PullRequestUserInfo
    repo: RepoResponse
    files: List[PullRequestFileInfo]
    commits: List[PullRequestCommitInfo]
    reviewers: List[PullRequestReviewerInfo]
    priorities: List[PullRequestPriorityInfo]
    
    @field_validator('githubCreatedAt', 'githubUpdatedAt')
    @classmethod
    def validate_github_date(cls, v):
        if isinstance(v, list) and len(v) >= 6:
            # Java LocalDateTime 배열을 ISO 문자열로 변환
            year, month, day, hour, minute, second = v[:6]
            return f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:{second:02d}"
        return str(v) if v is not None else ""