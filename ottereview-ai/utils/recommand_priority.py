import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from typing import List, Dict, Any
import logging
from collections import defaultdict, Counter
from .vector_db import vector_db, PRData
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


async def recommend_priority(pr_data: PRData) -> Dict[str, Any]:
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
            logger.warning("유사한 우선순위 패턴을 찾을 수 없습니다")
            return calculate_config_based_priority_candidates(pr_data)
        
        # 2. 검색된 패턴들을 LLM용 컨텍스트로 변환
        context = _build_priority_context_from_patterns(similar_patterns, pr_data)
        
        # 3. LLM에게 컨텍스트와 함께 3개의 우선순위 후보 분석 요청 (RAG의 Generation 단계)
        priority_candidates = await _generate_priority_candidates_with_llm(context, pr_data)
        
        return priority_candidates
        
    except Exception as e:
        logger.error(f"우선순위 추천 중 오류 발생: {str(e)}")
        return calculate_config_based_priority_candidates(pr_data)


def _build_priority_context_from_patterns(patterns: List[Dict[str, Any]], current_pr: PRData) -> str:
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


async def _generate_priority_candidates_with_llm(context: str, pr_data: PRData) -> Dict[str, Any]:
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
    
    system_prompt = """당신은 코드 리뷰 전문가입니다.
PR의 파일 변경사항을 분석하여 리뷰어가 구체적으로 확인해야 할 내용을 3가지 관점에서 제시해주세요.

파일명과 변경사항을 바탕으로 다음을 분석해주세요:
1. 보안 및 인증 관련 변경 (JWT, 토큰, 권한, 보안 설정 등)
2. 데이터베이스/API 스키마 변경 (모델, 엔티티, 컨트롤러 등)
3. 비즈니스 로직 및 핵심 기능 변경
4. 테스트 코드 및 설정 변경
5. UI/UX 컴포넌트 변경

각 후보는 실제 변경된 파일과 내용을 바탕으로 구체적인 확인 사항을 제시해주세요.
"~가 수정되었습니다. ~를 확인해주세요" 형태로 작성해주세요.

응답은 반드시 다음 JSON 형식으로만 해주세요:
{
  "priority": [
    {
      "title": "구체적인 변경 내용 (예: 'JWT 토큰 검증 로직 수정')",
      "priority_level": "CRITICAL|HIGH|MEDIUM|LOW",
      "reason": "~가 수정되었습니다. ~를 확인해주세요. (구체적인 체크포인트 포함)"
    },
    {
      "title": "구체적인 변경 내용",
      "priority_level": "CRITICAL|HIGH|MEDIUM|LOW", 
      "reason": "~가 수정되었습니다. ~를 확인해주세요. (구체적인 체크포인트 포함)"
    },
    {
      "title": "구체적인 변경 내용",
      "priority_level": "CRITICAL|HIGH|MEDIUM|LOW",
      "reason": "~가 수정되었습니다. ~를 확인해주세요. (구체적인 체크포인트 포함)"
    }
  ]
}"""

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


def _parse_priority_candidates_response(response_text: str, pr_data: PRData) -> Dict[str, Any]:
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


