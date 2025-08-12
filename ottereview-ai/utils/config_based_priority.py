"""
설정 파일 기반 우선순위 계산 로직
하드코딩된 규칙들을 YAML 설정으로 분리하여 유연성 확보
"""
from typing import Dict, Any, List
import logging
from .priority_config import get_priority_config
from models import PreparationResult, PRData  # PRData는 하위 호환성을 위해 유지

logger = logging.getLogger(__name__)

def calculate_config_based_priority_candidates(pr_data: PreparationResult) -> Dict[str, Any]:
    """
    설정 파일 기반으로 3개의 우선순위 후보 계산
    
    Args:
        pr_data: PR 데이터
        
    Returns:
        Dict[str, Any]: 3개의 우선순위 후보 결과
    """
    try:
        config = get_priority_config()
        
        total_changes = sum(f.additions + f.deletions for f in pr_data.files)
        file_count = len(pr_data.files)
        
        # 파일별로 매칭되는 규칙들을 분석
        file_rule_matches = _analyze_file_rules(pr_data.files, config)
        
        candidates = []
        
        # 첫 번째 후보: 가장 높은 우선순위 규칙
        first_candidate = _generate_first_candidate(file_rule_matches, config, total_changes, file_count, pr_data)
        candidates.append(first_candidate)
        
        # 두 번째 후보: 두 번째로 높은 우선순위 또는 대안 규칙
        second_candidate = _generate_second_candidate(file_rule_matches, config, total_changes, file_count)
        candidates.append(second_candidate)
        
        # 세 번째 후보: 나머지 규칙 또는 기본 규칙
        third_candidate = _generate_third_candidate(file_rule_matches, config, total_changes, file_count, pr_data)
        candidates.append(third_candidate)
        
        return {
            'candidates': candidates,
            'pr_info': {
                'total_files': file_count,
                'total_changes': total_changes,
                'security_files': file_rule_matches.get('security', {}).get('count', 0),
                'db_files': file_rule_matches.get('database', {}).get('count', 0),
                'api_files': file_rule_matches.get('api', {}).get('count', 0),
                'test_files': file_rule_matches.get('test', {}).get('count', 0),
                'branch_info': f"{pr_data.source} -> {pr_data.target}"
            }
        }
        
    except Exception as e:
        logger.error(f"설정 기반 우선순위 후보 계산 실패: {str(e)}")
        return _get_error_fallback_candidates(pr_data)


def _analyze_file_rules(files: List[Any], config) -> Dict[str, Any]:
    """
    파일들을 분석하여 각 규칙별로 매칭되는 정보를 수집
    
    Args:
        files: PR의 파일들
        config: 우선순위 규칙 설정
        
    Returns:
        Dict: 규칙별 매칭 정보
    """
    file_rule_matches = {}
    
    for file_obj in files:
        filename = file_obj.filename
        matches = config.find_matching_rules(filename)
        
        for category, rule_info, keyword in matches:
            if category not in file_rule_matches:
                file_rule_matches[category] = {
                    'files': [],
                    'keywords': set(),
                    'descriptions': set(),
                    'count': 0,
                    'rule_info': rule_info
                }
            
            file_rule_matches[category]['files'].append(filename)
            file_rule_matches[category]['keywords'].add(keyword)
            file_rule_matches[category]['descriptions'].add(
                config.get_description_for_keyword(category, keyword)
            )
            file_rule_matches[category]['count'] += 1
    
    return file_rule_matches


def _generate_first_candidate(file_rule_matches: Dict, config, total_changes: int, file_count: int, pr_data=None) -> Dict[str, str]:
    """첫 번째 우선순위 후보 생성 (가장 높은 우선순위)"""
    
    # 우선순위 순서: security > database > api > test
    priority_order = ['security', 'database', 'api', 'test']
    
    for category in priority_order:
        if category in file_rule_matches:
            match_info = file_rule_matches[category]
            descriptions = ', '.join(list(match_info['descriptions']))
            files = match_info['files']
            
            title = config.format_title(category, 
                                      security_desc=descriptions,
                                      db_desc=descriptions, 
                                      api_desc=descriptions)
            
            reason = config.format_reason(category, files,
                                        security_desc=descriptions,
                                        db_desc=descriptions,
                                        api_desc=descriptions)
            
            return {
                'title': title,
                'priority_level': config.get_priority_level(category),
                'reason': reason
            }
    
    # 매칭된 규칙이 없으면 변경 규모로 판단
    scale_rule_name, scale_rule = config.check_change_scale_condition(total_changes, file_count)
    if scale_rule:
        main_files = [f.filename for f in pr_data.files[:3]] if pr_data else []
        reason = scale_rule.get('reason_template', '').format(
            files=', '.join(main_files),
            file_count=file_count,
            total_changes=total_changes
        )
        
        return {
            'title': scale_rule.get('title', '기능 변경'),
            'priority_level': scale_rule.get('priority_level', 'MEDIUM'),
            'reason': reason
        }
    
    # 최종 폴백
    fallback_rules = config.get_fallback_rules()
    general_rule = fallback_rules.get('general_feature', {})
    
    return {
        'title': general_rule.get('title', '일반 기능 변경'),
        'priority_level': general_rule.get('priority_level', 'MEDIUM'),
        'reason': general_rule.get('reason_template', '기능이 수정되었습니다.')
    }


