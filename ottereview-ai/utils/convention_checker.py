import re
import ast
import logging
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class ConventionType(str, Enum):
    """지원되는 네이밍 컨벤션 타입"""
    CAMEL_CASE = "camelCase"
    PASCAL_CASE = "PascalCase"
    SNAKE_CASE = "snake_case"
    KEBAB_CASE = "kebab-case"
    CONSTANT_CASE = "CONSTANT_CASE"

@dataclass
class Identifier:
    """코드에서 추출된 식별자"""
    name: str
    type: str  # 'function', 'variable', 'class', 'constant'
    line_number: int
    context: str = ""

@dataclass
class ConventionViolation:
    """컨벤션 위반 정보"""
    file_path: str
    line_number: int
    element_type: str
    element_name: str
    expected_convention: ConventionType
    suggested_name: str
    severity: str = "medium"  # low, medium, high

class RegexConventionChecker:
    """정규식 기반 빠른 컨벤션 체크"""
    
    PATTERNS = {
        ConventionType.CAMEL_CASE: r'^[a-z][a-zA-Z0-9]*$',
        ConventionType.PASCAL_CASE: r'^[A-Z][a-zA-Z0-9]*$',
        ConventionType.SNAKE_CASE: r'^[a-z][a-z0-9_]*$',
        ConventionType.KEBAB_CASE: r'^[a-z][a-z0-9\-]*$',
        ConventionType.CONSTANT_CASE: r'^[A-Z][A-Z0-9_]*$'
    }
    
    @classmethod
    def matches_convention(cls, name: str, convention: ConventionType) -> bool:
        """이름이 컨벤션에 맞는지 정규식으로 체크"""
        pattern = cls.PATTERNS.get(convention)
        if not pattern:
            return True
        return bool(re.match(pattern, name))
    
    @classmethod
    def suggest_name(cls, name: str, target_convention: ConventionType) -> str:
        """컨벤션에 맞는 이름 제안"""
        if target_convention == ConventionType.CAMEL_CASE:
            return cls._to_camel_case(name)
        elif target_convention == ConventionType.PASCAL_CASE:
            return cls._to_pascal_case(name)
        elif target_convention == ConventionType.SNAKE_CASE:
            return cls._to_snake_case(name)
        elif target_convention == ConventionType.KEBAB_CASE:
            return cls._to_kebab_case(name)
        elif target_convention == ConventionType.CONSTANT_CASE:
            return cls._to_constant_case(name)
        return name
    
    @staticmethod
    def _to_camel_case(name: str) -> str:
        """camelCase로 변환"""
        # snake_case나 kebab-case에서 변환
        parts = re.split(r'[_\-]', name.lower())
        if len(parts) <= 1:
            # PascalCase에서 변환
            s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
            parts = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).split('_')
            if len(parts) <= 1:
                return name.lower()
        return parts[0].lower() + ''.join(word.capitalize() for word in parts[1:])
    
    @staticmethod
    def _to_pascal_case(name: str) -> str:
        """PascalCase로 변환"""
        # snake_case나 kebab-case에서 변환
        parts = re.split(r'[_\-]', name.lower())
        if len(parts) <= 1:
            # camelCase에서 변환
            if name and name[0].islower():
                return name[0].upper() + name[1:]
            return name
        return ''.join(word.capitalize() for word in parts)
    
    @staticmethod
    def _to_snake_case(name: str) -> str:
        """snake_case로 변환"""
        # camelCase나 PascalCase에서 변환
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
    
    @staticmethod
    def _to_kebab_case(name: str) -> str:
        """kebab-case로 변환"""
        return RegexConventionChecker._to_snake_case(name).replace('_', '-')
    
    @staticmethod
    def _to_constant_case(name: str) -> str:
        """CONSTANT_CASE로 변환"""
        return RegexConventionChecker._to_snake_case(name).upper()

class PythonASTParser:
    """Python AST 파서"""
    
    @staticmethod
    def extract_identifiers(content: str) -> List[Identifier]:
        """Python 코드에서 식별자 추출"""
        identifiers = []
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    # Python 특수 메서드(__init__, __str__ 등)는 제외
                    if not (node.name.startswith('__') and node.name.endswith('__')):
                        identifiers.append(Identifier(
                            name=node.name,
                            type="function",
                            line_number=node.lineno
                        ))
                elif isinstance(node, ast.ClassDef):
                    identifiers.append(Identifier(
                        name=node.name,
                        type="class",
                        line_number=node.lineno
                    ))
                elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                    # 변수 할당
                    identifiers.append(Identifier(
                        name=node.id,
                        type="variable",
                        line_number=node.lineno
                    ))
                elif isinstance(node, ast.Assign):
                    # 상수 체크 (대문자로만 구성된 변수)
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            if target.id.isupper():
                                identifiers.append(Identifier(
                                    name=target.id,
                                    type="constant",
                                    line_number=node.lineno
                                ))
        except Exception as e:
            logger.warning(f"Python AST 파싱 오류: {e}")
        return identifiers

