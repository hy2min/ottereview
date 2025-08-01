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
    """
    commit_messages = "\n".join(pr_data.commit_messages)
    file_changes_summary = "\n".join(pr_data.file_changes)
    code_changes = "\n".join(pr_data.code_changes)
    branch_name = pr_data.branch_name

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
    


    
   
    
