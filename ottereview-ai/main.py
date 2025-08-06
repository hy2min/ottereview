from utils.cushion_convert import convert_review_to_soft_tone
from utils.vector_db import vector_db, PRData
from utils.pull_request import recommand_pull_request_title, summary_pull_request, recommend_reviewers
from utils.recommand_priority import recommend_priority
from utils.whisper import whisper_service
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import openai
import os
from typing import Optional, List
import logging

# 로깅 설정
logging.basicConfig(level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")))
logger = logging.getLogger(__name__)

# FastAPI 애플리케이션 생성
app = FastAPI(
    title="ottereview",
    description="OtteReview AI API",
    version="1.0.0"
)

ENV = os.getenv("ENV", "development")

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
    
    Args:
        review_data (dict): {"content": "리뷰 내용"} 형식의 데이터
    
    Returns:
        dict: {"content": "부드럽게 변환된 리뷰 내용"} 형식의 결과
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



@app.post("/ai/pull_requests/title")
async def generate_pull_request_title(pr_data: PRData):
    """
    Pull Request 제목을 생성합니다.
    
    Args:
        pr_data: 커밋 정보와 파일 변경사항
        
    Returns:
        {"title": "생성된 PR 제목"}
    """
    try:
        title = await recommand_pull_request_title(pr_data)
        return {"result": title}
        
    except Exception as e:
        logger.error(f"API 호출 중 오류: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="PR 제목 생성 중 오류가 발생했습니다."
        )
    
@app.post("/ai/pull_requests/summary")
async def summary_pull_request_title(pr_data: PRData):
    """
    Pull Request의 내용을 요약합니다.
    
    Args:
        pr_data: PRData 객체 (vector_db.py의 구조)
        
    Returns:
        {"summary": "요약된 PR 내용"}
    """
    try:
        summary = await summary_pull_request(pr_data)
        return {"result": summary}
        
    except Exception as e:
        logger.error(f"API 호출 중 오류: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Pull Request 요약 생성 중 오류가 발생했습니다."
        )
    
@app.post("/ai/vector-db/store")
async def store_pr_to_vector_db(pr_request: PRData):
    """
    PR 데이터를 벡터 DB에 저장합니다.
    
    Args:
        pr_request: PR 데이터 (머지 완료 후 호출)
        
    Returns:
        {"success": boolean, "message": "상태 메시지"}
    """
    try:
        # 벡터 DB에 저장
        success = await vector_db.store_pr_data(pr_request.pr_id, pr_request)
        
        if success:
            return {
                "success": True,
                "message": f"PR {pr_request.pr_id} 데이터가 성공적으로 저장되었습니다."
            }
        else:
            raise HTTPException(status_code=500, detail="벡터 DB 저장에 실패했습니다.")
        
    except Exception as e:
        logger.error(f"벡터 DB 저장 중 오류: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"벡터 DB 저장 중 오류가 발생했습니다: {str(e)}"
        )

@app.post("/ai/speech/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
):
    """
    음성 파일을 텍스트로 변환 (STT)
    
    Args:
        audio_file: 업로드된 음성 파일 (mp3, mp4, mpeg, mpga, m4a, wav, webm)
        language: 언어 코드 (선택사항, 예: 'ko', 'en')
        
    Returns:
        {"text": "변환된 텍스트", "language": "언어코드"}
    """
    try:
        result = await whisper_service.transcribe_audio(file)
        return {"result": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"음성 변환 API 호출 중 오류: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="음성 변환 중 오류가 발생했습니다."
        )

@app.post("/ai/reviewers/recommend")
async def recommend_pr_reviewers(pr_data: PRData):
    """
    RAG를 활용해서 PR 리뷰어를 추천합니다.
    
    Args:
        pr_data: PRData 객체 (PR 정보)
        
    Returns:
        {"result": [{"github_username": "사용자명", "github_email": "이메일", "reason": "추천 이유"}]}
    """
    try:
        recommendations = await recommend_reviewers(pr_data, limit=5)
        return {"result": recommendations}
        
    except Exception as e:
        logger.error(f"리뷰어 추천 API 호출 중 오류: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="리뷰어 추천 중 오류가 발생했습니다."
        )

@app.post("/ai/priority/recommend")
async def recommend_pr_priority(pr_data: PRData):
    """
    RAG를 활용해서 PR의 리뷰 우선순위를 3가지 후보로 추천합니다.
    
    Args:
        pr_data: PRData 객체 (PR 정보)
        
    Returns:
        {"result": {
            "candidates": [
                {
                    "title": "간결한 제목",
                    "priority_level": "CRITICAL|HIGH|MEDIUM|LOW",
                    "reason": "우선순위 선택 이유"
                },
                ...
            ],
        }
    }
    """
    try:
        priority_candidates = await recommend_priority(pr_data)
        return {"result": priority_candidates}
        
    except Exception as e:
        logger.error(f"우선순위 추천 API 호출 중 오류: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="우선순위 추천 중 오류가 발생했습니다."
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=(ENV == "development"))