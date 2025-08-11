import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from typing import List, Dict, Any
import logging
from collections import defaultdict, Counter
from .vector_db import vector_db
from models import PreparationResult, PRData  # PRData는 하위 호환성을 위해 유지
from .config_based_priority import calculate_config_based_priority_candidates

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


async def recommend_priority(pr_data: PreparationResult) -> Dict[str, Any]:
    """
    RAG를 활용한 리뷰 우선순위 추천 로직 - 3개의 후보 반환
    
    Args:
        pr_data: PRData 객체 (현재 PR 정보)
        
    Returns:
        Dict[str, Any]: 3개의 우선순위 추천 결과
    """
    try:
        # 1. 벡터 DB에서 유사한 우선순위 패턴 검색 (RAG의 Retrieval 단계)
        similar_patterns = await vector_db.get_similar_priority_patterns(pr_data, limit=15)
        
        if not similar_patterns:
            logger.warning("유사한 우선순위 패턴을 찾을 수 없습니다. 설정 기반 분석으로 대체합니다.")
            similar_patterns=" "
        
        # 2. 검색된 패턴들을 LLM용 컨텍스트로 변환
        context = _build_priority_context_from_patterns(similar_patterns, pr_data)
        
        # 3. LLM에게 컨텍스트와 함께 3개의 우선순위 후보 분석 요청 (RAG의 Generation 단계)
        priority_candidates = await _generate_priority_candidates_with_llm(context, pr_data)
        
        # 4. 결과 검증 및 보완
        return _validate_and_complete_candidates(priority_candidates, pr_data)
        
    except Exception as e:
        logger.error(f"우선순위 추천 전체 과정에서 오류 발생: {str(e)}")
        return _get_default_error_response()

def _get_default_error_response() -> Dict[str, Any]:
    """기본 오류 응답 생성"""
    return {
        'priority': [
            {
                'title': '우선순위 추천오류',
                'priority_level': 'MEDIUM',
                'reason': 'AI 서비스에서 오류가 발생하였거나, 파일 변경이 적습니다.'
            },
            {
                'title': '우선순위 추천오류',
                'priority_level': 'MEDIUM',
                'reason': 'AI 서비스에서 오류가 발생하였거나, 파일 변경이 적습니다.'
            },
            {
                'title': '우선순위 추천오류',
                'priority_level': 'MEDIUM',
                'reason': 'AI 서비스에서 오류가 발생하였거나, 파일 변경이 적습니다.'
            }
        ]
    }

def _validate_and_complete_candidates(result: Dict[str, Any], pr_data: PreparationResult) -> Dict[str, Any]:
    """결과를 검증하고, 3개가 안되면 설정 기반 또는 기본값으로 채움"""
    
    candidates = result.get('priority', [])
    valid_candidates = []

    for i, candidate in enumerate(candidates[:3]):
        if not isinstance(candidate, dict) or not all(k in candidate for k in ['title', 'priority_level', 'reason']):
            continue
        
        priority_level = candidate.get('priority_level', 'MEDIUM')
        if priority_level not in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
            priority_level = 'MEDIUM'
        
        valid_candidates.append({
            'title': candidate.get('title', f'우선순위 후보 {i+1}'),
            'priority_level': priority_level,
            'reason': candidate.get('reason', '분석 결과에 따른 우선순위')
        })

    # 3개 미만인 경우, 먼저 설정 기반 후보로 채우고, 그래도 부족하면 기본 오류값으로 채움
    if len(valid_candidates) < 3:
        try:
            config_candidates = calculate_config_based_priority_candidates(pr_data)['candidates']
            num_needed = 3 - len(valid_candidates)
            
            # 설정 기반 후보에서 중복되지 않는 것을 추가
            for config_cand in config_candidates:
                if len(valid_candidates) >= 3:
                    break
                # 이미 있는 title과 겹치지 않도록
                if not any(vc['title'] == config_cand['title'] for vc in valid_candidates):
                    valid_candidates.append(config_cand)

        except Exception as e:
            logger.error(f"설정 기반 후보 생성 중 오류: {str(e)}")

    # 그래도 3개가 안되면 기본 오류 응답으로 채움
    while len(valid_candidates) < 3:
        valid_candidates.append({
            'title': '우선순위 추천오류',
            'priority_level': 'MEDIUM',
            'reason': 'AI 분석 중 일부 결과가 유효하지 않아 기본값으로 대체합니다.'
        })

    return {'priority': valid_candidates}



