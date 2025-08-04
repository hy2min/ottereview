import chromadb
from chromadb.config import Settings
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

load_dotenv()

logger = logging.getLogger(__name__)

class FileInfo(BaseModel):
    """파일 변경 정보"""
    filename: str
    status: str  # modified, added, deleted
    additions: int
    deletions: int
    patch: str

class CommitInfo(BaseModel):
    """커밋 정보"""
    sha: str
    message: str
    author_name: str
    author_email: str
    additions: int
    deletions: int

class ReviewCommentInfo(BaseModel):
    """리뷰 코멘트 정보"""
    user_name: str
    path: str
    body: str
    position: Optional[int] = None

class ReviewInfo(BaseModel):
    """리뷰 정보"""
    user_github_username: str
    state: str  # APPROVED, REQUEST_CHANGES, COMMENTED
    body: str
    commit_sha: str
    review_comments: List[ReviewCommentInfo] = Field(default_factory=list)

class PRData(BaseModel):
    """Pull Request 전체 데이터"""
    # PR 기본 정보
    source_branch: str
    target_branch: str
    title: str
    body: str
    
    # 저장소 정보 (reviewers에서 추출)
    repository_name: str  # reviewers[0]의 정보에서 추출 가능하다고 가정
    
    # 변경 사항
    files: List[FileInfo]
    commits: List[CommitInfo]
    
    # 리뷰 정보
    reviewers: List[str]  # 리뷰어 username 목록
    reviews: List[ReviewInfo] = Field(default_factory=list)


