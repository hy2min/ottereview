package com.ssafy.ottereview.auth.exception;

import com.ssafy.ottereview.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum AuthErrorCode implements ErrorCode {
    
    AUTHENTICATION_FAILED("AUTH001", "인증에 실패했습니다", 401),
    AUTHORIZATION_FAILED("AUTH002", "권한이 없습니다", 403),
    INVALID_ACCESS_TOKEN("AUTH003", "유효하지 않은 토큰입니다", 401),
    INVALID_REFRESH_TOKEN("AUTH004", "유효하지 않은 리프레시 토큰입니다", 401),
    REFRESH_TOKEN_INVALID("AUTH005", "리프레시 토큰이 유효하지 않습니다", 401),
    ACCESS_TOKEN_INVALID("AUTH006", "액세스 토큰이 유효하지 않습니다", 401),
    AUTH_EXPIRED("AUTH007", "토큰이 만료되었습니다", 401),
    GITHUB_USER_NOT_FOUND("AUTH008", "GitHub 사용자 정보를 찾을 수 없습니다", 404),
    GITHUB_USER_API_ERROR("AUTH009", "GitHub 사용자 API 호출 중 오류가 발생했습니다", 500);
    
    private final String code;
    private final String message;
    private final int httpStatus;
}
