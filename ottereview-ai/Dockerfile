# Python 3.10 이미지 사용
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 설치 (필요시)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 의존성 설치 (캐시 효율성)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
# .dockerignore에 의해 불필요한 파일은 제외됨
COPY . .

# 필요한 디렉토리 생성
RUN mkdir -p /app/models /app/chroma_db /app/backup_data

# 포트 8000 노출
EXPOSE 8000

# 비루트 사용자로 실행 (보안)
RUN adduser --disabled-password --gecos '' --uid 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# ChromaDB 데이터 디렉토리를 볼륨으로 선언
VOLUME ["/app/models"]

# FastAPI 애플리케이션 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]