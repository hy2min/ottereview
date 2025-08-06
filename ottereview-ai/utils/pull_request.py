import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from typing import List, Dict, Any
import logging
from collections import defaultdict, Counter
from .vector_db import vector_db, PRData

# .env 파일에서 환경변수 로드
load_dotenv()

logger = logging.getLogger(__name__)

# OpenAI API KEY 확인
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY가 환경변수에 설정되지 않았습니다. .env 파일을 확인해주세요.")

# 중요! langchain의 BASE_URL을 GMS로 설정합니다. 
os.environ["OPENAI_API_BASE"] = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"

model = init_chat_model("gpt-4o-mini", model_provider="openai")

async def recommand_pull_request_title(pr_data):
    """추천할 Pull Request의 제목을 생성합니다.
    Args:
        pr_data: PRData 객체 (vector_db.py의 구조)
    Returns:
        str: 추천할 Pull Request 제목
    """
    system_prompt = """당신은 개발자의 Pull Request 제목을 생성하는 전문가입니다.
    다음 규칙을 따르세요:
    - 제목은 간결하고 명확해야 합니다.
    - 코드의 주요 변경 사항이나 기능을 반영해야 합니다.
    - 불필요한 단어는 제거하고 핵심 내용만 포함해야 합니다.
    - 제목은 대문자로 시작하고, 마침표는 사용하지 않습니다.
    - 제목은 50자 이내로 작성해야 합니다.
    - 제목은 한국어로 작성되어야 합니다.
    - 예시: '[FEATURE]: 유저 인증로직 구현 ' 또는 '[FIX]: 데이터 베이스 연결 오류 수정'
    - 헤더의 구조는 '[TYPE]: 내용' 형식이어야 합니다.
    - TYPE은 'FEATURE', 'FIX', 'DOCS', 'STYLE', 'REFACTOR', 'TEST' 중 하나여야 합니다.
    """
    
    # PRData 타입 (vector_db.py의 구조)에서 데이터 추출
    commit_messages = "\n".join([commit.message for commit in pr_data.commits])
    file_changes_summary = "\n".join([f"{file.filename} ({file.status})" for file in pr_data.files])
    code_changes = "\n".join([f"{file.filename}: +{file.additions}/-{file.deletions}" for file in pr_data.files])
    branch_name = f"{pr_data.source} -> {pr_data.target}"

    user_prompt = f"""다음 정보를 바탕으로 Pull Request 제목을 생성해주세요:

        커밋 메시지들:
        {commit_messages}

        변경된 주요 파일들:
        {file_changes_summary}

        주요 코드 변경사항:
        {code_changes}

        브랜치명: {branch_name}

    위 정보를 바탕으로 간결하고 명확한 Pull Request 제목을 생성해주세요."""

    # 모델에 요청을 보내고 응답을 받습니다.
    try:
        response = model.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        title = response.content if hasattr(response, 'content') else str(response)
        
        return title
    except Exception as e:
        raise e

async def summary_pull_request(pr_data):
    """Pull Request의 내용을 요약합니다.
    Args:
        pr_data: PRData 객체 (vector_db.py의 구조)
    Returns:
        str: Pull Request 내용 요약
    """
    system_prompt = """당신은 개발자의 Pull Request 내용을 요약하는 전문가입니다.
    다음 규칙을 따르세요:
    - 목적 및 핵심 변경사항 요약: Pull Request의 제목(`title`)과 본문(`body`)을 기반으로 이 PR이 해결하려는 문제나 추가하려는 기능이 무엇인지 파악하고, 이를 하나의 간결한 문장으로 요약하세요.
    - 변경 파일 요약: `files` 목록을 분석하여 변경된 파일들의 주요 역할을 명시적으로 언급하세요. 예를 들어, "데이터 처리 로직 수정", "새로운 API 엔드포인트 추가", "테스트 코드 업데이트"와 같이 설명합니다.
    - 커밋 메시지 활용: 여러 개의 커밋 메시지가 있는 경우, 이들을 단순히 나열하지 말고, 커밋들의 공통된 주제나 변경 히스토리를 한 문장으로 압축하여 요약하세요. 커밋 메시지가 너무 간단하거나(예: "as", "11111") 의미가 불분명하면, 이 정보는 생략하거나 "개발 과정의 여러 작은 수정사항 포함"과 같이 추상적으로 요약합니다.
    - 최종 요약: 위에 제시된 정보들을 종합하여 **200자 이내의 하나의 자연스러운 문장**으로 완성하세요.
    """

    # PRData 타입 (vector_db.py의 구조)에서 데이터 추출
    commit_messages = "\n".join([commit.message for commit in pr_data.commits])
    file_changes_summary = "\n".join([f"{file.filename} ({file.status})" for file in pr_data.files])
    code_changes = "\n".join([f"{file.filename}: +{file.additions}/-{file.deletions}" for file in pr_data.files])
    branch_name = f"{pr_data.source} -> {pr_data.target}"
    descriptions = pr_data.descriptions or "No description provided."
    
    user_prompt = f"""다음 정보를 바탕으로 Pull Request 내용을 요약해주세요:

        커밋 메시지들:
        {commit_messages}

        변경된 주요 파일들:
        {file_changes_summary}

        주요 코드 변경사항:
        {code_changes}
        브랜치명: {branch_name}

        작성자 설명:
        {descriptions}
    위 정보를 바탕으로 간결하고 명확한 Pull Request 내용을 요약해주세요."""

    # 모델에 요청을 보내고 응답을 받습니다.
    try:
        response = model.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])

        review_comment = response.content if hasattr(response, 'content') else str(response)

        return review_comment
    except Exception as e:
        raise e

