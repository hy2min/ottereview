package com.ssafy.ottereview.githubapp.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum GithubAppErrorCode implements ErrorCode {
    
    GITHUB_APP_INSTALLATION_FAILED("GITHUB001", "GitHub 앱 설치에 실패했습니다", 500),
    GITHUB_APP_PARSE_ERROR("GITHUB002", "GitHub 앱 파싱 오류가 발생했습니다", 400),
    GITHUB_APP_PRIVATE_KEY_ERROR("GITHUB003", "GitHub 앱 개인 키 오류가 발생했습니다", 500),
    GITHUB_APP_CREATE_FAILED("GITHUB004", "GitHub 앱 생성에 실패했습니다", 500),
    GITHUB_TOKEN_REQUEST_FAILED("GITHUB005", "GitHub 토큰 요청에 실패했습니다", 500),
    GITHUB_APP_OAUTH_ERROR("GITHUB006", "GitHub App OAuth 인증 오류가 발생했습니다", 401),
    GITHUB_REPOSITORY_NOT_FOUND("GITHUB007", "저장소를 찾을 수 없거나 접근 권한이 없습니다.", 404),
    GITHUB_APP_INSTALLATION_NOT_FOUND("GITHUB008", "GitHub 앱 설치 정보를 찾을 수 없습니다.", 404),
    GITHUB_APP_PULL_REQUEST_NOT_FOUND("GITHUB009", "GitHub 앱 풀 리퀘스트 정보를 찾을 수 없습니다.", 404),
    GITHUB_APP_ACCOUNT_NOT_FOUND("GITHUB010", "GitHub 앱 계정 정보를 찾을 수 없습니다.", 404),
    GITHUB_APP_PULL_REQUEST_FILE_NOT_FOUND("GITHUB011", "GitHub 앱 풀 리퀘스트 파일 정보를 찾을 수 없습니다.", 404),
    GITHUB_APP_PULL_REQUEST_COMMIT_NOT_FOUND("GITHUB012", "GitHub 앱 풀 리퀘스트 커밋 정보를 찾을 수 없습니다.", 404),
    GITHUB_APP_COMPARE_NOT_FOUND("GITHUB013", "GitHub 앱 비교 정보를 찾을 수 없습니다.", 404),
    GITHUB_APP_PULL_REQUEST_CREATE_FAILED("GITHUB014", "GitHub 앱 풀 리퀘스트 생성에 실패했습니다.", 500),
    GITHUB_APP_BRANCH_NOT_FOUND("GITHUB015", "GitHub 앱 브랜치를 찾을 수 없습니다.", 404),
    GITHUB_APP_FILE_DIFF_NOT_FOUND("GITHUB016", "GitHub 앱 파일 차이 정보를 찾을 수 없습니다.", 404),
    GITHUB_APP_ORGANIZATION_MEMBER_NOT_FOUND("GITHUB017", "GitHub 앱 조직 멤버 정보를 찾을 수 없습니다.", 404),
    GITHUB_APP_PULL_REQUEST_CLOSE_FAILED("GITHUB018", "GitHub 풀 리퀘스트 닫기에 실패했습니다.", 500),
    GITHUB_APP_REVIEW_COMMENT_CREATE_FAILED("GITHUB019", "GitHub 리뷰 댓글 생성에 실패했습니다.", 500),
    GITHUB_APP_REVIEW_COMMENT_REPLY_CREATE_FAILED("GITHUB020", "GitHub 리뷰 댓글 답글 생성에 실패했습니다.", 500),
    GITHUB_APP_REVIEW_COMMENT_UPDATE_FAILED("GITHUB021", "GitHub 리뷰 댓글 수정에 실패했습니다.", 500),
    GITHUB_APP_REVIEW_COMMENT_DELETE_FAILED("GITHUB022", "GitHub 리뷰 댓글 삭제에 실패했습니다.", 500),
    GITHUB_APP_REVIEW_COMMENT_NOT_FOUND("GITHUB023", "GitHub 리뷰 댓글을 찾을 수 없습니다.", 404);

    private final String code;
    private final String message;
    private final int httpStatus;
}