class VectorDB:
    """ChromaDB를 사용한 PR 벡터 데이터베이스 클래스"""
    
    def __init__(self, db_path: str = None):
        """벡터 DB 초기화 및 설정"""
        self.db_path = db_path or os.getenv("CHROMA_DB_PATH", "./chroma_db")
        
        # ChromaDB 클라이언트 초기화
        self.client = chromadb.PersistentClient(
            path=self.db_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            openai_api_base=os.getenv("OPENAI_API_BASE", "https://gms.ssafy.io/gmsapi/api.openai.com/v1")
        )
        
        # 컬렉션 초기화
        self._ensure_collections()
    
    def _ensure_collections(self):
        """ChromaDB 컬렉션들 생성 및 확인"""
        collections = {
            "pr_collection": "PR 기본 정보와 코드 변경사항",
            "review_collection": "리뷰 내용과 피드백 패턴", 
            "reviewer_collection": "리뷰어 전문성과 경험"
        }
        
        for collection_name, description in collections.items():
            try:
                collection = self.client.get_collection(name=collection_name)
                logger.info(f"컬렉션 {collection_name}이 이미 존재합니다")
            except:
                logger.info(f"컬렉션 {collection_name}을 생성합니다: {description}")
                collection = self.client.create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine", "description": description}
                )
        
        # 컬렉션 참조 저장
        self.pr_collection = self.client.get_collection("pr_collection")
        self.review_collection = self.client.get_collection("review_collection")
        self.reviewer_collection = self.client.get_collection("reviewer_collection")
    
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
    
    async def store_pr_data(self, pr_id: str, pr_data: PRData) -> bool:
        """PR 데이터를 벡터 DB에 저장 (머지 완료 후 호출)"""
        try:
            # 1. PR 기본 정보 저장
            await self._store_pr_info(pr_id, pr_data)
            
            # 2. 리뷰 정보 저장 (있는 경우에만)
            if pr_data.reviews:
                await self._store_review_info(pr_id, pr_data)
            
            # 3. 리뷰어 전문성 정보 업데이트
            await self._update_reviewer_expertise(pr_id, pr_data)
            
            logger.info(f"PR {pr_id} 데이터가 성공적으로 저장되었습니다")
            return True
            
        except Exception as e:
            logger.error(f"PR {pr_id} 저장 중 오류: {str(e)}\n{traceback.format_exc()}")
            return False
    
    async def _store_pr_info(self, pr_id: str, pr_data: PRData):
        """PR 기본 정보 저장"""
        # 변경된 파일 정보 정리
        file_paths = [f.filename for f in pr_data.files]
        file_categories = self._extract_file_categories(pr_data.files)
        
        # 커밋 메시지들 수집
        commit_messages = [c.message for c in pr_data.commits]
        authors = list(set([c.author_name for c in pr_data.commits]))
        
        # 전체 변경량 계산
        total_additions = sum(f.additions for f in pr_data.files)
        total_deletions = sum(f.deletions for f in pr_data.files)
        
        # 벡터화용 텍스트 생성
        content_parts = [
            f"저장소: {pr_data.repository_name}",
            f"브랜치: {pr_data.source_branch} -> {pr_data.target_branch}",
            f"제목: {pr_data.title}",
            f"설명: {pr_data.body}",
            f"변경된 파일: {', '.join(file_paths)}",
            f"커밋 메시지: {' '.join(commit_messages)}",
            f"작성자: {', '.join(authors)}",
            f"파일 카테고리: {', '.join(file_categories.keys())}"
        ]
        
        content = " ".join(content_parts)
        content_vector = await self.embeddings.aembed_query(content)
        
        # 메타데이터 준비
        metadata = {
            "pr_id": pr_id,
            "repository": pr_data.repository_name,
            "source_branch": pr_data.source_branch,
            "target_branch": pr_data.target_branch,
            "title": pr_data.title,
            "authors": ",".join(authors),
            "file_paths": ",".join(file_paths),
            "file_categories": ",".join(file_categories.keys()),
            "total_additions": total_additions,
            "total_deletions": total_deletions,
            "files_changed": len(pr_data.files),
            "commits_count": len(pr_data.commits),
            "reviewers": ",".join(pr_data.reviewers)
        }
        
        # ChromaDB에 저장
        self.pr_collection.upsert(
            ids=[pr_id],
            embeddings=[content_vector],
            documents=[content],
            metadatas=[metadata]
        )
    
    async def _store_review_info(self, pr_id: str, pr_data: PRData):
        """리뷰 정보 저장"""
        for i, review in enumerate(pr_data.reviews):
            review_id = f"{pr_id}_review_{i}"
            
            # 리뷰 코멘트들 수집
            comment_texts = [rc.body for rc in review.review_comments]
            comment_files = [rc.path for rc in review.review_comments]
            
            # 벡터화용 텍스트 생성
            content_parts = [
                f"리뷰어: {review.user_github_username}",
                f"리뷰 상태: {review.state}",
                f"리뷰 내용: {review.body}",
            ]
            
            if comment_texts:
                content_parts.append(f"코멘트: {' '.join(comment_texts)}")
            if comment_files:
                content_parts.append(f"코멘트 파일: {', '.join(set(comment_files))}")
            
            content = " ".join(content_parts)
            content_vector = await self.embeddings.aembed_query(content)
            
            # 메타데이터 준비
            metadata = {
                "pr_id": pr_id,
                "reviewer": review.user_github_username,
                "review_state": review.state,
                "comment_count": len(review.review_comments),
                "reviewed_files": ",".join(set(comment_files)),
                "has_detailed_comments": len(comment_texts) > 0
            }
            
            # ChromaDB에 저장
            self.review_collection.upsert(
                ids=[review_id],
                embeddings=[content_vector],
                documents=[content],
                metadatas=[metadata]
            )
    
    async def _update_reviewer_expertise(self, pr_id: str, pr_data: PRData):
        """리뷰어 전문성 정보 업데이트"""
        file_categories = self._extract_file_categories(pr_data.files)
        file_paths = [f.filename for f in pr_data.files]
        
        for reviewer in pr_data.reviewers:
            reviewer_id = f"reviewer_{reviewer}"
            
            # 기존 전문성 정보 조회
            try:
                existing = self.reviewer_collection.get(ids=[reviewer_id])
                if existing['metadatas']:
                    # 기존 정보 업데이트
                    existing_metadata = existing['metadatas'][0]
                    reviewed_repos = existing_metadata.get("reviewed_repositories", "").split(",")
                    if pr_data.repository_name not in reviewed_repos:
                        reviewed_repos.append(pr_data.repository_name)
                    
                    total_prs = int(existing_metadata.get("total_prs_reviewed", 0)) + 1
                    
                    # 파일 카테고리별 경험 업데이트
                    for category in file_categories.keys():
                        category_key = f"{category}_experience"
                        current_exp = int(existing_metadata.get(category_key, 0))
                        existing_metadata[category_key] = current_exp + 1
                    
                    existing_metadata.update({
                        "reviewed_repositories": ",".join(filter(None, reviewed_repos)),
                        "total_prs_reviewed": total_prs,
                        "last_reviewed_files": ",".join(file_paths)
                    })
                    
                    metadata = existing_metadata
                else:
                    # 새로운 리뷰어
                    metadata = self._create_new_reviewer_metadata(reviewer, pr_data, file_categories, file_paths)
            except:
                # 새로운 리뷰어
                metadata = self._create_new_reviewer_metadata(reviewer, pr_data, file_categories, file_paths)
            
            # 벡터화용 텍스트 생성
            content = f"리뷰어: {reviewer} 전문 분야: {', '.join(file_categories.keys())} 저장소: {pr_data.repository_name}"
            content_vector = await self.embeddings.aembed_query(content)
            
            # ChromaDB에 저장
            self.reviewer_collection.upsert(
                ids=[reviewer_id],
                embeddings=[content_vector],
                documents=[content],
                metadatas=[metadata]
            )
    
    def _create_new_reviewer_metadata(self, reviewer: str, pr_data: PRData, file_categories: Dict[str, int], file_paths: List[str]) -> Dict[str, Any]:
        """새로운 리뷰어 메타데이터 생성"""
        metadata = {
            "reviewer_username": reviewer,
            "reviewed_repositories": pr_data.repository_name,
            "total_prs_reviewed": 1,
            "last_reviewed_files": ",".join(file_paths)
        }
        
        # 파일 카테고리별 경험 초기화
        for category in file_categories.keys():
            metadata[f"{category}_experience"] = 1
        
        return metadata
    
    async def find_similar_prs(self, query_content: str, limit: int = 10) -> List[Dict[str, Any]]:
        """유사한 PR들 찾기"""
        try:
            query_vector = await self.embeddings.aembed_query(query_content)
            
            results = self.pr_collection.query(
                query_embeddings=[query_vector],
                n_results=limit,
                include=["metadatas", "distances", "documents"]
            )
            
            similar_prs = []
            if results['ids'] and results['metadatas'] and results['distances']:
                for pr_id, metadata, distance in zip(
                    results['ids'][0], results['metadatas'][0], results['distances'][0]
                ):
                    similarity_score = 1 - distance
                    
                    similar_prs.append({
                        "pr_id": metadata.get("pr_id"),
                        "repository": metadata.get("repository"),
                        "title": metadata.get("title"),
                        "source_branch": metadata.get("source_branch"),
                        "target_branch": metadata.get("target_branch"),
                        "authors": metadata.get("authors", "").split(",") if metadata.get("authors") else [],
                        "reviewers": metadata.get("reviewers", "").split(",") if metadata.get("reviewers") else [],
                        "file_paths": metadata.get("file_paths", "").split(",") if metadata.get("file_paths") else [],
                        "file_categories": metadata.get("file_categories", "").split(",") if metadata.get("file_categories") else [],
                        "total_additions": int(metadata.get("total_additions", 0)),
                        "total_deletions": int(metadata.get("total_deletions", 0)),
                        "similarity_score": float(similarity_score)
                    })
            
            return similar_prs
            
        except Exception as e:
            logger.error(f"유사한 PR 찾기 중 오류: {str(e)}")
            return []
    
    async def get_reviewer_recommendations(self, pr_data: PRData, limit: int = 5) -> Dict[str, Any]:
        """리뷰어 추천을 위한 컨텍스트"""
        try:
            # 현재 PR 정보로 쿼리 생성
            file_categories = self._extract_file_categories(pr_data.files)
            query_content = f"파일 카테고리: {', '.join(file_categories.keys())} 저장소: {pr_data.repository_name}"
            
            # 유사한 PR들 찾기
            similar_prs = await self.find_similar_prs(query_content, limit=20)
            
            # 리뷰어 경험 정보 수집
            query_vector = await self.embeddings.aembed_query(query_content)
            reviewer_results = self.reviewer_collection.query(
                query_embeddings=[query_vector],
                n_results=10,
                include=["metadatas", "distances"]
            )
            
            reviewer_scores = {}
            
            # 유사한 PR에서 리뷰어 점수 계산
            for similar_pr in similar_prs:
                if similar_pr["similarity_score"] > 0.3:
                    for reviewer in similar_pr["reviewers"]:
                        if reviewer and reviewer not in [c.author_name for c in pr_data.commits]:
                            if reviewer not in reviewer_scores:
                                reviewer_scores[reviewer] = {
                                    "similarity_score": 0,
                                    "pr_count": 0,
                                    "file_expertise": set()
                                }
                            
                            reviewer_scores[reviewer]["similarity_score"] += similar_pr["similarity_score"]
                            reviewer_scores[reviewer]["pr_count"] += 1
                            reviewer_scores[reviewer]["file_expertise"].update(similar_pr["file_categories"])
            
            # 리뷰어 전문성 점수 추가
            if reviewer_results['metadatas']:
                for metadata, distance in zip(reviewer_results['metadatas'][0], reviewer_results['distances'][0]):
                    reviewer = metadata.get("reviewer_username")
                    if reviewer and reviewer not in reviewer_scores:
                        reviewer_scores[reviewer] = {
                            "similarity_score": 0,
                            "pr_count": 0,
                            "file_expertise": set()
                        }
                    
                    if reviewer:
                        expertise_score = 1 - distance
                        reviewer_scores[reviewer]["expertise_score"] = expertise_score
                        reviewer_scores[reviewer]["total_reviews"] = int(metadata.get("total_prs_reviewed", 0))
                        
                        # 파일 카테고리별 경험 추가
                        for category in file_categories.keys():
                            exp_key = f"{category}_experience"
                            if exp_key in metadata:
                                reviewer_scores[reviewer]["file_expertise"].add(category)
            
            # 점수 정규화 및 정렬
            for reviewer_data in reviewer_scores.values():
                if reviewer_data["pr_count"] > 0:
                    reviewer_data["avg_similarity"] = reviewer_data["similarity_score"] / reviewer_data["pr_count"]
                else:
                    reviewer_data["avg_similarity"] = 0
                
                reviewer_data["file_expertise"] = list(reviewer_data["file_expertise"])
            
            # 추천 점수 계산 및 정렬
            recommendations = []
            for reviewer, data in reviewer_scores.items():
                score = (
                    data.get("avg_similarity", 0) * 0.4 +
                    data.get("expertise_score", 0) * 0.3 +
                    min(data.get("total_reviews", 0) / 10, 1) * 0.3
                )
                
                recommendations.append({
                    "reviewer": reviewer,
                    "score": score,
                    "rationale": {
                        "similar_prs_reviewed": data["pr_count"],
                        "avg_similarity": data.get("avg_similarity", 0),
                        "expertise_areas": data["file_expertise"],
                        "total_reviews": data.get("total_reviews", 0)
                    }
                })
            
            recommendations.sort(key=lambda x: x["score"], reverse=True)
            
            return {
                "current_pr": {
                    "repository": pr_data.repository_name,
                    "file_categories": list(file_categories.keys()),
                    "files_changed": len(pr_data.files),
                    "authors": list(set([c.author_name for c in pr_data.commits]))
                },
                "recommendations": recommendations[:limit],
                "similar_prs_analyzed": len(similar_prs)
            }
            
        except Exception as e:
            logger.error(f"리뷰어 추천 중 오류: {str(e)}")
            return {"error": str(e)}
    
    async def get_title_suggestions(self, pr_data: PRData) -> Dict[str, Any]:
        """PR 제목 추천을 위한 컨텍스트"""
        try:
            # 현재 PR 분석
            file_categories = self._extract_file_categories(pr_data.files)
            commit_messages = [c.message for c in pr_data.commits]
            
            query_content = f"저장소: {pr_data.repository_name} 파일: {', '.join([f.filename for f in pr_data.files])} 커밋: {' '.join(commit_messages)}"
            similar_prs = await self.find_similar_prs(query_content, limit=10)
            
            # 패턴 분석
            title_patterns = []
            for similar_pr in similar_prs:
                if similar_pr["similarity_score"] > 0.3:
                    title_patterns.append({
                        "title": similar_pr["title"],
                        "similarity": similar_pr["similarity_score"],
                        "file_categories": similar_pr["file_categories"],
                        "repository": similar_pr["repository"]
                    })
            
            return {
                "current_pr": {
                    "repository": pr_data.repository_name,
                    "source_branch": pr_data.source_branch,
                    "target_branch": pr_data.target_branch,
                    "commit_messages": commit_messages,
                    "file_categories": list(file_categories.keys()),
                    "total_additions": sum(f.additions for f in pr_data.files),
                    "total_deletions": sum(f.deletions for f in pr_data.files),
                    "files_changed": len(pr_data.files),
                    "is_single_commit": len(pr_data.commits) == 1,
                    "is_single_file": len(pr_data.files) == 1
                },
                "similar_patterns": title_patterns[:5],
                "analysis": {
                    "has_tests": any("test" in f.filename.lower() for f in pr_data.files),
                    "has_docs": any("doc" in f.filename.lower() or "readme" in f.filename.lower() for f in pr_data.files),
                    "is_feature": sum(f.additions for f in pr_data.files) > sum(f.deletions for f in pr_data.files) * 2,
                    "is_refactor": sum(f.deletions for f in pr_data.files) > sum(f.additions for f in pr_data.files),
                    "main_category": max(file_categories.items(), key=lambda x: x[1])[0] if file_categories else "other"
                }
            }
            
        except Exception as e:
            logger.error(f"제목 추천 중 오류: {str(e)}")
            return {"error": str(e)}
    
    async def get_priority_suggestions(self, pr_data: PRData) -> Dict[str, Any]:
        """우선순위 추천을 위한 컨텍스트"""
        try:
            file_categories = self._extract_file_categories(pr_data.files)
            
            # 파일별 우선순위 분석
            file_priorities = []
            for file_info in pr_data.files:
                priority_score = 0
                reasons = []
                
                # 파일 크기 기준
                total_changes = file_info.additions + file_info.deletions
                if total_changes > 100:
                    priority_score += 3
                    reasons.append("대규모 변경")
                elif total_changes > 50:
                    priority_score += 2
                    reasons.append("중간 규모 변경")
                
                # 파일 타입 기준
                ext = os.path.splitext(file_info.filename)[1].lower()
                if ext in ['.py', '.java', '.js', '.ts']:
                    priority_score += 2
                    reasons.append("핵심 소스코드")
                elif 'test' in file_info.filename.lower():
                    priority_score += 1
                    reasons.append("테스트 코드")
                elif ext in ['.md', '.txt']:
                    priority_score += 0
                    reasons.append("문서")
                
                # 변경 타입 기준
                if file_info.status == 'added':
                    priority_score += 2
                    reasons.append("새 파일 추가")
                elif file_info.status == 'deleted':
                    priority_score += 1
                    reasons.append("파일 삭제")
                
                file_priorities.append({
                    "filename": file_info.filename,
                    "priority_score": priority_score,
                    "reasons": reasons,
                    "additions": file_info.additions,
                    "deletions": file_info.deletions,
                    "status": file_info.status
                })
            
            # 우선순위별로 정렬
            file_priorities.sort(key=lambda x: x["priority_score"], reverse=True)
            
            # 우선순위 그룹 생성
            high_priority = [f for f in file_priorities if f["priority_score"] >= 4]
            medium_priority = [f for f in file_priorities if 2 <= f["priority_score"] < 4]
            low_priority = [f for f in file_priorities if f["priority_score"] < 2]
            
            return {
                "current_pr": {
                    "repository": pr_data.repository_name,
                    "total_files": len(pr_data.files),
                    "file_categories": list(file_categories.keys()),
                    "total_additions": sum(f.additions for f in pr_data.files),
                    "total_deletions": sum(f.deletions for f in pr_data.files)
                },
                "priority_groups": {
                    "high": high_priority,
                    "medium": medium_priority,
                    "low": low_priority
                },
                "recommendations": {
                    "review_order": [f["filename"] for f in file_priorities],
                    "focus_areas": [f["filename"] for f in high_priority],
                    "total_priority_files": len(high_priority) + len(medium_priority)
                }
            }
            
        except Exception as e:
            logger.error(f"우선순위 추천 중 오류: {str(e)}")
            return {"error": str(e)}

# 전역 인스턴스
vector_db = VectorDB()