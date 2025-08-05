import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

# .env 파일에서 환경변수 로드
load_dotenv()

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

