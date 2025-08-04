from utils.cushion_convert import convert_review_to_soft_tone
from utils.vector_db import vector_db, PRData
from fastapi import FastAPI, HTTPException
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
        
        result = convert_review_to_soft_tone({"content": review_data.content})
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 변환 중 오류가 발생했습니다: {str(e)}")

class PullRequestTitleRequest(BaseModel):

    commit_messages: list[str]
    file_changes: list[str]
    code_changes: list[str]
    branch_name: Optional[str] = None
    """
    Pull Request 제목 생성을 위한 요청 모델
    - commit_messages: 커밋 메시지 목록
    - file_changes: 변경된 파일 목록
    - code_changes: 주요 코드 변경사항 목록
    - branch_name: 브랜치명 (선택적)
    """

class PRDataRequest(BaseModel):
    pr_id: str
    pr_data: PRData


@app.post("/ai/pull_requests/title")
async def generate_pull_request_title(pr_data: PullRequestTitleRequest):
    """
    Pull Request 제목을 생성합니다.
    
    Args:
        pr_data: 커밋 정보와 파일 변경사항
        
    Returns:
        {"title": "생성된 PR 제목"}
    """
    try:
        title = await recommand_pull_request_title(pr_data)
        return {"title": title}
        
    except Exception as e:
        logger.error(f"API 호출 중 오류: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="PR 제목 생성 중 오류가 발생했습니다."
        )

@app.post("/ai/vector-db/store")
async def store_pr_to_vector_db(pr_request: PRDataRequest):
    """
    PR 데이터를 벡터 DB에 저장합니다.
    
    Args:
        pr_request: PR 데이터 (머지 완료 후 호출)
        
    Returns:
        {"success": boolean, "message": "상태 메시지"}
    """
    try:
        # 벡터 DB에 저장
        success = await vector_db.store_pr_data(pr_request.pr_id, pr_request.pr_data)
        
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=(ENV == "development"))