class JavaScriptParser:
    """JavaScript/TypeScript 파서 (정규식 기반)"""
    
    @staticmethod
    def extract_identifiers(content: str) -> List[Identifier]:
        """JavaScript/TypeScript 코드에서 식별자 추출"""
        identifiers = []
        lines = content.split('\n')
        
        # 함수 선언 패턴들
        func_patterns = [
            r'function\s+(\w+)\s*\(',  # function myFunc()
            r'const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*\{|function)',  # const myFunc = () =>
            r'(\w+)\s*:\s*(?:async\s+)?function',  # myFunc: function
            r'(\w+)\s*\([^)]*\)\s*\{',  # method() { (클래스 메서드)
        ]
        
        # 클래스 선언
        class_pattern = r'class\s+(\w+)'
        
        # 변수 선언 (상수가 아닌 것)
        var_patterns = [
            r'(?:const|let|var)\s+(\w+)(?:\s*=|\s*;)',
            r'(?:const|let|var)\s*\{\s*(\w+)',  # 구조분해할당
        ]
        
        # 상수 (대문자로만 구성)
        const_pattern = r'const\s+([A-Z_][A-Z0-9_]*)\s*='
        
        for i, line in enumerate(lines, 1):
            # 클래스 먼저 체크
            for match in re.finditer(class_pattern, line):
                identifiers.append(Identifier(
                    name=match.group(1),
                    type="class",
                    line_number=i
                ))
            
            # 상수 체크
            for match in re.finditer(const_pattern, line):
                identifiers.append(Identifier(
                    name=match.group(1),
                    type="constant",
                    line_number=i
                ))
            
            # 함수 체크
            for pattern in func_patterns:
                for match in re.finditer(pattern, line):
                    name = match.group(1)
                    if not name.isupper():  # 상수가 아닌 경우만
                        identifiers.append(Identifier(
                            name=name,
                            type="function",
                            line_number=i
                        ))
            
            # 변수 체크 (상수와 함수가 아닌 것)
            for pattern in var_patterns:
                for match in re.finditer(pattern, line):
                    name = match.group(1)
                    if not name.isupper() and not any(f.name == name and f.type == "function" for f in identifiers):
                        identifiers.append(Identifier(
                            name=name,
                            type="variable",
                            line_number=i
                        ))
        
        return identifiers

class JavaParser:
    """Java 파서 (정규식 기반)"""
    
    @staticmethod
    def extract_identifiers(content: str) -> List[Identifier]:
        """Java 코드에서 식별자 추출"""
        identifiers = []
        lines = content.split('\n')
        
        # 클래스/인터페이스 선언
        class_pattern = r'(?:public\s+|private\s+|protected\s+)?(?:class|interface)\s+(\w+)'
        
        # 메서드 선언
        method_pattern = r'(?:public\s+|private\s+|protected\s+|static\s+)*\w+\s+(\w+)\s*\([^)]*\)\s*\{'
        
        # 변수 선언
        var_pattern = r'(?:public\s+|private\s+|protected\s+|static\s+)*(?:final\s+)?\w+\s+(\w+)\s*[=;]'
        
        # 상수 (static final이거나 대문자)
        const_pattern = r'(?:public\s+|private\s+|protected\s+)?static\s+final\s+\w+\s+([A-Z_][A-Z0-9_]*)'
        
        for i, line in enumerate(lines, 1):
            # 클래스/인터페이스
            for match in re.finditer(class_pattern, line):
                identifiers.append(Identifier(
                    name=match.group(1),
                    type="class",
                    line_number=i
                ))
            
            # 상수
            for match in re.finditer(const_pattern, line):
                identifiers.append(Identifier(
                    name=match.group(1),
                    type="constant",
                    line_number=i
                ))
            
            # 메서드
            for match in re.finditer(method_pattern, line):
                name = match.group(1)
                # Java 특수 메서드와 생성자 제외
                if not name.isupper() and name not in ['main', 'toString', 'equals', 'hashCode'] and not name[0].isupper():
                    identifiers.append(Identifier(
                        name=name,
                        type="function",
                        line_number=i
                    ))
            
            # 변수
            for match in re.finditer(var_pattern, line):
                name = match.group(1)
                if not name.isupper() and not any(f.name == name for f in identifiers):
                    identifiers.append(Identifier(
                        name=name,
                        type="variable",
                        line_number=i
                    ))
        
        return identifiers