async def recommend_reviewers(pr_data: PRData, limit: int = 3) -> List[Dict[str, Any]]:
    """
    RAG를 활용한 리뷰어 추천 로직
    
    Args:
        pr_data: PRData 객체 (현재 PR 정보)
        limit: 추천할 리뷰어 수 (기본값: 3)
        
    Returns:
        List[Dict]: 추천된 리뷰어 목록
    """
    try:
        # 1. 벡터 DB에서 유사한 PR 패턴 검색 (RAG의 Retrieval 단계)
        similar_patterns = await vector_db.get_similar_reviewer_patterns(pr_data, limit=15)
        
        if not similar_patterns:
            logger.warning("유사한 리뷰어 패턴을 찾을 수 없습니다")
            return []
        
        # 2. 검색된 패턴들을 LLM용 컨텍스트로 변환
        context = _build_context_from_patterns(similar_patterns, pr_data)
        
        # 3. LLM에게 컨텍스트와 함께 추천 요청 (RAG의 Generation 단계)
        recommendations = await _generate_recommendations_with_llm(context, pr_data, limit)
        
        return recommendations
        
    except Exception as e:
        logger.error(f"리뷰어 추천 중 오류 발생: {str(e)}")
        return []

def _build_context_from_patterns(patterns: List[Dict[str, Any]], current_pr: PRData) -> str:
    """
    벡터 검색 결과를 LLM용 컨텍스트로 변환
    
    Args:
        patterns: 벡터 DB에서 검색된 유사 패턴들
        current_pr: 현재 PR 데이터
        
    Returns:
        str: LLM에 제공할 컨텍스트 문자열
    """
    context_parts = []
    
    # 리뷰어별로 그룹화
    reviewer_data = {}
    for pattern in patterns:
        reviewer = pattern['reviewer']
        if reviewer not in reviewer_data:
            reviewer_data[reviewer] = {
                'email': pattern['reviewer_email'],
                'patterns': [],
                'total_similarity': 0,
                'file_categories': set(),
                'review_count': 0
            }
        
        reviewer_data[reviewer]['patterns'].append(pattern)
        reviewer_data[reviewer]['total_similarity'] += pattern['similarity_score']
        reviewer_data[reviewer]['file_categories'].update(pattern['file_categories'])
        if pattern['review_provided']:
            reviewer_data[reviewer]['review_count'] += 1
    
    # 상위 8명만 컨텍스트에 포함
    sorted_reviewers = sorted(
        reviewer_data.items(),
        key=lambda x: x[1]['total_similarity'],
        reverse=True
    )[:8]
    
    context_parts.append("=== 과거 유사한 PR들의 리뷰어 패턴 ===")
    
    for i, (reviewer, data) in enumerate(sorted_reviewers, 1):
        avg_similarity = data['total_similarity'] / len(data['patterns'])
        file_types = ', '.join(list(data['file_categories'])[:3])
        similarity_score = f"{avg_similarity:.3f}"
        
        context_parts.append(f"""
{i}. 리뷰어: {reviewer}
   - 이메일: {data['email']}
   - 평균 유사도: {similarity_score}
   - 전문 파일타입: {file_types}
   - 리뷰 제공 횟수: {data['review_count']}/{len(data['patterns'])}
        """.strip())
    
    return "\n".join(context_parts)