def _build_priority_context_from_patterns(patterns: List[Dict[str, Any]], current_pr: PreparationResult) -> str:
    """
    벡터 검색 결과를 LLM용 우선순위 분석 컨텍스트로 변환
    
    Args:
        patterns: 벡터 DB에서 검색된 유사 패턴들
        current_pr: 현재 PR 데이터
        
    Returns:
        str: LLM에 제공할 컨텍스트 문자열
    """
    context_parts = []
    
    # 기능별로 그룹화
    category_data = {}
    for pattern in patterns:
        category = pattern['functional_category']
        if category not in category_data:
            category_data[category] = {
                'patterns': [],
                'total_similarity': 0,
                'priority_indicators': set(),
                'complexity_levels': [],
                'change_scales': []
            }
        
        category_data[category]['patterns'].append(pattern)
        category_data[category]['total_similarity'] += pattern['similarity_score']
        category_data[category]['priority_indicators'].update(pattern['priority_indicators'])
        category_data[category]['complexity_levels'].append(pattern['complexity_level'])
        category_data[category]['change_scales'].append(pattern['change_scale'])
    
    # 상위 카테고리들을 컨텍스트에 포함
    sorted_categories = sorted(
        category_data.items(),
        key=lambda x: x[1]['total_similarity'],
        reverse=True
    )[:6]
    
    context_parts.append("=== 과거 유사한 PR들의 우선순위 패턴 ===")
    
    for i, (category, data) in enumerate(sorted_categories, 1):
        avg_similarity = data['total_similarity'] / len(data['patterns'])
        priority_indicators = ', '.join(list(data['priority_indicators'])[:4])
        complexity_counter = Counter(data['complexity_levels'])
        scale_counter = Counter(data['change_scales'])
        
        most_common_complexity = complexity_counter.most_common(1)[0][0] if complexity_counter else "보통"
        most_common_scale = scale_counter.most_common(1)[0][0] if scale_counter else "소규모"
        
        context_parts.append(f"""
{i}. 기능영역: {category}
   - 평균 유사도: {avg_similarity:.3f}
   - 주요 우선순위 지표: {priority_indicators}
   - 일반적 복잡도: {most_common_complexity}
   - 일반적 변경규모: {most_common_scale}
   - 관련 PR 수: {len(data['patterns'])}
        """.strip())
    
    return "\n".join(context_parts)