def _generate_second_candidate(file_rule_matches: Dict, config, total_changes: int, file_count: int) -> Dict[str, str]:
    """두 번째 우선순위 후보 생성"""
    
    # 첫 번째와 다른 카테고리 선택
    used_categories = set()
    priority_order = ['database', 'api', 'security', 'test']
    
    for category in priority_order:
        if category in file_rule_matches and category not in used_categories:
            match_info = file_rule_matches[category]
            descriptions = ', '.join(list(match_info['descriptions']))
            files = match_info['files']
            
            title = config.format_title(category,
                                      db_desc=descriptions,
                                      api_desc=descriptions,
                                      security_desc=descriptions)
            
            reason = config.format_reason(category, files,
                                        db_desc=descriptions,
                                        api_desc=descriptions,
                                        security_desc=descriptions)
            
            used_categories.add(category)
            return {
                'title': title,
                'priority_level': config.get_priority_level(category),
                'reason': reason
            }
    
    # 매칭된 다른 규칙이 없으면 내부 로직 규칙 사용
    fallback_rules = config.get_fallback_rules()
    internal_rule = fallback_rules.get('internal_logic', {})
    
    return {
        'title': internal_rule.get('title', '내부 로직 구현'),
        'priority_level': internal_rule.get('priority_level', 'MEDIUM'),
        'reason': internal_rule.get('reason_template', '내부 비즈니스 로직이 구현되었습니다.')
    }


def _generate_third_candidate(file_rule_matches: Dict, config, total_changes: int, file_count: int, pr_data=None) -> Dict[str, str]:
    """세 번째 우선순위 후보 생성"""
    
    # 테스트 파일이 있으면 테스트 관련 후보
    if 'test' in file_rule_matches:
        match_info = file_rule_matches['test']
        files = match_info['files']
        
        title = config.format_title('test')
        reason = config.format_reason('test', files)
        
        return {
            'title': title,
            'priority_level': config.get_priority_level('test'),
            'reason': reason
        }
    
    # 소규모 변경인지 확인
    scale_rule_name, scale_rule = config.check_change_scale_condition(total_changes, file_count)
    if scale_rule_name == 'small_scale':
        changed_files = [f.filename for f in pr_data.files] if pr_data else []
        reason = scale_rule.get('reason_template', '').format(
            files=', '.join(changed_files),
            total_changes=total_changes
        )
        
        return {
            'title': scale_rule.get('title', '소규모 수정사항'),
            'priority_level': scale_rule.get('priority_level', 'LOW'),
            'reason': reason
        }
    
    # 기본 코드 품질 검토
    fallback_rules = config.get_fallback_rules()
    quality_rule = fallback_rules.get('code_quality', {})
    
    return {
        'title': quality_rule.get('title', '코드 품질 검토'),
        'priority_level': quality_rule.get('priority_level', 'MEDIUM'),
        'reason': quality_rule.get('reason_template', '여러 파일에 걸친 변경사항이 있습니다.')
    }


def _get_error_fallback_candidates(pr_data: PreparationResult) -> Dict[str, Any]:
    """에러 상황에서 사용할 기본 후보들"""
    try:
        config = get_priority_config()
        error_fallback = config.get_error_fallback()
        
        return {
            'candidates': error_fallback,
            'pr_info': {
                'total_files': len(pr_data.files) if pr_data.files else 0,
                'total_changes': 0,
                'branch_info': f"{pr_data.source} -> {pr_data.target}" if pr_data else "unknown"
            }
        }
    except Exception as e:
        logger.error(f"에러 폴백 후보 생성 실패: {str(e)}")
        # 최종 하드코딩된 폴백
        return {
            'candidates': [
                {
                    'title': '시스템 오류',
                    'priority_level': 'MEDIUM',
                    'reason': '우선순위 분석 시스템에 오류가 발생했습니다.'
                }
            ],
            'pr_info': {
                'total_files': 0,
                'total_changes': 0,
                'branch_info': 'unknown'
            }
        }