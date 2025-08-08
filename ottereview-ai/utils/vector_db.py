import pinecone
from pinecone import Pinecone, ServerlessSpec
import json
import logging
import numpy as np
from typing import List, Dict, Optional, Any, Tuple
from pydantic import BaseModel, Field
import hashlib
import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
import traceback
import uuid
from datetime import datetime
from collections import defaultdict

load_dotenv()

logger = logging.getLogger(__name__)

class DiffHunkLine(BaseModel):
    """diff hunk의 각 라인 정보"""
    oldLine: Optional[int] = None
    newLine: Optional[int] = None
    type: str  # context, addition, deletion
    content: str
    position: int

class DiffHunk(BaseModel):
    """diff hunk 정보"""
    oldStart: int
    oldLines: int
    newStart: int
    newLines: int
    context: str
    lines: List[DiffHunkLine]

class FileInfo(BaseModel):
    """파일 변경 정보"""
    filename: str
    status: str  # modified, added, deleted
    additions: int
    deletions: int
    changes: int
    patch: Optional[str] = None
    rawUrl: str
    blobUrl: str
    diffHunks: Optional[List[DiffHunk]] = None

class CommitInfo(BaseModel):
    """커밋 정보"""
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
    additions: int
    deletions: int
    totalChanges: int

class AuthorInfo(BaseModel):
    """작성자 정보"""
    id: int
    githubUsername: str
    githubEmail: str

class RepositoryInfo(BaseModel):
    """저장소 정보"""
    id: int
    fullName: str

class PreReviewers(BaseModel):
    """PR 리뷰어 정보"""
    id: int
    githubUsername: str
    githubEmail: str

class Reviewers(BaseModel):
    """PR 리뷰어 정보"""
    id: int
    githubUsername: str
    githubEmail: str
    
class PRData(BaseModel):
    """Pull Request 전체 데이터"""
    # PR 기본 정보
    pr_id: Optional[int] = None
    source: str
    target: str
    url: str
    htmlUrl: str
    permalinkUrl: str
    diffUrl: str
    patchUrl: str
    status: str
    aheadBy: int
    behindBy: int
    totalCommits: int
    
    # 커밋 정보
    baseCommit: CommitInfo
    mergeBaseCommit: CommitInfo
    commits: List[CommitInfo]
    
    # 파일 변경 정보
    files: List[FileInfo]
    
    # 기타 정보 (null일 수 있음)
    summary: Optional[str] = None
    pre_reviewers: Optional[List[PreReviewers]] = None
    reviewers: Optional[List[Reviewers]] = None  # JSON에서는 null
    reviews: Optional[List] = None  # JSON에서는 null
    descriptions: Optional[List] = None  # JSON에서는 null
    priorities: Optional[List] = None  # JSON에서는 null
    title: Optional[str] = None  # JSON에서는 null
    body: Optional[str] = None  # JSON에서는 null
    
    # 작성자 및 저장소 정보
    author: AuthorInfo
    repository: RepositoryInfo