class FastConventionChecker:
    """빠른 컨벤션 체크 메인 클래스"""
    
    def __init__(self):
        self.regex_checker = RegexConventionChecker()
        self.parsers = {
            'py': PythonASTParser(),
            'js': JavaScriptParser(),
            'ts': JavaScriptParser(),
            'jsx': JavaScriptParser(),
            'tsx': JavaScriptParser(),
            'java': JavaParser(),
        }
    
    def check_file_conventions(self, file_path: str, content: str, rules: Dict[str, ConventionType]) -> List[ConventionViolation]:
        """파일의 컨벤션을 빠르게 체크"""
        violations = []
        
        # 파일명 체크
        if 'file_names' in rules:
            filename = file_path.split('/')[-1].split('.')[0]  # 확장자 제거
            if not self.regex_checker.matches_convention(filename, rules['file_names']):
                suggested = self.regex_checker.suggest_name(filename, rules['file_names'])
                violations.append(ConventionViolation(
                    file_path=file_path,
                    line_number=0,
                    element_type="filename",
                    element_name=filename,
                    expected_convention=rules['file_names'],
                    suggested_name=suggested,
                    severity="low"
                ))
        
        # 언어별 파서로 식별자 추출
        ext = self._get_file_extension(file_path)
        parser = self.parsers.get(ext)
        
        if not parser:
            logger.warning(f"지원하지 않는 파일 확장자: {ext}")
            return violations
        
        identifiers = parser.extract_identifiers(content)
        
        # 각 식별자에 대해 컨벤션 체크
        for identifier in identifiers:
            rule_key = f"{identifier.type}_names"
            if rule_key in rules:
                expected_convention = rules[rule_key]
                if not self.regex_checker.matches_convention(identifier.name, expected_convention):
                    suggested = self.regex_checker.suggest_name(identifier.name, expected_convention)
                    violations.append(ConventionViolation(
                        file_path=file_path,
                        line_number=identifier.line_number,
                        element_type=identifier.type,
                        element_name=identifier.name,
                        expected_convention=expected_convention,
                        suggested_name=suggested,
                        severity=self._get_violation_severity(identifier.type)
                    ))
        
        return violations
    
    def _get_file_extension(self, file_path: str) -> str:
        """파일 확장자 추출"""
        return file_path.split('.')[-1].lower() if '.' in file_path else ''
    
    def _get_violation_severity(self, element_type: str) -> str:
        """요소 타입별 위반 심각도"""
        severity_map = {
            'class': 'high',
            'function': 'medium', 
            'constant': 'medium',
            'variable': 'low',
            'filename': 'low'
        }
        return severity_map.get(element_type, 'medium')

def format_violations_korean(violations: List[ConventionViolation]) -> str:
    """위반사항을 한국어로 포맷팅"""
    if not violations:
        return "코딩 컨벤션을 잘 준수하고 있습니다."
    
    result = []
    grouped = {}
    
    # 파일별로 그룹화
    for violation in violations:
        if violation.file_path not in grouped:
            grouped[violation.file_path] = []
        grouped[violation.file_path].append(violation)
    
    for file_path, file_violations in grouped.items():
        result.append(f"\n📁 {file_path}")
        
        for v in file_violations:
            element_type_kr = {
                'class': '클래스',
                'function': '함수',
                'variable': '변수', 
                'constant': '상수',
                'filename': '파일명'
            }.get(v.element_type, v.element_type)
            
            convention_kr = {
                'camelCase': 'camelCase',
                'PascalCase': 'PascalCase',
                'snake_case': 'snake_case',
                'kebab-case': 'kebab-case',
                'CONSTANT_CASE': 'CONSTANT_CASE'
            }.get(v.expected_convention.value, v.expected_convention.value)
            
            line_info = f" (라인 {v.line_number})" if v.line_number > 0 else ""
            result.append(f"  ⚠️  {element_type_kr} '{v.element_name}'{line_info}은(는) {convention_kr} 규칙에 따라 '{v.suggested_name}'으로 수정해야 합니다.")
    
    return "\n".join(result)