async def _generate_priority_candidates_with_llm(context: str, pr_data: PreparationResult) -> Dict[str, Any]:
    """
    LLM을 활용해 컨텍스트 기반으로 3개의 우선순위 후보 생성
    
    Args:
        context: 벡터 검색으로 구성된 컨텍스트
        pr_data: 현재 PR 데이터
        
    Returns:
        Dict[str, Any]: 3개의 우선순위 후보 결과
    """
    # 현재 PR 정보 요약
    files_summary = ', '.join([f.filename for f in pr_data.files[:7]])
    commits_summary = ' | '.join([c.message for c in pr_data.commits[:3]])
    total_changes = sum(f.additions + f.deletions for f in pr_data.files)
    
    system_prompt = """당신은 Pull Request의 변경 사항을 분석하여 리뷰어가 놓치지 말아야 할 핵심 리뷰 포인트를 3가지 제안하는 AI 분석 시스템입니다.

**분석 목표:**
코드 변경의 잠재적 위험, 중요한 로직 수정, 아키텍처 영향도를 식별하여 리뷰어가 효율적으로 리뷰할 수 있도록 돕습니다.

**분석 가이드라인:**
1.  **보안 및 인증 (CRITICAL)**: `jwt`, `token`, `auth`, `password` 등 보안 관련 키워드가 포함된 파일 변경은 최우선으로 분석합니다. 권한 부여, 토큰 생성/검증 로직의 위험성을 구체적으로 제시하세요.
2.  **데이터베이스 및 API (HIGH)**: `Entity`, `Repository`, `Controller`, `DTO` 등의 변경은 데이터 무결성 및 하위 호환성 문제를 야기할 수 있습니다. 스키마 변경, API 명세 변경의 영향을 명확히 설명하세요.
3.  **핵심 비즈니스 로직 (HIGH/MEDIUM)**: 주요 기능의 비즈니스 로직 변경을 식별합니다. '어떤 로직이 어떻게 바뀌었는지'와 '어떤 엣지 케이스를 테스트해야 하는지'를 포함하여 이유를 작성하세요.
4.  **대규모 변경 및 리팩토링 (MEDIUM)**: 여러 파일에 걸친 광범위한 변경이나 리팩토링은 아키텍처의 일관성을 해칠 수 있습니다. 변경의 일관성과 잠재적인 사이드 이펙트를 검토하도록 제안하세요.
5.  **단순 수정 및 테스트 (LOW)**: 오타 수정, 단순 버그 픽스, 테스트 코드 추가 등은 낮은 우선순위를 부여합니다.

**`reason` 작성 규칙:**
-   **구체성**: "로직 수정"과 같은 추상적인 표현 대신, "A 파일에서 사용자 등급 계산 방식이 B로 변경되었습니다. C 조건에서의 엣지 케이스를 확인해야 합니다."와 같이 구체적으로 작성하세요.
-   **실행 가능성**: 리뷰어가 무엇을 확인해야 하는지 명확한 체크포인트를 제시하세요.
-   **파일 참조**: 어떤 파일의 변경사항에 근거한 분석인지 명시하세요.

**응답 형식:**
-   **반드시 3개의 후보를 생성해야 합니다.**
-   **설명 없이 아래 JSON 형식만 반환해야 합니다.**

{
  "priority": [
    {
      "title": "분석 결과에 대한 구체적인 제목",
      "priority_level": "CRITICAL|HIGH|MEDIUM|LOW",
      "reason": "분석 가이드라인과 작성 규칙에 따른 구체적인 리뷰 요청 사항입니다."
    },
    {
      "title": "두 번째 분석 결과 제목",
      "priority_level": "CRITICAL|HIGH|MEDIUM|LOW",
      "reason": "두 번째 리뷰 요청 사항입니다."
    },
    {
      "title": "세 번째 분석 결과 제목",
      "priority_level": "CRITICAL|HIGH|MEDIUM|LOW",
      "reason": "세 번째 리뷰 요청 사항입니다."
    }
  ]
}
"""

    user_prompt = f"""{context}

=== 현재 PR 정보 ===
- 제목: {pr_data.title}
- 파일들: {files_summary}
- 커밋 메시지: {commits_summary}
- 브랜치: {pr_data.source} -> {pr_data.target}
- 총 변경라인: {total_changes}라인
- 파일 수: {len(pr_data.files)}개

위 정보를 종합하여 이 PR의 리뷰 우선순위를 3가지 관점에서 분석해주세요."""

    try:
        response = model.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        result = _parse_priority_candidates_response(response.content, pr_data)
        logger.info(f"LLM이 {len(result.get('priority', []))}개의 우선순위 후보를 생성했습니다")
        return result
        
    except Exception as e:
        logger.error(f"LLM 우선순위 후보 생성 중 오류: {str(e)}")
        # 폴백: 설정 기반 우선순위 후보 계산
        return calculate_config_based_priority_candidates(pr_data)


def _parse_priority_candidates_response(response_text: str, pr_data: PreparationResult) -> Dict[str, Any]:
    """
    LLM 우선순위 후보 응답을 파싱
    
    Args:
        response_text: LLM 응답 텍스트
        pr_data: PR 데이터
        
    Returns:
        Dict[str, Any]: 파싱된 3개의 우선순위 후보 결과
    """
    try:
        import json
        import re
        
        # JSON 부분만 추출
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if not json_match:
            raise ValueError("JSON 형식을 찾을 수 없습니다")
        
        json_str = json_match.group(0)
        result = json.loads(json_str)
        
        # 검증 및 정리
        candidates = result.get('priority', [])
        valid_candidates = []
        
        for i, candidate in enumerate(candidates[:3]):  # 최대 3개까지
            if not isinstance(candidate, dict):
                continue
                
            title = candidate.get('title', f'우선순위 후보 {i+1}')
            priority_level = candidate.get('priority_level', 'MEDIUM')
            reason = candidate.get('reason', '분석 결과에 따른 우선순위')
            
            # 우선순위 레벨 검증
            if priority_level not in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
                priority_level = 'MEDIUM'
            
            valid_candidates.append({
                'title': title,
                'priority_level': priority_level,
                'reason': reason
            })
        
        # 3개 미만인 경우 설정 기반 후보로 채움
        while len(valid_candidates) < 3:
            config_candidates = calculate_config_based_priority_candidates(pr_data)
            missing_candidate = config_candidates['candidates'][len(valid_candidates)]
            valid_candidates.append(missing_candidate)
        
        return {
            'priority': valid_candidates,
        }
        
    except Exception as e:
        logger.error(f"우선순위 후보 응답 파싱 실패: {str(e)}")
        return calculate_config_based_priority_candidates(pr_data)