def _calculate_basic_priority_candidates(pr_data: PRData) -> Dict[str, Any]:
    """
    LLM 실패 시 사용할 기본 우선순위 3개 후보 계산
    
    **DEPRECATED**: 이 함수는 더 이상 사용되지 않습니다.
    대신 config_based_priority.py의 calculate_config_based_priority_candidates를 사용하세요.
    하드코딩된 규칙들이 YAML 설정 파일로 분리되어 더 유지보수하기 쉽습니다.
    
    Args:
        pr_data: PR 데이터
        
    Returns:
        Dict[str, Any]: 3개의 기본 우선순위 후보 결과
    """
    try:
        total_changes = sum(f.additions + f.deletions for f in pr_data.files)
        file_count = len(pr_data.files)
        
        # 파일 타입별 분석
        security_files = [f for f in pr_data.files if any(keyword in f.filename.lower() 
                         for keyword in ['auth', 'security', 'jwt', 'password', 'token', 'login'])]
        
        db_files = [f for f in pr_data.files if any(keyword in f.filename.lower()
                   for keyword in ['model', 'entity', 'migration', 'schema', 'database'])]
        
        api_files = [f for f in pr_data.files if any(keyword in f.filename.lower()
                    for keyword in ['controller', 'api', 'endpoint', 'route', 'handler'])]
        
        test_files = [f for f in pr_data.files if 'test' in f.filename.lower()]
        
        candidates = []
        
        # 실제 파일명과 변경사항 분석
        security_file_names = [f.filename for f in security_files]
        db_file_names = [f.filename for f in db_files]
        api_file_names = [f.filename for f in api_files]
        test_file_names = [f.filename for f in test_files]
        
        # 첫 번째 후보: 보안/인증 관련 변경
        if security_files:
            security_types = []
            for fname in security_file_names:
                if 'jwt' in fname.lower():
                    security_types.append('JWT 토큰')
                elif 'auth' in fname.lower():
                    security_types.append('인증')
                elif 'security' in fname.lower():
                    security_types.append('보안 설정')
                elif any(kw in fname.lower() for kw in ['password', 'token', 'login']):
                    security_types.append('로그인/토큰')
            
            security_desc = ', '.join(security_types) if security_types else '보안'
            candidates.append({
                'title': f'{security_desc} 로직 수정',
                'priority_level': 'CRITICAL',
                'reason': f'{", ".join(security_file_names[:2])} 등의 보안 관련 파일이 수정되었습니다. {security_desc} 검증 로직과 권한 체크, 보안 취약점이 없는지 확인해주세요.'
            })
        elif total_changes > 500 or file_count > 15:
            main_files = [f.filename for f in pr_data.files[:3]]
            candidates.append({
                'title': '대규모 기능 구현',
                'priority_level': 'HIGH', 
                'reason': f'{", ".join(main_files)} 등 총 {file_count}개 파일에 {total_changes}라인이 변경되었습니다. 전체적인 아키텍처 영향도와 기능 간 연관성을 확인해주세요.'
            })
        else:
            main_file = pr_data.files[0].filename if pr_data.files else '파일'
            candidates.append({
                'title': '일반 기능 변경',
                'priority_level': 'MEDIUM',
                'reason': f'{main_file} 등에서 기능이 수정되었습니다. 비즈니스 로직이 올바르게 구현되었는지와 예외 처리를 확인해주세요.'
            })
        
        # 두 번째 후보: API/데이터베이스 변경
        if db_files:
            db_desc = []
            for fname in db_file_names:
                if 'entity' in fname.lower() or 'model' in fname.lower():
                    db_desc.append('엔티티/모델')
                elif 'migration' in fname.lower():
                    db_desc.append('마이그레이션')
                elif 'repository' in fname.lower():
                    db_desc.append('레포지토리')
            
            db_type = ', '.join(set(db_desc)) if db_desc else '데이터베이스'
            candidates.append({
                'title': f'데이터베이스 {db_type} 변경',
                'priority_level': 'HIGH',
                'reason': f'{", ".join(db_file_names[:2])} 등의 데이터베이스 관련 파일이 수정되었습니다. 스키마 변경사항, 데이터 무결성, 마이그레이션 스크립트를 확인해주세요.'
            })
        elif api_files:
            api_desc = []
            for fname in api_file_names:
                if 'controller' in fname.lower():
                    api_desc.append('컨트롤러')
                elif 'api' in fname.lower():
                    api_desc.append('API')
                elif any(kw in fname.lower() for kw in ['endpoint', 'route']):
                    api_desc.append('엔드포인트')
            
            api_type = ', '.join(set(api_desc)) if api_desc else 'API'
            candidates.append({
                'title': f'{api_type} 인터페이스 변경', 
                'priority_level': 'HIGH',
                'reason': f'{", ".join(api_file_names[:2])} 등의 API 관련 파일이 수정되었습니다. 요청/응답 스펙 변경, 기존 클라이언트 호환성, 에러 처리를 확인해주세요.'
            })
        else:
            candidates.append({
                'title': '내부 로직 구현',
                'priority_level': 'MEDIUM',
                'reason': '내부 비즈니스 로직이 구현되었습니다. 코드 품질, 성능, 가독성 측면에서 검토해주세요.'
            })
        
        # 세 번째 후보: 테스트 및 기타 변경
        if test_files:
            candidates.append({
                'title': '테스트 코드 추가/수정',
                'priority_level': 'MEDIUM',
                'reason': f'{", ".join(test_file_names[:2])} 등의 테스트 파일이 수정되었습니다. 테스트 시나리오 적절성, 커버리지, 테스트 코드 품질을 확인해주세요.'
            })
        elif total_changes < 50 and file_count <= 3:
            changed_files = [f.filename for f in pr_data.files]
            candidates.append({
                'title': '소규모 수정사항',
                'priority_level': 'LOW',
                'reason': f'{", ".join(changed_files)} 파일에 {total_changes}라인의 소규모 변경이 있습니다. 기본적인 코드 리뷰 후 안전하게 진행해주세요.'
            })
        else:
            candidates.append({
                'title': '코드 품질 검토',
                'priority_level': 'MEDIUM',
                'reason': f'여러 파일에 걸친 변경사항이 있습니다. 코딩 컨벤션 준수, 성능 이슈, 유지보수성을 중점적으로 확인해주세요.'
            })
        
        return {
            'candidates': candidates,
            'pr_info': {
                'total_files': file_count,
                'total_changes': total_changes,
                'security_files': len(security_files),
                'db_files': len(db_files),
                'api_files': len(api_files),
                'test_files': len(test_files),
                'branch_info': f"{pr_data.source} -> {pr_data.target}"
            }
        }
        
    except Exception as e:
        logger.error(f"기본 우선순위 후보 계산 실패: {str(e)}")
        return {
            'candidates': [
                {
                    'title': '분석 오류로 인한 기본 설정',
                    'priority_level': 'MEDIUM',
                    'reason': '우선순위 분석 중 오류가 발생하여 기본 중간 우선순위로 설정했습니다.'
                },
                {
                    'title': '수동 검토 필요',
                    'priority_level': 'MEDIUM',
                    'reason': '자동 분석이 실패하여 수동으로 우선순위를 결정해주세요.'
                },
                {
                    'title': '안전한 기본값 적용',
                    'priority_level': 'MEDIUM',
                    'reason': '시스템 오류로 인해 안전한 기본값을 적용했습니다.'
                }
            ],
            'pr_info': {
                'total_files': len(pr_data.files) if pr_data.files else 0,
                'total_changes': 0,
                'branch_info': f"{pr_data.source} -> {pr_data.target}" if pr_data else "unknown"
            }
        }