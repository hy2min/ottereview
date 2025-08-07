"""
우선순위 규칙 설정 파일을 읽어오고 관리하는 유틸리티 모듈
"""
import yaml
import os
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class PriorityRuleConfig:
    """우선순위 규칙 설정 관리 클래스"""
    
    def __init__(self, config_path: str = None):
        """
        Args:
            config_path: 설정 파일 경로. None이면 기본 경로 사용
        """
        if config_path is None:
            # 현재 파일의 디렉토리에서 상위로 올라가서 config 디렉토리 찾기
            current_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(os.path.dirname(current_dir), 'config', 'priority_rules.yaml')
        
        self.config_path = config_path
        self._config = None
        self._load_config()
    
    def _load_config(self):
        """YAML 설정 파일을 로드"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as file:
                self._config = yaml.safe_load(file)
                logger.info(f"우선순위 규칙 설정 로드 완료: {self.config_path}")
        except FileNotFoundError:
            logger.error(f"우선순위 규칙 설정 파일을 찾을 수 없습니다: {self.config_path}")
            raise
        except yaml.YAMLError as e:
            logger.error(f"YAML 파싱 오류: {e}")
            raise
        except Exception as e:
            logger.error(f"설정 파일 로드 중 오류 발생: {e}")
            raise
    
    def get_priority_rules(self) -> Dict[str, Any]:
        """우선순위 규칙들을 반환"""
        return self._config.get('priority_rules', {})
    
    def get_change_scale_rules(self) -> Dict[str, Any]:
        """변경 규모별 규칙들을 반환"""
        return self._config.get('change_scale_rules', {})
    
    def get_fallback_rules(self) -> Dict[str, Any]:
        """기본 폴백 규칙들을 반환"""
        return self._config.get('fallback_rules', {})
    
    def get_error_fallback(self) -> List[Dict[str, str]]:
        """에러 상황 기본값들을 반환"""
        return self._config.get('error_fallback', [])
    
    def get_rule_by_category(self, category: str) -> Dict[str, Any]:
        """특정 카테고리의 규칙을 반환"""
        return self.get_priority_rules().get(category, {})
    
    def find_matching_rules(self, filename: str) -> List[tuple]:
        """
        파일명에서 매칭되는 규칙들을 찾아 반환
        
        Args:
            filename: 검사할 파일명
            
        Returns:
            List[tuple]: (카테고리명, 규칙정보, 매칭된키워드) 튜플들의 리스트
        """
        matches = []
        filename_lower = filename.lower()
        
        priority_rules = self.get_priority_rules()
        
        for category, rule_info in priority_rules.items():
            keywords = rule_info.get('keywords', [])
            
            for keyword in keywords:
                if keyword in filename_lower:
                    matches.append((category, rule_info, keyword))
        
        return matches
    
    def get_description_for_keyword(self, category: str, keyword: str) -> str:
        """
        특정 카테고리와 키워드에 대한 설명을 반환
        
        Args:
            category: 규칙 카테고리
            keyword: 키워드
            
        Returns:
            str: 키워드에 대한 설명 (없으면 키워드 자체 반환)
        """
        rule_info = self.get_rule_by_category(category)
        descriptions = rule_info.get('descriptions', {})
        return descriptions.get(keyword, keyword)
    
    def format_reason(self, category: str, files: List[str], **kwargs) -> str:
        """
        특정 카테고리의 이유 템플릿을 포맷팅하여 반환
        
        Args:
            category: 규칙 카테고리
            files: 파일명 리스트
            **kwargs: 템플릿에서 사용할 추가 변수들
            
        Returns:
            str: 포맷팅된 이유 문자열
        """
        rule_info = self.get_rule_by_category(category)
        reason_template = rule_info.get('reason_template', '')
        
        # 파일명 리스트를 문자열로 변환 (최대 2개까지만)
        files_str = ', '.join(files[:2])
        
        try:
            return reason_template.format(files=files_str, **kwargs)
        except KeyError as e:
            logger.warning(f"템플릿 포맷팅 중 키 오류: {e}")
            return reason_template
    
    def format_title(self, category: str, **kwargs) -> str:
        """
        특정 카테고리의 제목 템플릿을 포맷팅하여 반환
        
        Args:
            category: 규칙 카테고리
            **kwargs: 템플릿에서 사용할 변수들
            
        Returns:
            str: 포맷팅된 제목 문자열
        """
        rule_info = self.get_rule_by_category(category)
        title_template = rule_info.get('title_template', '')
        
        try:
            return title_template.format(**kwargs)
        except KeyError as e:
            logger.warning(f"제목 템플릿 포맷팅 중 키 오류: {e}")
            return title_template
    
    def get_priority_level(self, category: str) -> str:
        """특정 카테고리의 우선순위 레벨을 반환"""
        rule_info = self.get_rule_by_category(category)
        return rule_info.get('priority_level', 'MEDIUM')
    
    def check_change_scale_condition(self, total_changes: int, file_count: int) -> tuple:
        """
        변경 규모 조건을 확인하여 해당하는 규칙을 반환
        
        Args:
            total_changes: 총 변경 라인 수
            file_count: 변경된 파일 수
            
        Returns:
            tuple: (규칙명, 규칙정보) 또는 (None, None)
        """
        change_scale_rules = self.get_change_scale_rules()
        
        # 대규모 변경 확인
        if 'large_scale' in change_scale_rules:
            large_scale = change_scale_rules['large_scale']
            condition = large_scale.get('condition', {})
            
            if (total_changes >= condition.get('total_changes', float('inf')) or 
                file_count >= condition.get('file_count', float('inf'))):
                return ('large_scale', large_scale)
        
        # 소규모 변경 확인
        if 'small_scale' in change_scale_rules:
            small_scale = change_scale_rules['small_scale']
            condition = small_scale.get('condition', {})
            
            if (total_changes < condition.get('total_changes', 0) and 
                file_count <= condition.get('file_count', 0)):
                return ('small_scale', small_scale)
        
        return (None, None)
    
    def reload_config(self):
        """설정 파일을 다시 로드"""
        self._load_config()


# 전역 인스턴스 (싱글톤 패턴)
_priority_config = None

def get_priority_config() -> PriorityRuleConfig:
    """전역 우선순위 규칙 설정 인스턴스를 반환"""
    global _priority_config
    if _priority_config is None:
        _priority_config = PriorityRuleConfig()
    return _priority_config