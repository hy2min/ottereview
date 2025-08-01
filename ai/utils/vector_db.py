import redis
import json
import logging
import numpy as np
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime, timezone
from dataclasses import dataclass, field
from redis.commands.search.field import TextField, VectorField, NumericField, TagField
from redis.commands.search.indexing import IndexDefinition, IndexType
from redis.commands.search.query import Query
import hashlib
import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
import traceback

load_dotenv()

logger = logging.getLogger(__name__)

@dataclass
class FileChange:
    """파일 변경 정보"""
    path: str
    status: str
    category: str
    changes: str
    summary: str
    patch: str

@dataclass
class CommitInfo:
    """커밋 정보"""
    order: int
    author: str
    message: str
    total_additions: int
    total_deletions: int
    files_changed: int
    files: List[FileChange]

@dataclass
class PRInfo:
    """Pull Request 정보를 담는 데이터 클래스 (FastAPI 요청 바디와 1:1 매핑)"""
    pr_id: str
    repository: str
    language: str
    branch: str
    base_branch: str
    commits: List[CommitInfo]
    reviewers: List[str] = field(default_factory=list)

class VectorDB:
    """Redis를 사용한 PR 벡터 데이터베이스 클래스"""
    
    def __init__(self, redis_url: str = None):
        """벡터 DB 초기화 및 설정"""
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
        
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            openai_api_base=os.getenv("OPENAI_API_BASE", "https://gms.ssafy.io/gmsapi/api.openai.com/v1")
        )
        
        self.vector_dim = 1536
        self.index_name = "pr_index"
        
        self._ensure_index()
    
    def _get_schema_hash(self, schema):
        """스키마를 해시하여 고유한 인덱스 이름 생성"""
        schema_str = json.dumps([str(field) for field in schema], sort_keys=True)
        return hashlib.md5(schema_str.encode()).hexdigest()[:8]

    def _ensure_index(self):
        schema = [
                TextField("pr_id"),
                TextField("repository"),
                TextField("language"),
                TextField("branch"),
                TextField("base_branch"),
                TagField("reviewers"),
                TextField("commits_json", sortable=False, no_stem=True),
                VectorField(
                    "content_vector",
                    "HNSW",
                    {
                        "TYPE": "FLOAT32",
                        "DIM": self.vector_dim,
                        "DISTANCE_METRIC": "COSINE"
                    }
                )
            ]
        
        schema_hash = self._get_schema_hash(schema)
        self.index_name = f"pr_index_{schema_hash}"
        """Redis 벡터 인덱스 생성 및 확인"""
        try:
            self.redis_client.ft(self.index_name).info()
            logger.info(f"인덱스 {self.index_name}가 이미 존재합니다")
        except:
            logger.info(f"인덱스 {self.index_name}를 생성합니다")
            definition = IndexDefinition(prefix=["pr:"], index_type=IndexType.HASH)
            self.redis_client.ft(self.index_name).create_index(schema, definition=definition)
            logger.info("인덱스가 성공적으로 생성되었습니다")
    
    def _prepare_pr_data_for_vectorization(self, pr_info: PRInfo) -> Tuple[str, List[str], List[str], List[str], Dict[str, int], int, int, int]:
        """PR 정보를 벡터화 및 Redis 저장을 위해 준비하는 함수"""
        all_changed_files = []
        all_authors = []
        all_commit_messages = []
        file_categories_count = {}
        total_additions = 0
        total_deletions = 0
        total_files_changed = 0
        
        file_summaries = []
        
        for commit in pr_info.commits:
            all_authors.append(commit.author)
            all_commit_messages.append(commit.message)
            total_additions += commit.total_additions
            total_deletions += commit.total_deletions
            total_files_changed += commit.files_changed
            
            for file_change in commit.files:
                all_changed_files.append(file_change.path)
                file_summaries.append(file_change.summary)
                category = file_change.category
                file_categories_count[category] = file_categories_count.get(category, 0) + 1
        
        # 중복 제거
        all_changed_files = list(set(all_changed_files))
        all_authors = list(set(all_authors))
        
        content_parts = [
            f"저장소: {pr_info.repository}",
            f"언어: {pr_info.language}",
            f"브랜치: {pr_info.branch} -> {pr_info.base_branch}",
            f"변경된 파일: {', '.join(all_changed_files)}",
            f"커밋 메시지: {' '.join(all_commit_messages)}",
            f"작성자: {', '.join(all_authors)}",
            f"파일 카테고리: {', '.join(file_categories_count.keys())}",
        ]
        
        if file_summaries:
            content_parts.append(f"파일 요약: {' '.join(file_summaries)}")
            
        return (
            " ".join(content_parts), 
            all_changed_files, 
            all_authors, 
            all_commit_messages, 
            file_categories_count, 
            total_additions, 
            total_deletions, 
            total_files_changed
        )
    
    async def store_pr(self, pr_info: PRInfo) -> bool:
        """PR 정보를 벡터 DB에 저장 (머지 완료 후에만 호출)"""
        try:
            (
                content, 
                all_changed_files, 
                all_authors, 
                all_commit_messages, 
                file_categories_count, 
                total_additions, 
                total_deletions, 
                total_files_changed
            ) = self._prepare_pr_data_for_vectorization(pr_info)
            
            content_vector = await self.embeddings.aembed_query(content)
            
            # 스키마에 맞춰 commits_json으로 저장
            commits_data = []
            for commit in pr_info.commits:
                commit_dict = {
                    "order": commit.order,
                    "author": commit.author,
                    "message": commit.message,
                    "total_additions": commit.total_additions,
                    "total_deletions": commit.total_deletions,
                    "files_changed": commit.files_changed,
                    "files": [
                        {
                            "path": f.path,
                            "status": f.status,
                            "category": f.category,
                            "changes": f.changes,
                            "summary": f.summary,
                            "patch": f.patch
                        } for f in commit.files
                    ]
                }
                commits_data.append(commit_dict)
            
            pr_data = {
                "pr_id": pr_info.pr_id,
                "repository": pr_info.repository,
                "language": pr_info.language,
                "branch": pr_info.branch,
                "base_branch": pr_info.base_branch,
                "reviewers": ",".join(pr_info.reviewers),
                "all_authors": ",".join(all_authors),
                "all_changed_files": ",".join(all_changed_files),
                "file_categories": ",".join(file_categories_count.keys()),
                "all_commit_messages": " ".join(all_commit_messages),
                "file_summaries": " ".join([f.summary for commit in pr_info.commits for f in commit.files]),
                "total_additions": total_additions,
                "total_deletions": total_deletions,
                "total_files_changed": total_files_changed,
                "commits_json": json.dumps(commits_data, ensure_ascii=False),
                "content_vector": np.array(content_vector).astype(np.float32).tobytes()
            }
            
            key = f"pr:{pr_info.pr_id}"
            self.redis_client.hset(key, mapping=pr_data)
            
            logger.info(f"PR {pr_info.pr_id}가 성공적으로 저장되었습니다")
            return True
            
        except Exception as e:
            logger.error(f"PR {pr_info.pr_id} 저장 중 오류: {str(e)}\n{traceback.format_exc()}")
            return False
    
    async def find_similar_prs(self, query_content: str, limit: int = 10) -> List[Dict[str, Any]]:
        """주어진 내용과 유사한 PR들을 찾는 함수"""
        try:
            query_vector = await self.embeddings.aembed_query(query_content)
            query_bytes = np.array(query_vector).astype(np.float32).tobytes()
            
            q = Query(f"*=>[KNN {limit} @content_vector $query_vector AS score]").return_fields(
                "pr_id", "repository", "language", "branch", "base_branch", 
                "reviewers", "all_authors", "all_changed_files", "file_categories",
                "total_additions", "total_deletions", "score"
            ).sort_by("score").dialect(2)
            
            results = self.redis_client.ft(self.index_name).search(q, {"query_vector": query_bytes})
            
            similar_prs = []
            for doc in results.docs:
                similar_prs.append({
                    "pr_id": doc.pr_id,
                    "repository": doc.repository,
                    "language": doc.language,
                    "branch": doc.branch,
                    "base_branch": doc.base_branch,
                    "all_authors": doc.all_authors.split(",") if hasattr(doc, 'all_authors') and doc.all_authors else [],
                    "reviewers": doc.reviewers.split(",") if doc.reviewers else [],
                    "all_changed_files": doc.all_changed_files.split(",") if hasattr(doc, 'all_changed_files') and doc.all_changed_files else [],
                    "file_categories": doc.file_categories.split(",") if hasattr(doc, 'file_categories') and doc.file_categories else [],
                    "total_additions": int(doc.total_additions) if hasattr(doc, 'total_additions') else 0,
                    "total_deletions": int(doc.total_deletions) if hasattr(doc, 'total_deletions') else 0,
                    "similarity_score": float(doc.score)
                })
            
            return similar_prs
            
        except Exception as e:
            logger.error(f"유사한 PR 찾기 중 오류: {str(e)}\n{traceback.format_exc()}")
            return []
            
    async def get_reviewer_context(self, pr_info: PRInfo, similarity_threshold: float = 0.3, limit: int = 20) -> Dict[str, Any]:
        """리뷰어 추천을 위한 컨텍스트 정보 제공 (LLM 호출용)"""
        try:
            (
                content, 
                all_changed_files, 
                all_authors, 
                all_commit_messages, 
                file_categories_count, 
                total_additions, 
                total_deletions, 
                total_files_changed
            ) = self._prepare_pr_data_for_vectorization(pr_info)
            
            similar_prs = await self.find_similar_prs(content, limit=limit)
            
            reviewer_experience = {}
            
            for similar_pr in similar_prs:
                similarity = similar_pr["similarity_score"]
                if similarity >= similarity_threshold:
                    reviewers = similar_pr["reviewers"]
                    
                    file_overlap = len(set(all_changed_files) & set(similar_pr["all_changed_files"]))
                    file_overlap_ratio = file_overlap / max(len(all_changed_files), 1)
                    
                    for reviewer in reviewers:
                        if reviewer and reviewer not in all_authors:
                            if reviewer not in reviewer_experience:
                                reviewer_experience[reviewer] = {
                                    "reviewed_prs": [],
                                    "total_reviews": 0,
                                    "avg_similarity": 0.0,
                                    "file_expertise": []
                                }
                            
                            reviewer_experience[reviewer]["reviewed_prs"].append({
                                "pr_id": similar_pr["pr_id"],
                                "repository": similar_pr["repository"],
                                "similarity": similarity,
                                "file_overlap": file_overlap_ratio,
                                "files": similar_pr["all_changed_files"],
                                "categories": similar_pr["file_categories"]
                            })
                            reviewer_experience[reviewer]["total_reviews"] += 1
                            reviewer_experience[reviewer]["avg_similarity"] += similarity
                            
                            for file in similar_pr["all_changed_files"]:
                                if file in all_changed_files:
                                    reviewer_experience[reviewer]["file_expertise"].append(file)
            
            for reviewer_data in reviewer_experience.values():
                if reviewer_data["total_reviews"] > 0:
                    reviewer_data["avg_similarity"] /= reviewer_data["total_reviews"]
                    reviewer_data["file_expertise"] = list(set(reviewer_data["file_expertise"]))
            
            return {
                "current_pr": {
                    "repository": pr_info.repository,
                    "language": pr_info.language,
                    "branch": pr_info.branch,
                    "all_authors": all_authors,
                    "all_changed_files": all_changed_files,
                    "file_categories": file_categories_count,
                    "total_additions": total_additions,
                    "total_deletions": total_deletions
                },
                "reviewer_experience": reviewer_experience,
                "similar_prs_count": len(similar_prs)
            }
            
        except Exception as e:
            logger.error(f"리뷰어 컨텍스트 생성 중 오류: {str(e)}\n{traceback.format_exc()}")
            return {"error": str(e)}
    
    async def get_pr_context_for_title_generation(self, pr_info: PRInfo, similarity_threshold: float = 0.3) -> Dict[str, Any]:
        """PR 제목 생성을 위한 컨텍스트 정보 제공 (LLM 호출용)"""
        try:
            (
                content, 
                all_changed_files, 
                all_authors, 
                all_commit_messages, 
                file_categories_count, 
                total_additions, 
                total_deletions, 
                total_files_changed
            ) = self._prepare_pr_data_for_vectorization(pr_info)
            
            similar_prs = await self.find_similar_prs(content, limit=10)
            
            similar_patterns = []
            for similar_pr in similar_prs:
                if similar_pr["similarity_score"] >= similarity_threshold:
                    similar_patterns.append({
                        "repository": similar_pr["repository"],
                        "language": similar_pr["language"],
                        "branch": similar_pr["branch"],
                        "similarity": similar_pr["similarity_score"],
                        "files": similar_pr["all_changed_files"],
                        "categories": similar_pr["file_categories"],
                        "additions": similar_pr["total_additions"],
                        "deletions": similar_pr["total_deletions"]
                    })
            
            return {
                "current_pr": {
                    "repository": pr_info.repository,
                    "language": pr_info.language,
                    "branch": pr_info.branch,
                    "base_branch": pr_info.base_branch,
                    "all_changed_files": all_changed_files,
                    "all_commit_messages": all_commit_messages,
                    "file_categories": file_categories_count,
                    "total_additions": total_additions,
                    "total_deletions": total_deletions,
                    "commits_count": len(pr_info.commits)
                },
                "similar_patterns": similar_patterns[:5],
                "file_patterns": {
                    "is_single_file": len(all_changed_files) == 1,
                    "has_tests": any("test" in f.lower() for f in all_changed_files),
                    "has_docs": any("doc" in f.lower() or "readme" in f.lower() for f in all_changed_files),
                    "is_major_addition": total_additions > total_deletions * 3,
                    "is_major_refactor": total_deletions > total_additions * 2,
                    "main_categories": list(file_categories_count.keys())
                }
            }
            
        except Exception as e:
            logger.error(f"PR 제목 컨텍스트 생성 중 오류: {str(e)}\n{traceback.format_exc()}")
            return {"error": str(e)}
    
    async def get_priority_context(self, pr_info: PRInfo, similarity_threshold: float = 0.3) -> Dict[str, Any]:
        """우선순위 결정을 위한 컨텍스트 정보 제공 (LLM 호출용)"""
        try:
            (
                content, 
                all_changed_files, 
                all_authors, 
                all_commit_messages, 
                file_categories_count, 
                total_additions, 
                total_deletions, 
                total_files_changed
            ) = self._prepare_pr_data_for_vectorization(pr_info)
            
            similar_prs = await self.find_similar_prs(content, limit=10)
            
            total_changes = total_additions + total_deletions
            
            critical_files = [".py", ".js", ".ts", ".java", ".cpp", ".go"]
            critical_changes = sum(1 for f in all_changed_files 
                                 if any(f.endswith(ext) for ext in critical_files))
            
            similar_priority_patterns = []
            for similar_pr in similar_prs:
                if similar_pr["similarity_score"] >= similarity_threshold:
                    similar_priority_patterns.append({
                        "repository": similar_pr["repository"],
                        "files": similar_pr["all_changed_files"],
                        "categories": similar_pr["file_categories"],
                        "total_changes": similar_pr["total_additions"] + similar_pr["total_deletions"]
                    })
            
            return {
                "current_pr": {
                    "repository": pr_info.repository,
                    "language": pr_info.language,
                    "total_changes": total_changes,
                    "critical_file_ratio": critical_changes / len(all_changed_files) if all_changed_files else 0,
                    "all_changed_files": all_changed_files,
                    "file_categories": file_categories_count,
                    "total_additions": total_additions,
                    "total_deletions": total_deletions,
                    "all_authors": all_authors,
                    "branch": pr_info.branch,
                    "commits_count": len(pr_info.commits)
                },
                "similar_priority_patterns": similar_priority_patterns[:5],
                "metrics": {
                    "has_critical_files": critical_changes > 0,
                    "is_large_change": total_changes > 500,
                    "has_multiple_authors": len(all_authors) > 1,
                    "has_multiple_commits": len(pr_info.commits) > 1
                }
            }
            
        except Exception as e:
            logger.error(f"우선순위 컨텍스트 생성 중 오류: {str(e)}\n{traceback.format_exc()}")
            return {"error": str(e)}
    
# 전역 인스턴스 생성
vector_db = VectorDB()