async def _generate_recommendations_with_llm(context: str, pr_data: PRData, limit: int=3) -> List[Dict[str, Any]]:
    """
    LLM을 활용해 컨텍스트 기반 리뷰어 추천
    
    Args:
        context: 벡터 검색으로 구성된 컨텍스트
        pr_data: 현재 PR 데이터
        limit: 추천할 리뷰어 수
        
    Returns:
        List[Dict]: LLM이 추천한 리뷰어 목록
    """
    # 현재 PR 정보 요약
    files_summary = ', '.join([f.filename for f in pr_data.files[:5]])
    commits_summary = ' | '.join([c.message for c in pr_data.commits[:3]])
    
    system_prompt = """당신은 코드 리뷰어 추천 전문가입니다.
과거 유사한 PR 패턴을 분석하여 가장 적합한 리뷰어를 추천해주세요.

추천 기준:
1. 현재 PR과 유사한 작업을 리뷰한 경험
2. 해당 파일 타입에 대한 전문성  
3. 과거 리뷰 제공 이력
4. 유사도 점수

응답은 반드시 다음 JSON 형식으로만 추천 해주세요:
[
  {
    "github_username": "사용자명",
    "github_email": "이메일"
  }
]"""

    user_prompt = f"""{context}

=== 현재 PR 정보 ===
- 제목: {pr_data.title}
- 파일들: {files_summary}
- 커밋 메시지: {commits_summary}
- 브랜치: {pr_data.source} -> {pr_data.target}

위 정보를 종합하여 가장 적합한 리뷰어 {limit}명을 추천해주세요."""

    try:
        response = model.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        result = _parse_llm_response(response.content, limit)
        logger.info(f"LLM이 {len(result)}명의 리뷰어를 추천했습니다")
        return result
        
    except Exception as e:
        logger.error(f"LLM 추천 생성 중 오류: {str(e)}")
        # 폴백: 간단한 유사도 기반 추천
        return _fallback_simple_recommendation(pr_data, limit)

def _parse_llm_response(response_text: str, limit: int) -> List[Dict[str, Any]]:
    """
    LLM 응답을 파싱해서 리뷰어 목록으로 변환
    
    Args:
        response_text: LLM 응답 텍스트
        limit: 최대 리뷰어 수
        
    Returns:
        List[Dict]: 파싱된 리뷰어 목록
    """
    try:
        import json
        import re
        
        # JSON 부분만 추출
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if not json_match:
            raise ValueError("JSON 형식을 찾을 수 없습니다")
        
        json_str = json_match.group(0)
        recommendations = json.loads(json_str)
        
        # 검증 및 정리
        valid_recommendations = []
        for rec in recommendations[:limit]:
            if isinstance(rec, dict) and 'github_username' in rec:
                valid_recommendations.append({
                    'github_username': rec.get('github_username', ''),
                    'github_email': rec.get('github_email', ''),
                })
        
        return valid_recommendations
        
    except Exception as e:
        logger.error(f"LLM 응답 파싱 실패: {str(e)}")
        return []

async def _fallback_simple_recommendation(pr_data: PRData, limit: int) -> List[Dict[str, Any]]:
    """
    LLM 실패 시 사용할 간단한 폴백 추천
    
    Args:
        pr_data: PR 데이터
        limit: 추천할 리뷰어 수
        
    Returns:
        List[Dict]: 간단한 추천 결과
    """
    try:
        similar_patterns = await vector_db.get_similar_reviewer_patterns(pr_data, limit=10)
        
        reviewer_scores = {}
        for pattern in similar_patterns:
            reviewer = pattern['reviewer']
            if reviewer not in reviewer_scores:
                reviewer_scores[reviewer] = {
                    'score': 0,
                    'email': pattern['reviewer_email']
                }
            reviewer_scores[reviewer]['score'] += pattern['similarity_score']
        
        # 상위 추천
        recommendations = []
        sorted_reviewers = sorted(reviewer_scores.items(), key=lambda x: x[1]['score'], reverse=True)
        
        for reviewer, data in sorted_reviewers[:limit]:
            recommendations.append({
                'github_username': reviewer,
                'github_email': data['email'],
                'reason': '유사한 작업 경험을 보유하고 있습니다'
            })
        
        return recommendations
        
    except Exception as e:
        logger.error(f"폴백 추천도 실패: {str(e)}")
        return []

