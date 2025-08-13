from functools import wraps
from utils.cushion_convert import convert_review_to_soft_tone
from utils.vector_db import vector_db
from models import PreparationResult, PRData, PRDetailData
from utils.pull_request import recommand_pull_request_title, summary_pull_request, recommend_reviewers
from utils.recommand_priority import recommend_priority
from utils.whisper import whisper_service
from utils.ai_await import check_pr_conventions,ConventionRule
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from pydantic import BaseModel
import openai
import os
from typing import Optional, List, Callable, Any
import logging
import redis
import json

# 로깅 설정
logging.basicConfig(level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")))
logger = logging.getLogger(__name__)

# Redis 클라이언트 초기화
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", "6379")),
    db=int(os.getenv("REDIS_DB", "0")),
    decode_responses=True
)

# FastAPI 애플리케이션 생성
app = FastAPI(
    title="ottereview",
    description="OtteReview AI API",
    version="1.0.0"
)

ENV = os.getenv("ENV", "development")

def sanitize_branch_name(branch_name: str) -> str:
    """
    브랜치 이름을 Redis 키에 사용할 수 있도록 sanitize합니다.
    스프링의 sanitizeBranchName 메서드와 동일한 로직으로 구현해야 합니다.
    """
    return branch_name.replace("/", "_").replace(":", "_").replace(" ", "_")

async def get_pr_data_from_redis(repo_id: int, source: str, target: str) -> PreparationResult:
    """
    Redis에서 PR 데이터를 읽어와 PRData 객체로 변환합니다.
    """
    try:
        sanitized_source = sanitize_branch_name(source)
        sanitized_target = sanitize_branch_name(target)
        pr_key = f"pr:prepare:{repo_id}:{sanitized_source}:{sanitized_target}"
        logger.info(f"Attempting to fetch Redis key: {pr_key}")
        
        pr_data_json = redis_client.get(pr_key)
        
        if not pr_data_json:
            raise HTTPException(
                status_code=404, 
                detail=f"PR 데이터를 Redis에서 찾을 수 없습니다. (key: {pr_key})"
            )
        
        pr_data_dict = json.loads(pr_data_json)
        return PreparationResult(**pr_data_dict)
        
    except json.JSONDecodeError as e:
        logger.error(f"Redis 데이터 JSON 파싱 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="PR 데이터 형식이 올바르지 않습니다.")
    except Exception as e:
        logger.error(f"Redis 데이터 조회 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PR 데이터 조회 중 오류가 발생했습니다: {str(e)}")

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "environment": ENV,
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
        }

class reviewRequest(BaseModel):
    content: str
    """
    리뷰어가 작성한 리뷰를 부드러운 어조로 변환하기 위한 요청 모델
    """

@app.post("/ai/review/cushion", response_model=dict)
async def convert_review(review_data: reviewRequest):
    """
    리뷰어가 작성한 리뷰를 부드러운 어조로 변환합니다.
    """
    try:
        if not review_data.content.strip():
            raise HTTPException(status_code=400, detail="리뷰 내용이 비어있습니다.")
        
        result = convert_review_to_soft_tone(review_data.content)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 변환 중 오류가 발생했습니다: {str(e)}")

class PRRequest(BaseModel):
    repo_id: int
    source: str
    target: str

@app.post("/ai/pull_requests/title")
async def generate_pull_request_title(request: PRRequest):
    """
    Pull Request 제목을 생성합니다.
    """
    pr_data = await get_pr_data_from_redis(request.repo_id, request.source, request.target)
    title = await recommand_pull_request_title(pr_data)
    return {"result": title}
    
@app.post("/ai/pull_requests/summary")
async def summary_pull_request_title(request: PRRequest):
    """
    Pull Request의 내용을 요약합니다.
    """
    pr_data = await get_pr_data_from_redis(request.repo_id, request.source, request.target)
    summary = await summary_pull_request(pr_data)
    return {"result": summary}
    
@app.post("/ai/vector-db/store")
async def store_pr_to_vector_db(pr_request: PRDetailData):
    """
    PR Detail 데이터를 벡터 DB에 저장합니다. (백엔드에서 PRDetailData로 호출)
    """
    try:
        success = await vector_db.store_pr_data(pr_request)
        
        if success:
            return {
                "success": True,
                "message": f"PR {pr_request.id} 데이터가 성공적으로 저장되었습니다."
            }
        else:
            raise HTTPException(status_code=500, detail="벡터 DB 저장에 실패했습니다.")
        
    except Exception as e:
        logger.error(f"벡터 DB 저장 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"벡터 DB 저장 중 오류가 발생했습니다: {str(e)}")

@app.post("/ai/speech/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    음성 파일을 텍스트로 변환 (STT)
    """
    try:
        result = await whisper_service.transcribe_audio(file)
        return {"result": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"음성 변환 API 호출 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail="음성 변환 중 오류가 발생했습니다.")

@app.post("/ai/reviewers/recommend")
async def recommend_pr_reviewers(request: PRRequest):
    """
    RAG를 활용해서 PR 리뷰어를 추천합니다.
    """
    pr_data = await get_pr_data_from_redis(request.repo_id, request.source, request.target)
    recommendations = await recommend_reviewers(pr_data, limit=5)
    return {"result": recommendations}

@app.post("/ai/priority/recommend")
async def recommend_pr_priority(request: PRRequest):
    """
    RAG를 활용해서 PR의 리뷰 우선순위를 3가지 후보로 추천합니다.
    """
    pr_data = await get_pr_data_from_redis(request.repo_id, request.source, request.target)
    priority_candidates = await recommend_priority(pr_data)
    logger.info(f"Priority candidates: {priority_candidates}")
    return {"result": priority_candidates}

class ConventionRequest(BaseModel):
    """코딩 컨벤션 체크 요청 모델"""
    repo_id: int
    source: str
    target: str
    rules: ConventionRule

@app.post("/ai/coding-convention/check")
async def check_coding_conventions(request: ConventionRequest):
    """
    PR의 파일들에 대해 비동기 방식으로 코딩 컨벤션을 체크합니다.
    """
    try:
        logger.info(f"Convention check request: {request}")
        
        # Redis에서 PR 데이터 가져오기
        pr_data = await get_pr_data_from_redis(request.repo_id, request.source, request.target)
        logger.info(f"PR data retrieved: {type(pr_data)}")
        
        analysis_result = await check_pr_conventions(pr_data, request.rules)
        logger.info(f"Convention analysis result: {analysis_result}")
        return {"result": analysis_result}
    except Exception as e:
        logger.error(f"Convention check error: {str(e)}")
        logger.error(f"Error traceback:", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Convention check failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=(ENV == "development"))