class PineconeVectorDB:
    """RAG 파이프라인을 위한 Pinecone 벡터 데이터베이스"""
    
    def __init__(self):
        """Pinecone 벡터 DB 초기화"""
        # Pinecone 클라이언트 초기화
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        
        # OpenAI 임베딩 초기화
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            openai_api_base=os.getenv("OPENAI_API_BASE", "https://gms.ssafy.io/gmsapi/api.openai.com/v1")
        )
        
        # 인덱스 설정
        self.index_configs = {
            "reviewer-patterns": {
                "dimension": 1536,
                "metric": "cosine",
                "description": "리뷰어 선택 패턴과 전문성"
            },
            "priority-patterns": {
                "dimension": 1536,
                "metric": "cosine",
                "description": "의미 단위별 리뷰 우선순위 패턴"
            }
        }
        
        # 인덱스 초기화
        self._ensure_indexes()
    
    def _ensure_indexes(self):
        """Pinecone 인덱스들 생성 및 확인"""
        existing_indexes = [index.name for index in self.pc.list_indexes()]
        
        for index_name, config in self.index_configs.items():
            if index_name not in existing_indexes:
                logger.info(f"인덱스 {index_name}을 생성합니다: {config['description']}")
                
                self.pc.create_index(
                    name=index_name,
                    dimension=config["dimension"],
                    metric=config["metric"],
                    spec=ServerlessSpec(
                        cloud='aws',
                        region='us-east-1'
                    )
                )
            else:
                logger.info(f"인덱스 {index_name}이 이미 존재합니다")
        
        # 인덱스 참조 저장
        self.reviewer_patterns_index = self.pc.Index("reviewer-patterns")
        self.priority_patterns_index = self.pc.Index("priority-patterns")
    
    def _extract_file_categories(self, files: List[FileInfo]) -> Dict[str, int]:
        """파일 확장자별 카테고리 분류"""
        categories = {}
        for file in files:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext in ['.py', '.java', '.js', '.ts', '.cpp', '.c', '.go']:
                category = 'source_code'
            elif ext in ['.md', '.txt', '.rst']:
                category = 'documentation'
            elif ext in ['.json', '.yaml', '.yml', '.xml', '.toml']:
                category = 'configuration'
            elif 'test' in file.filename.lower() or ext in ['.test.js', '.spec.js']:
                category = 'test'
            else:
                category = 'other'
            
            categories[category] = categories.get(category, 0) + 1
        return categories
    
    async def store_pr_data(self, pr_id: int, pr_data: PRData) -> bool:
        """PR 데이터를 벡터 DB에 저장 (머지 완료 후 호출)"""
        try:
            # 1. 리뷰어 패턴 저장 (리뷰어 추천용)
            await self._store_reviewer_patterns(pr_id, pr_data)
            
            # 2. 우선순위 패턴 저장 (우선순위 추천용)
            await self._store_priority_patterns(pr_id, pr_data)
            
            logger.info(f"PR {pr_id} 데이터가 성공적으로 저장되었습니다")
            return True
            
        except Exception as e:
            logger.error(f"PR {pr_id} 저장 중 오류: {str(e)}\n{traceback.format_exc()}")
            return False
    
    async def _store_reviewer_patterns(self, pr_id: str, pr_data: PRData):
        """리뷰어 추천을 위한 패턴 저장"""
        if not pr_data.reviewers:
            return
            
        file_categories = self._extract_file_categories(pr_data.files)
        reviewer_usernames = [r.githubUsername for r in pr_data.reviewers]
        
        # 각 리뷰어별로 패턴 저장
        for i, reviewer_info in enumerate(pr_data.reviewers):
            context_parts = [
                f"리뷰어: {reviewer_info.githubUsername}",
                f"파일 타입: {', '.join(file_categories.keys())}",
                f"브랜치: {pr_data.source} -> {pr_data.target}",
                f"파일들: {', '.join([f.filename for f in pr_data.files])}"
            ]
            
            # 리뷰 내용이 있으면 추가
            if pr_data.reviews:
                reviewer_reviews = [r for r in pr_data.reviews if r.user_github_username == reviewer_info.githubUsername]
                if reviewer_reviews:
                    review_texts = [r.body for r in reviewer_reviews if r.body]
                    comment_texts = []
                    for review in reviewer_reviews:
                        comment_texts.extend([c.body for c in review.review_comments])
                    
                    if review_texts:
                        context_parts.append(f"리뷰 내용: {' '.join(review_texts)}")
                    if comment_texts:
                        context_parts.append(f"코멘트: {' '.join(comment_texts)}")
            
            context = " ".join(context_parts)
            context_vector = await self.embeddings.aembed_query(context)
            
            metadata = {
                "pr_id": str(pr_id),
                "repository_id": str(pr_data.repository.id),
                "repository_name": pr_data.repository.fullName,
                "reviewer": reviewer_info.githubUsername,
                "reviewer_email": reviewer_info.githubEmail,
                "file_categories": ",".join(file_categories.keys()),
                "files_reviewed": ",".join([f.filename for f in pr_data.files])[:500],
                "review_provided": str(bool(pr_data.reviews)),
                "timestamp": datetime.now().isoformat()
            }
            
            self.reviewer_patterns_index.upsert(vectors=[{
                "id": f"{pr_id}_reviewer_{i}",
                "values": context_vector,
                "metadata": metadata
            }])
    
    async def _store_priority_patterns(self, pr_id: int, pr_data: PRData):
        """의미 단위별 우선순위 패턴 저장"""
        file_categories = self._extract_file_categories(pr_data.files)
        commit_messages = [c.message for c in pr_data.commits]
        
        # 기능별/의미별 그룹화 (간단한 휴리스틱)
        functional_groups = self._group_files_by_function(pr_data.files, commit_messages)
        
        # 각 기능 그룹별로 패턴 저장
        for i, group in enumerate(functional_groups):
            context_parts = [
                f"기능영역: {group['category']}",
                f"관련파일: {', '.join(group['files'])}",
                f"변경규모: {group['change_scale']}",
                f"커밋메시지: {group['related_commits']}",
                f"파일타입: {', '.join(group['file_types'])}",
                f"브랜치: {pr_data.source} -> {pr_data.target}"
            ]
            
            context = " ".join(context_parts)
            context_vector = await self.embeddings.aembed_query(context)
            
            metadata = {
                "pr_id": str(pr_id),
                "repository_id": str(pr_data.repository.id),
                "repository_name": pr_data.repository.fullName,
                "functional_category": group['category'],
                "related_files": ",".join(group['files'])[:500],
                "change_scale": group['change_scale'],
                "file_types": ",".join(group['file_types']),
                "total_changes": str(group['total_changes']),
                "complexity_level": group['complexity_level'],
                "priority_indicators": ",".join(group['priority_indicators']),
                "related_commits": group['related_commits'][:300],
                "timestamp": datetime.now().isoformat()
            }
            
            self.priority_patterns_index.upsert(vectors=[{
                "id": f"{pr_id}_priority_{i}",
                "values": context_vector,
                "metadata": metadata
            }])
    
    def _group_files_by_function(self, files: List[FileInfo], commit_messages: List[str]) -> List[Dict[str, Any]]:
        """파일들을 기능/의미 단위로 그룹화"""
        groups = []
        
        # 1. 인증/보안 관련
        auth_files = [f for f in files if any(keyword in f.filename.lower() 
                     for keyword in ['auth', 'jwt', 'token', 'security', 'login', 'password'])]
        if auth_files:
            groups.append(self._create_functional_group(
                auth_files, "인증/보안", commit_messages, ["보안중요", "인증로직"]
            ))
        
        # 2. API/엔드포인트 관련  
        api_files = [f for f in files if any(keyword in f.filename.lower()
                    for keyword in ['api', 'controller', 'endpoint', 'route', 'handler'])]
        if api_files:
            groups.append(self._create_functional_group(
                api_files, "API/엔드포인트", commit_messages, ["API변경", "엔드포인트"]
            ))
        
        # 3. 데이터베이스 관련
        db_files = [f for f in files if any(keyword in f.filename.lower()
                   for keyword in ['model', 'entity', 'migration', 'schema', 'database', 'db'])]
        if db_files:
            groups.append(self._create_functional_group(
                db_files, "데이터베이스", commit_messages, ["스키마변경", "데이터베이스"]
            ))
        
        # 4. 테스트 관련
        test_files = [f for f in files if 'test' in f.filename.lower()]
        if test_files:
            groups.append(self._create_functional_group(
                test_files, "테스트", commit_messages, ["테스트코드"]
            ))
        
        # 5. 설정/환경 관련
        config_files = [f for f in files if any(keyword in f.filename.lower()
                       for keyword in ['config', 'env', 'setting', 'properties', 'yaml', 'json'])]
        if config_files:
            groups.append(self._create_functional_group(
                config_files, "설정/환경", commit_messages, ["환경설정", "설정변경"]
            ))
        
        # 6. UI/프론트엔드 관련
        ui_files = [f for f in files if any(keyword in f.filename.lower()
                   for keyword in ['component', 'view', 'page', 'template', 'css', 'style'])]
        if ui_files:
            groups.append(self._create_functional_group(
                ui_files, "UI/프론트엔드", commit_messages, ["UI변경", "프론트엔드"]
            ))
        
        # 7. 나머지 파일들 (기타)
        grouped_files = set()
        for group in groups:
            grouped_files.update(group['files'])
        
        remaining_files = [f for f in files if f.filename not in grouped_files]
        if remaining_files:
            groups.append(self._create_functional_group(
                remaining_files, "기타", commit_messages, ["기타변경"]
            ))
        
        return groups
    
    def _create_functional_group(self, files: List[FileInfo], category: str, 
                               commit_messages: List[str], priority_indicators: List[str]) -> Dict[str, Any]:
        """기능 그룹 생성"""
        total_changes = sum(f.additions + f.deletions for f in files)
        file_types = list(set([os.path.splitext(f.filename)[1].lower() for f in files]))
        
        # 변경 규모 계산
        if total_changes > 200:
            change_scale = "대규모"
            priority_indicators.append("대규모변경")
        elif total_changes > 50:
            change_scale = "중간규모"
            priority_indicators.append("중간규모변경")
        else:
            change_scale = "소규모"
        
        # 복잡도 계산
        if len(files) > 5:
            complexity_level = "복잡"
            priority_indicators.append("복잡한변경")
        elif len(files) > 2:
            complexity_level = "보통"
        else:
            complexity_level = "단순"
        
        # 관련 커밋 메시지 찾기
        related_commits = " ".join([msg for msg in commit_messages 
                                  if any(keyword in msg.lower() for keyword in category.lower().split('/'))])
        
        return {
            "category": category,
            "files": [f.filename for f in files],
            "change_scale": change_scale,
            "complexity_level": complexity_level,
            "total_changes": total_changes,
            "file_types": file_types,
            "priority_indicators": priority_indicators,
            "related_commits": related_commits or " ".join(commit_messages)
        }
    
    async def get_similar_reviewer_patterns(self, pr_data: PRData, limit: int = 10) -> List[Dict[str, Any]]:
        """현재 PR과 유사한 리뷰어 패턴 검색"""
        try:
            # 현재 PR 분석
            file_categories = self._extract_file_categories(pr_data.files)
            commit_messages = [c.message for c in pr_data.commits]
            
            # 기능별 그룹 분석
            functional_groups = self._group_files_by_function(pr_data.files, commit_messages)
            main_categories = [group['category'] for group in functional_groups]
            
            # 주요 파일들 추출
            main_files = [f.filename for f in pr_data.files[:5]]  # 상위 5개 파일
            
            # 검색 쿼리 생성
            query_parts = [
                f"기능영역: {', '.join(main_categories)}",
                f"파일타입: {', '.join(file_categories.keys())}",
                f"파일들: {', '.join(main_files)}",
                f"브랜치: {pr_data.source} -> {pr_data.target}",
                f"커밋: {' '.join(commit_messages)}"
            ]
            
            query = " ".join(query_parts)
            return await self.search_reviewer_patterns(query, pr_data.repository.id, limit)
            
        except Exception as e:
            logger.error(f"유사한 리뷰어 패턴 검색 중 오류: {str(e)}")
            return []

    
    async def search_reviewer_patterns(self, query: str, repository_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """유사한 리뷰어 패턴 검색 (리뷰어 추천용)"""
        try:
            query_vector = await self.embeddings.aembed_query(query)
            
            results = self.reviewer_patterns_index.query(
                vector=query_vector,
                top_k=limit,
                include_metadata=True,
                filter={"repository_id": str(repository_id)}
            )
            
            patterns = []
            for match in results.matches:
                metadata = match.metadata
                patterns.append({
                    "pr_id": metadata.get("pr_id"),
                    "repository_id": metadata.get("repository_id"),
                    "repository_name": metadata.get("repository_name"),
                    "reviewer": metadata.get("reviewer"),
                    "reviewer_email": metadata.get("reviewer_email"),
                    "file_categories": metadata.get("file_categories", "").split(",") if metadata.get("file_categories") else [],
                    "files_reviewed": metadata.get("files_reviewed", "").split(",") if metadata.get("files_reviewed") else [],
                    "review_provided": metadata.get("review_provided") == "true",
                    "similarity_score": float(match.score)
                })
            
            return patterns
            
        except Exception as e:
            logger.error(f"리뷰어 패턴 검색 중 오류: {str(e)}")
            return []
    
    async def get_similar_priority_patterns(self, pr_data: PRData, limit: int = 5) -> List[Dict[str, Any]]:
        """현재 PR과 유사한 우선순위 패턴 검색"""
        try:
            # 현재 PR 분석
            file_categories = self._extract_file_categories(pr_data.files)
            commit_messages = [c.message for c in pr_data.commits]
            total_changes = sum(f.additions + f.deletions for f in pr_data.files)
            
            # 기능별 그룹 분석
            functional_groups = self._group_files_by_function(pr_data.files, commit_messages)
            main_categories = [group['category'] for group in functional_groups]
            
            # 변경 규모 계산
            if total_changes > 200:
                change_scale = "대규모"
            elif total_changes > 50:
                change_scale = "중간규모"
            else:
                change_scale = "소규모"
            
            # 검색 쿼리 생성
            query_parts = [
                f"기능영역: {', '.join(main_categories)}",
                f"파일타입: {', '.join(file_categories.keys())}",
                f"변경규모: {change_scale}",
                f"브랜치: {pr_data.source} -> {pr_data.target}",
                f"커밋: {' '.join(commit_messages)}"
            ]
            
            query = " ".join(query_parts)
            return await self.search_priority_patterns(query, pr_data.repository.id, limit)
            
        except Exception as e:
            logger.error(f"유사한 우선순위 패턴 검색 중 오류: {str(e)}")
            return []
        
    async def search_priority_patterns(self, query: str, repository_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """유사한 우선순위 패턴 검색 (우선순위 추천용)"""
        try:
            query_vector = await self.embeddings.aembed_query(query)
            
            results = self.priority_patterns_index.query(
                vector=query_vector,
                top_k=limit,
                include_metadata=True,
                filter={"repository_id": str(repository_id)}
            )
            
            patterns = []
            for match in results.matches:
                metadata = match.metadata
                patterns.append({
                    "pr_id": metadata.get("pr_id"),
                    "repository_id": metadata.get("repository_id"),
                    "repository_name": metadata.get("repository_name"),
                    "functional_category": metadata.get("functional_category"),
                    "related_files": metadata.get("related_files", "").split(",") if metadata.get("related_files") else [],
                    "change_scale": metadata.get("change_scale"),
                    "file_types": metadata.get("file_types", "").split(",") if metadata.get("file_types") else [],
                    "total_changes": int(metadata.get("total_changes", "0")),
                    "complexity_level": metadata.get("complexity_level"),
                    "priority_indicators": metadata.get("priority_indicators", "").split(",") if metadata.get("priority_indicators") else [],
                    "related_commits": metadata.get("related_commits"),
                    "similarity_score": float(match.score)
                })
            
            return patterns
            
        except Exception as e:
            logger.error(f"우선순위 패턴 검색 중 오류: {str(e)}")
            return []
    
    def delete_index(self, index_name: str):
        """인덱스 삭제 (개발/테스트용)"""
        try:
            self.pc.delete_index(index_name)
            logger.info(f"인덱스 {index_name}이 삭제되었습니다")
        except Exception as e:
            logger.error(f"인덱스 {index_name} 삭제 중 오류: {str(e)}")
    
    def get_index_stats(self, index_name: str) -> Dict[str, Any]:
        """인덱스 통계 조회"""
        try:
            index = self.pc.Index(index_name)
            stats = index.describe_index_stats()
            return {
                "total_vector_count": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": stats.namespaces
            }
        except Exception as e:
            logger.error(f"인덱스 {index_name} 통계 조회 중 오류: {str(e)}")
            return {"error": str(e)}

# 전역 인스턴스
vector_db = PineconeVectorDB()

"""
RAG 파이프라인 사용 예시:

# 1. PR 데이터 저장 (머지 완료 후)
await vector_db.store_pr_data("pr_123", pr_data)

# 1. 리뷰어 추천을 위한 패턴 검색 (PRData 입력)
reviewer_patterns = await vector_db.get_similar_reviewer_patterns(pr_data, limit=10)

# 2. 우선순위 추천을 위한 패턴 검색 (PRData 입력)
priority_patterns = await vector_db.get_similar_priority_patterns(pr_data, limit=5)
"""